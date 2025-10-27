from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    ProfileViewSet, CultureViewSet, CategoryViewSet, PeriodViewSet, PageContentViewSet,
    RecipeViewSet, LangLessonViewSet, CalendarDateViewSet, PersonViewSet,
    MapBorderViewSet, MapPinViewSet, LanguageTableViewSet, UniversalItemViewSet,
    BookViewSet, FilmViewSet, UserMusicComposerViewSet,          
    UserBookViewSet, UserFilmViewSet, UserMusicPieceViewSet, UserMusicArtistViewSet,
    UserHistoryEventViewSet, RegisterView, CurrentUserView, FilmSimpleViewSet, ListViewSet, BookSimpleViewSet,
    import_films_view, update_film_image, fetch_tmdb_images, import_books_view, update_userbook_isbn, search_books_view
)

router = DefaultRouter()
router.register(r'profiles', ProfileViewSet, basename='profile')
router.register(r'cultures', CultureViewSet, basename='culture')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'periods', PeriodViewSet, basename='period')
router.register(r'page-contents', PageContentViewSet, basename='pagecontent')
router.register(r'recipes', RecipeViewSet, basename='recipe')
router.register(r'lang-lessons', LangLessonViewSet, basename='langlesson')
router.register(r'calendar-dates', CalendarDateViewSet, basename='calendardate')
router.register(r'people', PersonViewSet, basename='person')
router.register(r'map-borders', MapBorderViewSet, basename='mapborder')
router.register(r'map-pins', MapPinViewSet, basename='mappin')
router.register(r'language-tables', LanguageTableViewSet, basename='languagetable')
router.register(r'universal-items', UniversalItemViewSet, basename='universalitem')
router.register(r'books', BookViewSet, basename='book')
router.register(r'films', FilmViewSet, basename='film')
router.register(r'user-books', UserBookViewSet, basename='userbook')
router.register(r'user-films', UserFilmViewSet, basename='userfilm')
router.register(r'user-music-pieces', UserMusicPieceViewSet, basename='usermusicpiece')
router.register(r'user-composers', UserMusicComposerViewSet, basename='usercomposers')
router.register(r'user-artists', UserMusicArtistViewSet, basename="userartists")
router.register(r'user-history-events', UserHistoryEventViewSet, basename='userhistoryevent')
router.register(r'simple-films', FilmSimpleViewSet, basename='simplefilm'),
router.register(r'simple-books', BookSimpleViewSet, basename='simplebook')
router.register(r'lists', ListViewSet, basename='list')

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/current-user/', CurrentUserView.as_view(), name='current_user'),
    path('api/import-films/', import_films_view, name="import-films"),
    path('api/user-films/<int:pk>/update-image/', update_film_image, name="update_film_image"),
    path('api/films/<int:tmdb_id>/images/', fetch_tmdb_images, name="fetch_tmdb_images"),
    path('api/import-books/', import_books_view, name="import-books"),
    path('api/update-userbook/', update_userbook_isbn, name="update-userbook"),
    path('api/search-books/', search_books_view, name="search-books")
]