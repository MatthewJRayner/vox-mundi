from rest_framework import viewsets, status, generics
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, SAFE_METHODS, BasePermission, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from django.contrib.auth.models import User
from django.db.models import Q, Avg, Count
from django.shortcuts import get_object_or_404
from .models import (
    Profile, Culture, Category, Period, PageContent, Recipe, LangLesson,
    CalendarDate, Person, MapBorder, MapPin, LanguageTable, UniversalItem,
    Book, Film, MusicPiece, Artwork, UserBook, UserFilm,
    UserMusicPiece, UserMusicArtist, UserArtwork, UserHistoryEvent, Visibility, List
)
from .serializers import (
    ProfileSerializer, CultureSerializer, CategorySerializer, PeriodSerializer,
    PageContentSerializer, RecipeSerializer, LangLessonSerializer, CalendarDateSerializer,
    PersonSerializer, MapBorderSerializer, MapPinSerializer, LanguageTableSerializer,
    UniversalItemSerializer, BookSerializer, FilmSerializer, MusicPieceSerializer,
    ArtworkSerializer, UserBookSerializer, UserFilmSerializer,
    UserMusicPieceSerializer, UserMusicArtistSerializer, UserArtworkSerializer, UserHistoryEventSerializer, RegisterSerializer, UserSerializer, ListSerializer
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)
        token_data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }

        return Response(
            {**serializer.data, **token_data},
            status=status.HTTP_201_CREATED
        )

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
           

