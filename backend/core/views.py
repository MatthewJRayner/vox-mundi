import requests
import random
from rest_framework import viewsets, status, generics
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, SAFE_METHODS, BasePermission, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from core.services.tmdb_import import import_films_from_list
from core.services.openlibrary_import import create_book_from_openlibrary, fetch_works_by_title, search_openlibrary, update_userbook_with_isbn
from django.conf import settings
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
    UserMusicPieceSerializer, UserMusicArtistSerializer, UserArtworkSerializer, UserHistoryEventSerializer, RegisterSerializer, UserSerializer, ListSerializer,
    FilmSimpleSerializer, BookSimpleSerializer
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
            qs = qs.filter(user=user)
        
        if code:
            qs = qs.filter(cultures__code__iexact=code)
        
                                                                                                   
            
        return qs.distinct()

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
        shared = self.request.query_params.get("shared") == "true"
        code = self.request.query_params.get("code")
        q = self.request.query_params.get("q")

        if not user.is_authenticated:
            return CalendarDate.objects.none()

        qs = (
            CalendarDate.objects
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
                Q(holiday_name__icontains=q) |
                Q(type__icontains=q)
            )
            
        return qs.distinct()

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
        type_filter = self.request.query_params.get("type", None)
        
        qs = self.queryset
        
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
        language = self.request.query_params.get("language", None)
        genre = self.request.query_params.get("genre", None)
        
        qs = (
            Book.objects
            .select_related("creator", "date")
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
        
    @action(detail=True, methods=["get"], url_path="details")
    def details(self, request, pk=None):
        book = self.get_object()
        user_books = book.universal_item.user_books.filter(visibility=Visibility.PUBLIC)
        
        avg_rating = user_books.aggregate(avg=Avg("rating"))["avg"]
        review_count = user_books.aggregate(count=Count("id"))["count"]
        
        serializer = self.get_serializer(book)
        userfilm_data = UserBookSerializer(user_books[:10], many=True).data
        
        return Response({
            "book": serializer.data,
            "average_rating": avg_rating,
            "review_count": review_count,
            "reviews": userfilm_data,
        })
        
    @action(detail=False, methods=["get"], url_path="random", permission_classes=[IsAuthenticatedOrReadOnly])
    def random_book(self, request):
        """Return a random book + its userbook if it exists"""
        book = Book.objects.order_by("?").first()
        if not book:
            return Response({"detail": "No books available."}, status=404)

        userbook = None
        if request.user.is_authenticated:
            userbook = UserBook.objects.filter(
                universal_item=book.universal_item,
                user=request.user
            ).first()

        book_data = BookSimpleSerializer(book).data
        userbook_data = UserBookSerializer(userbook).data if userbook else None

        return Response({
            "book": book_data,
            "userbook": userbook_data
        })
        
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def frontpage(self, request):
        user = request.user
        code = request.query_params.get("code")
        if not code:
            return Response({"error": "culture code is required"}, status=400)

        culture = Culture.objects.filter(user=user, code=code).first()
        if not culture:
            return Response({"error": "Invalid culture code"}, status=404)

        # All userbooks for that user/culture
        userbooks = UserBook.objects.filter(user=user, cultures__code__iexact=code)
        
        # Build the sets
        readlist_ids = list(userbooks.filter(readlist=True)
                             .values_list("universal_item__id", flat=True))
        favourite_ids = list(userbooks.filter(favourite=True)
                             .values_list("universal_item__id", flat=True))
        recent_ids = list(userbooks.filter(read=True, date_finished__isnull=False)
                          .order_by("-date_finished")
                          .values_list("universal_item__id", flat=True)[:10])

        # Map universal_item IDs to book IDs
        book_ids_map = {
            ui["universal_item__id"]: ui["id"] 
            for ui in Book.objects.filter(universal_item__id__in=(readlist_ids + favourite_ids + recent_ids))
            .values("id", "universal_item__id")
        }

        # Convert universal_item IDs to book IDs
        readlist_book_ids = [book_ids_map.get(uid) for uid in readlist_ids if book_ids_map.get(uid)]
        favourite_book_ids = [book_ids_map.get(uid) for uid in favourite_ids if book_ids_map.get(uid)]
        recent_book_ids = [book_ids_map.get(uid) for uid in recent_ids if book_ids_map.get(uid)]

        # Random samples
        data_sets = {
            "readlist": Book.objects.filter(id__in=random.sample(readlist_book_ids, min(5, len(readlist_book_ids)))) if readlist_book_ids else [],
            "favourites": Book.objects.filter(id__in=favourite_book_ids[:5]) if favourite_book_ids else [],
            "recent": Book.objects.filter(id__in=recent_book_ids) if recent_book_ids else [],
        }

        # If empty, provide fallback
        if not any(data_sets.values()):
            fallback = Book.objects.order_by("?")[:5]
            data_sets["fallback"] = fallback

        # Gather all book IDs we're returning
        all_book_ids = [book.id for books in data_sets.values() for book in books]
        userbook_map = {
            ub.universal_item.id: ub
            for ub in userbooks.filter(universal_item__id__in=[uid for uid, bid in book_ids_map.items() if bid in all_book_ids])
        }

        # Build response payload
        result = {}
        for key, books in data_sets.items():
            result[key] = []
            for book in books:
                book_data = BookSimpleSerializer(book).data
                ub = userbook_map.get(book.universal_item.id)
                if ub:
                    book_data["userbook"] = {
                        "cover": ub.cover,
                        "read": ub.read,
                        "favourite": ub.favourite,
                        "readlist": ub.readlist,
                        "id": ub.id,
                        "date_finished": ub.date_finished,
                    }
                else:
                    book_data["userbook"] = None
                result[key].append(book_data)

        return Response(result)
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def list_books(self, request):
        user = request.user
        universal_item_ids = request.query_params.get("ids", "").split(",")
        q = request.query_params.get("q", None)
        
        qs = Book.objects.filter(universal_item__id__in=universal_item_ids)
        
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(alt_title__icontains=q)
                | Q(creator_string__icontains=q)
                | Q(alt_creator_name__icontains=q)
            )
        
        books = qs.distinct()
        
        if not books:
            return Response({"results": []}, status=200)
        
        userbooks = UserBook.objects.filter(
            user=user,
            universal_item__id__in=universal_item_ids
        )
        
        userbook_map = {ub.universal_item.id: ub for ub in userbooks}

        results = []
        for book in books:
            book_data = BookSimpleSerializer(book).data
            ub = userbook_map.get(book.universal_item.id)
            if ub:
                book_data["userbook"] = {
                    "cover": ub.cover,
                    "read": ub.read,
                    "favourite": ub.favourite,
                    "readlist": ub.readlist,
                    "id": ub.id,
                    "date_finished": ub.date_finished,
                }
            else:
                book_data["userbook"] = None
            results.append(book_data)

        return Response({"results": results})
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def period_books(self, request):
        user = self.request.user
        period = self.request.query_params.get("period", None)
        q = self.request.query_params.get("g", None)
        
        qs = UserBook.objects.filter(user=user)
        
        if period:
            qs = qs.filter(period__id__iexact=period)
        
        userbooks = qs.distinct()
        
        if not userbooks:
            return Response({"results": []}, status=200)
        
        books = Book.objects.filter(
            universal_item__id__in=userbooks.values_list("universal_item__id", flat=True)
        )
        
        if q:
            books = books.filter(
                Q(title__icontains=q)
                | Q(alt_title__icontains=q)
                | Q(creator_string__icontains=q)
                | Q(alt_creator_name__icontains=q)
            )
        
        book_map = {
            b.universal_item.id: b for b in books
        }
        
        results = []
        for ub in userbooks:
            book = book_map.get(ub.universal_item.id)
            if book:
                book_data = BookSimpleSerializer(book).data
                book_data["userbook"] = {
                    "cover": ub.cover,
                    "read": ub.read,
                    "favourite": ub.favourite,
                    "readlist": ub.readlist,
                    "id": ub.id,
                    "date_finished": ub.date_finished,
                }
                results.append(book_data)
        
        return Response({"results": results}, status=200)
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def search(self, request):
        user = request.user
        q = request.query_params.get("q", None)
        genre = request.query_params.get("genre", None)
        limit = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))
        
        # Build the book queryset with filters
        qs = (
            Book.objects
            .select_related("creator", "date")
            .order_by("title")
        )
        
        if genre:
            qs = qs.filter(Q(genre__icontains=genre))
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(alt_title__icontains=q)
                | Q(creator_string__icontains=q)
                | Q(alt_creator_name__icontains=q)
            )
            
        books = qs.distinct()[offset:offset + limit]
        
        if not books:
            return Response({"results": []}, status=200)
        
        userbooks = UserBook.objects.filter(
            user=user,
            universal_item__id__in=books.values_list("universal_item__id", flat=True)
        )
        
        userbook_map = {
            uf.universal_item.id: uf for uf in userbooks
        }
        
        results = []
        for book in books:
            book_data = BookSimpleSerializer(book).data
            ub = userbook_map.get(book.universal_item.id)
            if ub:
                book_data["userbook"] = {
                    "cover": ub.cover,
                    "read": ub.read,
                    "favourite": ub.favourite,
                    "readlist": ub.readlist,
                    "id": ub.id,
                    "date_finished": ub.date_finished,
                }
            else:
                book_data["userbook"] = None
            results.append(book_data)
        
        return Response({"results": results, "total": qs.count()})
    
    
