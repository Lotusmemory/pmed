"""LLM client for generating literature review summaries (Anthropic Messages API)."""
import httpx


SYSTEM_PROMPT = """你是一位资深的生物医学领域研究员，请根据以下文献摘要，撰写一份约500字的中文分点综述。要求：
1. 概括该研究领域的最新进展和热点方向
2. 分点阐述，每个点有小标题，语言严谨但通俗
3. 指出存在的挑战或未来趋势
4. 仅输出综述内容，不要包含其他解释"""


async def generate_review(
    abstracts: list[str],
    api_base: str,
    api_key: str,
    model: str,
    query: str,
) -> str:
    """Call Anthropic-compatible LLM API to generate a review from article abstracts."""
    if not api_key:
        raise ValueError("LLM API key is not configured")

    # Limit abstracts to avoid token overflow
    combined = "\n\n---\n\n".join(abstracts[:100])
    user_message = f"研究关键词：{query}\n\n以下是相关文献摘要：\n\n{combined}"

    # Anthropic Messages API format
    url = f"{api_base.rstrip('/')}/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "system": SYSTEM_PROMPT,
        "messages": [
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.7,
        "max_tokens": 2000,
    }

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        result = resp.json()
        # Anthropic response: content[0].text
        return result["content"][0]["text"]


def generate_fallback_review(query: str, articles: list[dict]) -> str:
    """Generate a simple rule-based review when LLM is unavailable."""
    years = sorted(set(a["year"] for a in articles if a["year"]), reverse=True)
    journals = {}
    for a in articles:
        j = a["journal"]
        if j:
            journals[j] = journals.get(j, 0) + 1
    top_journals = sorted(journals.items(), key=lambda x: -x[1])[:5]

    lines = [f"## 关于「{query}」的文献综述（本地生成）\n"]
    lines.append(f"### 1. 研究概况")
    lines.append(
        f"共检索到 {len(articles)} 篇相关文献，"
        f"时间跨度为 {years[-1] if years else 'N/A'} 至 {years[0] if years else 'N/A'} 年。"
    )
    lines.append(f"\n### 2. 主要发表期刊")
    for j, c in top_journals:
        lines.append(f"- **{j}**：{c} 篇")
    lines.append(f"\n### 3. 研究趋势")
    lines.append(f"从发文量来看，{years[0] if years else '近年'} 为该领域研究的高峰期。")
    lines.append(f"\n### 4. 未来展望")
    lines.append(f"该领域仍有较大的探索空间，建议关注最新发表的高影响力文献。")
    lines.append(f"\n\n*（此综述由本地规则生成，配置 LLM API 可获得更深入的分析）*")
    return "\n".join(lines)
