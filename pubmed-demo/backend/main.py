"""FastAPI backend for PubMed literature search and analysis."""
import os
import re
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from pubmed_client import search_pubmed, compute_statistics
from llm_client import generate_review, generate_fallback_review

load_dotenv()

app = FastAPI(title="PubMed Literature Analysis Demo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Config
PUBMED_API_KEY = os.getenv("PUBMED_API_KEY", "7e35f0a83965ec231540bfc273edb2a30108")
PUBMED_EMAIL = os.getenv("PUBMED_EMAIL", "demo@example.com")
LLM_API_BASE = os.getenv("LLM_API_BASE", "https://api.openai.com/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")

# In-memory cache for last search results
_cache: dict = {}


class SearchRequest(BaseModel):
    query: str
    max_results: int = 200
    sort: str = "relevance"
    date_from: str = ""
    date_to: str = ""


@app.post("/api/search")
async def api_search(req: SearchRequest):
    """Search PubMed and return articles with statistics."""
    try:
        articles = await search_pubmed(
            query=req.query,
            api_key=PUBMED_API_KEY,
            email=PUBMED_EMAIL,
            max_results=req.max_results,
            sort=req.sort,
            date_from=req.date_from,
            date_to=req.date_to,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PubMed API error: {str(e)}")

    if not articles:
        return {"articles": [], "statistics": compute_statistics([]), "message": "未找到相关文献，请更换关键词"}

    stats = compute_statistics(articles)
    _cache["articles"] = articles
    _cache["query"] = req.query

    return {"articles": articles, "statistics": stats}


@app.get("/api/statistics")
async def api_statistics():
    """Get statistics for cached search results."""
    articles = _cache.get("articles", [])
    return compute_statistics(articles)


@app.get("/api/wordcloud")
async def api_wordcloud():
    """Extract keywords and return word frequency data for word cloud."""
    articles = _cache.get("articles", [])
    if not articles:
        return {"words": []}

    # English stop words
    stop_words = {
        "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
        "have", "has", "had", "do", "does", "did", "will", "would", "could",
        "should", "may", "might", "shall", "can", "need", "dare", "ought",
        "used", "to", "of", "in", "for", "on", "with", "at", "by", "from",
        "as", "into", "through", "during", "before", "after", "above",
        "between", "out", "off", "over", "under", "again", "further", "then",
        "once", "here", "there", "when", "where", "why", "how", "all", "both",
        "each", "few", "more", "most", "other", "some", "such", "no", "nor",
        "not", "only", "own", "same", "so", "than", "too", "very", "just",
        "about", "also", "and", "but", "or", "if", "while", "this", "that",
        "these", "those", "it", "its", "we", "our", "they", "their", "them",
        "he", "she", "his", "her", "you", "your", "my", "me", "i",
        "study", "studies", "research", "results", "method", "methods",
        "conclusion", "conclusions", "background", "objective", "objectives",
        "purpose", "aim", "aims", "introduction", "discussion", "result",
        "using", "used", "based", "showed", "shown", "found", "findings",
        "compared", "analysis", "effect", "effects", "significant",
        "significantly", "however", "although", "including", "associated",
        "two", "three", "one", "new", "high", "low", "different", "patients",
        "patient", "data", "level", "levels", "group", "groups",
    }

    word_counter: Counter = Counter()
    for article in articles:
        text = f"{article.get('title', '')} {article.get('abstract', '')}"
        # Extract words: 3+ char English words
        words = re.findall(r"[a-zA-Z]{3,}", text.lower())
        words = [w for w in words if w not in stop_words and len(w) > 2]
        word_counter.update(words)

    # Return top 150 words
    top_words = [{"word": w, "count": c} for w, c in word_counter.most_common(150)]
    return {"words": top_words}


@app.post("/api/review")
async def api_review(req: SearchRequest):
    """Generate AI review from top article abstracts."""
    articles = _cache.get("articles", [])
    query = _cache.get("query", req.query)

    if not articles:
        raise HTTPException(status_code=400, detail="No articles available. Please search first.")

    # Sort by impact factor, take top 100
    sorted_articles = sorted(articles, key=lambda x: x.get("impact_factor", 0), reverse=True)
    top_articles = sorted_articles[:100]
    abstracts = [a["abstract"] for a in top_articles if a.get("abstract")]

    if not abstracts:
        raise HTTPException(status_code=400, detail="No abstracts available for review generation.")

    try:
        review = await generate_review(
            abstracts=abstracts,
            api_base=LLM_API_BASE,
            api_key=LLM_API_KEY,
            model=LLM_MODEL,
            query=query,
        )
        return {"review": review, "source": "llm"}
    except Exception:
        # Fallback to rule-based review
        review = generate_fallback_review(query, top_articles)
        return {"review": review, "source": "fallback"}


# Serve frontend static files in production
frontend_dist = Path(__file__).parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