class BookSimpleViewSet(viewsets.ModelViewSet):
    serializer_class = BookSimpleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Book.objects.select_related('date').order_by('title')
        
        # Optional filtering (similar to BookViewSet)
        q = self.request.query_params.get("q", None)
        ol_id = self.request.query_params.get("ol_id", None)
        limit = self.request.query_params.get("limit", None)

        if ol_id:
            qs = qs.filter(ol_id__iexact=ol_id)
        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(alt_title__icontains=q) |
                Q(creator_string__icontains=q) |
                Q(alt_creator_name__icontains=q)
            )
        if limit:
            qs = qs[:int(limit)]

        return qs

class FilmViewSet(viewsets.ModelViewSet):
    serializer_class = FilmSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        q = self.request.query_params.get("q", None)
        tmdb_id = self.request.query_params.get("tmdb_id", None)
        genre = self.request.query_params.get("genre", None)
        actor = self.request.query_params.get("actor", None)
        crew = self.request.query_params.get("crew", None)
        director = self.request.query_params.get("director", None)
        limit = self.request.query_params.get("limit", None)
        
        qs = (
            Film.objects
            .select_related("creator", "date")
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
                Q(cast__name__icontains=actor)
            )
        if crew:
            qs = qs.filter(
                Q(crew__name__icontains=crew)
            )
        if director:
            qs = qs.filter(
                Q(crew__role__iexact="Director")
            )
            
        if limit:
            qs = qs[:int(limit)]
            return qs
            
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
        
    @action(detail=False, methods=["get"], url_path="random", permission_classes=[IsAuthenticatedOrReadOnly])
    def random_film(self, request):
        """Return a random film + its userfilm if it exists"""
        film = Film.objects.order_by("?").first()
        if not film:
            return Response({"detail": "No films available."}, status=404)

        userfilm = None
        if request.user.is_authenticated:
            userfilm = UserFilm.objects.filter(
                universal_item=film.universal_item,
                user=request.user
            ).first()

        film_data = FilmSimpleSerializer(film).data
        userfilm_data = UserFilmSerializer(userfilm).data if userfilm else None

        return Response({
            "film": film_data,
            "userfilm": userfilm_data
        })
        
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def frontpage(self, request):
        user = request.user
        code = request.query_params.get("code")
        if not code:
            return Response({"error": "culture code is required"}, status=400)

        culture = Culture.objects.filter(user=user, code=code).first()
        if not culture:
            return Response({"error": "Invalid culture code"}, status=404)

        # All userfilms for that user/culture
        userfilms = UserFilm.objects.filter(user=user, cultures__code__iexact=code)
        
        # Build the sets
        watchlist_ids = list(userfilms.filter(watchlist=True)
                             .values_list("universal_item__id", flat=True))
        favourite_ids = list(userfilms.filter(favourite=True)
                             .values_list("universal_item__id", flat=True))
        recent_ids = list(userfilms.filter(seen=True, date_watched__isnull=False)
                          .order_by("-date_watched")
                          .values_list("universal_item__id", flat=True)[:10])

        # Map universal_item IDs to film IDs
        film_ids_map = {
            ui["universal_item__id"]: ui["id"] 
            for ui in Film.objects.filter(universal_item__id__in=(watchlist_ids + favourite_ids + recent_ids))
            .values("id", "universal_item__id")
        }

        # Convert universal_item IDs to film IDs
        watchlist_film_ids = [film_ids_map.get(uid) for uid in watchlist_ids if film_ids_map.get(uid)]
        favourite_film_ids = [film_ids_map.get(uid) for uid in favourite_ids if film_ids_map.get(uid)]
        recent_film_ids = [film_ids_map.get(uid) for uid in recent_ids if film_ids_map.get(uid)]

        # Random samples
        data_sets = {
            "watchlist": Film.objects.filter(id__in=random.sample(watchlist_film_ids, min(5, len(watchlist_film_ids)))) if watchlist_film_ids else [],
            "favourites": Film.objects.filter(id__in=favourite_film_ids[:5]) if favourite_film_ids else [],
            "recent": Film.objects.filter(id__in=recent_film_ids) if recent_film_ids else [],
        }

        # If empty, provide fallback
        if not any(data_sets.values()):
            fallback = Film.objects.order_by("?")[:5]
            data_sets["fallback"] = fallback

        # Gather all film IDs we're returning
        all_film_ids = [film.id for films in data_sets.values() for film in films]
        userfilm_map = {
            uf.universal_item.id: uf
            for uf in userfilms.filter(universal_item__id__in=[uid for uid, fid in film_ids_map.items() if fid in all_film_ids])
        }

        # Build response payload
        result = {}
        for key, films in data_sets.items():
            result[key] = []
            for film in films:
                film_data = FilmSimpleSerializer(film).data
                uf = userfilm_map.get(film.universal_item.id)
                if uf:
                    film_data["userfilm"] = {
                        "poster": uf.poster,
                        "background_pic": uf.background_pic,
                        "seen": uf.seen,
                        "favourite": uf.favourite,
                        "watchlist": uf.watchlist,
                        "id": uf.id,
                        "date_watched": uf.date_watched,
                    }
                else:
                    film_data["userfilm"] = None
                result[key].append(film_data)

        return Response(result)
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def search(self, request):
        user = request.user
        q = request.query_params.get("q", None)
        actor = request.query_params.get("actor", None)
        director = request.query_params.get("director", None)
        crew = request.query_params.get("crew", None)
        genre = request.query_params.get("genre", None)
        limit = int(request.query_params.get("limit", 20))
        offset = int(request.query_params.get("offset", 0))
        
        # Build the film queryset with filters
        qs = (
            Film.objects
            .select_related("creator", "date")
            .order_by("title")
        )
        
        if actor:
            qs = qs.filter(Q(cast__icontains=actor))
        if director:
            qs = qs.filter(
                Q(creator_string__iexact=director)
            )
        if crew:
            qs = qs.filter(Q(crew__icontains=crew))
        if genre:
            qs = qs.filter(Q(genre__icontains=genre))
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(alt_title__icontains=q)
                | Q(creator_string__icontains=q)
                | Q(alt_creator_name__icontains=q)
            )
            
        films = qs.distinct()[offset:offset + limit]
        
        if not films:
            return Response({"results": []}, status=200)
        
        userfilms = UserFilm.objects.filter(
            user=user,
            universal_item__id__in=films.values_list("universal_item__id", flat=True)
        )
        
        userfilm_map = {
            uf.universal_item.id: uf for uf in userfilms
        }
        
        results = []
        for film in films:
            film_data = FilmSimpleSerializer(film).data
            uf = userfilm_map.get(film.universal_item.id)
            if uf:
                film_data["userfilm"] = {
                    "poster": uf.poster,
                    "background_pic": uf.background_pic,
                    "seen": uf.seen,
                    "favourite": uf.favourite,
                    "watchlist": uf.watchlist,
                    "id": uf.id,
                    "date_watched": uf.date_watched,
                }
            else:
                film_data["userfilm"] = None
            results.append(film_data)
        
        return Response({"results": results, "total": qs.count()})
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def list_films(self, request):
        user = request.user
        universal_item_ids = request.query_params.get("ids", "").split(",")
        q = request.query_params.get("q", None)
        
        qs = Film.objects.filter(universal_item__id__in=universal_item_ids)
        
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(alt_title__icontains=q)
                | Q(creator_string__icontains=q)
                | Q(alt_creator_name__icontains=q)
            )
        
        films = qs.distinct()
        
        if not films:
            return Response({"results": []}, status=200)
        
        userfilms = UserFilm.objects.filter(
            user=user,
            universal_item__id__in=universal_item_ids
        )
        
        userfilm_map = {uf.universal_item.id: uf for uf in userfilms}

        results = []
        for film in films:
            film_data = FilmSimpleSerializer(film).data
            uf = userfilm_map.get(film.universal_item.id)
            if uf:
                film_data["userfilm"] = {
                    "poster": uf.poster,
                    "background_pic": uf.background_pic,
                    "seen": uf.seen,
                    "favourite": uf.favourite,
                    "watchlist": uf.watchlist,
                    "id": uf.id,
                    "date_watched": uf.date_watched,
                    "rating": uf.rating,
                }
            else:
                film_data["userfilm"] = None
            results.append(film_data)

        return Response({"results": results})
    
    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
    def period_films(self, request):
        user = self.request.user
        period = self.request.query_params.get("period", None)
        q = self.request.query_params.get("g", None)
        
        qs = UserFilm.objects.filter(user=user)
        
        if period:
            qs = qs.filter(period__id__iexact=period)
        
        userfilms = qs.distinct()
        
        if not userfilms:
            return Response({"results": []}, status=200)
        
        films = Film.objects.filter(
            universal_item__id__in=userfilms.values_list("universal_item__id", flat=True)
        )
        
        if q:
            films = films.filter(
                Q(title__icontains=q)
                | Q(alt_title__icontains=q)
                | Q(creator_string__icontains=q)
                | Q(alt_creator_name__icontains=q)
            )
        
        film_map = {
            f.universal_item.id: f for f in films
        }
        
        results = []
        for uf in userfilms:
            film = film_map.get(uf.universal_item.id)
            if film:
                film_data = FilmSimpleSerializer(film).data
                film_data["userfilm"] = {
                    "id": uf.id,
                    "poster": uf.poster,
                    "background_pic": uf.background_pic,
                    "seen": uf.seen,
                    "favourite": uf.favourite,
                    "watchlist": uf.watchlist,
                    "date_watched": uf.date_watched,
                    "rating": uf.rating,
                    "period_id": uf.period.id if uf.period else None,
                }
                results.append(film_data)
        
        return Response({"results": results}, status=200)
        
        
