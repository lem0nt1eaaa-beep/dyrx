from .base_agent import BaseAgent, _vision_client, _VISION_MODEL

SYSTEM_PROMPT = """你是「封面诊断师 Agent」，负责评估抖音视频封面的吸引力。

【你的职责】
评分维度：封面吸引力（权重 18%）

【抖音爆款封面五大类型（基于数据总结）】
1. 大字报式：50%以上区域被大字占据，字体与背景强对比（黄底黑字/白底红字）
2. 悬念式：关键信息被遮挡或留白，配合「…」「？」「竟然」等词
3. 对比式：左右/上下分割，形成视觉冲击（Before/After）
4. 人物特写式：人物占画面70%以上，表情到位（惊讶/哈哈大笑）
5. 数字清单式：「3个方法」「7天」「第1步」等，暗示内容可操作

【量化评分标准】
- 90-100：符合上述类型之一，文字钩子强，颜色对比清晰，爆款级封面
- 70-89：具备1个爆款封面特征，有优化空间
- 50-69：封面平庸，缺乏抓注意力设计
- 0-49：封面与内容无关或设计混乱

注意：若用户未提供封面图，根据文案内容推断最适合的封面设计方向并评分（基准分50分起）。

【输出要求】
严格返回如下JSON，不要输出JSON之外的任何内容：
{
  "dimension": "cover",
  "score": <0-100整数>,
  "analysis": "<核心问题诊断，50字以内>",
  "cover_type": "<最适合的封面类型：大字报式/悬念式/对比式/人物特写式/数字清单式>",
  "sub_scores": {
    "视觉冲击力": <0-100>,
    "文字钩子": <0-100>,
    "颜色对比度": <0-100>,
    "构图合理性": <0-100>
  },
  "suggestions": ["<封面优化建议1，具体指出改哪里>", "<建议2>", "<建议3>"]
}"""

VISION_SYSTEM_PROMPT = SYSTEM_PROMPT + "\n\n用户已提供真实封面图片，请直接基于图片内容进行视觉分析和评分，无需推断。"


class CoverAgent(BaseAgent):
    name = "封面诊断师"
    dimension = "cover"
    weight = 0.18
    system_prompt = SYSTEM_PROMPT

    def analyze(self, input_data: dict) -> dict:
        cover_b64 = input_data.get("cover_base64")
        if cover_b64 and _vision_client:
            return self._analyze_with_vision(input_data, cover_b64)
        return super().analyze(input_data)

    def analyze_with_context(self, input_data: dict, context: str) -> dict:
        cover_b64 = input_data.get("cover_base64")
        if cover_b64 and _vision_client:
            return self._analyze_with_vision(input_data, cover_b64, context=context)
        return super().analyze_with_context(input_data, context)

    def _analyze_with_vision(self, input_data: dict, cover_b64: str, context: str | None = None) -> dict:
        text_parts = []
        if input_data.get("title"):
            text_parts.append(f"视频标题：{input_data['title']}")
        if input_data.get("content"):
            text_parts.append(f"视频文案：{input_data['content']}")
        if context:
            text_parts.append(f"\n其他Agent的结论（Round 2）：\n{context}")
        user_text = "\n".join(text_parts) if text_parts else "请分析封面图。"

        system = VISION_SYSTEM_PROMPT
        if context:
            system += "\n\n这是Round 2，请结合其他Agent的结论，更新你对封面的评分。"

        try:
            resp = _vision_client.chat.completions.create(  # type: ignore[union-attr]
                model=_VISION_MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:image/jpeg;base64,{cover_b64}"},
                            },
                            {"type": "text", "text": user_text},
                        ],
                    },
                ],
            )
            return self._parse_response(resp.choices[0].message.content)
        except Exception as e:
            # Fall back to text-only analysis
            result = super().analyze(input_data)
            result["analysis"] = f"[视觉分析失败，已回退文字分析] {result.get('analysis', '')}"
            return result