class IsOwnerOrPublic(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        visibility = getattr(obj, 'visibility', None)
        owner = getattr(obj, 'user', None)
        if request.method in SAFE_METHODS:
            if visibility == Visibility.PUBLIC:
                return True
            return owner == request.user
        return owner == request.user

class ProfileViewSet(viewsets.ModelViewSet):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Profile.objects.select_related('user').prefetch_related('preferred_cultures')

class CultureViewSet(viewsets.ModelViewSet):
    serializer_class = CultureSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        code = self.request.query_params.get('code', None)
        shared = self.request.query_params.get('shared') == "true"
        qs = Culture.objects.select_related('user')
        
        if not user.is_authenticated:
            return Culture.objects.none()
        
        if shared:
            return qs.filter(
                visibility=Visibility.PUBLIC    
            ).exclude(user=user)
            
        if code:
            qs = qs.filter(user=user, code=code)
        else: 
            qs = qs.filter(user=user)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        code = self.request.query_params.get('code', None)
        key = self.request.query_params.get('key', None)
        qs = Category.objects.select_related('culture').filter(culture__user=user)
        
        if not user.is_authenticated:
            return Category.objects.none()
        
        if code:
            qs = qs.filter(culture__code=code, culture__user=user)
        if key:
            qs = qs.filter(key=key)
        return qs
    
    def perform_create(self, serializer):
        culture = serializer.validated_data.get('culture')
        if culture.user != self.request.user:
            raise PermissionError("You can only add categories to your own cultures.")
        serializer.save()

class PeriodViewSet(viewsets.ModelViewSet):
    serializer_class = PeriodSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        code = self.request.query_params.get('code', None)
        key = self.request.query_params.get('key', None)
        if not user.is_authenticated:
            return Period.objects.none()
        
        qs = (Period.objects
            .select_related('culture', 'category')
            .filter(culture__user=user)
        )
        if code: qs = qs.filter(culture__code=code)
        if key: qs = qs.filter(category__key=key)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        code = self.request.data.get("culture_code")
        category_id = self.request.data.get("category_id")

        if not code or not category_id:
            raise ValidationError("Culture code and category ID are required.")

        try:
            culture = Culture.objects.get(user=user, code=code)
            category = Category.objects.get(id=category_id, culture=culture)
        except (Culture.DoesNotExist, Category.DoesNotExist):
            raise ValidationError("Invalid culture or category.")

        serializer.save(culture=culture, category=category)

class PageContentViewSet(viewsets.ModelViewSet):
    serializer_class = PageContentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        code = self.request.query_params.get('code', None)
        key = self.request.query_params.get('key', None)
        if not user.is_authenticated:
            return PageContent.objects.none()
            
        qs = (PageContent.objects
            .select_related('culture', 'category')
            .filter(culture__user=user)
        )
        if code: qs = qs.filter(culture__code=code)
        if key: qs = qs.filter(category__key=key)
        return qs

    def perform_create(self, serializer):
        culture = serializer.validated_data.get('culture')
        if culture.user != self.request.user:
            raise PermissionError("You do not own this culture.")
        serializer.save()

class RecipeViewSet(viewsets.ModelViewSet):
    serializer_class = RecipeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        code = self.request.query_params.get('code', None)
        shared = self.request.query_params.get('shared') == 'true'
        
        qs = Recipe.objects.select_related('user').prefetch_related('cultures')
        
        if not user.is_authenticated:
            return qs.filter(visibility=Visibility.PUBLIC)
        
        if not shared:
            return qs.filter(user=user)
        
                                                                                                   
            
        return qs.filter(visibility=Visibility.PUBLIC).exclude(user=user).distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class LangLessonViewSet(viewsets.ModelViewSet):
    serializer_class = LangLessonSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        code = self.request.query_params.get('code', None)
        shared = self.request.query_params.get('shared') == 'true'
        
        qs = LangLesson.objects.select_related('user').prefetch_related('cultures')
        
        if not user.is_authenticated:
            return qs.filter(visibility=Visibility.PUBLIC)
        
        if not shared:
            return qs.filter(user=user)
        
        if code:
            try:
                user_culture = Culture.objects.get(user=user, code=code)
            except Culture.DoesNotExist:
                return qs.none()
            
            group_key = user_culture.shared_group_key
            return qs.filter(
                visibility=Visibility.PUBLIC,
                cultures__shared_group_key=group_key
            ).exclude(user=user).distinct()
            
        return qs.filter(visibility=Visibility.PUBLIC).exclude(user=user).distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CalendarDateViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarDateSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        code = self.request.query_params.get('code', None)
        shared = self.request.query_params.get('shared') == 'true'
        
        qs = CalendarDate.objects.select_related('user').prefetch_related('cultures')
        
        if not user.is_authenticated:
            return qs.filter(visibility=Visibility.PUBLIC)
        
        if not shared:
            qs.filter(user=user, culture__code=code)
        
        if code:
            try:
                user_culture = Culture.objects.get(user=user, code=code)
            except Culture.DoesNotExist:
                return qs.none()
            
            group_key = user_culture.shared_group_key
            return qs.filter(
                visibility=Visibility.PUBLIC,
                cultures__shared_group_key=group_key
            ).exclude(user=user).distinct()
            
        return qs.filter(visibility=Visibility.PUBLIC).exclude(user=user).distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PersonViewSet(viewsets.ModelViewSet):
    serializer_class = PersonSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Person.objects.select_related('birth_date', 'death_date')

        query = self.request.query_params.get('q', None)
        nationality = self.request.query_params.get('nationality', None)
        profession = self.request.query_params.get('profession', None)
        living = self.request.query_params.get('living', None)
        wikidata = self.request.query_params.get('wikidata_id', None)

        if query:
            # Flexible name search (handles partial matches, e.g. “Mozart”, “de Vinci”)
            qs = qs.filter(
                Q(given_name__icontains=query) |
                Q(family_name__icontains=query) |
                Q(middle_name__icontains=query)
            )
        if nationality:
            qs = qs.filter(nationality__icontains=nationality)
        if profession:
            qs = qs.filter(profession__icontains=profession)
        if living == "true":
            qs = qs.filter(death_date__isnull=True)
        if wikidata:
            qs = qs.filter(wikidata_id=wikidata)

        return qs.order_by("family_name", "given_name")
    
    def perform_create(self, serializer):
        serializer.save()

class MapBorderViewSet(viewsets.ModelViewSet):
    serializer_class = MapBorderSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        code = self.request.query_params.get("code")
        period_title = self.request.query_params.get("period")
        shared = self.request.query_params.get("shared") == "true"

        if not user.is_authenticated:
            return MapBorder.objects.none()

        qs = MapBorder.objects.select_related("culture", "period")

        if shared:
            if code:
                try:
                    user_culture = Culture.objects.get(user=user, code=code)
                except Culture.DoesNotExist:
                    return qs.none()

                group_key = user_culture.shared_group_key

                qs = qs.filter(
                    culture__shared_group_key=group_key,
                    culture__visibility=Visibility.PUBLIC
                ).exclude(culture__user=user)

            else:
                qs = qs.filter(
                    culture__visibility=Visibility.PUBLIC
                ).exclude(culture__user=user)

        else:
            qs = qs.filter(culture__user=user)
            if code:
                qs = qs.filter(culture__code=code)

        if period_title:
            qs = qs.filter(
                period__title=period_title,
                period__category__key="history"
            )

        return qs.distinct()

    def perform_create(self, serializer):
        user = self.request.user
        culture_id = self.request.data.get("culture_id")
        period_id = self.request.data.get("period_id")

        try:
            culture = Culture.objects.get(id=culture_id, user=user)
        except Culture.DoesNotExist:
            raise ValidationError({"culture": "Invalid or unauthorized culture."})

        period = None
        if period_id:
            period = Period.objects.filter(id=period_id, culture=culture).first()

        serializer.save(culture=culture, period=period)

class MapPinViewSet(viewsets.ModelViewSet):
    serializer_class = MapPinSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        code = self.request.query_params.get('code', None)
        period_title = self.request.query_params.get('period', None)
        shared = self.request.query_params.get('shared') == "true"
        
        if not user.is_authenticated:
            return MapPin.objects.none()
        
        qs = MapPin.objects.select_related("culture", "period")
        
        if shared:
            if code:
                try:
                    user_culture = Culture.objects.get(user=user, code=code)
                except Culture.DoesNotExist:
                    return qs.none()
                group_key = user_culture.shared_group_key
                
                qs = qs.filter(
                    culture__shared_group_key=group_key,
                    culture__visibility=Visibility.PUBLIC,
                    visibility=Visibility.PUBLIC
                ).exclude(culture__user=user)
            
            else:
                qs = qs.filter(
                    culture__visibility=Visibility.PUBLIC,
                    visibility=Visibility.PUBLIC    
                ).exclude(culture__user=user)
        
        else:
            qs = qs.filter(culture__user=user)
            if code:
                qs = qs.filter(culture__code=code)
                
        if period_title:
            qs = qs.filter(
                period__title=period_title,
                period__category__key="history"
            )
            
        return qs.distinct()

    def perform_create(self, serializer):
        user = self.request.user
        culture_id = self.request.data.get("culture_id")
        period_id = self.request.data.get("period_id")

        try:
            culture = Culture.objects.get(id=culture_id, user=user)
        except Culture.DoesNotExist:
            raise ValidationError({"culture": "Invalid or unauthorized culture."})

        period = None
        if period_id:
            period = Period.objects.filter(id=period_id, culture=culture).first()

        serializer.save(culture=culture, period=period)

class LanguageTableViewSet(viewsets.ModelViewSet):
    serializer_class = LanguageTableSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        code = self.request.query_params.get('code', None)
        qs = LanguageTable.objects.select_related('culture')
        
        if not user.is_authenticated:
            return LanguageTable.objects.none()
        
        if code:
            qs = qs.filter(culture__code=code, culture__user=user)
        else:
            qs = qs.filter(culture__user=user)
        return qs

    def perform_create(self, serializer):
        serializer.save()

class UniversalItemViewSet(viewsets.ModelViewSet):
    serializer_class = UniversalItemSerializer
    queryset = (
        UniversalItem.objects
        .select_related("content_type")
        .prefetch_related('cultures')
        .order_by('title')
    )
    
    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [p() for p in permission_classes]

    def get_queryset(self):
        q = self.request.query_params.get("q", None)
        code = self.request.query_params.get("code", None)
        type_filter = self.request.query_params.get("type", None)
        
        qs = self.queryset
        
        if code:
            qs = qs.filter(cultures__code__iexact=code)
        if type_filter:
            qs = qs.filter(type__iexact=type_filter)
            
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(creator_string__icontains=q)
            )
        
        return qs.distinct()

    def perform_create(self, serializer):
        serializer.save()
 
