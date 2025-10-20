from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.contenttypes.models import ContentType
from taggit.serializers import TagListSerializerField
from .models import (
    Profile, Culture, Category, Period, PageContent, Recipe, LangLesson,
    CalendarDate, Person, MapBorder, MapPin, LanguageTable, UniversalItem,
    Book, Film, MusicPiece, Artwork, UserBook, UserFilm,
    UserMusicPiece, UserMusicArtist, UserArtwork, UserHistoryEvent, DateEstimate, Visibility, List
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
        
class PersonSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ['given_name', 'family_name', 'photo']

class CultureSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Culture
        fields = ['id', 'user', 'name', 'code', 'colour', 'picture', 'created_at', 'updated_at', 'shared_group_key', 'visibility']
        
    def create(self, validated_data):
        culture = super().create(validated_data)
        
        default_category = ["Literature", "Film", "Music", "Art", "Cuisine", "History", "Calendar"]
        
        Category.objects.bulk_create([
            Category(
                culture=culture,
                key=cat.lower(),
                display_name=cat
            ) for cat in default_category
        ])
        
        PageContent.objects.bulk_create([
            PageContent(
                culture=culture,
                category=Category.objects.get(culture=culture, key=cat.lower())
            ) for cat in default_category
        ])
        
        return culture
    
class CultureSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Culture
        fields = ['id', 'name', 'code', 'shared_group_key']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    preferred_cultures = CultureSimpleSerializer(many=True, read_only=True)
    preferred_culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), source='preferred_cultures', many=True, write_only=True, required=False)

    class Meta:
        model = Profile
        fields = ['user', 'bio', 'avatar', 'location', 'website',
                  'preferred_cultures', 'preferred_culture_ids', 'display_reviews_publicly', 'created_at', 'updated_at']

class CategorySerializer(serializers.ModelSerializer):
    culture = CultureSimpleSerializer(read_only=True)
    culture_id = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), source='culture', write_only=True, required=False)

    class Meta:
        model = Category
        fields = ['id', 'culture', 'culture_id', 'key', 'display_name', 'created_at', 'updated_at']
        
class CategorySimpleSerializer(serializers.ModelSerializer):
    culture = CultureSimpleSerializer(read_only=True)
    class Meta:
        model = Category
        fields = ['id', 'key', 'display_name', 'culture']

class PeriodSerializer(serializers.ModelSerializer):
    culture_id = serializers.PrimaryKeyRelatedField(
        queryset=Culture.objects.all(), source='culture', write_only=True, required=False
    )
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True, required=False
    )

    class Meta:
        model = Period
        fields = [
            'id', 'culture_id', 'category_id',
            'start_year', 'end_year', 'desc', 'short_intro', 'title',
            'created_at', 'updated_at'
        ]
        
class PeriodSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Period
        fields = ['id', 'title', 'start_year', 'end_year']

class PageContentSerializer(serializers.ModelSerializer):
    culture_id = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), source='culture', write_only=True, required=False)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source='category', write_only=True, required=False)

    class Meta:
        model = PageContent
        fields = ['id', 'culture_id', 'category_id', 'intro_text', 'overview_text', 'extra_text', 'created_at', 'updated_at']

