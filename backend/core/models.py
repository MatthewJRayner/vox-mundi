from django.db import models, transaction
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from colorfield.fields import ColorField
from taggit.managers import TaggableManager
from datetime import timedelta
import uuid

# -------------------------------------------------
# SHARED UTILS
# -------------------------------------------------
class DatePrecision(models.TextChoices):
    EXACT = 'exact', 'Exact'
    YEAR = 'year', 'Year'
    DECADE = 'decade', 'Decade'
    CENTURY = 'century', 'Century'
    MILLENNIUM = 'millennium', 'Millennium'
    UNKNOWN = 'unknown', 'Unknown'

class Visibility(models.TextChoices):
    PUBLIC = 'public', 'Public'
    PRIVATE = 'private', 'Private'

class DateEstimate(models.Model):
    date_known = models.BooleanField(default=True)
    date = models.DateField(null=True, blank=True)
    date_estimate_start = models.IntegerField(null=True, blank=True)
    date_estimate_end = models.IntegerField(null=True, blank=True)
    date_precision = models.CharField(
        max_length=20,
        choices=DatePrecision.choices,
        default=DatePrecision.UNKNOWN
    )

    def __str__(self):
        if self.date_known and self.date:
            return str(self.date)
        return f"{self.date_estimate_start or '?'}–{self.date_estimate_end or '?'} ({self.date_precision})"

    class Meta:
        verbose_name_plural = "Date Estimates"
        indexes = [models.Index(fields=['date_precision'])]

# -------------------------------------------------
# ABSTRACT BASE MODELS
# -------------------------------------------------
class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class AbstractUserTrackingModel(TimestampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    cultures = models.ManyToManyField('Culture', related_name="%(class)s_items", blank=True)
    rating = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    notes = models.TextField(blank=True)
    visibility = models.CharField(
        max_length=20,
        choices=Visibility.choices,
        default=Visibility.PRIVATE
    )

    def clean(self):
        # Guard against unsaved instance
        if self.pk is None:
            return
        for culture in self.cultures.all():
            if culture.user != self.user:
                raise ValidationError(f"Culture {culture.name} does not belong to user {self.user.username}")

    class Meta:
        abstract = True

class AbstractMedia(TimestampedModel):
    title = models.CharField(max_length=200)
    alt_title = models.CharField(max_length=200, null=True, blank=True)
    creator = models.ForeignKey('Person', on_delete=models.SET_NULL, null=True, blank=True)
    creator_string = models.CharField(max_length=200, null=True, blank=True)
    alt_creator_name = models.CharField(max_length=200, null=True, blank=True)
    date = models.OneToOneField('DateEstimate', on_delete=models.CASCADE, null=True, blank=True)
    external_links = models.JSONField(default=list, blank=True)  # [ {"label": "Wikipedia", "url": "..."}, ]
    tags = TaggableManager(blank=True)

    class Meta:
        abstract = True

# -------------------------------------------------
# USER-SPECIFIC MODELS
# -------------------------------------------------
class Profile(TimestampedModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    bio = models.TextField(blank=True)
    avatar = models.URLField(blank=True, null=True)
    location = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True, null=True)
    preferred_cultures = models.ManyToManyField('Culture', blank=True, related_name="preferred_by")
    display_reviews_publicly = models.BooleanField(default=False)

    def __str__(self):
        return f"Profile of {self.user.username}"

    class Meta:
        verbose_name_plural = "Profiles"
        indexes = [models.Index(fields=['user'])]

class Culture(TimestampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cultures")
    name = models.CharField(max_length=100)
    code = models.SlugField(max_length=3)
    colour = ColorField(default='#FFFFFF')
    picture = models.URLField(blank=True, null=True)
    shared_group_key = models.SlugField(
        max_length=50,
        blank=True,
        default="",
        help_text="Canonical key linking related cultures across users"
    )
    visibility = models.CharField(
        max_length=20,
        choices=Visibility.choices,
        default=Visibility.PRIVATE
    )
    
    def save(self, *args, **kwargs):
        if not self.shared_group_key:
            self.shared_group_key = self.code.lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.user.username})"

    class Meta:
        unique_together = [('user', 'code')]
        indexes = [models.Index(fields=['user', 'code', 'shared_group_key'])]
        verbose_name_plural = "Cultures"