class BookViewSet(viewsets.ModelViewSet):
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        q = self.request.query_params.get("q", None)
        isbn = self.request.query_params.get("isbn", None)
        language = self.request.query_params.get("language", None)
        genre = self.request.query_params.get("genre", None)
        
        qs = (
            Book.objects
            .select_related("creator", "date")
            .prefetch_related("universal_item__cultures")
            .order_by("title")
        )
        
        if isbn:
            qs = qs.filter(isbn__iexact=isbn)
        if language:
            qs = qs.filter(language__icontains=language)
        if genre:
            qs = qs.filter(genre__icontains=genre)
            
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(alt_title__icontains=q)
                | Q(creator_string__icontains=q)
                | Q(alt_creator_name__icontains=q)
            )
        
        return qs.distinct()
    
    def perform_create(self, serializer):
        serializer.save()

class FilmViewSet(viewsets.ModelViewSet):
    serializer_class = FilmSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        q = self.request.query_params.get("q", None)
        tmdb_id = self.request.query_params.get("tmdb_id", None)
        genre = self.request.query_params.get("genre", None)
        actor = self.request.query_params.get("actor", None)
        crew = self.request.query_params.get("crew", None)
        role = self.request.query_params.get("role", None)
        
        qs = (
            Film.objects
            .select_related("creator", "date")
            .prefetch_related("universal_item__cultures")
            .order_by("title")
        )
        
        if tmdb_id:
            qs = qs.filter(tmdb_id__iexact=tmdb_id)
        if genre:
            qs = qs.filter(genre__icontains=genre)
            
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(alt_title__icontains=q)
                | Q(creator_string__icontains=q)
                | Q(alt_creator_name__icontains=q)
            )
            
        if actor:
            qs = qs.filter(
                Q(cast__icontains=actor)
            )
        if crew:
            qs = qs.filter(
                Q(crew__icontains=crew)
            )
        if role:
            qs = qs.filter(
                Q(crew__icontains=role)
            )
            
        return qs.distinct()
    
    def perform_create(self, serializer):
        serializer.save()
        
    @action(detail=True, methods=["get"], url_path="details")
    def details(self, request, pk=None):
        film = self.get_object()
        user_films = film.universal_item.user_films.filter(visibility=Visibility.PUBLIC)
        
        avg_rating = user_films.aggregate(avg=Avg("rating"))["avg"]
        review_count = user_films.aggregate(count=Count("id"))["count"]
        
        serializer = self.get_serializer(film)
        userfilm_data = UserFilmSerializer(user_films[:10], many=True).data
        
        return Response({
            "film": serializer.data,
            "average_rating": avg_rating,
            "review_count": review_count,
            "reviews": userfilm_data,
        })

