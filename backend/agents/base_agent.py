from __future__ import annotations

import json
import os
import re
import time

import httpx
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"
MODEL = "deepseek-chat"

_VISION_API_KEY  = os.getenv("VISION_API_KEY")
_VISION_BASE_URL = os.getenv("VISION_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
_VISION_MODEL    = os.getenv("VISION_MODEL", "qwen-vl-plus")

# Lazy-initialized clients — avoid crash on startup when env vars aren't loaded yet
_client: OpenAI | None = None
_vision_client: OpenAI | None = None


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        api_key = os.getenv("DEEPSEEK_API_KEY")
        if not api_key:
            raise RuntimeError("DEEPSEEK_API_KEY 未设置，请在 Railway Variables 中添加")
        _client = OpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com/v1",
            http_client=httpx.Client(timeout=60.0, trust_env=False),
        )
    return _client


def _get_vision_client() -> OpenAI | None:
    global _vision_client
    if _vision_client is None and _VISION_API_KEY:
        _vision_client = OpenAI(
            api_key=_VISION_API_KEY,
            base_url=_VISION_BASE_URL,
            http_client=httpx.Client(timeout=60.0, trust_env=False),
        )
    return _vision_client

_MOCK_RESPONSES = {
    "comment_bait": {
        "dimension": "comment_bait",
        "score": 73,
        "bait_hit_rate": 73,
        "bait_types": {
            "争议引子": 80, "经验召唤引子": 60, "知识补充引子": 45,
            "情感共鸣引子": 70, "求助引子": 30, "互怼引子": 55,
        },
        "persona_distribution": {
            "神评人格": 15, "共鸣型": 25, "知识型": 20, "杠精型": 12,
            "求助型": 10, "凑热闹型": 8, "晒经历型": 7, "阴阳型": 3,
        },
        "shen_ping_probability": 42,
        "analysis": "文案有一定争议性，但留白不足，神评触发概率中等",
        "suggestions": [
            "在第15秒加入「你们遇到过这种情况吗？」，触发经验召唤引子",
            "结尾改为悬念式收尾，如「但最后发生的事让我没想到…」",
            "加入一个轻微有争议的观点，引发正反讨论",
        ],
        "seed_comments": [
            {"text": "说得对！我上次也遇到这个，结果…", "persona": "晒经历型", "predicted_likes": 3200},
            {"text": "不对吧，其实正确的做法是…", "persona": "知识型", "predicted_likes": 2800},
            {"text": "哈哈这个我笑了，太真实了", "persona": "神评人格", "predicted_likes": 8900},
            {"text": "求问在哪里可以学到这个？", "persona": "求助型", "predicted_likes": 560},
            {"text": "厉害了我的哥，这也行？", "persona": "阴阳型", "predicted_likes": 1200},
        ],
    },
    "content": {
        "dimension": "content", "score": 68,
        "analysis": "叙事结构清晰，但情绪密度偏低，中段缺少张力",
        "sub_scores": {"逻辑清晰度": 75, "情绪密度": 55, "信息密度": 70, "叙事结构": 72},
        "suggestions": ["在第8秒制造一个情绪反转", "压缩前10秒，更快进入核心内容"],
    },
    "cover": {
        "dimension": "cover", "score": 61,
        "analysis": "封面文字钩子不够强，颜色对比度尚可",
        "sub_scores": {"视觉冲击力": 58, "文字钩子": 55, "颜色对比度": 70, "构图合理性": 62},
        "suggestions": ["封面文字改为疑问句式，制造悬念", "主体与背景增加颜色对比"],
    },
    "algorithm": {
        "dimension": "algorithm", "score": 65,
        "analysis": "关键词覆盖不足，发布时段建议优化",
        "sub_scores": {"关键词优化": 60, "标签选取": 68, "发布时段": 65, "话题匹配": 67},
        "recommended_tags": ["#干货分享", "#经验之谈", "#真实案例"],
        "best_publish_time": "工作日晚7-9点",
        "suggestions": ["标题加入高搜索量关键词", "蹭近期热门话题标签"],
    },
    "competitor": {
        "dimension": "competitor", "score": 58,
        "engagement_score": 62, "competitor_score": 54,
        "analysis": "互动号召不明确，与赛道爆款相比缺少转发诱因",
        "engagement_breakdown": {"点赞诱因": 65, "收藏诱因": 60, "转发诱因": 45, "行动号召": 55},
        "missing_viral_elements": ["缺少「值得收藏」的干货清单", "没有制造「我要转给朋友看」的情绪触发点"],
        "suggestions": ["结尾加「收藏备用」引导", "加入同赛道近期流行的对比结构"],
    },
}