class RecipeSerializer(serializers.ModelSerializer):
    cultures = CultureSimpleSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)

    class Meta:
        model = Recipe
        fields = ['id', 'cultures', 'culture_ids', 'name', 'region', 'cooking_time', 'ingredients',
                  'instructions', 'types', 'course', 'rating', 'notes', 'visibility',
                  'serving_size', 'photo', 'created_at', 'updated_at']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value
    
    def create(self, validated_data):
        cultures = validated_data.pop('cultures', [])
        instance = Recipe.objects.create(**validated_data)
        instance.cultures.set(cultures)
        return instance

    def update(self, instance, validated_data):
        cultures = validated_data.pop('cultures', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if cultures is not None:
            instance.cultures.set(cultures)
        instance.save()
        return instance

class LangLessonSerializer(serializers.ModelSerializer):
    cultures = CultureSimpleSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)

    class Meta:
        model = LangLesson
        fields = ['id', 'cultures', 'culture_ids', 'topic', 'lesson', 'examples', 'level',
                  'rating', 'notes', 'visibility', 'created_at', 'updated_at']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value
    
    def create(self, validated_data):
        cultures = validated_data.pop('cultures', [])
        instance = LangLesson.objects.create(**validated_data)
        instance.cultures.set(cultures)
        return instance

    def update(self, instance, validated_data):
        cultures = validated_data.pop('cultures', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if cultures is not None:
            instance.cultures.set(cultures)
        instance.save()
        return instance

class CalendarDateSerializer(serializers.ModelSerializer):
    cultures = CultureSimpleSerializer(many=True, read_only=True)
    person = PersonSimpleSerializer(read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)
    person_id = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), source='person', write_only=True, required=False)

    class Meta:
        model = CalendarDate
        fields = ['id', 'cultures', 'culture_ids', 'holiday_name', 'date_text', 'calendar_date',
                  'traditions', 'meaning', 'photo', 'person', 'person_id', 'rating', 'notes',
                  'visibility', 'created_at', 'updated_at', 'isAnnual', 'type']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value
    
    def create(self, validated_data):
        cultures = validated_data.pop('cultures', [])
        instance = CalendarDate.objects.create(**validated_data)
        instance.cultures.set(cultures)
        return instance

    def update(self, instance, validated_data):
        cultures = validated_data.pop('cultures', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if cultures is not None:
            instance.cultures.set(cultures)
        instance.save()
        return instance

class MapBorderSerializer(serializers.ModelSerializer):
    culture_id = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), source='culture', write_only=True, required=False)
    period_id = serializers.PrimaryKeyRelatedField(queryset=Period.objects.all(), source='period', write_only=True, required=False)

    class Meta:
        model = MapBorder
        fields = ['id', 'culture_id', 'period_id', 'borders', 'created_at', 'updated_at']

class MapPinSerializer(serializers.ModelSerializer):
    date = DateEstimateSerializer(read_only=True)
    date_id = serializers.PrimaryKeyRelatedField(queryset=DateEstimate.objects.all(), source='date', write_only=True, required=False)
    culture_id = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), source='culture', write_only=True, required=False)
    period_id = serializers.PrimaryKeyRelatedField(queryset=Period.objects.all(), source='period', write_only=True, required=False)

    class Meta:
        model = MapPin
        fields = ['id', 'culture_id', 'period_id', 'date', 'date_id', 'type', 'loc', 'external_links', 'created_at', 'updated_at', 'title', 'photo', 'location', 'happened', 'significance']
    
    def validate_loc(self, value): 
        if not isinstance(value, dict): 
            raise serializers.ValidationError("loc must be a GeoJSON object") 
        if value.get("type") != "Point": 
            raise serializers.ValidationError("loc.type must be 'Point'") 
        coords = value.get("coordinates") 
        if not (isinstance(coords, (list, tuple)) and len(coords) == 2): 
            raise serializers.ValidationError("loc.coordinates must be [lng, lat]") 
        return value

class LanguageTableSerializer(serializers.ModelSerializer):
    culture_id = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), source='culture', write_only=True, required=False)

    class Meta:
        model = LanguageTable
        fields = ['id', 'culture_id', 'title', 'table_data', 'created_at', 'updated_at']

class UniversalItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = UniversalItem
        fields = ['id', 'title', 'creator_string', 'type', 'created_at', 'updated_at']
        
class UniversalItemSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = UniversalItem
        fields = ['id']

class BookSerializer(serializers.ModelSerializer):
    creator_id = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), source='creator', write_only=True, required=False)
    date = DateEstimateSerializer(read_only=True)
    date_id = serializers.PrimaryKeyRelatedField(queryset=DateEstimate.objects.all(), source='date', write_only=True, required=False)
    tags = TagListSerializerField(required=False)

    class Meta:
        model = Book
        fields = ['id', 'title', 'alt_title', 'creator_id', 'creator_string', 'alt_creator_name', 'date', 'date_id', 'external_links', 'tags', 'isbn', 'series', 'volume', 'cover', 'synopsis', 'industry_rating', 'genre', 'language', 'created_at', 'updated_at']

    def validate_isbn(self, value):
        if value and Book.objects.filter(isbn=value).exists():
            raise serializers.ValidationError("Book with this ISBN already exists.")
        return value