class MusicPieceViewSet(viewsets.ModelViewSet):
    serializer_class = MusicPieceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        q = self.request.query_params.get("q", None)
        code = self.request.query_params.get("code", None)
        type_filter = self.request.query_params.get("type", None)

        qs = (
            MusicPiece.objects
            .select_related("creator", "date")
            .prefetch_related("universal_item__cultures")
            .order_by("title")
        )

        if code:
            try:
                user_culture = Culture.objects.get(code=code)
                qs = qs.filter(universal_item__cultures__shared_group_key=user_culture.shared_group_key)
            except Culture.DoesNotExist:
                return MusicPiece.objects.none()

        if type_filter:
            qs = qs.filter(type__icontains=type_filter)

        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(creator__given_name__icontains=q) |
                Q(creator__family_name__icontains=q) |
                Q(creator_string__icontains=q) |
                Q(instrument__icontains=q)
            )

        return qs.distinct()
    
    def perform_create(self, serializer):
        serializer.save()

class ArtworkViewSet(viewsets.ModelViewSet):
    serializer_class = ArtworkSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        q = self.request.query_params.get("q", None)
        code = self.request.query_params.get("code", None)
        type_filter = self.request.query_params.get("type", None)

        qs = (
            Artwork.objects
            .select_related("creator", "date")
            .prefetch_related("universal_item__cultures")
            .order_by("title")
        )

        if code:
            try:
                user_culture = Culture.objects.get(code=code)
                qs = qs.filter(universal_item__cultures__shared_group_key=user_culture.shared_group_key)
            except Culture.DoesNotExist:
                return Artwork.objects.none()

        if type_filter:
            qs = qs.filter(type__icontains=type_filter)

        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(creator__given_name__icontains=q) |
                Q(creator__family_name__icontains=q) |
                Q(creator_string__icontains=q) |
                Q(associated_culture__icontains=q) |
                Q(themes__icontains=q)
            )

        return qs.distinct()

    def perform_create(self, serializer):
        serializer.save()
    
