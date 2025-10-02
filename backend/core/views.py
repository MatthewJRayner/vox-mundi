from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly, SAFE_METHODS, BasePermission
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
    UserMusicPieceSerializer, UserArtworkSerializer, UserHistoryEventSerializer
)

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
        if user.is_authenticated:
            return Culture.objects.filter(user=user).select_related('user')
        return Culture.objects.none()

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Category.objects.filter(culture__user=user).select_related('culture')
        return Category.objects.none()

    def perform_create(self, serializer):
        serializer.save()

class PeriodViewSet(viewsets.ModelViewSet):
    serializer_class = PeriodSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Period.objects.filter(culture__user=user).select_related('culture')
        return Period.objects.none()

    def perform_create(self, serializer):
        serializer.save()

class PageContentViewSet(viewsets.ModelViewSet):
    serializer_class = PageContentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return PageContent.objects.filter(culture__user=user).select_related('culture', 'category')
        return PageContent.objects.none()

    def perform_create(self, serializer):
        serializer.save()

class RecipeViewSet(viewsets.ModelViewSet):
    serializer_class = RecipeSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return Recipe.objects.filter(Q(user=user) | Q(visibility='public')).select_related('user').prefetch_related('cultures')
        return Recipe.objects.filter(visibility='public').select_related('user').prefetch_related('cultures')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class LangLessonViewSet(viewsets.ModelViewSet):
    serializer_class = LangLessonSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return LangLesson.objects.filter(Q(user=user) | Q(visibility='public')).select_related('user').prefetch_related('cultures')
        return LangLesson.objects.filter(visibility='public').select_related('user').prefetch_related('cultures')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class CalendarDateViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarDateSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrPublic]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            return CalendarDate.objects.filter(Q(user=user) | Q(visibility='public')).select_related('user', 'person').prefetch_related('cultures')
        return CalendarDate.objects.filter(visibility='public').select_related('user', 'person').prefetch_related('cultures')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PersonViewSet(viewsets.ModelViewSet):
    serializer_class = PersonSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Person.objects.select_related('birth_date', 'death_date')

class MapBorderViewSet(viewsets.ModelViewSet):
    serializer_class = MapBorderSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
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