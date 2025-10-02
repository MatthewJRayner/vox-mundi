from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.contenttypes.models import ContentType
from taggit.serializers import TagListSerializerField
from .models import (
    Profile, Culture, Category, Period, PageContent, Recipe, LangLesson,
    CalendarDate, Person, MapBorder, MapPin, LanguageTable, UniversalItem,
    Book, Film, MusicPiece, Artwork, HistoryEvent, UserBook, UserFilm,
    UserMusicPiece, UserArtwork, UserHistoryEvent, DateEstimate, Visibility
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class DateEstimateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DateEstimate
        fields = ['id', 'date_known', 'date', 'date_estimate_start', 'date_estimate_end', 'date_precision']

class PersonSerializer(serializers.ModelSerializer):
    birth_date = DateEstimateSerializer(read_only=True)
    death_date = DateEstimateSerializer(read_only=True)
    birth_date_id = serializers.PrimaryKeyRelatedField(queryset=DateEstimate.objects.all(), source='birth_date', write_only=True, required=False)
    death_date_id = serializers.PrimaryKeyRelatedField(queryset=DateEstimate.objects.all(), source='death_date', write_only=True, required=False)

    class Meta:
        model = Person
        fields = ['id', 'given_name', 'family_name', 'middle_name', 'bio', 'photo',
                  'external_links', 'profession', 'nationality', 'birthplace',
                  'birth_date', 'birth_date_id', 'death_date', 'death_date_id', 'titles', 'epithets', 'resting_place',
                  'notable_works', 'wikidata_id']

class CultureSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Culture
        fields = ['id', 'user', 'name', 'code', 'colour', 'picture', 'created_at', 'updated_at']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    preferred_cultures = CultureSerializer(many=True, read_only=True)
    preferred_culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), source='preferred_cultures', many=True, write_only=True, required=False)

    class Meta:
        model = Profile
        fields = ['id', 'user', 'bio', 'avatar', 'location', 'website',
                  'preferred_cultures', 'preferred_culture_ids', 'display_reviews_publicly', 'created_at', 'updated_at']

class CategorySerializer(serializers.ModelSerializer):
    culture = CultureSerializer(read_only=True)
    culture_id = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), source='culture', write_only=True, required=False)

    class Meta:
        model = Category
        fields = ['id', 'culture', 'culture_id', 'key', 'display_name', 'created_at', 'updated_at']

class PeriodSerializer(serializers.ModelSerializer):
    culture = CultureSerializer(read_only=True)
    culture_id = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), source='culture', write_only=True, required=False)

    class Meta:
        model = Period
        fields = ['id', 'culture', 'culture_id', 'section', 'start_year', 'end_year', 'desc', 'short_intro', 'created_at', 'updated_at']

class PageContentSerializer(serializers.ModelSerializer):
    culture = CultureSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    culture_id = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), source='culture', write_only=True, required=False)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True, required=False)

    class Meta:
        model = PageContent
        fields = ['id', 'culture', 'culture_id', 'category', 'category_id', 'intro_text', 'overview_text', 'extra_text', 'created_at', 'updated_at']

class RecipeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    cultures = CultureSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)

    class Meta:
        model = Recipe
        fields = ['id', 'user', 'cultures', 'culture_ids', 'name', 'region', 'cooking_time', 'ingredients',
                  'instructions', 'type', 'course', 'rating', 'notes', 'visibility',
                  'serving_size', 'photo', 'created_at', 'updated_at']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value

class LangLessonSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    cultures = CultureSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)

    class Meta:
        model = LangLesson
        fields = ['id', 'user', 'cultures', 'culture_ids', 'topic', 'lesson', 'examples', 'level',
                  'rating', 'notes', 'visibility', 'created_at', 'updated_at']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value

class CalendarDateSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    cultures = CultureSerializer(many=True, read_only=True)
    person = PersonSerializer(read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)
    person_id = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), source='person', write_only=True, required=False)

    class Meta:
        model = CalendarDate
        fields = ['id', 'user', 'cultures', 'culture_ids', 'holiday_name', 'date_text', 'calendar_date',
                  'traditions', 'meaning', 'photo', 'person', 'person_id', 'rating', 'notes',
                  'visibility', 'created_at', 'updated_at']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value

class MapBorderSerializer(serializers.ModelSerializer):
    culture = CultureSerializer(read_only=True)
    period = PeriodSerializer(read_only=True)
    culture_id = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), source='culture', write_only=True, required=False)
    period_id = serializers.PrimaryKeyRelatedField(queryset=Period.objects.all(), source='period', write_only=True, required=False)

    class Meta:
        model = MapBorder
        fields = ['id', 'culture', 'culture_id', 'period', 'period_id', 'borders', 'created_at', 'updated_at']

