"""
Automated Crime News Scraper for GitHub Actions
Runs periodically to fetch new crime news and update MongoDB
"""

import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import pymongo
import os
from dotenv import load_dotenv
import time
import re

import feedparser
import hashlib
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

load_dotenv()

class AutoCrimeScraper:
    def __init__(self):
        # MongoDB connection
        self.mongo_uri = os.getenv("MONGO_URI")
        if not self.mongo_uri:
            raise ValueError("MONGO_URI not found in environment variables")
        
        self.client = pymongo.MongoClient(self.mongo_uri)
        self.db = self.client["fir_data"]
        self.collection = self.db["crime_news"]
        
        # Create unique index on URL to prevent duplicates
        self.collection.create_index([("news_url", 1)], unique=True)
        self.collection.create_index([("created_at", -1)])
        
        self.headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        
        # Initialize geocoder with reasonable timeout and user agent
        self.geolocator = Nominatim(user_agent="crimepulse_scraper", timeout=3)
        
        # Cache for geocoded locations to avoid repeated API calls
        self.geocode_cache = {}
        
        print(f"✅ Connected to MongoDB. Current records: {self.collection.count_documents({})}")
    
    def scrape_times_of_india_rss(self):
        """Scrape Times of India India-wide RSS feed"""
        print("\n📡 Fetching Times of India RSS...")
        
        rss_urls = [
            'https://timesofindia.indiatimes.com/rssfeeds/-2128838597.cms',  # India News
            'https://timesofindia.indiatimes.com/rssfeeds/1081479906.cms',  # Mumbai News
            'https://timesofindia.indiatimes.com/rssfeeds/2647163.cms',     # Delhi News
            'https://timesofindia.indiatimes.com/rssfeeds/1898055.cms'      # Bangalore News
        ]
        
        new_articles = []
        
        for rss_url in rss_urls:
            try:
                feed = feedparser.parse(rss_url)
                print(f"  Found {len(feed.entries)} articles in feed")
                
                for entry in feed.entries[:20]:  # Process latest 20
                    title = entry.get('title', '')
                    url = entry.get('link', '')
                    
                    # Check if crime-related
                    crime_keywords = ['murder', 'rape', 'theft', 'robbery', 'assault', 'kidnap', 
                                     'crime', 'arrested', 'police', 'killed', 'attack', 'molest']
                    
                    if any(keyword in title.lower() for keyword in crime_keywords):
                        # Add all India crime news (removed Mumbai filter)
                        new_articles.append({
                            'title': title,
                            'url': url,
                            'source': 'Times of India',
                            'published': entry.get('published', '')
                        })
            except Exception as e:
                print(f"  ❌ Error fetching RSS: {e}")
        
        print(f"  ✅ Found {len(new_articles)} crime-related articles")
        return new_articles
    
    def scrape_hindustan_times_rss(self):
        """Scrape Hindustan Times India RSS"""
        print("\n📡 Fetching Hindustan Times RSS...")
        
        rss_urls = [
            'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml',
            'https://www.hindustantimes.com/feeds/rss/mumbai-news/rssfeed.xml',
            'https://www.hindustantimes.com/feeds/rss/delhi-news/rssfeed.xml'
        ]
        
        new_articles = []
        
        for rss_url in rss_urls:
            try:
                feed = feedparser.parse(rss_url)
                print(f"  Found {len(feed.entries)} articles in feed")
                
                for entry in feed.entries[:20]:
                    title = entry.get('title', '')
                    url = entry.get('link', '')
                    
                    crime_keywords = ['murder', 'rape', 'theft', 'robbery', 'assault', 'kidnap', 
                                     'crime', 'arrested', 'police', 'killed', 'attack']
                    
                    if any(keyword in title.lower() for keyword in crime_keywords):
                        new_articles.append({
                            'title': title,
                            'url': url,
                            'source': 'Hindustan Times',
                            'published': entry.get('published', '')
                        })
            except Exception as e:
                print(f"  ❌ Error fetching RSS: {e}")
        
        print(f"  ✅ Found {len(new_articles)} crime-related articles")
        return new_articles
    
    def classify_crime_type(self, text):
        """Classify crime type from text"""
        text_lower = text.lower()
        
        if any(word in text_lower for word in ['murder', 'killed', 'homicide', 'stabbed', 'shot dead']):
            return 'murder'
        elif any(word in text_lower for word in ['rape', 'sexual assault', 'molest', 'harassment']):
            return 'rape'
        elif any(word in text_lower for word in ['theft', 'stolen', 'burglary', 'robbery', 'loot', 'robbed']):
            return 'theft'
        elif any(word in text_lower for word in ['kidnap', 'abduct', 'missing']):
            return 'kidnapping'
        elif any(word in text_lower for word in ['extortion', 'blackmail', 'ransom']):
            return 'extortion'
        else:
            return 'other'
    
    def determine_severity(self, crime_type):
        """Determine severity level"""
        severity_map = {
            'murder': 'Critical',
            'rape': 'Critical',
            'kidnapping': 'High',
            'extortion': 'High',
            'theft': 'Medium',
            'other': 'Low'
        }
        return severity_map.get(crime_type, 'Low')
    
    def extract_location(self, text):
        """Extract location from text using regex patterns and prioritize specific over general"""
        # Common location patterns in Indian news headlines
        patterns = [
            r"in\s+([A-Z][a-zA-Z\s]+?)(?:'s|,|\.|near|of)",  # "in Punjab's Gurdaspur" -> Punjab
            r"in\s+([A-Z][a-zA-Z\s]+?)(?:\s+district)",      # "in Gurdaspur district" -> Gurdaspur
            r"near\s+([A-Z][a-zA-Z\s]+?)(?:'s|,|\.|in)",     # "near Indo-Pak border in Punjab" -> Punjab
            r"([A-Z][a-zA-Z\s]+?)(?:'s)\s+([A-Z][a-zA-Z]+)", # "Punjab's Gurdaspur" -> both Punjab and Gurdaspur
            r"at\s+([A-Z][a-zA-Z\s]+?)(?:'s|,|\.|after|\s+in)",  # "at Delhi's" -> Delhi
            r"in\s+([A-Z][a-zA-Z\s]+?)(?:\s|,|$)",           # "in Mumbai" -> Mumbai
        ]
        
        found_locations = []
        
        # Extract all potential locations using patterns
        for pattern in patterns:
            matches = re.findall(pattern, text)
            if matches:
                for match in matches:
                    if isinstance(match, tuple):
                        # For patterns that capture multiple groups (e.g., "Punjab's Gurdaspur")
                        for loc in match:
                            if loc and len(loc.strip()) > 2:
                                found_locations.append(loc.strip())
                    elif len(match.strip()) > 2:
                        found_locations.append(match.strip())
        
        # Known Indian states (lower priority)
        states = ['Punjab', 'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh',
                 'West Bengal', 'Gujarat', 'Rajasthan', 'Kerala', 'Madhya Pradesh', 'Bihar',
                 'Haryana', 'Telangana', 'Andhra Pradesh', 'Odisha', 'Jharkhand', 'Assam']
        
        # Known cities (higher priority)
        cities = ['Mumbai', 'Delhi', 'Bangalore', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad',
                 'Pune', 'Ahmedabad', 'Surat', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
                 'Gurdaspur', 'Amritsar', 'Ludhiana', 'Chandigarh', 'Patiala', 'Noida',
                 'Gurgaon', 'Gurugram', 'Ghaziabad', 'Faridabad', 'Indore', 'Bhopal']
        
        # Prioritize cities over states
        city_locations = [loc for loc in found_locations if loc in cities]
        if city_locations:
            return city_locations[0]  # Return first found city
        
        # Fall back to state if no city found
        state_locations = [loc for loc in found_locations if loc in states]
        if state_locations:
            return state_locations[0]
        
        # If nothing found via patterns, try simple keyword matching
        if found_locations:
            return found_locations[0]
        
        return "India"  # Default if no specific location found
    
    def geocode_location(self, location_name):
        """Geocode location using Nominatim with caching"""
        # Check cache first
        if location_name in self.geocode_cache:
            return self.geocode_cache[location_name]
        
        try:
            # Add "India" to the query to prioritize Indian locations
            query = f"{location_name}, India"
            location = self.geolocator.geocode(query)
            
            if location:
                coords = (location.latitude, location.longitude)
                self.geocode_cache[location_name] = coords
                print(f"  📍 Geocoded {location_name} -> {coords}")
                return coords
            else:
                print(f"  ⚠️ Could not geocode: {location_name}")
                return None
        except (GeocoderTimedOut, GeocoderServiceError) as e:
            print(f"  ⚠️ Geocoding error for {location_name}: {e}")
            return None
        except Exception as e:
            print(f"  ⚠️ Unexpected geocoding error for {location_name}: {e}")
            return None
    
    def get_coordinates(self, location):
        """Get coordinates using geocoding with fallback to hardcoded values"""
        # Hardcoded coordinates for common locations (fallback)
        coords_map = {
            # Mumbai and areas
            'Mumbai': (19.0760, 72.8777),
            'Andheri': (19.1136, 72.8697),
            'Bandra': (19.0596, 72.8295),
            'Borivali': (19.2403, 72.8565),
            'Colaba': (18.9067, 72.8147),
            # Major cities
            'Delhi': (28.7041, 77.1025),
            'Bangalore': (12.9716, 77.5946),
            'Bengaluru': (12.9716, 77.5946),
            'Chennai': (13.0827, 80.2707),
            'Kolkata': (22.5726, 88.3639),
            'Hyderabad': (17.3850, 78.4867),
            'Pune': (18.5204, 73.8567),
            'Ahmedabad': (23.0225, 72.5714),
            'Gurdaspur': (32.0405, 75.4056),
            'Amritsar': (31.6340, 74.8723),
            'Ludhiana': (30.9010, 75.8573),
            'Chandigarh': (30.7333, 76.7794),
            'Patiala': (30.3398, 76.3869),
            'Punjab': (31.1471, 75.3412),  # Punjab state center
            'Nagpur': (21.1458, 79.0882),
            'Noida': (28.5355, 77.3910),
            'Gurugram': (28.4595, 77.0266),
            'Gurgaon': (28.4595, 77.0266),
            'India': (20.5937, 78.9629)  # Center of India
        }
        
        # First, try to use geocoding
        if location and location != "India":
            geocoded = self.geocode_location(location)
            if geocoded:
                return geocoded
        
        # Fallback to hardcoded coordinates
        lat, lon = coords_map.get(location, coords_map['India'])
        return lat, lon
    
    def process_and_save_article(self, article):
        """Process article and save to MongoDB"""
        try:
            # Check if already exists
            if self.collection.find_one({"news_url": article['url']}):
                return False  # Already exists
            
            crime_type = self.classify_crime_type(article['title'])
            location = self.extract_location(article['title'])
            latitude, longitude = self.get_coordinates(location)
            severity = self.determine_severity(crime_type)
            
            # Create FIR number from hash
            fir_hash = hashlib.md5(article['url'].encode()).hexdigest()[:8].upper()
            fir_number = f"FIR/{datetime.now().year}/{fir_hash}"
            
            crime_record = {
                'fir_number': fir_number,
                'crime_type': crime_type,
                'title': article['title'],
                'description': article['title'],  # Use title as description for RSS
                'location': location,
                'latitude': latitude,
                'longitude': longitude,
                'incident_date': article.get('published', datetime.now().isoformat()),
                'source': article['source'],
                'news_url': article['url'],
                'image_url': None,  # Can be enhanced later
                'severity_level': severity,
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            
            # Insert into MongoDB
            self.collection.insert_one(crime_record)
            print(f"  ✅ Added: {article['title'][:60]}...")
            return True
            
        except pymongo.errors.DuplicateKeyError:
            return False  # Duplicate
        except Exception as e:
            print(f"  ❌ Error saving article: {e}")
            return False
    
    def run(self):
        """Main scraping process"""
        print("\n" + "="*80)
        print("🚨 AUTOMATED CRIME NEWS SCRAPER")
        print("="*80)
        print(f"⏰ Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Collect articles from all sources
        all_articles = []
        all_articles.extend(self.scrape_times_of_india_rss())
        all_articles.extend(self.scrape_hindustan_times_rss())
        
        print(f"\n📊 Total articles found: {len(all_articles)}")
        
        # Process and save
        new_count = 0
        for article in all_articles:
            if self.process_and_save_article(article):
                new_count += 1
        
        print("\n" + "="*80)
        print(f"✅ SCRAPING COMPLETE")
        print(f"   New articles added: {new_count}")
        print(f"   Total in database: {self.collection.count_documents({})}")
        print(f"   Finished at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("="*80 + "\n")
        
        self.client.close()
        return new_count


if __name__ == "__main__":
    scraper = AutoCrimeScraper()
    scraper.run()
