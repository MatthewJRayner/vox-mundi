import requests
import time
from rest_framework.exceptions import ValidationError
from ..models import Book, UserBook

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

    time.sleep(1)

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
    
    time.sleep(1)

    # Fetch author
    author_name = ""
    alt_creator_name = ""
    if work.get("authors"):
        first_author_key = work["authors"][0]["author"]["key"]
        author_url = f"{OL_BASE_URL}{first_author_key}.json"
        author_response = requests.get(author_url, headers=headers)
        time.sleep(1)
        if author_response.ok:
            author = author_response.json()
            author_name = author.get("name", "")
            alt_creator_name = ", ".join(author.get("personal_name", ""))

    # Description handling (can be str or dict)
    desc = work.get("description", "")
    if isinstance(desc, dict):
        desc = desc.get("value", "")

    # Language handling
    languages = []
    if work.get("languages"):   
        for lang in work["languages"]:
            key = lang.get("key", "")
            if key:
                languages.append(key.split("/")[-1])

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
        "genre": [s for s in work.get("subjects", []) if isinstance(s, str) and len(s) < 50 and "book" not in s.lower()],
        "synopsis": desc,
        "cover": cover,
        "language": languages,
        "date": date or work.get("created", {}).get("value"),
    }
    
def create_book_from_openlibrary(ol_id: str, date: str = None):
    """
    End-to-end flow: fetch OpenLibrary data and create or update a Book record.
    """
    data = fetch_info_from_olid(ol_id, date)
    book, created = Book.create_with_universal_item(data)
    return book

def fetch_book_by_isbn(isbn: str) -> dict:
    """
    Fetch detailed metadata from OpenLibrary for a given ISBN.
    Returns parsed fields suitable for updating a UserBook.
    """
    isbn = isbn.strip().replace("-", "")
    url = f"{OL_BASE_URL}/isbn/{isbn}.json"
    response = requests.get(url, headers=headers)

    if not response.ok:
        raise ValidationError(f"No book found for ISBN {isbn}")

    data = response.json()
    time.sleep(1)

    description = data.get("description")
    if isinstance(description, dict):
        description = description.get("value")
    elif not isinstance(description, str):
        description = None

    # Cover image
    cover = None
    if data.get("covers"):
        cover = f"https://covers.openlibrary.org/b/id/{data['covers'][0]}-L.jpg"

    # Language
    language = None
    if data.get("languages"):
        lang_key = data["languages"][0].get("key", "")
        language = lang_key.split("/")[-1] if lang_key else None

    # Basic info
    return {
        "isbn": data.get("isbn_13", data.get("isbn_10", [isbn]))[0],
        "publisher": ", ".join(data.get("publishers", [])),
        "page_count": data.get("number_of_pages"),
        "format": data.get("physical_format"),
        "language": language,
        "cover": cover,
        "publish_date": data.get("publish_date"),
    }
    
def update_userbook_with_isbn(userbook: UserBook, isbn: str) -> UserBook:
    """
    Fetch OpenLibrary data for ISBN and update an existing UserBook record.
    Does not modify the UniversalItem.
    """
    info = fetch_book_by_isbn(isbn)

    # Update only the relevant fields
    for field, value in {
        "isbn": info.get("isbn"),
        "publisher": info.get("publisher"),
        "page_count": info.get("page_count"),
        "format": info.get("format"),
        "read_language": info.get("language"),
        "cover": info.get("cover"),
        "edition_read_year": info.get("publish_date")
    }.items():
        if value:
            setattr(userbook, field, value)

    userbook.owned = True
    userbook.save(update_fields=[
        "isbn", "publisher", "page_count", "format",
        "read_language", "cover", "edition_read_year"
    ])

    return userbook

def search_openlibrary(query, limit=10):
    """
    Query OpenLibrary for a book search by title/author keyword.
    Returns a list of simplified book entries.
    """
    try:
        response = requests.get(
            OPENLIBRARY_SEARCH_URL,
            params={"q": query, "limit": limit},
            timeout=10
        )
        response.raise_for_status()
        data = response.json()

        results = []
        for doc in data.get("docs", []):
            title = doc.get("title")
            authors = doc.get("author_name", [])
            first_publish_year = doc.get("first_publish_year")
            work_key = doc.get("key")  # e.g. "/works/OL531767W"

            if not title or not work_key:
                continue

            results.append({
                "title": title,
                "author": ", ".join(authors) if authors else None,
                "first_publish_year": first_publish_year,
                "work_id": work_key.split("/")[-1],  # just the "OLxxxxW" part
            })

        return results

    except Exception as e:
        print(f"OpenLibrary search failed: {e}")
        return []