class Category(TimestampedModel):
    culture = models.ForeignKey(Culture, on_delete=models.CASCADE, related_name="categories")
    key = models.SlugField(max_length=50)
    display_name = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.display_name} ({self.culture.name})"

    class Meta:
        verbose_name_plural = "Categories"
        indexes = [models.Index(fields=['culture', 'key'])]

class Period(TimestampedModel):
    culture = models.ForeignKey(Culture, on_delete=models.CASCADE, related_name="periods")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="periods")
    start_year = models.IntegerField()
    end_year = models.IntegerField()
    title = models.CharField(max_length=200, blank=True, null=True)
    desc = models.TextField(blank=True, null=True)
    short_intro = models.CharField(max_length=255, blank=True, null=True)

    def clean(self):
        if self.start_year > self.end_year:
            raise ValidationError("Start year must be less than or equal to end year.")

    def __str__(self):
        return f"{self.category.display_name}: {self.start_year}-{self.end_year} ({self.culture.name})"

    class Meta:
        verbose_name_plural = "Periods"
        indexes = [models.Index(fields=["culture", "category"])]

class PageContent(TimestampedModel):
    culture = models.ForeignKey(Culture, on_delete=models.CASCADE, related_name="pages")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="pages")
    intro_text = models.TextField(blank=True, null=True)
    overview_text = models.TextField(blank=True, null=True)
    extra_text = models.TextField(blank=True, null=True)
    lists = models.JSONField(default=list, blank=True, null=True)

    def __str__(self):
        return f"{self.category.display_name} Page ({self.culture.name})"

    class Meta:
        verbose_name_plural = "Page Contents"

class Recipe(AbstractUserTrackingModel):
    name = models.CharField(max_length=200)
    region = models.CharField(max_length=100, blank=True)
    cooking_time = models.PositiveIntegerField(help_text="Minutes", null=True, blank=True)
    ingredients = models.JSONField(default=list)
    instructions = models.JSONField(default=list)
    types = models.JSONField(default=list)
    course = models.CharField(max_length=50)
    serving_size = models.CharField(max_length=50, blank=True)
    photo = models.URLField(blank=True, null=True)

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.name} ({culture_names})"

    class Meta:
        verbose_name_plural = "Recipes"
        indexes = [models.Index(fields=['user'])]

class LangLesson(AbstractUserTrackingModel):
    topic = models.CharField(max_length=200)
    lesson = models.TextField()
    examples = models.TextField(blank=True)
    level = models.CharField(
        max_length=50,
        choices=[('beginner', 'Beginner'), ('intermediate', 'Intermediate'), ('advanced', 'Advanced')]
    )

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.topic} ({culture_names})"

    class Meta:
        verbose_name_plural = "Language Lessons"
        indexes = [models.Index(fields=['user'])]

class CalendarDate(AbstractUserTrackingModel):
    holiday_name = models.CharField(max_length=200)
    date_text = models.CharField(max_length=100, blank=True)
    calendar_date = models.DateField(null=True, blank=True)
    type = models.CharField(max_length=100, blank=True, null=True)
    traditions = models.TextField(blank=True)
    meaning = models.TextField(blank=True)
    photo = models.URLField(blank=True, null=True)
    isAnnual = models.BooleanField(default=False)
    reference_system = models.CharField(
        max_length=50,
        choices=[
            ("gregorian", "Gregorian"),
            ("egyptian", "Egyptian"),
            ("islamic", "Islamic"),
        ],
        default="gregorian",
    )
    person = models.ForeignKey("Person", null=True, blank=True, on_delete=models.SET_NULL, related_name="holidays")

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.holiday_name} ({culture_names})"

    class Meta:
        verbose_name_plural = "Calendar Dates"
        indexes = [models.Index(fields=['user'])]
        unique_together = [("holiday_name", "calendar_date")]
             