class FilmSerializer(serializers.ModelSerializer):
    universal_item = UniversalItemSimpleSerializer(read_only=True)
    creator_id = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), source='creator', write_only=True, required=False)
    date = DateEstimateSerializer(read_only=True)
    date_id = serializers.PrimaryKeyRelatedField(queryset=DateEstimate.objects.all(), source='date', write_only=True, required=False)
    tags = TagListSerializerField(required=False)

    class Meta:
        model = Film
        fields = ['id', 'title', 'universal_item', 'alt_title', 'creator_id', 'creator_string', 'alt_creator_name', 'date', 'date_id', 'external_links', 'tags',
                  'runtime', 'genre', 'tmdb_id', 'cast', 'crew', 'blurb', 'synopsis', 'languages', 'countries', 'festival', 'poster', 'background_pic', 
                  'budget', 'box_office', 'series', 'volume', 'release_date', 'industry_rating', 'created_at', 'updated_at']

    def validate_tmdb_id(self, value):
        if value and Film.objects.filter(tmdb_id=value).exists():
            raise serializers.ValidationError("Film with this TMDb ID already exists.")
        return value
    
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
    
class FilmSimpleSerializer(serializers.ModelSerializer):
    universal_item = UniversalItemSimpleSerializer(read_only=True)
    class Meta:
        model = Film
        fields = ['id', 'universal_item', 'title', 'creator_string', 'release_date', 'poster']

class MusicPieceSerializer(serializers.ModelSerializer):
    creator_id = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), source='creator', write_only=True, required=False)
    date = DateEstimateSerializer(read_only=True)
    date_id = serializers.PrimaryKeyRelatedField(queryset=DateEstimate.objects.all(), source='date', write_only=True, required=False)
    tags = TagListSerializerField(required=False)

    class Meta:
        model = MusicPiece
        fields = ['id', 'title', 'alt_title', 'creator_id', 'creator_string', 'alt_creator_name', 'date', 'date_id', 'external_links', 'tags',
                  'instrument', 'recording', 'sheet_music', 'musicbrainz_id', 'created_at', 'updated_at']

    def validate_musicbrainz_id(self, value):
        if value and MusicPiece.objects.filter(musicbrainz_id=value).exists():
            raise serializers.ValidationError("MusicPiece with this MusicBrainz ID already exists.")
        return value

class ArtworkSerializer(serializers.ModelSerializer):
    creator_id = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), source='creator', write_only=True, required=False)
    date = DateEstimateSerializer(read_only=True)
    date_id = serializers.PrimaryKeyRelatedField(queryset=DateEstimate.objects.all(), source='date', write_only=True, required=False)
    tags = TagListSerializerField(required=False)

    class Meta:
        model = Artwork
        fields = ['id', 'title', 'alt_title', 'creator_id', 'creator_string', 'alt_creator_name', 'date', 'date_id', 'external_links', 'tags',
                  'group', 'location', 'associated_culture', 'photo', 'model_3d',
                  'type', 'wikidata_id', 'created_at', 'updated_at']

    def validate_wikidata_id(self, value):
        if value and Artwork.objects.filter(wikidata_id=value).exists():
            raise serializers.ValidationError("Artwork with this Wikidata ID already exists.")
        return value

