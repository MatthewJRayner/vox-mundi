import requests
from datetime import datetime, timedelta, UTC
from dateutil import parser
from concurrent.futures import ThreadPoolExecutor
from django.conf import settings
from typing import List, Dict, Any, Optional

GOOGLE_API_KEY = settings.CONFIG.get("GOOGLE_SEARCH_API_KEY")
SEARCH_ENGINE_ID = settings.CONFIG.get("GOOGLE_SEARCH_ID")


def _parse_iso_or_fuzzy(text: str) -> Optional[datetime]:
    if not text:
        return None
    try:
        return datetime.fromisoformat(text.replace("Z", "+00:00")).astimezone(UTC)
    except Exception:
        pass
    try:
        return parser.parse(text, fuzzy=True, default=datetime.now(UTC)).replace(tzinfo=UTC)
    except Exception:
        return None


def parse_google_results(data: dict, composer: str) -> List[Dict[str, Any]]:
    """
    Only keep results whose title exactly matches
    "{composer} concerts | Classical Events"
    """
    expected_title = f"{composer} concerts | Classical Events".lower()
    events: List[Dict[str, Any]] = []

    for item in data.get("items", []):
        title = item.get("title", "").strip()
        snippet = item.get("snippet", "")
        link = item.get("link", "")
        pagemap = item.get("pagemap", {})

        if title.lower() != expected_title:
            continue

        musicevents = pagemap.get("musicevent", [])
        hcalendars = pagemap.get("hcalendar", [])
        venues = pagemap.get("musicvenue", [])
        addresses = pagemap.get("postaladdress", [])

        if not musicevents:
            events.append({
                "composer": composer,
                "title": title,
                "description": snippet,
                "date": None,
                "link": link,
                "venue": None,
                "address": None,
                "source": "classicalevents",
            })
            continue

        for i, ev in enumerate(musicevents):
            hcal = hcalendars[i] if i < len(hcalendars) else {}
            venue = venues[i] if i < len(venues) else {}
            addr = addresses[i] if i < len(addresses) else {}

            raw_date = ev.get("startdate") or hcal.get("dtstart")
            parsed = _parse_iso_or_fuzzy(raw_date)

            events.append({
                "composer": composer,
                "title": ev.get("name") or title,
                "description": ev.get("description") or snippet,
                "date": parsed.isoformat() if parsed else None,
                "link": hcal.get("url") or ev.get("url") or link,
                "venue": venue.get("name"),
                "address": {
                    "locality": addr.get("addresslocality"),
                    "street": addr.get("streetaddress"),
                } if addr else None,
                "source": "classicalevents",
            })

    seen: set[tuple] = set()
    uniq: List[Dict[str, Any]] = []
    for ev in events:
        key = (ev["composer"], ev.get("title"), ev.get("date"))
        if key not in seen:
            seen.add(key)
            uniq.append(ev)

    return uniq

def fetch_concerts_for_composer(composer: str) -> List[Dict[str, Any]]:
    url = "https://www.googleapis.com/customsearch/v1"
    params = {
        "key": GOOGLE_API_KEY,
        "cx": SEARCH_ENGINE_ID,
        "q": f'"{composer}" concerts site:www.classicalevents.co.uk',
        "num": 5,
    }

    try:
        r = requests.get(url, params=params, timeout=12)
        if r.status_code == 200:
            return parse_google_results(r.json(), composer)
    except Exception as e:
        print(f"[Google] error for {composer}: {e}")
    return []

def clean_and_rank_events(events: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    now = datetime.now(UTC)
    upcoming = []

    for ev in events:
        dt = _parse_iso_or_fuzzy(ev.get("date"))
        if dt and dt >= now - timedelta(days=1):
            ev["parsed_date"] = dt.isoformat()
            upcoming.append(ev)

    return sorted(upcoming, key=lambda e: e["parsed_date"])

def search_many_composers(composers: List[str]) -> List[Dict[str, Any]]:
    all_events: List[Dict[str, Any]] = []

    with ThreadPoolExecutor(max_workers=5) as pool:
        futures = [pool.submit(fetch_concerts_for_composer, c) for c in composers]
        for f in futures:
            try:
                all_events.extend(f.result())
            except Exception as e:
                print(f"[Thread] {e}")

    return clean_and_rank_events(all_events)