class UserHistoryEvent(AbstractUserTrackingModel):
    title = models.CharField(max_length=200)
    alt_title = models.CharField(max_length=200, null=True, blank=True)
    type = models.CharField(max_length=100)
    date = models.OneToOneField(DateEstimate, on_delete=models.CASCADE, null=True, blank=True, related_name="user_history_event")
    location = models.CharField(max_length=200, blank=True, null=True)
    period = models.ForeignKey(Period, on_delete=models.SET_NULL, null=True, blank=True, related_name="events")
    sources = models.TextField(blank=True)
    significance_level = models.PositiveSmallIntegerField(default=0)
    importance_rank = models.PositiveSmallIntegerField(null=True, blank=True)
    photo = models.URLField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.title} ({culture_names})"

    class Meta:
        verbose_name_plural = "User History Events"
        indexes = [models.Index(fields=['user'], name='user_event_idx')]

# -------------------------------------------------
# GLOBAL MODELS
# -------------------------------------------------
class Person(TimestampedModel):
    given_name = models.CharField(max_length=100)
    family_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    photo = models.URLField(blank=True, null=True)
    external_links = models.JSONField(default=list, blank=True)
    profession = models.CharField(max_length=100, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    birthplace = models.CharField(max_length=100, blank=True)
    birth_date = models.OneToOneField(DateEstimate, on_delete=models.CASCADE, null=True, blank=True, related_name="births")
    death_date = models.OneToOneField(DateEstimate, on_delete=models.CASCADE, null=True, blank=True, related_name="deaths")
    titles = models.CharField(max_length=255, blank=True)
    epithets = models.CharField(max_length=255, blank=True)
    resting_place = models.CharField(max_length=255, blank=True)
    notable_works = models.JSONField(default=list, blank=True)
    wikidata_id = models.CharField(max_length=20, blank=True, unique=True)

    def full_name(self):
        return f"{self.given_name} {self.middle_name} {self.family_name}".strip()

    def __str__(self):
        return self.full_name()

    class Meta:
        verbose_name_plural = "People"
        indexes = [models.Index(fields=['family_name', 'given_name'], name='person_name_idx'), models.Index(fields=['wikidata_id'], name='person_wikidata_idx')]

class UserMapPreferences(TimestampedModel):
    culture = models.ForeignKey(Culture, on_delete=models.CASCADE, related_name="map_preferences")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="map_preferences")
    center = models.JSONField(default=dict, null=True, blank=True)  # {"lat": ..., "lng": ...}
    zoom = models.PositiveIntegerField(default=5, null=True, blank=True)

    def __str__(self):
        return f"Map Preferences of {self.culture.name}"

    class Meta:
        verbose_name_plural = "Map Preferences"

class MapPin(AbstractUserTrackingModel):
    period = models.ForeignKey(Period, on_delete=models.CASCADE, related_name="map_pins", null=True, blank=True)
    type = models.CharField(max_length=50, null=True, blank=True)
    filter = models.CharField(max_length=50, choices=[
        ("landmark", "Landmark"),
        ("event", "Event"),
        ("travel", "Travel"),
        ("figure", "Figure"),
        ("artwork", "Artwork"),
        ("other", "Other"),
    ], default="other")
    loc = models.JSONField()
    external_link = models.URLField(null=True, blank=True)
    visibility = models.CharField(
        max_length=20,
        choices=Visibility.choices,
        default=Visibility.PRIVATE
    )
    title = models.CharField(max_length=200, null=True, blank=True)
    photo = models.URLField(null=True, blank=True)
    date = models.OneToOneField(DateEstimate, on_delete=models.CASCADE, null=True, blank=True, related_name="user_map_pin")
    location = models.CharField(max_length=200, null=True, blank=True)
    happened = models.TextField(blank=True, null=True)
    significance = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.type} Pin"

    class Meta:
        verbose_name_plural = "Map Pins"

class LanguageTable(TimestampedModel):
    culture = models.ForeignKey(Culture, on_delete=models.CASCADE, related_name="language_tables")
    title = models.CharField(max_length=200)
    table_data = models.JSONField(default=dict)

    def __str__(self):
        return f"{self.title} ({self.culture.name})"

    class Meta:
        verbose_name_plural = "Language Tables"

