import time
import requests
from django.conf import settings
from ..models import Film

TMDB_BASE_URL = "https://api.themoviedb.org/3" 
TMDB_API_KEY = settings.CONFIG['TMDB_READ_TOKEN']

def fetch_tmdb_data(query: str, year: int = None, index: int = 0) -> dict | None:
    """
    Accepts either a TMDb key or a title and fetches film data.
    Optionall filters results by release year
    Returns JSON or None.
    """
    base = "https://api.themoviedb.org/3"
    read_token = settings.CONFIG['TMDB_READ_TOKEN']
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {read_token}"
    }
    
    if query.isdigit():
        url = f"{base}/movie/{query}?append_to_response=credits"
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            return None
        return response.json()

    search_url = f"{base}/search/movie?query={query}"
    response = requests.get(search_url, headers=headers)
    if response.status_code != 200:
        return None

    data = response.json()
    results = data.get("results", [])

    if not results:
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
            return None
    else:
        result = results[index]
        tmbd_id = result["id"]
        
    if Film.objects.filter(tmdb_id=str(tmdb_id)).exists():
        print(f"Film '{query}' (TMDb {tmdb_id}) already in DB, trying next result...")
        time.sleep(0.25)
        return fetch_tmdb_by_title(query, index + 1)
    
    details_url = f"{base}/movie/{tmdb_id}?append_to_response=credits"
    response = requests.get(details_url, headers=headers)
    if response.status_code != 200:
        return None
    return response.json()

def import_films_from_list(lines: list[str]) -> list[dict]:
    """
    Given a list of TMDb IDs or titles, import all films
    Respect API rate limits
    """
    imported = []
    for line in lines:
        query = line.strip()
        if not query:
            continue
        
        data = fetch_tmdb_data(query)
        if data:
            film, created = Film.create_with_universal_item(data)
            imported.append({
                "title": film.title,
                "tmdb_id": film.tmdb_id,
                "created": created,
            })
        time.sleep(0.25)
        
    return imported