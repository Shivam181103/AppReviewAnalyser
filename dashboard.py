"""
App Store Reviews Analytics Dashboard
Flask web application with sentiment analysis and visualizations
"""

import re
import json
import asyncio
from typing import Any
from urllib.parse import urlparse
from datetime import datetime

import httpx
from flask import Flask, render_template, request, jsonify
from textblob import TextBlob

app = Flask(__name__)

# ---------------------------------------------------------------------------
# Helpers (from server.py)
# ---------------------------------------------------------------------------

def parse_app_id(url: str) -> tuple[str, str]:
    """Extract app ID and country code from an App Store URL."""
    parsed = urlparse(url)
    if "apps.apple.com" not in parsed.netloc:
        raise ValueError(f"Not a valid App Store URL: {url}")

    path_parts = parsed.path.strip("/").split("/")
    country = path_parts[0] if path_parts else "us"

    app_id_part = next((p for p in path_parts if p.startswith("id")), None)
    if not app_id_part:
        raise ValueError("Could not find app ID (id<digits>) in URL")

    app_id = app_id_part[2:]
    if not app_id.isdigit():
        raise ValueError(f"Extracted app ID is not numeric: {app_id}")

    return country, app_id


async def fetch_app_metadata(country: str, app_id: str) -> dict:
    """Fetch basic app metadata from the iTunes lookup API."""
    url = f"https://itunes.apple.com/lookup?id={app_id}&country={country}"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

    if data.get("resultCount", 0) == 0:
        raise ValueError(f"No app found with ID {app_id} in country '{country}'")

    result = data["results"][0]
    return {
        "name": result.get("trackName"),
        "developer": result.get("artistName"),
        "rating": result.get("averageUserRating"),
        "rating_count": result.get("userRatingCount"),
        "version": result.get("version"),
        "genre": result.get("primaryGenreName"),
        "description": (result.get("description") or "")[:500],
        "app_id": app_id,
        "country": country,
        "icon_url": result.get("artworkUrl512", result.get("artworkUrl100")),
    }


async def fetch_reviews_rss(
    country: str,
    app_id: str,
    page: int = 1,
    sort: str = "mostRecent",
) -> list[dict]:
    """Fetch reviews via Apple's public RSS feed."""
    sort_map = {
        "mostRecent": "mostRecent",
        "mostHelpful": "mostHelpful",
    }
    sort_param = sort_map.get(sort, "mostRecent")

    url = (
        f"https://itunes.apple.com/{country}/rss/customerreviews/"
        f"page={page}/id={app_id}/sortby={sort_param}/json"
    )

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

    feed = data.get("feed", {})
    entries = feed.get("entry", [])

    reviews = []
    for entry in entries:
        if "im:rating" not in entry:
            continue
        reviews.append({
            "title": entry.get("title", {}).get("label", ""),
            "rating": int(entry.get("im:rating", {}).get("label", 0)),
            "author": entry.get("author", {}).get("name", {}).get("label", ""),
            "date": entry.get("updated", {}).get("label", ""),
            "review": entry.get("content", {}).get("label", ""),
            "version": entry.get("im:version", {}).get("label", ""),
            "vote_count": int(entry.get("im:voteCount", {}).get("label", 0)),
        })

    return reviews


async def fetch_all_reviews(
    country: str,
    app_id: str,
    max_pages: int = 10,
    sort: str = "mostRecent",
) -> list[dict]:
    """Fetch reviews across multiple RSS pages concurrently."""
    pages = range(1, max_pages + 1)
    tasks = [fetch_reviews_rss(country, app_id, page=p, sort=sort) for p in pages]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_reviews = []
    for r in results:
        if isinstance(r, Exception):
            continue
        all_reviews.extend(r)

    return all_reviews


# ---------------------------------------------------------------------------
# Sentiment Analysis
# ---------------------------------------------------------------------------

def analyze_sentiment(text: str) -> dict:
    """Analyze sentiment using TextBlob."""
    if not text:
        return {"polarity": 0, "subjectivity": 0, "label": "neutral"}
    
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    if polarity > 0.1:
        label = "positive"
    elif polarity < -0.1:
        label = "negative"
    else:
        label = "neutral"
    
    return {
        "polarity": round(polarity, 3),
        "subjectivity": round(subjectivity, 3),
        "label": label
    }


def compute_analytics(reviews: list[dict]) -> dict:
    """Compute comprehensive analytics from reviews."""
    if not reviews:
        return {}

    ratings = [r["rating"] for r in reviews]
    avg_rating = sum(ratings) / len(ratings)

    rating_dist = {str(i): 0 for i in range(1, 6)}
    for r in ratings:
        rating_dist[str(r)] = rating_dist.get(str(r), 0) + 1

    sentiment_dist = {"positive": 0, "negative": 0, "neutral": 0}
    total_polarity = 0
    total_subjectivity = 0
    
    for review in reviews:
        sentiment = analyze_sentiment(review["review"])
        review["sentiment"] = sentiment
        sentiment_dist[sentiment["label"]] += 1
        total_polarity += sentiment["polarity"]
        total_subjectivity += sentiment["subjectivity"]

    avg_polarity = total_polarity / len(reviews) if reviews else 0
    avg_subjectivity = total_subjectivity / len(reviews) if reviews else 0

    return {
        "total_reviews": len(reviews),
        "average_rating": round(avg_rating, 2),
        "rating_distribution": rating_dist,
        "sentiment_distribution": sentiment_dist,
        "average_polarity": round(avg_polarity, 3),
        "average_subjectivity": round(avg_subjectivity, 3),
        "most_recent": reviews[0]["date"] if reviews else None,
    }


# ---------------------------------------------------------------------------
# Flask Routes
# ---------------------------------------------------------------------------

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        data = request.json
        url = data.get('url')
        max_pages = int(data.get('max_pages', 10))
        
        if not url:
            return jsonify({"error": "URL is required"}), 400
        
        country, app_id = parse_app_id(url)
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        metadata = loop.run_until_complete(fetch_app_metadata(country, app_id))
        reviews = loop.run_until_complete(fetch_all_reviews(country, app_id, max_pages=max_pages))
        
        loop.close()
        
        analytics = compute_analytics(reviews)
        
        return jsonify({
            "metadata": metadata,
            "analytics": analytics,
            "reviews": reviews[:50]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)
