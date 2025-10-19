import csv
from django.core.management.base import BaseCommand
from django.conf import settings
from ...models import Film
from ...serializers import FilmSerializer
from ...services.tmdb_import import fetch_tmdb_data
from django.core import management
from datetime import timedelta

class Command(BaseCommand):
    help = 'Import Letterboxd CSV data into film model'
    
    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the Letterboxd CSV file')
        
    def handle(self, *args, **options):
        csv_file = options['csv_file']
        imported = 0
        exists = 0
        skipped = 0
        
        with open(csv_file, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                title = row.get('Name', '').strip()
                
                if not title:
                    self.stdout.write(self.style.ERROR(f"Skipped row with empty title: {row}"))
                    skipped += 1
                    continue
                
                tmdb_data = fetch_tmdb_data(title)
                if not tmdb_data:
                    continue
                film, created = Film.create_with_universal_item(tmdb_data)
                
                if created:
                    self.stdout.write(self.style.SUCCESS(f"{film.title} ({film.tmdb_id}) imported"))
                    imported += 1
                else:
                    self.stdout.write(self.style.ERROR(f"Film already exists in database"))
                    exists += 1
        
        self.stdout.write(self.style.SUCCESS(f"Successfully imported {imported} films to DB, with {skipped} films skipped and {exists} films already existing"))
                
                