from django.contrib import admin
from .models import (
    Profile, Culture, Category, Period, PageContent, Recipe, LangLesson, CalendarDate,
    Person, MapBorder, MapPin, LanguageTable, UniversalItem, Book, Film, MusicPiece,
    Artwork, HistoryEvent, UserBook, UserFilm, UserMusicPiece, UserArtwork, UserHistoryEvent 
)

# Register your models here.
@admin.register(Period)
class PeriodAdmin(admin.ModelAdmin):
    list_display = ('title', 'culture', 'start_year', 'end_year')
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