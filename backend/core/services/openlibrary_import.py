import requests
from rest_framework.exceptions import ValidationError
from ..models import Book

OL_BASE_URL = "https://openlibrary.org"
OL_SEARCH_URL = f"{OL_BASE_URL}/search.json"
headers = {
    "User-Agent": "VoxMundi (raynerjmatthew@gmail.com)"
}

def fetch_works_by_title(title: str):
    """
    Search OpenLibrary by title and return a list of works.
    Each result will include OLID and first_publish_year for user selection.
    """
    response = requests.get(OL_SEARCH_URL, params={"title": title}, headers=headers)
    if not response.ok:
        raise ValidationError("Could not connect to OpenLibrary.")

    data = response.json()
    docs = data.get("docs", [])
    if not docs:
        return []

    results = []
    for doc in docs:
        results.append({
            "title": doc.get("title"),
            "author_name": ", ".join(doc.get("author_name", [])),
            "first_publish_year": doc.get("first_publish_year"),
            "work_id": doc.get("key").split("/")[-1],  # e.g. "/works/OL27448W" -> "OL27448W"
            "edition_count": doc.get("edition_count"),
        })
    return results


def fetch_info_from_olid(ol_id: str, date: str = None):
    """
    Fetch metadata for a given work ID (OLID).
    Returns a payload dict suitable for creating a Book.
    """
    url = f"{OL_BASE_URL}/works/{ol_id}.json"
    work_response = requests.get(url, headers=headers)
    if not work_response.ok:
        raise ValidationError(f"Work {ol_id} not found.")

    work = work_response.json()

    # Fetch author
    author_name = ""
    alt_creator_name = ""
    if work.get("authors"):
        first_author_key = work["authors"][0]["author"]["key"]
        author_url = f"{OL_BASE_URL}{first_author_key}.json"
        author_response = requests.get(author_url, headers=headers)
        if author_response.ok:
            author = author_response.json()
            author_name = author.get("name", "")
            alt_creator_name = ", ".join(author.get("personal_names", []))

    # Description handling (can be str or dict)
    desc = work.get("description", "")
    if isinstance(desc, dict):
        desc = desc.get("value", "")

    # Language handling
    language = None
    if work.get("languages"):
        lang_key = work["languages"][0].get("key", "")
        language = lang_key.split("/")[-1] if lang_key else None

    # Cover URL
    cover = None
    if work.get("covers"):
        cover = f"https://covers.openlibrary.org/b/id/{work['covers'][0]}-L.jpg"

    return {
        "ol_id": ol_id,
        "title": work.get("title"),
        "alt_title": work.get("subtitle", ""),
        "creator_string": author_name,
        "alt_creator_name": alt_creator_name,
        "genre": [s for s in work.get("subjects", []) if isinstance(s, str)],
        "synopsis": desc,
        "cover": cover,
        "language": language,
        "date": date or work.get("created", {}).get("value"),
    }
    
def create_book_from_openlibrary(ol_id: str, date: str = None):
    """
    End-to-end flow: fetch OpenLibrary data and create or update a Book record.
    """
    data = fetch_info_from_olid(ol_id, date)
    book, created = Book.create_with_universal_item(data)
    return book