# -------------------------------------------------
# HYBRID MODELS
# -------------------------------------------------
class UniversalItem(TimestampedModel):
    external_id = models.CharField(max_length=255)
    title = models.CharField(max_length=200)
    creator_string = models.CharField(max_length=200, null=True, blank=True)
    type = models.CharField(max_length=50)

    def __str__(self):
        return f"{self.title} ({self.type})"

    class Meta:
        verbose_name_plural = "Universal Items"
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['type']),
            models.Index(fields=['creator_string'])
        ]

# ---- BOOK ----
class Book(AbstractMedia):
    universal_item = models.OneToOneField(UniversalItem, on_delete=models.CASCADE, related_name="book", blank=True, null=True)
    series = models.CharField(max_length=200, blank=True, null=True)
    volume = models.CharField(max_length=50, blank=True, null=True)
    cover = models.URLField(blank=True, null=True)
    synopsis = models.TextField(blank=True)
    industry_rating = models.DecimalField(max_digits=4, blank=True, null=True, decimal_places=1)
    genre = models.JSONField(default=list, blank=True, null=True)
    languages = models.JSONField(default=list, blank=True, null=True)
    ol_id = models.CharField(max_length=20, blank=True, null=True, unique=True)
    

    class Meta:
        verbose_name_plural = "Books"
        indexes = [models.Index(fields=['ol_id'], name='book_ol_id_idx')]
        
    @classmethod
    @transaction.atomic
    def create_with_universal_item(cls, payload):
        """
        Create or update a Book record and its linked UniversalItem entry.
        """
        universal_item, _ = UniversalItem.objects.get_or_create(
            external_id=payload["ol_id"],
            type="book",
            defaults={
                "title": payload["title"],
                "creator_string": payload["creator_string"],
            },
        )

        book, created = cls.objects.update_or_create(
            ol_id=payload["ol_id"],
            defaults={
                "universal_item": universal_item,
                "title": payload.get("title") or "Untitled",
                "alt_title": payload.get("alt_title") or None,
                "creator_string": payload.get("creator_string"),
                "alt_creator_name": payload.get("alt_creator_name") or None,
                "cover": payload.get("cover"),
                "synopsis": payload.get("synopsis"),
                "genre": payload.get("genre", []),
                "languages": payload.get("language"),
            },
        )

        return book, created

class UserBook(AbstractUserTrackingModel):
    universal_item = models.ForeignKey(UniversalItem, on_delete=models.CASCADE, related_name="user_books")
    page_count = models.PositiveIntegerField(null=True, blank=True)
    translated = models.BooleanField(default=False)
    format = models.CharField(max_length=50, blank=True, null=True)
    cover = models.URLField(blank=True, null=True)
    publisher = models.CharField(max_length=200, blank=True, null=True)
    isbn = models.CharField(max_length=25, blank=True, null=True)
    edition = models.CharField(max_length=50, blank=True, null=True)
    edition_read_year = models.IntegerField(blank=True, null=True)
    date_started = models.DateField(null=True, blank=True)
    date_finished = models.DateField(null=True, blank=True)
    read_language = models.CharField(max_length=100, blank=True, null=True)
    owned = models.BooleanField(default=False)
    read = models.BooleanField(default=False)
    readlist = models.BooleanField(default=False)
    favourite = models.BooleanField(default=False)
    period = models.ForeignKey(Period, on_delete=models.SET_NULL, null=True, blank=True, related_name="user_books")

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.universal_item.title} ({culture_names})"

    class Meta:
        unique_together = [('user', 'isbn')]
        verbose_name_plural = "User Books"
        indexes = [models.Index(fields=['user', 'universal_item'], name='user_book_idx')]

