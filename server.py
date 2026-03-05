"""
App Store Reviews MCP Server
Scrapes reviews from the Apple App Store based on an app link.
"""

import re
import json
import asyncio
from typing import Any
from urllib.parse import urlparse, parse_qs

import httpx
from bs4 import BeautifulSoup
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_app_id(url: str) -> tuple[str, str]:
    """Extract app ID and country code from an App Store URL.

    Supports formats like:
      https://apps.apple.com/us/app/instagram/id389801252
      https://apps.apple.com/gb/app/some-app/id123456789
    Returns (country, app_id).
    """
    parsed = urlparse(url)
    if "apps.apple.com" not in parsed.netloc:
        raise ValueError(f"Not a valid App Store URL: {url}")

    path_parts = parsed.path.strip("/").split("/")
    # path_parts typically: ['us', 'app', 'app-name', 'id123456789']
    country = path_parts[0] if path_parts else "us"

    app_id_part = next((p for p in path_parts if p.startswith("id")), None)
    if not app_id_part:
        raise ValueError("Could not find app ID (id<digits>) in URL")

    app_id = app_id_part[2:]  # strip leading 'id'
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
        "description": (result.get("description") or "")[:500] + "...",
        "app_id": app_id,
        "country": country,
    }


async def fetch_reviews_rss(
    country: str,
    app_id: str,
    page: int = 1,
    sort: str = "mostRecent",
) -> list[dict]:
    """Fetch reviews via Apple's public RSS feed (up to 500 reviews, 10 per page)."""
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

    # First entry is sometimes app metadata, not a review
    reviews = []
    for entry in entries:
        # Skip if missing review-specific fields
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
    max_pages: int = 5,
    sort: str = "mostRecent",
) -> list[dict]:
    """Fetch reviews across multiple RSS pages concurrently."""
    pages = range(1, max_pages + 1)
    tasks = [fetch_reviews_rss(country, app_id, page=p, sort=sort) for p in pages]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_reviews = []
    for r in results:
        if isinstance(r, Exception):
            continue  # skip failed pages silently
        all_reviews.extend(r)

    return all_reviews


def compute_summary(reviews: list[dict]) -> dict:
    """Compute aggregate statistics from a list of reviews."""
    if not reviews:
        return {}

    ratings = [r["rating"] for r in reviews]
    avg = sum(ratings) / len(ratings)

    dist = {str(i): 0 for i in range(1, 6)}
    for r in ratings:
        dist[str(r)] = dist.get(str(r), 0) + 1

    return {
        "total_fetched": len(reviews),
        "average_rating": round(avg, 2),
        "rating_distribution": dist,
        "most_recent": reviews[0]["date"] if reviews else None,
    }


# ---------------------------------------------------------------------------
# MCP Server
# ---------------------------------------------------------------------------

app = Server("appstore-reviews")


@app.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="get_app_reviews",
            description=(
                "Scrape reviews for an iOS app from the Apple App Store. "
                "Provide the full App Store URL (e.g. https://apps.apple.com/us/app/instagram/id389801252). "
                "Returns reviews with ratings, author names, dates, and review text."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "Full Apple App Store URL for the app",
                    },
                    "max_pages": {
                        "type": "integer",
                        "description": "Number of pages to fetch (1-10, each page has ~10 reviews). Default: 5",
                        "default": 5,
                        "minimum": 1,
                        "maximum": 10,
                    },
                    "sort": {
                        "type": "string",
                        "enum": ["mostRecent", "mostHelpful"],
                        "description": "Sort order for reviews. Default: mostRecent",
                        "default": "mostRecent",
                    },
                    "min_rating": {
                        "type": "integer",
                        "description": "Filter reviews by minimum star rating (1-5). Optional.",
                        "minimum": 1,
                        "maximum": 5,
                    },
                    "max_rating": {
                        "type": "integer",
                        "description": "Filter reviews by maximum star rating (1-5). Optional.",
                        "minimum": 1,
                        "maximum": 5,
                    },
                },
                "required": ["url"],
            },
        ),
        types.Tool(
            name="get_app_metadata",
            description=(
                "Fetch metadata for an iOS app from the Apple App Store. "
                "Returns app name, developer, overall rating, review count, version, and genre."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "Full Apple App Store URL for the app",
                    }
                },
                "required": ["url"],
            },
        ),
        types.Tool(
            name="get_reviews_summary",
            description=(
                "Get an aggregate summary of reviews for an iOS app: "
                "average rating, rating distribution, and total reviews fetched."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "Full Apple App Store URL for the app",
                    },
                    "max_pages": {
                        "type": "integer",
                        "description": "Number of pages to fetch (1-10). Default: 10",
                        "default": 10,
                        "minimum": 1,
                        "maximum": 10,
                    },
                },
                "required": ["url"],
            },
        ),
    ]


