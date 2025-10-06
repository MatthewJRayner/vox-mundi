from rest_framework import viewsets, status, generics
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, SAFE_METHODS, BasePermission, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.db.models import Q
from .models import (
    Profile, Culture, Category, Period, PageContent, Recipe, LangLesson,
    CalendarDate, Person, MapBorder, MapPin, LanguageTable, UniversalItem,
    Book, Film, MusicPiece, Artwork, HistoryEvent, UserBook, UserFilm,
    UserMusicPiece, UserArtwork, UserHistoryEvent, Visibility
)
from .serializers import (
    ProfileSerializer, CultureSerializer, CategorySerializer, PeriodSerializer,
    PageContentSerializer, RecipeSerializer, LangLessonSerializer, CalendarDateSerializer,
    PersonSerializer, MapBorderSerializer, MapPinSerializer, LanguageTableSerializer,
    UniversalItemSerializer, BookSerializer, FilmSerializer, MusicPieceSerializer,
    ArtworkSerializer, HistoryEventSerializer, UserBookSerializer, UserFilmSerializer,
    UserMusicPieceSerializer, UserArtworkSerializer, UserHistoryEventSerializer, RegisterSerializer, UserSerializer
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
        qs = Culture.objects.select_related('user')
        
        if not user.is_authenticated:
            return Culture.objects.none()
        
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
        qs = Category.objects.select_related('culture')
        
        if not user.is_authenticated:
            return Category.objects.none()
        
        if code:
            qs = qs.filter(culture__code=code, culture__user=user)
        else:
            qs = qs.filter(culture__user=user)
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
        culture = serializer.validated_data.get('culture')
        if culture.user != self.request.user:
            raise PermissionError("You do not own this culture.")
        serializer.save()

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

class PersonViewSet(viewsets.ModelViewSet):
    serializer_class = PersonSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        query = self.request.query_params.get('q', None)
        nationality = self.request.query_params.get('nationality', None)
        qs = Person.objects.select_related('birth_date', 'death_date')

class MapBorderViewSet(viewsets.ModelViewSet):
    serializer_class = MapBorderSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        code = self.request.query_params.get('code', None)
        if user.is_authenticated:
            return MapBorder.objects.filter(culture__user=user).select_related('culture', 'period')
        return MapBorder.objects.none()

    def perform_create(self, serializer):
        serializer.save()

class MapPinViewSet(viewsets.ModelViewSet):
    serializer_class = MapPinSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return MapPin.objects.filter(culture__user=user).select_related('culture', 'period')
        return MapPin.objects.none()

    def perform_create(self, serializer):
        serializer.save()

class LanguageTableViewSet(viewsets.ModelViewSet):
    serializer_class = LanguageTableSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return LanguageTable.objects.filter(culture__user=user).select_related('culture')
        return LanguageTable.objects.none()

    def perform_create(self, serializer):
        serializer.save()

class UniversalItemViewSet(viewsets.ModelViewSet):
    serializer_class = UniversalItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return UniversalItem.objects.filter(cultures__user=user).select_related('content_type').prefetch_related('cultures')
        return UniversalItem.objects.none()

    def perform_create(self, serializer):
        serializer.save()

class BookViewSet(viewsets.ModelViewSet):
    serializer_class = BookSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Book.objects.select_related('creator', 'date').prefetch_related('universal_item')

class FilmViewSet(viewsets.ModelViewSet):
    serializer_class = FilmSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Film.objects.select_related('creator', 'date').prefetch_related('universal_item')

class MusicPieceViewSet(viewsets.ModelViewSet):
    serializer_class = MusicPieceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return MusicPiece.objects.select_related('creator', 'date').prefetch_related('universal_item')

class ArtworkViewSet(viewsets.ModelViewSet):
    serializer_class = ArtworkSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Artwork.objects.select_related('creator', 'date').prefetch_related('universal_item')

class HistoryEventViewSet(viewsets.ModelViewSet):
    serializer_class = HistoryEventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return HistoryEvent.objects.select_related('creator', 'date', 'period').prefetch_related('universal_item')

class UserBookViewSet(viewsets.ModelViewSet):
    serializer_class = UserBookSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return UserBook.objects.filter(Q(user=user) | Q(visibility='public')).select_related('user', 'universal_item').prefetch_related('cultures')
        return UserBook.objects.filter(visibility='public').select_related('user', 'universal_item').prefetch_related('cultures')

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

class UserMusicPieceViewSet(viewsets.ModelViewSet):
    serializer_class = UserMusicPieceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return UserMusicPiece.objects.filter(Q(user=user) | Q(visibility='public')).select_related('user', 'universal_item').prefetch_related('cultures')
        return UserMusicPiece.objects.filter(visibility='public').select_related('user', 'universal_item').prefetch_related('cultures')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserArtworkViewSet(viewsets.ModelViewSet):
    serializer_class = UserArtworkSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return UserArtwork.objects.filter(Q(user=user) | Q(visibility='public')).select_related('user', 'universal_item').prefetch_related('cultures')
        return UserArtwork.objects.filter(visibility='public').select_related('user', 'universal_item').prefetch_related('cultures')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class UserHistoryEventViewSet(viewsets.ModelViewSet):
    serializer_class = UserHistoryEventSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return UserHistoryEvent.objects.filter(Q(user=user) | Q(visibility='public')).select_related('user', 'universal_item').prefetch_related('cultures')
        return UserHistoryEvent.objects.filter(visibility='public').select_related('user', 'universal_item').prefetch_related('cultures')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)