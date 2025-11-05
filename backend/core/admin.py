from django.contrib import admin # type: ignore
from .models import (
    Profile, Culture, Category, Period, PageContent, Recipe, LangLesson, CalendarDate,
    Person, UserMapPreferences, MapPin, LanguageTable, UniversalItem, Book, Film, UserMusicArtist,
    UserBook, UserFilm, UserMusicPiece, UserHistoryEvent, UserMusicComposer, UserComposerSearch, List
)

# Register your models here.
@admin.register(Period)
class PeriodAdmin(admin.ModelAdmin):
    list_display = ('title', 'culture', 'start_year', 'end_year', 'category__key')
    search_fields = ('title', 'culture__name')
    list_filter = ('culture',)
    
@admin.register(Culture)
class CultureAdmin(admin.ModelAdmin):
    list_display = ('name', 'shared_group_key')
    search_fields = ('name', 'shared_group_key')
    list_filter = ('name',)
    
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('key', 'display_name', 'culture__shared_group_key', 'culture__user__username')
    search_fields = ('key', 'dispaly_name', 'culture__name')
    list_filter = ('key',)
    
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'bio', 'location')
    search_fields = ('user__username', 'bio', 'location')
    list_filter = ('location',)
    
@admin.register(UserHistoryEvent)
class UserHistoryEventAdmin(admin.ModelAdmin):
    list_display = ('user', 'type', 'title', 'date' )
    search_fields = ('user', 'title', 'description')
    list_filter = ('type', 'user')
    
@admin.register(CalendarDate)
class CalendarDateAdmin(admin.ModelAdmin):
    list_display = ('user', 'holiday_name', 'calendar_date')
    search_fields = ('user', 'holiday_name', 'calendar_date')
    list_filter = ('user', 'cultures')

@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'types', 'course')
    search_fields = ('user', 'name', 'types', 'course')
    list_filter = ('user', 'course', 'types')
    
@admin.register(PageContent)
class PageContentAdmin(admin.ModelAdmin):
    list_display = ('culture__user', 'category', 'culture')
    search_fields = ('user', 'category')

@admin.register(UserFilm)
class UserFilmAdmin(admin.ModelAdmin):
    list_display = ('user', 'notes')
    
@admin.register(List)
class ListAdmin(admin.ModelAdmin):
    list_display = ('user', 'type')
    
@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator_string', 'ol_id')

@admin.register(UserBook)
class UserBookAdmin(admin.ModelAdmin):
    list_display = ('user', 'notes')
    
@admin.register(UniversalItem)
class UniversalItemAdmin(admin.ModelAdmin):
    list_display = ('title', 'type')
    
@admin.register(UserMusicComposer)
class UserMusicComposerAdmin(admin.ModelAdmin):
    list_display = ('name', 'user')
    
@admin.register(UserMusicPiece)
class UserMusicPieceAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'user')
    
@admin.register(UserMusicArtist)
class UserMusicArtistAdmin(admin.ModelAdmin):
    list_display = ('name', 'user')
    
@admin.register(UserComposerSearch)
class UserComposerSearchAdMin(admin.ModelAdmin):
    list_display = ('user', 'culture', 'composer_list', 'saved_location')
    
@admin.register(MapPin)
class MapPinAdmin(admin.ModelAdmin):
    list_display = ('user', 'loc', 'title', 'type', 'period__title')

@admin.register(UserMapPreferences)
class UserMapPreferencesAdmin(admin.ModelAdmin):
    list_display = ('user', 'culture', 'zoom', 'center')