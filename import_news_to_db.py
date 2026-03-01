"""
Import crime news data into MongoDB
Reads crime_news_data.json and inserts into your existing fir_data database
Enhanced with: image fetching, better geocoding, and record display
"""

import json
import pymongo
import os
from datetime import datetime
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time
from urllib.parse import urljoin
import warnings

# Disable SSL warnings
warnings.filterwarnings('ignore', message='Unverified HTTPS request')
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

load_dotenv()

# Initialize geocoder
geolocator = Nominatim(user_agent="crimepulse_importer_v1")
geocode_cache = {}


def display_existing_records(collection, limit=5):
    """Display existing records in the database"""
    print("\n📊 EXISTING RECORDS IN DATABASE:")
    print("=" * 80)
    
    count = collection.count_documents({})
    print(f"Total records: {count}\n")
    
    if count == 0:
        print("  No existing records found.")
        return
    
    # Show sample records
    print(f"Showing latest {min(limit, count)} records:\n")
    records = collection.find().sort('_id', -1).limit(limit)
    
    for i, record in enumerate(records, 1):
        print(f"📝 Record #{i}:")
        print("-" * 80)
        
        # Display key-value pairs
        important_fields = [
            'fir_number', 'crime_type', 'title', 'location', 
            'latitude', 'longitude', 'incident_date', 'source', 
            'news_url', 'image_url', 'severity_level'
        ]
        
        for field in important_fields:
            if field in record and record[field]:
                value = str(record[field])[:80]  # Truncate long values
                print(f"  {field:20s}: {value}")
        
        print()
    
    # Crime type breakdown
    pipeline = [
        {"$group": {"_id": "$crime_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    crime_stats = list(collection.aggregate(pipeline))
    
    if crime_stats:
        print("📈 Crime Type Breakdown:")
        print("-" * 80)
        for stat in crime_stats:
            crime_type = stat['_id'] if stat['_id'] else 'Unknown'
            count = stat['count']
            print(f"  {crime_type:20s}: {count}")
    
    print("=" * 80)


def fetch_article_image(url, title=""):
    """Fetch the main image from an article URL"""
    if not url or not url.startswith('http'):
        return None
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=5, verify=False)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Try multiple strategies to find image
        image_url = None
        
        # 1. Open Graph image
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            image_url = og_image['content']
        
        # 2. Twitter card image
        if not image_url:
            twitter_image = soup.find('meta', attrs={'name': 'twitter:image'})
            if twitter_image and twitter_image.get('content'):
                image_url = twitter_image['content']
        
        # 3. First article image
        if not image_url:
            article_img = soup.find('article') or soup.find('div', class_='article')
            if article_img:
                img = article_img.find('img')
                if img and (img.get('src') or img.get('data-src')):
                    image_url = img.get('src') or img.get('data-src')
        
        # 4. Any large image in content
        if not image_url:
            for img in soup.find_all('img'):
                src = img.get('src') or img.get('data-src')
                if src and not any(x in src.lower() for x in ['logo', 'icon', 'avatar', 'thumbnail']):
                    # Check if it's reasonably sized
                    width = img.get('width', '0')
                    height = img.get('height', '0')
                    if width and height:
                        try:
                            if int(width) > 300 or int(height) > 200:
                                image_url = src
                                break
                        except:
                            pass
                    else:
                        image_url = src
                        break
        
        # Make URL absolute
        if image_url:
            if not image_url.startswith('http'):
                image_url = urljoin(url, image_url)
            
            return image_url
        
    except KeyboardInterrupt:
        raise  # Re-raise keyboard interrupt
    except:
        pass  # Silently fail on any other error
    
    return None


def get_precise_coordinates(location_name, city="Mumbai", state="Maharashtra", country="India"):
    """Get precise lat/lon for a specific location using geocoding"""
    
    # Check cache first
    cache_key = f"{location_name}_{city}"
    if cache_key in geocode_cache:
        return geocode_cache[cache_key]
    
    try:
        # Add delay to respect rate limits (reduced to 0.5s since we're caching)
        time.sleep(0.5)
        
        # Try full address first
        full_address = f"{location_name}, {city}, {state}, {country}"
        location = geolocator.geocode(full_address, timeout=10)
        
        if location:
            coords = {
                'latitude': location.latitude,
                'longitude': location.longitude,
                'formatted_address': location.address
            }
            geocode_cache[cache_key] = coords
            return coords
        
        # Try with just city if area not found
        location = geolocator.geocode(f"{city}, {state}, {country}", timeout=10)
        if location:
            coords = {
                'latitude': location.latitude,
                'longitude': location.longitude,
                'formatted_address': f"{city}, {state}, {country} (default)"
            }
            geocode_cache[cache_key] = coords
            return coords
            
    except GeocoderTimedOut:
        pass
    except Exception:
        pass
    
    # Return default Mumbai coordinates with consistent offset
    default = {
        'latitude': 19.0760 + (hash(location_name) % 100) * 0.001,  # Add small offset
        'longitude': 72.8777 + (hash(location_name) % 100) * 0.001,
        'formatted_address': f"{location_name}, Mumbai (approximate)"
    }
    geocode_cache[cache_key] = default
    return default

def import_news_to_mongodb():
    """Import scraped news data into MongoDB with images and precise geocoding"""
    
    # Connect to MongoDB
    MONGODB_URI = os.getenv("MONGO_URI")
    if not MONGODB_URI:
        print("❌ Error: MONGO_URI not found in .env file")
        return
    
    try:
        client = pymongo.MongoClient(MONGODB_URI)
        db = client["fir_data"]
        
        # Create/access collections
        news_collection = db["crime_news"]
        
        # Display existing records FIRST
        display_existing_records(news_collection, limit=5)
        
        # Read the JSON file
        with open('crime_news_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        articles = data.get('articles', [])
        
        if not articles:
            print("⚠️  No articles found in crime_news_data.json")
            return
        
        print(f"\n{'='*80}")
        print(f"📊 NEW DATA TO IMPORT:")
        print(f"{'='*80}")
        print(f"Found {len(articles)} articles to import")
        print(f"💾 Importing to database: {db.name}")
        print(f"📁 Collection: {news_collection.name}")
        print()
        
        # Process articles with progress
        news_records = []
        location_counter = {}  # Track locations to ensure unique coords
        
        for i, article in enumerate(articles, 1):
            try:
                if i % 20 == 0 or i == 1:  # Show progress every 20 articles
                    print(f"Processing {i}/{len(articles)}...")
                
                location_name = article.get('location', 'Mumbai')
                
                # Get precise coordinates for this specific location
                # Add small variation if we've seen this location before
                location_key = location_name.lower()
                if location_key in location_counter:
                    location_counter[location_key] += 1
                    variation = location_counter[location_key] * 0.0001
                else:
                    location_counter[location_key] = 0
                    variation = 0
                
                coords = get_precise_coordinates(location_name)
                
                # Add variation to prevent exact duplicates
                latitude = coords['latitude'] + variation
                longitude = coords['longitude'] + variation
                
                # Fetch image from article (with timeout protection)
                try:
                    image_url = fetch_article_image(article.get('link'), article.get('title'))
                except:
                    image_url = None
                    
                # Create enhanced record
                record = {
                    'fir_number': f"NEWS-{datetime.now().strftime('%Y%m%d')}-{i:04d}",
                    'crime_type': article.get('crime_type', 'unknown').upper(),
                    'crime_category': article.get('crime_type', 'unknown'),
                    'severity_level': get_severity_level(article.get('crime_type')),
                    
                    # Precise geocoding
                    'latitude': latitude,
                    'longitude': longitude,
                    'location': location_name,
                    'formatted_address': coords.get('formatted_address'),
                    'police_station': extract_police_station(location_name),
                    
                    # Dates
                    'incident_date': article.get('published_date'),
                    'scraped_date': article.get('scraped_date'),
                    
                    # News-specific fields
                    'source': article.get('source'),
                    'title': article.get('title'),
                    'description': article.get('description'),
                    'news_url': article.get('link'),
                    'image_url': image_url,  # NEW: Image URL
                    'is_verified': False,
                    'data_source': 'news_scraper',
                    
                    # Metadata
                    'created_at': datetime.now().isoformat(),
                    'is_mumbai_related': True
                }
                
                news_records.append(record)
                
            except KeyboardInterrupt:
                print("\n⚠️  Import interrupted by user")
                break
            except Exception as e:
                print(f"\n⚠️  Error processing article {i}: {str(e)[:50]}")
                continue
        
        # Insert into MongoDB
        if news_records:
            print(f"{'='*80}")
            print("💾 INSERTING RECORDS INTO DATABASE...")
            print(f"{'='*80}\n")
            
            result = news_collection.insert_many(news_records)
            print(f"✅ Successfully inserted {len(result.inserted_ids)} records")
            print()
            
            # Print detailed summary
            print(f"{'='*80}")
            print("📈 IMPORT SUMMARY:")
            print(f"{'='*80}")
            print(f"Total records imported: {len(news_records)}")
            print(f"Records with images: {sum(1 for r in news_records if r.get('image_url'))}")
            print(f"Unique locations: {len(location_counter)}")
            print()
            
            crime_counts = {}
            for record in news_records:
                ct = record['crime_type']
                crime_counts[ct] = crime_counts.get(ct, 0) + 1
            
            print("Crime type breakdown:")
            for crime_type, count in sorted(crime_counts.items(), key=lambda x: x[1], reverse=True):
                print(f"  - {crime_type:15s}: {count:3d} records")
            
            print()
            print("🔗 DATABASE INFO:")
            print(f"  Database: {db.name}")
            print(f"  Collection: {news_collection.name}")
            print(f"  Total documents: {news_collection.count_documents({})}")
            
            # Also add to main 'firs' collection automatically
            print()
            print("📌 Adding to 'firs' collection for unified heatmap...")
            fir_collection = db["firs"]
            fir_result = fir_collection.insert_many([r.copy() for r in news_records])
            print(f"✅ Added {len(fir_result.inserted_ids)} records to 'firs' collection")
            print(f"  Total FIRs: {fir_collection.count_documents({})}")
        
        client.close()
        print(f"\n{'='*80}")
        print("🎉 Import complete! Your data is ready for the heatmap.")
        print(f"{'='*80}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()


def get_severity_level(crime_type):
    """Assign severity level based on crime type"""
    severity_map = {
        'murder': 'Critical',
        'rape': 'Critical',
        'kidnapping': 'High',
        'extortion': 'Medium',
        'theft': 'Medium'
    }
    return severity_map.get(crime_type.lower() if crime_type else '', 'Medium')


def extract_police_station(location):
    """Extract or infer police station from location"""
    if not location:
        return "Mumbai Police (Unspecified)"
    
    # Comprehensive police station mapping for Mumbai
    station_map = {
        'Andheri': 'Andheri Police Station',
        'Bandra': 'Bandra Police Station',
        'Borivali': 'Borivali Police Station',
        'Mulund': 'Mulund Police Station',
        'Kurla': 'Kurla Police Station',
        'Colaba': 'Colaba Police Station',
        'Dadar': 'Dadar Police Station',
        'Goregaon': 'Goregaon Police Station',
        'Juhu': 'Juhu Police Station',
        'Kandivali': 'Kandivali Police Station',
        'Malad': 'Malad Police Station',
        'Powai': 'Powai Police Station',
        'Santacruz': 'Santacruz Police Station',
        'Vile Parle': 'Vile Parle Police Station',
        'Worli': 'Worli Police Station',
        'Versova': 'Versova Police Station',
        'Jogeshwari': 'Jogeshwari Police Station',
        'Ghatkopar': 'Ghatkopar Police Station',
        'Vikhroli': 'Vikhroli Police Station',
        'Bhandup': 'Bhandup Police Station',
        'Chembur': 'Chembur Police Station',
        'Dharavi': 'Dharavi Police Station',
        'Mahim': 'Mahim Police Station',
        'Sion': 'Sion Police Station',
        'Wadala': 'Wadala Police Station',
        'Parel': 'Parel Police Station',
        'Lower Parel': 'Lower Parel Police Station',
        'Marine Drive': 'Marine Drive Police Station',
        'Fort': 'Fort Police Station',
        'Nariman Point': 'Nariman Point Police Station',
        'Thane': 'Thane Police Station',
        'Navi Mumbai': 'Navi Mumbai Police',
        'Vasai': 'Vasai Police Station',
        'Mira Road': 'Mira Road Police Station',
    }
    
    for area, station in station_map.items():
        if area.lower() in location.lower():
            return station
    
    return f"{location} Police Station"


if __name__ == "__main__":
    print("=" * 80)
    print("🚨 ENHANCED CRIME NEWS DATA IMPORTER")
    print("=" * 80)
    print("Features:")
    print("  ✓ Display existing database records")
    print("  ✓ Fetch article images automatically")
    print("  ✓ Precise geocoding for unique lat/lon")
    print("  ✓ Detailed import progress")
    print("=" * 80)
    print()
    
    # Check if JSON file exists
    if not os.path.exists('crime_news_data.json'):
        print("❌ Error: crime_news_data.json not found")
        print("   Run news_scraper.py first to generate data")
    else:
        import_news_to_mongodb()