class UserBookViewSet(viewsets.ModelViewSet):
    serializer_class = UserBookSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        shared = self.request.query_params.get("shared") == "true"
        if not user.is_authenticated:
            return UserBook.objects.filter(visibility=Visibility.PUBLIC)
        
        qs = (
            UserBook.objects
            .select_related("user", "universal_item", "period")
            .prefetch_related("cultures", "universal_item__cultures")
            .order_by("-updated_at")
        )
        
        if shared:
            qs = qs.filter(visibility=Visibility.PUBLIC).exclude(user=user)
        else:
            qs = qs.filter(user=user)
            
        return qs.distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserFilmViewSet(viewsets.ModelViewSet):
    serializer_class = UserFilmSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return UserFilm.objects.filter(Q(user=user) | Q(visibility='public')).select_related('user', 'universal_item').prefetch_related('cultures')
        return UserFilm.objects.filter(visibility='public').select_related('user', 'universal_item').prefetch_related('cultures')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    @action(detail=False, methods=["get"], url_path="by-film/(?P<film_id>[^/.]+)")
    def by_film(self, request, film_id=None):
        user = request.user
        if not user.is_authenticated:
            return Response({"detail": "Authentication required."}, status=401)

        try:
            universal_item = UniversalItem.objects.get(film__id=film_id)
            user_film = UserFilm.objects.filter(user=user, universal_item=universal_item).first()
        except UniversalItem.DoesNotExist:
            return Response({"detail": "Film not found."}, status=404)

        if user_film:
            serializer = self.get_serializer(user_film)
            return Response(serializer.data)
        else:
            return Response({"detail": "No entry yet."})

class UserMusicPieceViewSet(viewsets.ModelViewSet):
    serializer_class = UserMusicPieceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        shared = self.request.query_params.get("shared") == "true"
        code = self.request.query_params.get("code")

        if not user.is_authenticated:
            return UserMusicPiece.objects.none()

        qs = (
            UserMusicPiece.objects
            .select_related("user", "universal_item")
            .prefetch_related("cultures", "universal_item__cultures")
            .order_by("-updated_at")
        )

        if shared:
            if code:
                try:
                    user_culture = Culture.objects.get(user=user, code=code)
                    group_key = user_culture.shared_group_key
                    qs = qs.filter(
                        visibility=Visibility.PUBLIC,
                        cultures__shared_group_key=group_key
                    ).exclude(user=user)
                except Culture.DoesNotExist:
                    return qs.none()
            else:
                qs = qs.filter(visibility=Visibility.PUBLIC).exclude(user=user)
        else:
            qs = qs.filter(user=user)
            if code:
                qs = qs.filter(cultures__code__iexact=code)

        return qs.distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