def extract_from_image(base64_image: str) -> dict:
    """Use vision model to extract title/content from a screenshot. Returns {} if vision unavailable."""
    vc = _get_vision_client()
    if not vc:
        return {}
    try:
        resp = vc.chat.completions.create(
            model=_VISION_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                    },
                    {
                        "type": "text",
                        "text": (
                            "这是一张抖音/短视频页面的截图。请提取以下信息，严格以JSON返回，不要任何多余内容：\n"
                            '{"title": "视频标题（如不可见则空字符串）", "content": "视频文案/简介（如不可见则空字符串）"}'
                        ),
                    },
                ],
            }],
            max_tokens=400,
        )
        raw = resp.choices[0].message.content
        match = re.search(r"\{[\s\S]*\}", raw)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return {}


class BaseAgent:
    name: str = "base"
    dimension: str = "base"
    weight: float = 0.0
    system_prompt: str = ""

    def _build_user_prompt(self, input_data: dict) -> str:
        parts = []
        if input_data.get("title"):
            parts.append(f"视频标题：{input_data['title']}")
        if input_data.get("content"):
            parts.append(f"视频文案：{input_data['content']}")
        if input_data.get("video_url"):
            parts.append(f"视频链接：{input_data['video_url']}")
        if input_data.get("cover_base64"):
            parts.append("（用户已上传封面图）")
        return "\n".join(parts) if parts else "（无内容输入）"

    def analyze(self, input_data: dict) -> dict:
        if MOCK_MODE:
            time.sleep(0.8)
            return dict(_MOCK_RESPONSES.get(self.dimension, {"dimension": self.dimension, "score": 60, "analysis": "模拟诊断结果", "suggestions": []}))
        user_msg = self._build_user_prompt(input_data)
        try:
            response = _get_client().chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_msg},
                ],
            )
            return self._parse_response(response.choices[0].message.content)
        except Exception as e:
            return {"dimension": self.dimension, "score": 50, "analysis": f"分析失败：{str(e)[:80]}", "suggestions": []}

    def analyze_with_context(self, input_data: dict, context: str) -> dict:
        if MOCK_MODE:
            time.sleep(0.5)
            base = dict(_MOCK_RESPONSES.get(self.dimension, {"dimension": self.dimension, "score": 60, "analysis": "模拟Round2结果", "suggestions": []}))
            base["score"] = min(100, base.get("score", 60) + 5)
            return base
        user_msg = self._build_user_prompt(input_data)
        full_msg = f"{user_msg}\n\n---\n其他Agent的Round 1结论：\n{context}"
        try:
            response = _get_client().chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": self.system_prompt + "\n\n这是Round 2，请结合其他Agent的结论，提出质疑或补充，并更新你的评分。"},
                    {"role": "user", "content": full_msg},
                ],
            )
            return self._parse_response(response.choices[0].message.content)
        except Exception as e:
            return {"dimension": self.dimension, "score": 50, "analysis": f"Round2失败：{str(e)[:80]}", "suggestions": []}

    def _parse_response(self, raw: str) -> dict:
        match = re.search(r"\{[\s\S]*\}", raw)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
        return {"dimension": self.dimension, "score": 50, "analysis": raw, "suggestions": []}