@app.list_resources()
async def list_resources() -> list[types.Resource]:
    return [
        types.Resource(
            uri="appstore://docs/usage",
            name="Usage Guide",
            description="How to use the App Store Reviews MCP server",
            mimeType="text/plain",
        )
    ]


@app.read_resource()
async def read_resource(uri: str) -> str:
    if uri == "appstore://docs/usage":
        return """
App Store Reviews MCP Server — Usage Guide
==========================================

TOOLS
-----

1. get_app_reviews(url, max_pages?, sort?, min_rating?, max_rating?)
   Fetch individual reviews for any iOS app.

   Example:
     url: "https://apps.apple.com/us/app/instagram/id389801252"
     max_pages: 3
     sort: "mostRecent"
     min_rating: 1
     max_rating: 3   ← only negative reviews

2. get_app_metadata(url)
   Fetch app name, developer, overall rating, version, genre.

3. get_reviews_summary(url, max_pages?)
   Get aggregate stats: average rating and rating distribution.

TIPS
----
- max_pages=10 returns ~100 reviews (Apple caps at 500 via RSS)
- Use min_rating/max_rating to focus on positive or negative feedback
- Country code is auto-detected from the URL (us, gb, au, etc.)
"""
    raise ValueError(f"Unknown resource URI: {uri}")


@app.call_tool()
async def call_tool(name: str, arguments: dict[str, Any]) -> list[types.TextContent]:
    try:
        if name == "get_app_metadata":
            url = arguments["url"]
            country, app_id = parse_app_id(url)
            metadata = await fetch_app_metadata(country, app_id)
            return [types.TextContent(type="text", text=json.dumps(metadata, indent=2))]

        elif name == "get_app_reviews":
            url = arguments["url"]
            max_pages = int(arguments.get("max_pages", 5))
            sort = arguments.get("sort", "mostRecent")
            min_rating = arguments.get("min_rating")
            max_rating = arguments.get("max_rating")

            country, app_id = parse_app_id(url)
            reviews = await fetch_all_reviews(country, app_id, max_pages=max_pages, sort=sort)

            if min_rating is not None:
                reviews = [r for r in reviews if r["rating"] >= int(min_rating)]
            if max_rating is not None:
                reviews = [r for r in reviews if r["rating"] <= int(max_rating)]

            output = {
                "app_id": app_id,
                "country": country,
                "total_reviews": len(reviews),
                "reviews": reviews,
            }
            return [types.TextContent(type="text", text=json.dumps(output, indent=2))]

        elif name == "get_reviews_summary":
            url = arguments["url"]
            max_pages = int(arguments.get("max_pages", 10))

            country, app_id = parse_app_id(url)
            reviews = await fetch_all_reviews(country, app_id, max_pages=max_pages)
            summary = compute_summary(reviews)
            summary["app_id"] = app_id
            summary["country"] = country

            return [types.TextContent(type="text", text=json.dumps(summary, indent=2))]

        else:
            raise ValueError(f"Unknown tool: {name}")

    except Exception as e:
        return [types.TextContent(type="text", text=f"Error: {str(e)}")]


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())