class MapPinSerializer(serializers.ModelSerializer):
    culture = CultureSerializer(read_only=True)
    period = PeriodSerializer(read_only=True)
    culture_id = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), source='culture', write_only=True, required=False)
    period_id = serializers.PrimaryKeyRelatedField(queryset=Period.objects.all(), source='period', write_only=True, required=False)

    class Meta:
        model = MapPin
        fields = ['id', 'culture', 'culture_id', 'period', 'period_id', 'type', 'loc', 'external_links', 'created_at', 'updated_at']

class LanguageTableSerializer(serializers.ModelSerializer):
    culture = CultureSerializer(read_only=True)
    culture_id = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), source='culture', write_only=True, required=False)

    class Meta:
        model = LanguageTable
        fields = ['id', 'culture', 'culture_id', 'title', 'table_data', 'created_at', 'updated_at']

class UniversalItemSerializer(serializers.ModelSerializer):
    cultures = CultureSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)
    content_type = serializers.StringRelatedField()
    content_object = serializers.SerializerMethodField()

    def get_content_object(self, obj):
        if obj.content_object is None:
            return None
        content_type = obj.content_type.model
        if content_type == 'book':
            return BookSerializer(obj.content_object).data
        elif content_type == 'film':
            return FilmSerializer(obj.content_object).data
        elif content_type == 'musicpiece':
            return MusicPieceSerializer(obj.content_object).data
        elif content_type == 'artwork':
            return ArtworkSerializer(obj.content_object).data
        elif content_type == 'historyevent':
            return HistoryEventSerializer(obj.content_object).data
        return None

    class Meta:
        model = UniversalItem
        fields = ['id', 'content_type', 'object_id', 'content_object', 'cultures', 'culture_ids', 'title', 'type', 'created_at', 'updated_at']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value

class BookSerializer(serializers.ModelSerializer):
    creator = PersonSerializer(read_only=True)
    creator_id = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), source='creator', write_only=True, required=False)
    date = DateEstimateSerializer(read_only=True)
    date_id = serializers.PrimaryKeyRelatedField(queryset=DateEstimate.objects.all(), source='date', write_only=True, required=False)
    tags = TagListSerializerField(required=False)

    class Meta:
        model = Book
        fields = ['id', 'title', 'creator', 'creator_id', 'date', 'date_id', 'external_links', 'tags', 'isbn', 'created_at', 'updated_at']

    def validate_isbn(self, value):
        if value and Book.objects.filter(isbn=value).exists():
            raise serializers.ValidationError("Book with this ISBN already exists.")
        return value

class FilmSerializer(serializers.ModelSerializer):
    creator = PersonSerializer(read_only=True)
    creator_id = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), source='creator', write_only=True, required=False)
    date = DateEstimateSerializer(read_only=True)
    date_id = serializers.PrimaryKeyRelatedField(queryset=DateEstimate.objects.all(), source='date', write_only=True, required=False)
    tags = TagListSerializerField(required=False)

    class Meta:
        model = Film
        fields = ['id', 'title', 'creator', 'creator_id', 'date', 'date_id', 'external_links', 'tags',
                  'runtime', 'genre', 'tmdb_id', 'created_at', 'updated_at']

    def validate_tmdb_id(self, value):
        if value and Film.objects.filter(tmdb_id=value).exists():
            raise serializers.ValidationError("Film with this TMDb ID already exists.")
        return value

class MusicPieceSerializer(serializers.ModelSerializer):
    creator = PersonSerializer(read_only=True)
    creator_id = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), source='creator', write_only=True, required=False)
    date = DateEstimateSerializer(read_only=True)
    date_id = serializers.PrimaryKeyRelatedField(queryset=DateEstimate.objects.all(), source='date', write_only=True, required=False)
    tags = TagListSerializerField(required=False)

    class Meta:
        model = MusicPiece
        fields = ['id', 'title', 'creator', 'creator_id', 'date', 'date_id', 'external_links', 'tags',
                  'instrument', 'recording', 'sheet_music', 'musicbrainz_id', 'created_at', 'updated_at']

    def validate_musicbrainz_id(self, value):
        if value and MusicPiece.objects.filter(musicbrainz_id=value).exists():
            raise serializers.ValidationError("MusicPiece with this MusicBrainz ID already exists.")
        return value

class ArtworkSerializer(serializers.ModelSerializer):
    creator = PersonSerializer(read_only=True)
    creator_id = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), source='creator', write_only=True, required=False)
    date = DateEstimateSerializer(read_only=True)
    date_id = serializers.PrimaryKeyRelatedField(queryset=DateEstimate.objects.all(), source='date', write_only=True, required=False)
    tags = TagListSerializerField(required=False)

    class Meta:
        model = Artwork
        fields = ['id', 'title', 'creator', 'creator_id', 'date', 'date_id', 'external_links', 'tags',
                  'group', 'location', 'associated_culture', 'themes', 'photo', 'model_3d',
                  'type', 'wikidata_id', 'created_at', 'updated_at']

    def validate_wikidata_id(self, value):
        if value and Artwork.objects.filter(wikidata_id=value).exists():
            raise serializers.ValidationError("Artwork with this Wikidata ID already exists.")
        return value

