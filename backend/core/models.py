from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from colorfield.fields import ColorField
from taggit.managers import TaggableManager
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
    cultures = models.ManyToManyField('Culture', related_name="%(class)s_items")
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
    creator = models.ForeignKey('Person', on_delete=models.SET_NULL, null=True, blank=True)
    date = models.ForeignKey('DateEstimate', on_delete=models.SET_NULL, null=True, blank=True)
    external_links = models.JSONField(default=list, blank=True)  # [ {"label": "Wikipedia", "url": "..."} ]
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

    def __str__(self):
        return f"{self.name} ({self.user.username})"

    class Meta:
        unique_together = [('user', 'code')]
        indexes = [models.Index(fields=['user', 'code'])]
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
    section = models.CharField(max_length=100)
    start_year = models.IntegerField()
    end_year = models.IntegerField()
    desc = models.TextField(blank=True)
    short_intro = models.CharField(max_length=255, blank=True)

    def clean(self):
        if self.start_year > self.end_year:
            raise ValidationError("Start year must be less than or equal to end year.")

    def __str__(self):
        return f"{self.section}: {self.start_year}-{self.end_year} ({self.culture.name})"

    class Meta:
        verbose_name_plural = "Periods"
        indexes = [models.Index(fields=['culture', 'section'])]

class PageContent(TimestampedModel):
    culture = models.ForeignKey(Culture, on_delete=models.CASCADE, related_name="pages")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="pages")
    intro_text = models.TextField(blank=True)
    overview_text = models.TextField(blank=True)
    extra_text = models.TextField(blank=True)

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
    type = models.CharField(max_length=50)
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
    traditions = models.TextField(blank=True)
    meaning = models.TextField(blank=True)
    photo = models.URLField(blank=True, null=True)
    person = models.ForeignKey("Person", null=True, blank=True, on_delete=models.SET_NULL, related_name="holidays")

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.holiday_name} ({culture_names})"

    class Meta:
        verbose_name_plural = "Calendar Dates"
        indexes = [models.Index(fields=['user'])]

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
    birth_date = models.ForeignKey(DateEstimate, related_name="births", on_delete=models.SET_NULL, null=True, blank=True)
    death_date = models.ForeignKey(DateEstimate, related_name="deaths", on_delete=models.SET_NULL, null=True, blank=True)
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

class MapBorder(TimestampedModel):
    culture = models.ForeignKey(Culture, on_delete=models.CASCADE, related_name="map_borders")
    period = models.ForeignKey(Period, on_delete=models.CASCADE, related_name="map_borders")
    borders = models.JSONField()

    def __str__(self):
        return f"Borders of {self.culture.name} ({self.period})"

    class Meta:
        verbose_name_plural = "Map Borders"

class MapPin(TimestampedModel):
    culture = models.ForeignKey(Culture, on_delete=models.CASCADE, related_name="map_pins")
    period = models.ForeignKey(Period, on_delete=models.CASCADE, related_name="map_pins")
    type = models.CharField(max_length=50)
    loc = models.JSONField()
    external_links = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.type} Pin ({self.culture.name})"

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
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    cultures = models.ManyToManyField(Culture, related_name="universal_items")
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=50)

    def clean(self):
        # Guard against unsaved instance
        if self.pk is None:
            return
        users = {culture.user for culture in self.cultures.all()}
        if len(users) > 1:
            raise ValidationError("All cultures must belong to the same user.")

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.title} ({self.type}, {culture_names})"

    class Meta:
        verbose_name_plural = "Universal Items"
        indexes = [models.Index(fields=['content_type', 'object_id'], name='universal_item_idx')]

# ---- BOOK ----
class Book(AbstractMedia):
    isbn = models.CharField(max_length=20, null=True, blank=True, unique=True)
    universal_item = GenericRelation(UniversalItem, related_query_name="book")

    class Meta:
        verbose_name_plural = "Books"
        indexes = [models.Index(fields=['isbn'], name='book_isbn_idx')]

class UserBook(AbstractUserTrackingModel):
    universal_item = models.ForeignKey(UniversalItem, on_delete=models.CASCADE, related_name="user_books")
    page_count = models.PositiveIntegerField(null=True, blank=True)
    is_history = models.BooleanField(default=False)
    translated = models.BooleanField(default=False)
    format = models.CharField(max_length=50, blank=True)
    cover = models.URLField(blank=True, null=True)
    date_started = models.DateField(null=True, blank=True)
    date_finished = models.DateField(null=True, blank=True)
    series = models.CharField(max_length=200, blank=True)
    location = models.CharField(max_length=200, blank=True)
    synopsis = models.TextField(blank=True)
    owned = models.BooleanField(default=False)

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.universal_item.title} ({culture_names})"

    class Meta:
        verbose_name_plural = "User Books"
        indexes = [models.Index(fields=['user', 'universal_item'], name='user_book_idx')]