class UserMusicArtistViewSet(viewsets.ModelViewSet):
    serializer_class = UserMusicArtistSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        shared = self.request.query_params.get("shared") == "true"
        code = self.request.query_params.get("code")

        if not user.is_authenticated:
            return UserMusicArtist.objects.none()

        qs = (
            UserMusicArtist.objects
            .select_related("user", "universal_item")
            .prefetch_related("cultures", "universal_item__cultures")
            .order_by("-updated_at")
        )

        if shared:
            if code:
                try:
                    user_culture = Culture.objects.get(user=user, code=code)
                    group_key = user_culture.shared_group_key
                    qs = qs.filter(
                        visibility=Visibility.PUBLIC,
                        cultures__shared_group_key=group_key
                    ).exclude(user=user)
                except Culture.DoesNotExist:
                    return qs.none()
            else:
                qs = qs.filter(visibility=Visibility.PUBLIC).exclude(user=user)
        else:
            qs = qs.filter(user=user)
            if code:
                qs = qs.filter(cultures__code__iexact=code)

        return qs.distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserArtworkViewSet(viewsets.ModelViewSet):
    serializer_class = UserArtworkSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        shared = self.request.query_params.get("shared") == "true"
        code = self.request.query_params.get("code")

        if not user.is_authenticated:
            return UserArtwork.objects.none()

        qs = (
            UserArtwork.objects
            .select_related("user", "universal_item")
            .prefetch_related("cultures", "universal_item__cultures")
            .order_by("-updated_at")
        )

        if shared:
            if code:
                try:
                    user_culture = Culture.objects.get(user=user, code=code)
                    group_key = user_culture.shared_group_key
                    qs = qs.filter(
                        visibility=Visibility.PUBLIC,
                        cultures__shared_group_key=group_key
                    ).exclude(user=user)
                except Culture.DoesNotExist:
                    return qs.none()
            else:
                qs = qs.filter(visibility=Visibility.PUBLIC).exclude(user=user)
        else:
            qs = qs.filter(user=user)
            if code:
                qs = qs.filter(cultures__code__iexact=code)

        return qs.distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserHistoryEventViewSet(viewsets.ModelViewSet):
    serializer_class = UserHistoryEventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        shared = self.request.query_params.get("shared") == "true"
        code = self.request.query_params.get("code")
        period_title = self.request.query_params.get("period")
        q = self.request.query_params.get("q")

        if not user.is_authenticated:
            return UserHistoryEvent.objects.none()

        qs = (
            UserHistoryEvent.objects
            .select_related("user")
            .prefetch_related("cultures")
            .order_by("-updated_at")
        )

        if shared:
            if code:
                try:
                    user_culture = Culture.objects.get(user=user, code=code)
                    group_key = user_culture.shared_group_key
                    qs = qs.filter(
                        visibility=Visibility.PUBLIC,
                        cultures__shared_group_key=group_key
                    ).exclude(user=user)
                except Culture.DoesNotExist:
                    return qs.none()
            else:
                qs = qs.filter(visibility=Visibility.PUBLIC).exclude(user=user)
        else:
            qs = qs.filter(user=user)
            if code:
                qs = qs.filter(cultures__code__iexact=code)
                
        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(alt_title__icontains=q) |
                Q(type__icontains=q) |
                Q(location__icontains=q) |
                Q(period__title__icontains=q)
            )

        # Optional: filter by historical period (if linked through UniversalItem)
        if period_title:
            qs = qs.filter(
                universal_item__event__period__title=period_title,
                universal_item__event__period__category__key="history"
            )

        return qs.distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
class ListViewSet(viewsets.ModelViewSet):
    serializer_class = ListSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        code = self.request.query_params.get("code")
        shared = self.request.query_params.get("shared") == "true"
        type_filter = self.request.query_params.get("type")

        qs = (
            List.objects
            .select_related("user")
            .prefetch_related("cultures", "items")
            .order_by("-updated_at")
        )

        if not user.is_authenticated:
            return qs.filter(visibility=Visibility.PUBLIC)

        if shared:
            if code:
                try:
                    user_culture = Culture.objects.get(user=user, code=code)
                    group_key = user_culture.shared_group_key
                    qs = qs.filter(
                        visibility=Visibility.PUBLIC,
                        cultures__shared_group_key=group_key
                    ).exclude(user=user)
                except Culture.DoesNotExist:
                    return qs.none()
            else:
                qs = qs.filter(visibility=Visibility.PUBLIC).exclude(user=user)
        else:
            qs = qs.filter(user=user)
            if code:
                qs = qs.filter(cultures__code__iexact=code)

        if type_filter:
            qs = qs.filter(type__iexact=type_filter)

        return qs.distinct()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)