class HistoryEventSerializer(serializers.ModelSerializer):
    creator = PersonSerializer(read_only=True)
    creator_id = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), source='creator', write_only=True, required=False)
    date = DateEstimateSerializer(read_only=True)
    date_id = serializers.PrimaryKeyRelatedField(queryset=DateEstimate.objects.all(), source='date', write_only=True, required=False)
    period = PeriodSerializer(read_only=True)
    period_id = serializers.PrimaryKeyRelatedField(queryset=Period.objects.all(), source='period', write_only=True, required=False)
    tags = TagListSerializerField(required=False)

    class Meta:
        model = HistoryEvent
        fields = ['id', 'title', 'creator', 'creator_id', 'date', 'date_id', 'period', 'period_id', 'external_links', 'tags',
                  'type', 'location', 'sources', 'significance_level', 'wikidata_id', 'created_at', 'updated_at']

    def validate_wikidata_id(self, value):
        if value and HistoryEvent.objects.filter(wikidata_id=value).exists():
            raise serializers.ValidationError("HistoryEvent with this Wikidata ID already exists.")
        return value

class UserBookSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    universal_item = UniversalItemSerializer(read_only=True)
    universal_item_id = serializers.PrimaryKeyRelatedField(queryset=UniversalItem.objects.all(), source='universal_item', write_only=True, required=False)
    cultures = CultureSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)

    class Meta:
        model = UserBook
        fields = ['id', 'user', 'universal_item', 'universal_item_id', 'cultures', 'culture_ids', 'rating', 'notes', 'visibility',
                  'page_count', 'is_history', 'translated', 'format', 'cover',
                  'date_started', 'date_finished', 'series', 'location', 'synopsis',
                  'owned', 'created_at', 'updated_at']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value

class UserFilmSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    universal_item = UniversalItemSerializer(read_only=True)
    universal_item_id = serializers.PrimaryKeyRelatedField(queryset=UniversalItem.objects.all(), source='universal_item', write_only=True, required=False)
    cultures = CultureSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)

    class Meta:
        model = UserFilm
        fields = ['id', 'user', 'universal_item', 'universal_item_id', 'cultures', 'culture_ids', 'rating', 'notes', 'visibility',
                  'cast', 'crew', 'rewatch_count', 'watch_location', 'medium', 'sound',
                  'color', 'date_watched', 'poster', 'background_pic', 'awards_won',
                  'created_at', 'updated_at']

    def validate_cast(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Cast must be a list of objects.")
        for item in value:
            if not isinstance(item, dict) or 'name' not in item:
                raise serializers.ValidationError("Each cast item must be a dict with a 'name' key.")
        return value

    def validate_crew(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Crew must be a list of objects.")
        for item in value:
            if not isinstance(item, dict) or 'name' not in item or 'role' not in item:
                raise serializers.ValidationError("Each crew item must be a dict with 'name' and 'role' keys.")
        return value

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value

class UserMusicPieceSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    universal_item = UniversalItemSerializer(read_only=True)
    universal_item_id = serializers.PrimaryKeyRelatedField(queryset=UniversalItem.objects.all(), source='universal_item', write_only=True, required=False)
    cultures = CultureSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)

    class Meta:
        model = UserMusicPiece
        fields = ['id', 'user', 'universal_item', 'universal_item_id', 'cultures', 'culture_ids', 'rating', 'notes', 'visibility',
                  'created_at', 'updated_at']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value

class UserArtworkSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    universal_item = UniversalItemSerializer(read_only=True)
    universal_item_id = serializers.PrimaryKeyRelatedField(queryset=UniversalItem.objects.all(), source='universal_item', write_only=True, required=False)
    cultures = CultureSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)

    class Meta:
        model = UserArtwork
        fields = ['id', 'user', 'universal_item', 'universal_item_id', 'cultures', 'culture_ids', 'rating', 'notes', 'visibility',
                  'created_at', 'updated_at']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value

class UserHistoryEventSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    universal_item = UniversalItemSerializer(read_only=True)
    universal_item_id = serializers.PrimaryKeyRelatedField(queryset=UniversalItem.objects.all(), source='universal_item', write_only=True, required=False)
    cultures = CultureSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)

    class Meta:
        model = UserHistoryEvent
        fields = ['id', 'user', 'universal_item', 'universal_item_id', 'cultures', 'culture_ids', 'rating', 'notes', 'visibility',
                  'importance_rank', 'created_at', 'updated_at']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value
    
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user