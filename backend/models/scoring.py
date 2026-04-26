from __future__ import annotations

WEIGHTS = {
    "comment_bait": 0.30,
    "content": 0.20,
    "cover": 0.18,
    "algorithm": 0.15,
    "competitor": 0.17,
}

DIMENSION_LABELS = {
    "comment_bait": "评论引子质量",
    "content": "内容质量",
    "cover": "封面吸引力",
    "algorithm": "算法适配度",
    "competitor": "互动潜力&竞品",
}


def _viral_probability(score: int) -> int:
    """非线性映射：总分 → 爆款概率%（低分段惩罚更重）"""
    return int(max(1, min(95, (score / 100) ** 2.2 * 95)))


def _percentile_estimate(score: int) -> int:
    """总分 → 赛道百分位（超过x%的同赛道视频）"""
    return int(max(5, min(99, (score / 100) ** 1.8 * 99)))


def _build_roadmap(agents, round1_results: list, round2_results: list) -> list:
    """从各 Agent suggestions 中提取最高 ROI 条目，按预计提分排序取 Top 3。"""
    items = []
    for agent, r1, r2 in zip(agents, round1_results, round2_results):
        score = r2.get("score") or r1.get("score") or 50
        suggestions = r2.get("suggestions") or r1.get("suggestions") or []
        if not suggestions:
            continue
        gap = 100 - score
        weight = WEIGHTS.get(agent.dimension, 0)
        score_lift = max(1, round(gap * weight * 0.45))
        items.append({
            "priority": 0,
            "action": suggestions[0],
            "dimension": DIMENSION_LABELS.get(agent.dimension, agent.dimension),
            "score_lift": score_lift,
        })
    items.sort(key=lambda x: x["score_lift"], reverse=True)
    for i, item in enumerate(items[:3]):
        item["priority"] = i + 1
    return items[:3]


def compute_final_score(agents, round1_results: list, round2_results: list) -> dict:
    scores = {}
    details = {}

    for agent, r1, r2 in zip(agents, round1_results, round2_results):
        dim = agent.dimension
        score = r2.get("score") or r1.get("score") or 50
        scores[dim] = score
        details[dim] = {
            "label": DIMENSION_LABELS.get(dim, dim),
            "score": score,
            "weight": WEIGHTS.get(dim, 0),
            "analysis": r2.get("analysis") or r1.get("analysis") or "",
            "suggestions": r2.get("suggestions") or r1.get("suggestions") or [],
        }

    total = round(sum(scores.get(dim, 50) * w for dim, w in WEIGHTS.items()))

    cb_result = round2_results[2] if len(round2_results) > 2 else {}

    return {
        "total_score": total,
        "viral_probability": _viral_probability(total),
        "percentile_estimate": _percentile_estimate(total),
        "improvement_roadmap": _build_roadmap(agents, round1_results, round2_results),
        "dimensions": details,
        "comment_bait_detail": {
            "bait_hit_rate": cb_result.get("bait_hit_rate", 0),
            "bait_types": cb_result.get("bait_types", {}),
            "persona_distribution": cb_result.get("persona_distribution", {}),
            "shen_ping_probability": cb_result.get("shen_ping_probability", 0),
            "seed_comments": cb_result.get("seed_comments", []),
            "suggestions": cb_result.get("suggestions", []),
        },
    }
