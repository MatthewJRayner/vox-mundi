import time
import requests
from django.conf import settings
from ..models import Film
from rest_framework.exceptions import ValidationError

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_API_KEY = settings.CONFIG.get('TMDB_READ_TOKEN')

def fetch_tmdb_data(query: str, year: int = None, index: int = 0, max_attempts: int = 5) -> dict | None:
    """
    Fetch TMDb movie data by TMDb ID or by title.
    Returns the movie JSON or None with appropriate error logging.
    """
    if not TMDB_API_KEY:
        raise ValidationError("TMDb API key is not configured.")

    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {TMDB_API_KEY}"
    }

    if query.isdigit():
        url = f"{TMDB_BASE_URL}/movie/{query}?append_to_response=credits"
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"Failed to fetch TMDb ID {query}: Status {response.status_code}")
            return None
        return response.json()

    search_url = f"{TMDB_BASE_URL}/search/movie?query={query}"
    response = requests.get(search_url, headers=headers)
    if response.status_code != 200:
        print(f"TMDb search error for '{query}': Status {response.status_code}")
        return None

    data = response.json()
    results = data.get("results", [])

    if not results:
        print(f"No TMDb results for '{query}'")
        return None

    tmdb_id = None
    if year:
        for r in results:
            if r.get("release_date"):
                release_year = int(r["release_date"].split("-")[0])
                if release_year == year:
                    tmdb_id = r["id"]
                    break
        if not tmdb_id:
            print(f"No TMDb results for '{query}' in year {year}")
            return None
    else:
        if index >= len(results) or index >= max_attempts:
            print(f"No more TMDb search results for '{query}' beyond index {index}")
            return None
        tmdb_id = results[index]["id"]

    if Film.objects.filter(tmdb_id=str(tmdb_id)).exists():
        print(f"Film '{query}' (TMDb {tmdb_id}) already in DB, trying next result...")
        time.sleep(0.25)
        return fetch_tmdb_data(query, year, index + 1, max_attempts)

    details_url = f"{TMDB_BASE_URL}/movie/{tmdb_id}?append_to_response=credits"
    response = requests.get(details_url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to fetch details for TMDb ID {tmdb_id}: Status {response.status_code}")
        return None
    return response.json()

def import_films_from_list(lines: list[str]) -> list[dict]:
    """
    Import films from a list of TMDb IDs or titles, respecting API rate limits.
    Returns a list of import results with status.
    """
    imported = []
    for line in lines:
        query = line.strip()
        if not query:
            continue

        try:
            data = fetch_tmdb_data(query)
            if data:
                film, created = Film.create_with_universal_item(data)
                imported.append({
                    "title": film.title,
                    "tmdb_id": film.tmdb_id,
                    "created": created,
                    "status": "success" if created else "already_exists",
                })
            else:
                imported.append({
                    "title": query,
                    "tmdb_id": None,
                    "created": False,
                    "status": "not_found",
                })
        except Exception as e:
            print(f"Error importing '{query}': {str(e)}")
            imported.append({
                "title": query,
                "tmdb_id": None,
                "created": False,
                "status": f"error: {str(e)}",
            })
        time.sleep(0.25)

    return imported