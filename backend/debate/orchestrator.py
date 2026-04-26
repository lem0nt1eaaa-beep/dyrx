from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator

from agents import (
    AlgorithmAgent,
    CommentBaitAgent,
    CompetitorAgent,
    ContentAgent,
    CoverAgent,
)
from models.scoring import compute_final_score

STEPS = [
    "接收输入数据",
    "内容分析师开始诊断",
    "封面诊断师开始诊断",
    "评论引子专家开始诊断",
    "算法策略师开始诊断",
    "竞品侦察员开始诊断",
    "Round 1 并行诊断完成",
    "评论引子专家发起 Round 2 辩论",
    "各 Agent 交叉质疑与补充",
    "裁判 Agent 综合所有论点",
    "生成最终诊断报告",
]


def _event(type_: str, **kwargs) -> dict:
    return {"type": type_, **kwargs}


async def _run_agent_async(agent, input_data: dict) -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, agent.analyze, input_data)


async def _run_agent_round2_async(agent, input_data: dict, context: str) -> dict:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, agent.analyze_with_context, input_data, context)


async def run_debate(input_data: dict) -> AsyncGenerator[dict, None]:
    agents = [
        ContentAgent(),
        CoverAgent(),
        CommentBaitAgent(),
        AlgorithmAgent(),
        CompetitorAgent(),
    ]

    # Step 0: 接收输入
    yield _event("step", index=0, label=STEPS[0])

    # ── Round 1：并行诊断 ──────────────────────────────────────────
    for i, agent in enumerate(agents):
        yield _event("step", index=i + 1, label=STEPS[i + 1])
        yield _event("agent_start", agent=agent.name, round=1)

    round1_results: list[dict] = await asyncio.gather(
        *[_run_agent_async(a, input_data) for a in agents]
    )

    for agent, result in zip(agents, round1_results):
        yield _event("agent_result", agent=agent.name, round=1, result=result)

    yield _event("step", index=6, label=STEPS[6])

    # ── Round 2：评论引子专家优先，其余 Agent 补充 ──────────────────
    yield _event("step", index=7, label=STEPS[7])

    # 构建其他 Agent 的 Round 1 摘要供 Round 2 使用
    def _summarize(results: list[dict]) -> str:
        lines = []
        for r in results:
            lines.append(
                f"[{r.get('dimension', '?')}] 评分={r.get('score', '?')} 分析={r.get('analysis', '')}"
            )
        return "\n".join(lines)

    comment_bait_agent = agents[2]
    others = [agents[0], agents[1], agents[3], agents[4]]
    others_r1_summary = _summarize([round1_results[0], round1_results[1], round1_results[3], round1_results[4]])

    # 评论引子专家 Round 2 先跑
    yield _event("agent_start", agent=comment_bait_agent.name, round=2)
    cb_r2 = await _run_agent_round2_async(comment_bait_agent, input_data, others_r1_summary)
    yield _event("agent_result", agent=comment_bait_agent.name, round=2, result=cb_r2)

    yield _event("step", index=8, label=STEPS[8])

    # 其余 Agent Round 2（包含评论引子专家的结论）
    cb_summary = f"[评论引子专家 Round 2] 评分={cb_r2.get('score', '?')} 分析={cb_r2.get('analysis', '')}"
    all_r1_summary = _summarize(round1_results) + f"\n{cb_summary}"

    round2_others = await asyncio.gather(
        *[_run_agent_round2_async(a, input_data, all_r1_summary) for a in others]
    )

    for agent, result in zip(others, round2_others):
        yield _event("agent_result", agent=agent.name, round=2, result=result)

    # ── Round 3：裁判综合 ──────────────────────────────────────────
    yield _event("step", index=9, label=STEPS[9])

    # 汇总 Round 2 所有结果
    r2_map = {comment_bait_agent.name: cb_r2}
    for a, r in zip(others, round2_others):
        r2_map[a.name] = r

    all_r2_results = [r2_map.get(a.name, r1) for a, r1 in zip(agents, round1_results)]

    yield _event("step", index=10, label=STEPS[10])
    final = compute_final_score(agents, round1_results, all_r2_results)
    yield _event("final_report", report=final)