# ---- FILM ----
class Film(AbstractMedia):
    runtime = models.PositiveIntegerField(null=True, blank=True)
    genre = models.CharField(max_length=100, blank=True)
    tmdb_id = models.CharField(max_length=20, null=True, blank=True, unique=True)
    universal_item = GenericRelation(UniversalItem, related_query_name="film")

    class Meta:
        verbose_name_plural = "Films"
        indexes = [models.Index(fields=['tmdb_id'], name='film_tmdb_idx')]

class UserFilm(AbstractUserTrackingModel):
    universal_item = models.ForeignKey(UniversalItem, on_delete=models.CASCADE, related_name="user_films")
    cast = models.JSONField(default=list)
    crew = models.JSONField(default=list)
    rewatch_count = models.PositiveIntegerField(default=0)
    watch_location = models.CharField(max_length=200, blank=True)
    medium = models.CharField(max_length=100, blank=True)
    sound = models.BooleanField(default=True)
    color = models.BooleanField(default=True)
    date_watched = models.DateField(null=True, blank=True)
    poster = models.URLField(blank=True, null=True)
    background_pic = models.URLField(blank=True, null=True)
    awards_won = models.JSONField(default=list)

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.universal_item.title} ({culture_names})"

    class Meta:
        verbose_name_plural = "User Films"
        indexes = [models.Index(fields=['user', 'universal_item'], name='user_film_idx')]

# ---- MUSIC PIECE ----
class MusicPiece(AbstractMedia):
    instrument = models.CharField(max_length=100, blank=True)
    recording = models.URLField(blank=True, null=True)
    sheet_music = models.URLField(blank=True, null=True)
    musicbrainz_id = models.CharField(max_length=36, null=True, blank=True, unique=True)
    universal_item = GenericRelation(UniversalItem, related_query_name="music")

    class Meta:
        verbose_name_plural = "Music Pieces"
        indexes = [models.Index(fields=['musicbrainz_id'], name='music_musicbrainz_idx')]

class UserMusicPiece(AbstractUserTrackingModel):
    universal_item = models.ForeignKey(UniversalItem, on_delete=models.CASCADE, related_name="user_music_pieces")

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.universal_item.title} ({culture_names})"

    class Meta:
        verbose_name_plural = "User Music Pieces"
        indexes = [models.Index(fields=['user', 'universal_item'], name='user_music_idx')]

# ---- ARTWORK ----
class Artwork(AbstractMedia):
    group = models.CharField(max_length=100, choices=[("artwork", "Artwork"), ("artifact", "Artifact")])
    location = models.CharField(max_length=200, blank=True)
    associated_culture = models.CharField(max_length=200, blank=True)
    themes = models.TextField(blank=True)
    photo = models.URLField(blank=True, null=True)
    model_3d = models.URLField(blank=True, null=True)
    type = models.CharField(max_length=100, blank=True)
    wikidata_id = models.CharField(max_length=20, null=True, blank=True, unique=True)
    universal_item = GenericRelation(UniversalItem, related_query_name="artwork")

    class Meta:
        verbose_name_plural = "Artworks"
        indexes = [models.Index(fields=['wikidata_id'], name='artwork_wikidata_idx')]

class UserArtwork(AbstractUserTrackingModel):
    universal_item = models.ForeignKey(UniversalItem, on_delete=models.CASCADE, related_name="user_artworks")

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.universal_item.title} ({culture_names})"

    class Meta:
        verbose_name_plural = "User Artworks"
        indexes = [models.Index(fields=['user', 'universal_item'], name='user_artwork_idx')]

# ---- HISTORY EVENT ----
class HistoryEvent(AbstractMedia):
    type = models.CharField(max_length=100)
    period = models.ForeignKey(Period, on_delete=models.SET_NULL, null=True, blank=True, related_name="events")
    location = models.CharField(max_length=200, blank=True)
    sources = models.TextField(blank=True)
    significance_level = models.PositiveSmallIntegerField(default=0)
    wikidata_id = models.CharField(max_length=20, null=True, blank=True, unique=True)
    universal_item = GenericRelation(UniversalItem, related_query_name="event")

    class Meta:
        verbose_name_plural = "History Events"
        indexes = [models.Index(fields=['wikidata_id'], name='event_wikidata_idx')]
class UserHistoryEvent(AbstractUserTrackingModel):
    universal_item = models.ForeignKey(UniversalItem, on_delete=models.CASCADE, related_name="user_history_events")
    importance_rank = models.PositiveSmallIntegerField(null=True, blank=True)

    def __str__(self):
        culture_names = ", ".join(culture.name for culture in self.cultures.all())
        return f"{self.universal_item.title} ({culture_names})"

    class Meta:
        verbose_name_plural = "User History Events"
        indexes = [models.Index(fields=['user', 'universal_item'], name='user_event_idx')]