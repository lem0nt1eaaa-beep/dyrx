import asyncio
import json
import uuid
from typing import AsyncGenerator, Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from debate.orchestrator import run_debate
from agents.base_agent import extract_from_image

app = FastAPI(title="DyRx 抖医 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory task store: task_id -> asyncio.Queue
_task_queues: Dict[str, asyncio.Queue] = {}


class DiagnoseRequest(BaseModel):
    video_url: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    cover_base64: Optional[str] = None


class ExtractImageRequest(BaseModel):
    image_base64: str


class CompareRequest(BaseModel):
    own: DiagnoseRequest
    competitor: DiagnoseRequest


# ── Single diagnosis ────────────────────────────────────────────────

@app.post("/diagnose")
async def start_diagnose(req: DiagnoseRequest):
    if not any([req.video_url, req.title, req.content, req.cover_base64]):
        raise HTTPException(status_code=400, detail="至少提供视频链接、标题、文案或封面图之一")
    task_id = str(uuid.uuid4())
    queue: asyncio.Queue = asyncio.Queue()
    _task_queues[task_id] = queue
    asyncio.create_task(_run_and_enqueue(task_id, req.model_dump(exclude_none=True), queue))
    return {"task_id": task_id}


async def _run_and_enqueue(task_id: str, input_data: dict, queue: asyncio.Queue):
    try:
        async for event in run_debate(input_data):
            await queue.put(event)
    except Exception as e:
        await queue.put({"type": "error", "message": str(e)})
    finally:
        await queue.put(None)


@app.get("/diagnose/{task_id}/stream")
async def stream_diagnose(task_id: str):
    if task_id not in _task_queues:
        raise HTTPException(status_code=404, detail="任务不存在")
    queue = _task_queues[task_id]

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            while True:
                event = await asyncio.wait_for(queue.get(), timeout=120)
                if event is None:
                    yield "data: [DONE]\n\n"
                    break
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
        finally:
            _task_queues.pop(task_id, None)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# ── Extract title/content from screenshot ──────────────────────────

@app.post("/extract-image")
async def extract_image(req: ExtractImageRequest):
    """Use vision model to extract title and content from a screenshot."""
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, extract_from_image, req.image_base64)
    return result  # {"title": "...", "content": "..."} or {}


# ── Competitor comparison ──────────────────────────────────────────

@app.post("/compare")
async def start_compare(req: CompareRequest):
    own_id  = str(uuid.uuid4())
    comp_id = str(uuid.uuid4())

    own_q:  asyncio.Queue = asyncio.Queue()
    comp_q: asyncio.Queue = asyncio.Queue()
    _task_queues[own_id]  = own_q
    _task_queues[comp_id] = comp_q

    asyncio.create_task(_run_and_enqueue(own_id,  req.own.model_dump(exclude_none=True),        own_q))
    asyncio.create_task(_run_and_enqueue(comp_id, req.competitor.model_dump(exclude_none=True), comp_q))

    return {"own_task_id": own_id, "competitor_task_id": comp_id}