class FilmSimpleViewSet(viewsets.ModelViewSet):
    serializer_class = FilmSimpleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = Film.objects.select_related('date').order_by('title')
        
        # Optional filtering (similar to FilmViewSet)
        q = self.request.query_params.get("q", None)
        tmdb_id = self.request.query_params.get("tmdb_id", None)
        limit = self.request.query_params.get("limit", None)

        if tmdb_id:
            qs = qs.filter(tmdb_id__iexact=tmdb_id)
        if q:
            qs = qs.filter(
                Q(title__icontains=q) |
                Q(alt_title__icontains=q) |
                Q(creator_string__icontains=q) |
                Q(alt_creator_name__icontains=q)
            )
        if limit:
            qs = qs[:int(limit)]

        return qs

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
            .prefetch_related("cultures")
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
        period = self.request.query_params.get("period", None)
        code = self.request.query_params.get("code", None)
        
        qs = UserFilm.objects.all()
        
        if not user.is_authenticated:
            return UserBook.objects.filter(visibility=Visibility.PUBLIC)
        if code:
            qs = qs.filter(cultures__code__iexact=code)
        if period:
            qs.filter(period__id=period)
        return qs.filter(user=user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    @action(detail=False, methods=["get"], url_path="by-film/(?P<film_id>[^/.]+)")
    def by_film(self, request, film_id=None):
        user = self.request.user
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
            return Response({"detail": "No entry yet."}, status=404)

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
        
# FILM IMPORT VIEW
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def import_films_view(request):
    """
    Import one or more films by TMDb ID or title.
    Input format:
    {
        "items": [550, "Inception", 1234]
    }
    """
    items = request.data.get("items", [])
    if not items or not all(isinstance(item, (str, int)) and str(item).strip() for item in items):
        return Response(
            {"error": "Items must be a non-empty list of non-empty strings or integers"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        imported = import_films_from_list(items)
        return Response(
            {"imported_count": len([r for r in imported if r["created"]]), "results": imported},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"error": f"Import failed: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
@api_view(["GET"])
def fetch_tmdb_images(request, tmdb_id):
    """
    Fetches posters and backdrops from TMDb for a given movie ID
    """
    base = "https://api.themoviedb.org/3"
    read_token = settings.CONFIG['TMDB_READ_TOKEN']
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {read_token}"
    }
    url = f"{base}/movie/{tmdb_id}/images"
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        return Response(
            {"error": f"TMDB request failed: {response.status_code}"},
            status=status.HTTP_400_BAD_REQUEST
        )
        
    data = response.json()
    return Response({
        "posters": data.get("posters", []),
        "backdrops": data.get("backdrops", []),
    })
    
@api_view(["PATCH"])
@permission_classes([IsOwnerOrPublic])
def update_film_image(request, pk):
    """
    Update poster or backdrop for a user's film
    """
    
    try:
        film = UserFilm.objects.get(pk=pk)
    except UserFilm.DoesNotExist:
        return Response({"error": "Film not found"}, status=status.HTTP_404_NOT_FOUND)
    
    poster = request.data.get("poster")
    backdrop = request.data.get("backdround_pic")
    
    if poster:
        film.poster = f"https://image.tmdb.org/t/p/original{poster}"
    if backdrop:
        film.background_pic = f"https://image.tmdb.org/t/p/original{backdrop}"
    
    film.save()
    return Response({"success": True, "poster": film.poster, "backdround_pic": film.background_pic})

# BOOK IMPORT VIEW
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def import_books_view(request):
    """
    Import one or more books by OpenLibrary Work ID or by title search.

    Input format:
    {
        "items": ["OL27448W", "Pride and Prejudice"]
    }

    - If a string looks like an OLID (e.g. 'OL12345W'), it fetches directly.
    - Otherwise, it performs a title search and imports the top result.
    """
    items = request.data.get("items", [])
    if not items or not all(isinstance(item, str) and item.strip() for item in items):
        return Response(
            {"error": "Items must be a non-empty list of non-empty strings."},
            status=status.HTTP_400_BAD_REQUEST
        )

    results = []
    for item in items:
        item = item.strip()
        try:
            # Detect OpenLibrary work ID format ("OLxxxxW")
            if item.upper().startswith("OL") and item[-1].upper() == "W":
                # Direct import
                book = create_book_from_openlibrary(item)
                results.append({
                    "input": item,
                    "book": str(book),
                    "created": True,
                    "ol_id": item
                })
            else:
                # Treat as title search
                works = fetch_works_by_title(item)
                if not works:
                    results.append({
                        "input": item,
                        "error": "No results found for this title."
                    })
                    continue

                # Take the top search result (could be improved later)
                top_result = works[0]
                ol_id = top_result["work_id"]

                book = create_book_from_openlibrary(ol_id)
                results.append({
                    "input": item,
                    "book": str(book),
                    "ol_id": ol_id,
                    "created": True
                })

        except ValidationError as ve:
            results.append({"input": item, "error": str(ve.detail)})
        except Exception as e:
            results.append({"input": item, "error": str(e)})

    # Summarize import result
    created_count = len([r for r in results if r.get("created")])

    return Response(
        {"imported_count": created_count, "results": results},
        status=status.HTTP_200_OK
    )
    
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_userbook_isbn(request):
    """
    Update an existing UserBook with ISBN metadata from OpenLibrary.
    
    Expected input:
    {
        "userbook_id": 42,
        "isbn": "000712693X"
    }
    """
    userbook_id = request.data.get("userbook_id")
    isbn = request.data.get("isbn")

    if not userbook_id or not isbn:
        return Response(
            {"error": "Both 'userbook_id' and 'isbn' are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        userbook = UserBook.objects.get(id=userbook_id, user=request.user)
    except UserBook.DoesNotExist:
        return Response(
            {"error": "UserBook not found or not owned by this user."},
            status=status.HTTP_404_NOT_FOUND,
        )

    try:
        updated_userbook = update_userbook_with_isbn(userbook, isbn)
        serializer = UserBookSerializer(updated_userbook)
        return Response(
            {"updated": True, "userbook": serializer.data},
            status=status.HTTP_200_OK
        )

    except ValidationError as ve:
        return Response({"error": str(ve.detail)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_books_view(request):
    """
    Search for books on OpenLibrary by title or author keyword.
    
    Example: GET /api/books/search/?q=canterbury+tales

    Returns:
    [
        {
            "title": "The Canterbury Tales",
            "author": "Geoffrey Chaucer",
            "first_publish_year": 1478,
            "work_id": "OL531767W"
        },
        ...
    ]
    """
    query = request.query_params.get("q")
    if not query:
        return Response(
            {"error": "Missing query parameter 'q'."},
            status=status.HTTP_400_BAD_REQUEST
        )

    results = search_openlibrary(query)
    if not results:
        return Response(
            {"results": [], "message": "No results found."},
            status=status.HTTP_200_OK
        )

    return Response({"results": results}, status=status.HTTP_200_OK)