# ---- FILM ----
class Film(AbstractMedia):
    runtime = models.DurationField(null=True, blank=True)
    genre = models.JSONField(default=list, blank=True, null=True)
    tmdb_id = models.CharField(max_length=20, null=True, blank=True, unique=True)
    universal_item = models.OneToOneField(UniversalItem, on_delete=models.CASCADE, related_name="film", blank=True, null=True)
    cast = models.JSONField(default=list, null=True, blank=True)
    crew = models.JSONField(default=list, null=True, blank=True)
    blurb = models.TextField(blank=True, null=True)
    synopsis = models.TextField(blank=True, null=True)
    languages = models.JSONField(default=list, blank=True, null=True)
    countries = models.JSONField(default=list, blank=True, null=True)
    festival = models.CharField(max_length=200, blank=True, null=True)
    poster = models.URLField(blank=True, null=True)
    background_pic = models.URLField(blank=True, null=True)
    budget = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    box_office = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    series = models.CharField(max_length=200, null=True, blank=True)
    volume = models.CharField(max_length=50, null=True, blank=True)
    release_date = models.DateField(null=True, blank=True)
    industry_rating = models.DecimalField(max_digits=12, decimal_places=1, blank=True, null=True)

    class Meta:
        verbose_name_plural = "Films"
        indexes = [models.Index(fields=['tmdb_id'], name='film_tmdb_idx')]
        
    @classmethod
    @transaction.atomic
    def create_with_universal_item(cls, tmdb_data):
        runtime = None
        runtime_value = tmdb_data.get("runtime")
        if runtime_value is not None:
            try:
                runtime = timedelta(minutes=int(runtime_value))
            except (ValueError, TypeError):
                runtime = None
        
        director_data = next(
            (c for c in tmdb_data.get("credits", {}).get("crew", []) if c["job"] == "Director"),
            None
        )
        director_name = director_data.get("name") if director_data else None
        director_original_name = director_data.get("original_name") if director_data else None
        alt_name = director_original_name if director_original_name and director_original_name != director_name else None
        
        universal_item, _ = UniversalItem.objects.get_or_create(
            external_id=tmdb_data["id"],
            type="film",
            defaults={
                "title": tmdb_data["title"],
                "creator_string": director_data.get("name") if director_data else "Unknown"
            },
        )
        
        film, created = cls.objects.update_or_create(
            tmdb_id=tmdb_data["id"],
            defaults={
                "universal_item": universal_item,
                "title": tmdb_data.get("title") or "Unknown Title",
                "tmdb_id": tmdb_data.get("id"),
                "alt_title": tmdb_data.get("original_title") if tmdb_data.get("original_title") != tmdb_data.get("title") else None,
                "creator_string": director_name,
                "alt_creator_name": alt_name,
                "runtime": runtime,
                "cast": [
                    {"name": c.get("name"), "role": c.get("character") or ""}
                    for c in tmdb_data.get("credits", {}).get("cast", [])
                ],
                "crew": [
                    {"name": c.get("name"), "role": c.get("job") or ""}
                    for c in tmdb_data.get("credits", {}).get("crew", [])
                ],
                "industry_rating": round(float(tmdb_data.get("vote_average") or 0.0), 1),
                "series": tmdb_data.get("belongs_to_collection", {}).get("name") if tmdb_data.get("belongs_to_collection") else None,
                "blurb": tmdb_data.get("tagline"),
                "synopsis": tmdb_data.get("overview"),
                "countries": [c for c in tmdb_data.get("origin_country", [])] or [],
                "poster": f"https://image.tmdb.org/t/p/original{tmdb_data.get('poster_path')}" if tmdb_data.get("poster_path") else None,
                "background_pic": f"https://image.tmdb.org/t/p/original{tmdb_data.get('backdrop_path')}" if tmdb_data.get("backdrop_path") else None,
                "genre": [g["name"] for g in tmdb_data.get("genres", [])] or [],
                "budget": tmdb_data.get("budget") or 0,
                "box_office": tmdb_data.get("box_office") or 0,
                "release_date": tmdb_data.get("release_date") or None,
                "languages": [l["iso_639_1"] for l in tmdb_data.get("spoken_languages", [])] or [],
            },
        )
        
        return film, created

class UserFilm(AbstractUserTrackingModel):
    universal_item = models.ForeignKey(UniversalItem, on_delete=models.CASCADE, related_name="user_films", null=True, blank=True)
    rewatch_count = models.PositiveIntegerField(default=0)
    watch_location = models.CharField(max_length=200, blank=True, null=True)
    date_watched = models.DateField(null=True, blank=True)
    poster = models.URLField(blank=True, null=True)
    background_pic = models.URLField(blank=True, null=True)
    seen = models.BooleanField(default=False)
    owned = models.BooleanField(default=False)
    watchlist = models.BooleanField(default=False)
    favourite = models.BooleanField(default=False)
    period = models.ForeignKey(Period, on_delete=models.SET_NULL, null=True, blank=True, related_name="user_films")
    

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.universal_item.title} ({culture_names})"

    class Meta:
        verbose_name_plural = "User Films"
        indexes = [models.Index(fields=['user', 'universal_item'], name='user_film_idx')]

