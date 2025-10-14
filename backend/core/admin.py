from django.contrib import admin
from .models import (
    Profile, Culture, Category, Period, PageContent, Recipe, LangLesson, CalendarDate,
    Person, MapBorder, MapPin, LanguageTable, UniversalItem, Book, Film, MusicPiece,
    Artwork, UserBook, UserFilm, UserMusicPiece, UserArtwork, UserHistoryEvent 
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