class UserBookSerializer(serializers.ModelSerializer):
    universal_item_id = serializers.PrimaryKeyRelatedField(queryset=UniversalItem.objects.all(), source='universal_item', write_only=True, required=False)
    cultures = CultureSimpleSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)

    class Meta:
        model = UserBook
        fields = ['id', 'universal_item_id', 'cultures', 'culture_ids', 'rating', 'notes', 'visibility',
                  'page_count', 'is_history', 'translated', 'format', 'cover', 'publisher', 'edition', 'edition_read_year',
                  'date_started', 'date_finished', 'location', 'read_language',
                  'owned', 'read', 'readlist', 'favourite', 'created_at', 'updated_at']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value
    
    def create(self, validated_data):
        cultures = validated_data.pop('cultures', [])
        instance = UserBook.objects.create(**validated_data)
        instance.cultures.set(cultures)
        return instance

    def update(self, instance, validated_data):
        cultures = validated_data.pop('cultures', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if cultures is not None:
            instance.cultures.set(cultures)
        instance.save()
        return instance

class UserFilmSerializer(serializers.ModelSerializer):
    universal_item = UniversalItemSimpleSerializer(read_only=True)
    universal_item_id = serializers.PrimaryKeyRelatedField(queryset=UniversalItem.objects.all(), source='universal_item', write_only=True, required=False)
    cultures = CultureSimpleSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)
    period = PeriodSimpleSerializer(read_only=True)
    period_id = serializers.PrimaryKeyRelatedField(queryset=Period.objects.all(), source='period', write_only=True, required=False)

    class Meta:
        model = UserFilm
        fields = ['id', 'universal_item', 'universal_item_id', 'cultures', 'culture_ids', 'rating', 'notes', 'visibility',
                  'rewatch_count', 'watch_location', 'date_watched', 'poster', 'background_pic',
                  'seen', 'owned', 'watchlist', 'favourite', 'created_at', 'updated_at', 'period', 'period_id']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value
    
    def create(self, validated_data):
        cultures = validated_data.pop('cultures', [])
        instance = UserFilm.objects.create(**validated_data)
        instance.cultures.set(cultures)
        return instance

    def update(self, instance, validated_data):
        cultures = validated_data.pop('cultures', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if cultures is not None:
            instance.cultures.set(cultures)
        instance.save()
        return instance

class UserMusicPieceSerializer(serializers.ModelSerializer):
    universal_item_id = serializers.PrimaryKeyRelatedField(queryset=UniversalItem.objects.all(), source='universal_item', write_only=True, required=False)
    cultures = CultureSimpleSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)

    class Meta:
        model = UserMusicPiece
        fields = ['id', 'universal_item_id', 'cultures', 'culture_ids', 'rating', 'notes', 'visibility',
                  'learned', 'created_at', 'updated_at']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value
    
    def create(self, validated_data):
        cultures = validated_data.pop('cultures', [])
        instance = UserMusicPiece.objects.create(**validated_data)
        instance.cultures.set(cultures)
        return instance

    def update(self, instance, validated_data):
        cultures = validated_data.pop('cultures', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if cultures is not None:
            instance.cultures.set(cultures)
        instance.save()
        return instance
    
class UserMusicArtistSerializer(serializers.ModelSerializer):
    person_id = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all(), source='person', write_only=True, required=False)
    cultures = CultureSimpleSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)
    
    class Meta:
        model = UserMusicArtist
        fields = ['id', 'person_id', 'cultures', 'culture_ids', 'rating', 'notes', 'visibility',
                  'favourite', 'name', 'bio', 'photo', 'external_links', 'year_active_start', 'year_active_end', 
                  'notables_works', 'ranking_tier', 'best_albums', 'best_songs', 'created_at', 'updated_at']
        
    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value
    
    def create(self, validated_data):
        cultures = validated_data.pop('cultures', [])
        instance = UserMusicArtist.objects.create(**validated_data)
        instance.cultures.set(cultures)
        return instance

    def update(self, instance, validated_data):
        cultures = validated_data.pop('cultures', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if cultures is not None:
            instance.cultures.set(cultures)
        instance.save()
        return instance

class UserArtworkSerializer(serializers.ModelSerializer):
    universal_item_id = serializers.PrimaryKeyRelatedField(queryset=UniversalItem.objects.all(), source='universal_item', write_only=True, required=False)
    cultures = CultureSimpleSerializer(many=True, read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)

    class Meta:
        model = UserArtwork
        fields = ['id', 'universal_item_id', 'cultures', 'culture_ids', 'rating', 'notes', 'visibility',
                  'owned', 'created_at', 'updated_at', 'themes']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value
    
    def create(self, validated_data):
        cultures = validated_data.pop('cultures', [])
        instance = UserArtwork.objects.create(**validated_data)
        instance.cultures.set(cultures)
        return instance

    def update(self, instance, validated_data):
        cultures = validated_data.pop('cultures', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if cultures is not None:
            instance.cultures.set(cultures)
        instance.save()
        return instance

class UserHistoryEventSerializer(serializers.ModelSerializer):
    universal_item_id = serializers.PrimaryKeyRelatedField(queryset=UniversalItem.objects.all(), source='universal_item', write_only=True, required=False)
    cultures = CultureSimpleSerializer(many=True, read_only=True)
    period = PeriodSimpleSerializer(read_only=True)
    culture_ids = serializers.PrimaryKeyRelatedField(queryset=Culture.objects.all(), many=True, source='cultures', write_only=True, required=False)
    period_id = serializers.PrimaryKeyRelatedField(queryset=Period.objects.all(), source='period', write_only=True, required=False)
    date = DateEstimateSerializer(required=False)

    class Meta:
        model = UserHistoryEvent
        fields = ['id', 'universal_item_id', 'cultures', 'culture_ids', 'rating', 'notes', 'visibility',
                  'importance_rank', 'created_at', 'sources', 'significance_level', 'period', 'period_id', 'created_at', 'updated_at',
                  'title', 'alt_title', 'type', 'date', 'location', 'photo', 'summary']

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value
    
    def create(self, validated_data):
        cultures = validated_data.pop('cultures', [])
        date_data = validated_data.pop('date', None)
        instance = UserHistoryEvent.objects.create(**validated_data)
        instance.cultures.set(cultures)

        if date_data:
            date_instance = DateEstimate.objects.create(**date_data)
            instance.date = date_instance
            instance.save()

        return instance

    def update(self, instance, validated_data):
        cultures = validated_data.pop('cultures', None)
        date_data = validated_data.pop('date', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if cultures is not None:
            instance.cultures.set(cultures)
            instance.save()
        if date_data:
            if instance.date:
                for attr, value in date_data.items():
                    setattr(instance.date, attr, value)
                instance.date.save()
            else:
                instance.date = DateEstimate.objects.create(**date_data)
                instance.save()
        return instance
    
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
    
class ListSerializer(serializers.ModelSerializer):
    culture_ids = serializers.PrimaryKeyRelatedField(
        queryset=Culture.objects.all(),
        many=True,
        source='cultures',
        write_only=True,
        required=False
    )
    items = UniversalItemSerializer(many=True, read_only=True)
    item_ids = serializers.PrimaryKeyRelatedField(
        queryset=UniversalItem.objects.all(),
        many=True,
        source='items',
        write_only=True,
        required=False
    )

    class Meta:
        model = List
        fields = ['id', 'culture_ids', 'items', 'item_ids', 'name', 'description', 'visibility', 'created_at', 'updated_at', 'type']
        read_only_fields = ['created_at', 'updated_at']  # Ensure these are not writable

    def validate_culture_ids(self, value):
        user = self.context['request'].user
        for culture in value:
            if culture.user != user:
                raise serializers.ValidationError("All cultures must belong to the authenticated user.")
        return value
    
    def create(self, validated_data):
        cultures = validated_data.pop('cultures', [])
        items = validated_data.pop('items', [])
        validated_data.pop('user', None)  # Remove user from validated_data if present
        user = self.context['request'].user
        
        list_instance = List.objects.create(user=user, **validated_data)
        list_instance.cultures.set(cultures)
        list_instance.items.set(items)
        return list_instance
    
    def update(self, instance, validated_data):
        cultures = validated_data.pop('cultures', None)
        items = validated_data.pop('items', None)
        validated_data.pop('user', None)  # Remove user from validated_data if present
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if cultures is not None:
            instance.cultures.set(cultures)
        if items is not None:
            instance.items.set(items)
        
        instance.save()
        return instance