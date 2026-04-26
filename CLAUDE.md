# DyRx 抖医

抖音 AI 视频诊断工具。基于 5 Agent 三轮辩论架构，以评论引子质量（30%）为最高权重维度。

## 启动方式

```bash
# 后端
cd backend
pip install -r requirements.txt
cp .env.example .env   # 填入 DEEPSEEK_API_KEY（必填）和 VISION_API_KEY（可选）
uvicorn main:app --reload --port 8000

# 前端
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## 目录结构

- `backend/agents/` — 5 个诊断 Agent（comment_bait 权重最高）
- `backend/debate/orchestrator.py` — 三轮辩论调度
- `backend/models/scoring.py` — 六维加权评分
- `frontend/src/components/` — UI 组件

## Phase 1-5 完成情况

- [x] FastAPI + SSE 流式推送
- [x] 5 Agent 并行 Round 1 + 三轮辩论
- [x] 六维雷达图 + 评论引子专区 UI
- [x] 图片上传（拖拽/粘贴），视觉封面分析（需 VISION_API_KEY）
- [x] 竞品对比模式（双视频并行诊断 + 维度差距视图）
- [x] /extract-image 端点（截图自动提取标题和文案）

## 关键 API

| 端点 | 说明 |
|------|------|
| POST /diagnose | 开始单视频诊断，返回 task_id |
| GET /diagnose/{id}/stream | SSE 流式接收诊断事件 |
| POST /extract-image | 截图提取标题/文案（需 VISION_API_KEY）|
| POST /compare | 开始竞品对比，返回两个 task_id |