# ---- MUSIC PIECE ----
class UserMusicPiece(AbstractUserTrackingModel):
    title = models.CharField(max_length=200, blank=True, null=True)
    artist = models.CharField(max_length=200, blank=True, null=True)
    instrument = models.CharField(max_length=100, blank=True, null=True)
    recording = models.URLField(blank=True, null=True)
    sheet_music = models.JSONField(default=list, blank=True, null=True)
    learned = models.BooleanField(default=False)
    release_year = models.IntegerField(blank=True, null=True)
    
    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.title} ({culture_names})"

    class Meta:
        verbose_name_plural = "User Music Pieces"
        indexes = [models.Index(fields=['user'], name='user_music_idx')]
        
class UserMusicArtist(AbstractUserTrackingModel):
    name = models.CharField(max_length=200)
    bio = models.TextField(blank=True, null=True)
    photo = models.URLField(blank=True, null=True)
    genres = models.JSONField(default=list, blank=True, null=True)
    external_links = models.JSONField(default=list, blank=True)
    year_active_start = models.IntegerField(null=True, blank=True)
    year_active_end = models.IntegerField(null=True, blank=True)
    notable_works = models.JSONField(default=list, blank=True, null=True)
    ranking_tier = models.PositiveSmallIntegerField(null=True, blank=True)
    favourite = models.BooleanField(default=False)
    best_albums = models.JSONField(default=list, blank=True, null=True)
    best_songs = models.JSONField(default=list, blank=True, null=True)

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.name} ({culture_names})"

    class Meta:
        verbose_name_plural = "User Music Artists"
        indexes = [models.Index(fields=['user'], name='user_music_artist_idx')]
        
class UserMusicComposer(AbstractUserTrackingModel):
    name = models.CharField(max_length=200)
    alt_name = models.CharField(max_length=200, null=True, blank=True)
    occupations = models.JSONField(default=list, blank=True, null=True)
    birth_year = models.IntegerField(blank=True, null=True)
    death_year = models.IntegerField(blank=True, null=True)
    period = models.ForeignKey(Period, on_delete=models.SET_NULL, null=True, blank=True, related_name="composers")
    photo = models.URLField(blank=True, null=True)
    summary = models.TextField(blank=True, null=True)
    famous = models.JSONField(default=list, blank=True, null=True)
    themes = models.JSONField(default=list, null=True, blank=True)
    instruments = models.JSONField(default=list, blank=True, null=True)
    

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.name} ({culture_names})"

    class Meta:
        verbose_name_plural = "User Composers"
        indexes = [models.Index(fields=['user'], name='user_composer_idx')]
        
class UserComposerSearch(TimestampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    culture = models.ForeignKey("Culture", on_delete=models.CASCADE)
    composer_list = models.JSONField(default=list, null=True, blank=True)
    saved_location = models.JSONField(default=dict, blank=True, null=True)
    
    class Meta:
        verbose_name_plural = "User Composer Searches"
        indexes = [models.Index(fields=["user", "culture"], name="user_composer_search_idx")]
        unique_together = [("user", "culture")]

# ---- LISTS ----
class List(TimestampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="lists")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    cultures = models.ManyToManyField(Culture, related_name="lists", blank=True)
    items = models.ManyToManyField(UniversalItem, related_name="in_lists", blank=True)
    visibility = models.CharField(
        max_length=20,
        choices=Visibility.choices,
        default=Visibility.PRIVATE
    )

    LIST_TYPES = [
        ("books", "Books"),
        ("films", "Films"),
        ("artworks", "Artworks"),
        ("music", "Music"),
        ("events", "History Events"),
        ("mixed", "Mixed"),
    ]
    type = models.CharField(max_length=100, blank=True, null=True, choices=LIST_TYPES)
    

    def __str__(self):
        return f"{self.name} ({self.user.username})"

    class Meta:
        verbose_name_plural = "Lists"
        indexes = [models.Index(fields=["user", "name"], name="list_user_name_idx")]
        unique_together = ("user", "name")