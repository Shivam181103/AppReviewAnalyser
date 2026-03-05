# App Store Reviews MCP Server

Scrape iOS App Store reviews directly from Claude using the Model Context Protocol.

---

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Test it standalone

```bash
python server.py
```

---

## Connect to Claude Desktop

Add the following to your Claude Desktop config file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "appstore-reviews": {
      "command": "python",
      "args": ["/absolute/path/to/server.py"]
    }
  }
}
```

> Replace `/absolute/path/to/server.py` with the actual path on your machine.

Then **restart Claude Desktop**.

---

## Tools Available

| Tool | Description |
|------|-------------|
| `get_app_reviews` | Fetch individual reviews (with optional rating filter) |
| `get_app_metadata` | Get app name, developer, rating, version |
| `get_reviews_summary` | Aggregate stats: avg rating + distribution |

---

## Example Usage in Claude

Once connected, you can ask Claude:

- *"Get the latest 50 reviews for Instagram"* → provide the App Store URL
- *"Show me all 1-star reviews for this app: https://apps.apple.com/us/app/..."*
- *"Summarize the review sentiment for Spotify"*

---

## Notes

- Apple's public RSS feed supports up to **500 reviews** (50 pages × 10 reviews)
- Country is auto-detected from the URL (`/us/`, `/gb/`, `/au/`, etc.)
- No API key required — uses Apple's public endpoints
