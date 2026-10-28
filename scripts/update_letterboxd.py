import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path


FEED_URL = "https://letterboxd.com/zmfirkins/rss/"
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "data" / "letterboxd.json"
NAMESPACES = {"letterboxd": "https://letterboxd.com"}


def main():
    request = urllib.request.Request(
        FEED_URL,
        headers={"User-Agent": "zmfirkins.github.io Letterboxd feed updater"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        root = ET.fromstring(response.read())

    entries = []
    for item in root.findall("./channel/item"):
        title = item.findtext("letterboxd:filmTitle", namespaces=NAMESPACES)
        rating_text = item.findtext("letterboxd:memberRating", namespaces=NAMESPACES)
        if not title or not rating_text:
            continue

        rating = float(rating_text)
        if rating <= 0:
            continue

        description = item.findtext("description") or ""
        poster_match = re.search(r'<img[^>]+src=["\']([^"\']+)', description, re.IGNORECASE)
        entries.append(
            {
                "title": title,
                "rating": rating,
                "poster": poster_match.group(1) if poster_match else None,
                "link": item.findtext("link"),
            }
        )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(entries, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(entries)} rated films to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
