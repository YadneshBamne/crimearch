"""
Optimized Crime News Scraper for Mumbai
Uses BeautifulSoup + Selenium + RSS to fetch 100+ crime entries
"""

import json
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from webdriver_manager.chrome import ChromeDriverManager
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
from fuzzywuzzy import fuzz
import feedparser
import re
import os
from dotenv import load_dotenv

load_dotenv()

class CrimeNewsScraper:
    def __init__(self):
        self.crime_types = {
            'murder': ['murder', 'killed', 'homicide', 'stabbed', 'shot dead', 'strangled', 'body found'],
            'theft': ['theft', 'stolen', 'burglary', 'robbery', 'loot', 'chain snatch', 'pickpocket', 'robbed'],
            'kidnapping': ['kidnap', 'abduct', 'missing person', 'ransom'],
            'rape': ['rape', 'sexual assault', 'molestation', 'molest', 'sexual harassment'],
            'extortion': ['extortion', 'blackmail', 'threatened for money', 'hafta', 'ransom demand']
        }
        
        self.mumbai_areas = [
            'Andheri', 'Bandra', 'Borivali', 'Churchgate', 'Colaba', 'Dadar', 'Goregaon', 
            'Juhu', 'Kandivali', 'Kurla', 'Malad', 'Mulund', 'Powai', 'Santacruz', 
            'Vile Parle', 'Worli', 'Mumbai', 'Ghatkopar', 'Vikhroli', 'Bhandup', 
            'Chembur', 'Dharavi', 'Mahim', 'Sion', 'Wadala', 'Parel', 'Lower Parel',
            'Marine Drive', 'Malabar Hill', 'Fort', 'Nariman Point', 'Thane', 'Navi Mumbai',
            'Vasai', 'Mira Road', 'Bhayander', 'Versova', 'Jogeshwari', 'Sakinaka'
        ]
        
        self.headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        self.geolocator = Nominatim(user_agent="crimepulse_v2")
        self.location_cache = {}
        
        # Setup Selenium
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
        
        print("🔧 Setting up Chrome driver...")
        self.driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()),
            options=chrome_options
        )
        
        self.news_data = []
        self.seen_titles = set()
    
    def __del__(self):
        """Close Selenium driver"""
        try:
            self.driver.quit()
        except:
            pass
    
    def classify_crime_type(self, text):
        """Classify crime type from text"""
        text_lower = text.lower()
        for crime_type, keywords in self.crime_types.items():
            for keyword in keywords:
                if keyword in text_lower:
                    return crime_type
        return None
    
    def extract_location(self, text):
        """Extract Mumbai location from text"""
        text_lower = text.lower()
        found = [area for area in self.mumbai_areas if area.lower() in text_lower]
        return max(found, key=len) if found else "Mumbai"
    
    def geocode_location(self, location_name):
        """Get lat/lon coordinates"""
        if location_name in self.location_cache:
            return self.location_cache[location_name]
        
        try:
            time.sleep(1)
            full_location = f"{location_name}, Mumbai, Maharashtra, India"
            location = self.geolocator.geocode(full_location, timeout=10)
            
            if location:
                coords = {'latitude': location.latitude, 'longitude': location.longitude}
                self.location_cache[location_name] = coords
                return coords
        except:
            pass
        
        # Default Mumbai coords
        default = {'latitude': 19.0760, 'longitude': 72.8777}
        self.location_cache[location_name] = default
        return default
    
    def is_duplicate(self, title):
        """Check if article is duplicate"""
        title_normalized = re.sub(r'\W+', '', title.lower())
        if title_normalized in self.seen_titles:
            return True
        
        # Fuzzy check
        for seen in self.seen_titles:
            if fuzz.ratio(title_normalized, seen) > 85:
                return True
        
        self.seen_titles.add(title_normalized)
        return False
    
    def scrape_rss_feed(self, feed_url, source_name, max_articles=50):
        """Scrape RSS feed"""
        print(f"\n📡 Scraping RSS: {source_name}...")
        count = 0
        
        try:
            feed = feedparser.parse(feed_url)
            
            for entry in feed.entries[:max_articles]:
                try:
                    title = entry.get('title', '')
                    if not title or self.is_duplicate(title):
                        continue
                    
                    description = entry.get('description', '') or entry.get('summary', '')
                    link = entry.get('link', '')
                    published = entry.get('published', datetime.now().strftime('%Y-%m-%d'))
                    
                    # Clean HTML from description
                    if description:
                        description = BeautifulSoup(description, 'html.parser').get_text(strip=True)
                    
                    full_text = f"{title} {description}"
                    crime_type = self.classify_crime_type(full_text)
                    
                    if crime_type:
                        location = self.extract_location(full_text)
                        coords = self.geocode_location(location)
                        
                        self.news_data.append({
                            'source': source_name,
                            'title': title,
                            'description': description,
                            'link': link,
                            'published_date': published,
                            'scraped_date': datetime.now().isoformat(),
                            'location': location,
                            'latitude': coords['latitude'],
                            'longitude': coords['longitude'],
                            'crime_type': crime_type
                        })
                        count += 1
                        print(f"  ✓ [{crime_type.upper()}] {title[:60]}...")
                        
                except Exception as e:
                    continue
            
            print(f"  Found {count} crime articles from {source_name}")
            return count
            
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            return 0
    
    def scrape_with_selenium(self, url, source_name, max_articles=30):
        """Scrape using Selenium for JavaScript-heavy sites"""
        print(f"\n🌐 Scraping {source_name} (Selenium)...")
        count = 0
        
        try:
            self.driver.get(url)
            time.sleep(3)
            
            # Scroll to load more content
            for _ in range(3):
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(2)
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            
            # Try multiple selectors
            articles = (soup.find_all('article')[:max_articles] or 
                       soup.find_all('div', class_=re.compile('article|story|news-item'))[:max_articles] or
                       soup.find_all('div', class_=re.compile('card'))[:max_articles])
            
            for article in articles:
                try:
                    title_elem = article.find(['h1', 'h2', 'h3', 'h4', 'h5'])
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    if self.is_duplicate(title):
                        continue
                    
                    link_elem = title_elem.find('a') or article.find('a')
                    link = link_elem.get('href', '') if link_elem else ''
                    if link and not link.startswith('http'):
                        from urllib.parse import urljoin
                        link = urljoin(url, link)
                    
                    desc_elem = article.find('p') or article.find('div', class_=re.compile('desc|summary'))
                    description = desc_elem.get_text(strip=True) if desc_elem else ""
                    
                    full_text = f"{title} {description}"
                    crime_type = self.classify_crime_type(full_text)
                    
                    if crime_type:
                        location = self.extract_location(full_text)
                        coords = self.geocode_location(location)
                        
                        self.news_data.append({
                            'source': source_name,
                            'title': title,
                            'description': description,
                            'link': link,
                            'published_date': datetime.now().strftime('%Y-%m-%d'),
                            'scraped_date': datetime.now().isoformat(),
                            'location': location,
                            'latitude': coords['latitude'],
                            'longitude': coords['longitude'],
                            'crime_type': crime_type
                        })
                        count += 1
                        print(f"  ✓ [{crime_type.upper()}] {title[:60]}...")
                        
                except Exception:
                    continue
            
            print(f"  Found {count} crime articles from {source_name}")
            return count
            
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            return 0
    
    def scrape_with_beautifulsoup(self, url, source_name, max_articles=30):
        """Scrape using BeautifulSoup for static sites"""
        print(f"\n📰 Scraping {source_name} (BeautifulSoup)...")
        count = 0
        
        try:
            response = requests.get(url, headers=self.headers, timeout=15)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            articles = (soup.find_all('article')[:max_articles] or 
                       soup.find_all('div', class_=re.compile('story|news|item'))[:max_articles] or
                       soup.select('.brief_box, .news-item, .story-card')[:max_articles])
            
            for article in articles:
                try:
                    title_elem = article.find(['h1', 'h2', 'h3', 'h4', 'a'])
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    if self.is_duplicate(title):
                        continue
                    
                    link_elem = article.find('a')
                    link = link_elem.get('href', '') if link_elem else ''
                    if link and not link.startswith('http'):
                        from urllib.parse import urljoin
                        link = urljoin(url, link)
                    
                    desc_elem = article.find('p')
                    description = desc_elem.get_text(strip=True) if desc_elem else ""
                    
                    full_text = f"{title} {description}"
                    crime_type = self.classify_crime_type(full_text)
                    
                    if crime_type:
                        location = self.extract_location(full_text)
                        coords = self.geocode_location(location)
                        
                        self.news_data.append({
                            'source': source_name,
                            'title': title,
                            'description': description,
                            'link': link,
                            'published_date': datetime.now().strftime('%Y-%m-%d'),
                            'scraped_date': datetime.now().isoformat(),
                            'location': location,
                            'latitude': coords['latitude'],
                            'longitude': coords['longitude'],
                            'crime_type': crime_type
                        })
                        count += 1
                        print(f"  ✓ [{crime_type.upper()}] {title[:60]}...")
                        
                except Exception:
                    continue
            
            print(f"  Found {count} crime articles from {source_name}")
            return count
            
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            return 0
    
    def scrape_google_news_search(self, query, max_results=20):
        """Scrape Google News search results"""
        print(f"\n🔍 Searching Google News: '{query}'...")
        count = 0
        
        try:
            search_url = f"https://www.google.com/search?q={query}+Mumbai+crime&tbm=nws&num=20"
            self.driver.get(search_url)
            time.sleep(2)
            
            soup = BeautifulSoup(self.driver.page_source, 'html.parser')
            articles = soup.find_all('div', class_='SoaBEf')[:max_results]
            
            for article in articles:
                try:
                    title_elem = article.find('div', role='heading')
                    if not title_elem:
                        continue
                    
                    title = title_elem.get_text(strip=True)
                    if self.is_duplicate(title):
                        continue
                    
                    crime_type = self.classify_crime_type(title)
                    if crime_type:
                        link_elem = article.find('a')
                        link = link_elem.get('href', '') if link_elem else ''
                        
                        location = self.extract_location(title)
                        coords = self.geocode_location(location)
                        
                        self.news_data.append({
                            'source': 'Google News',
                            'title': title,
                            'description': '',
                            'link': link,
                            'published_date': datetime.now().strftime('%Y-%m-%d'),
                            'scraped_date': datetime.now().isoformat(),
                            'location': location,
                            'latitude': coords['latitude'],
                            'longitude': coords['longitude'],
                            'crime_type': crime_type
                        })
                        count += 1
                        print(f"  ✓ [{crime_type.upper()}] {title[:60]}...")
                        
                except Exception:
                    continue
            
            print(f"  Found {count} crime articles from Google News")
            return count
            
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            return 0
    
    def save_to_json(self, filename='crime_news_data.json'):
        """Save data to JSON"""
        crime_stats = {}
        for article in self.news_data:
            ct = article['crime_type']
            crime_stats[ct] = crime_stats.get(ct, 0) + 1
        
        output = {
            'metadata': {
                'scrape_date': datetime.now().isoformat(),
                'total_articles': len(self.news_data),
                'crime_breakdown': crime_stats,
                'sources': list(set(a['source'] for a in self.news_data))
            },
            'articles': self.news_data
        }
        
        filepath = os.path.join(os.path.dirname(__file__), filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Saved {len(self.news_data)} articles to: {filename}")
        print(f"\n📊 Crime Type Breakdown:")
        for crime_type, count in crime_stats.items():
            print(f"   {crime_type.upper()}: {count}")
        
        return filepath
    
    def run(self):
        """Main scraping process"""
        print("=" * 80)
        print("🚨 OPTIMIZED CRIME NEWS SCRAPER - Target: 100+ Articles")
        print("=" * 80)
        
        start_time = time.time()
        
        # 1. RSS FEEDS (Most reliable)
        print("\n📡 Phase 1: RSS Feeds (Comprehensive)")
        
        # Main news RSS feeds
        main_rss_feeds = [
            # Mumbai/Maharashtra specific
            ('https://timesofindia.indiatimes.com/rssfeeds/-2128838593.cms', 'TOI Mumbai'),
            ('https://indianexpress.com/section/cities/mumbai/feed/', 'IE Mumbai'),
            ('https://www.thehindu.com/news/cities/mumbai/?service=rss', 'Hindu Mumbai'),
            ('https://www.thehindu.com/news/national/maharashtra/?service=rss', 'Hindu Maharashtra'),
            ('https://www.hindustantimes.com/feeds/rss/mumbai/rssfeed.xml', 'HT Mumbai'),
            
            # National feeds (contain Mumbai stories)
            ('https://feeds.feedburner.com/ndtvnews-india-news', 'NDTV India'),
            ('https://indianexpress.com/section/india/feed/', 'IE India'),
            ('https://www.thehindu.com/news/national/?service=rss', 'Hindu National'),
            ('https://timesofindia.indiatimes.com/rssfeeds/296589292.cms', 'TOI India'),
            ('https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', 'HT India'),
            
            # Crime-specific feeds
            ('https://www.news18.com/rss/india.xml', 'News18 India'),
            ('https://www.dnaindia.com/feeds/india.xml', 'DNA India'),
            ('https://www.businesstoday.in/rss/latest-news', 'Business Today'),
            
            # Google News RSS (crime searches)
            ('https://news.google.com/rss/search?q=Mumbai+murder&hl=en-IN&gl=IN&ceid=IN:en', 'Google News - Murder'),
            ('https://news.google.com/rss/search?q=Mumbai+theft+robbery&hl=en-IN&gl=IN&ceid=IN:en', 'Google News - Theft'),
            ('https://news.google.com/rss/search?q=Mumbai+kidnapping&hl=en-IN&gl=IN&ceid=IN:en', 'Google News - Kidnapping'),
            ('https://news.google.com/rss/search?q=Mumbai+rape+assault&hl=en-IN&gl=IN&ceid=IN:en', 'Google News - Rape'),
            ('https://news.google.com/rss/search?q=Mumbai+crime+police&hl=en-IN&gl=IN&ceid=IN:en', 'Google News - Crime'),
            ('https://news.google.com/rss/search?q=Mumbai+extortion&hl=en-IN&gl=IN&ceid=IN:en', 'Google News - Extortion'),
            ('https://news.google.com/rss/search?q=Maharashtra+murder&hl=en-IN&gl=IN&ceid=IN:en', 'Google News - MH Murder'),
            ('https://news.google.com/rss/search?q=Maharashtra+crime&hl=en-IN&gl=IN&ceid=IN:en', 'Google News - MH Crime'),
        ]
        
        for feed_url, source_name in main_rss_feeds:
            try:
                self.scrape_rss_feed(feed_url, source_name, max_articles=100)
                time.sleep(1)
                print(f"  📊 Total so far: {len(self.news_data)} articles")
                
                # Stop early if we have enough
                if len(self.news_data) >= 150:
                    print(f"  🎉 Reached 150 articles, moving to next phase...")
                    break
            except Exception as e:
                print(f"  ✗ Failed {source_name}: {str(e)[:100]}")
        
        # 2. BEAUTIFULSOUP SCRAPING with better selectors
        if len(self.news_data) < 100:
            print("\n📰 Phase 2: Web Scraping with BeautifulSoup")
            web_sources = [
                ('https://timesofindia.indiatimes.com/city/mumbai/crime', 'TOI Crime'),
                ('https://www.mid-day.com/mumbai/mumbai-crime-news', 'Mid-Day Crime'),
                ('https://www.hindustantimes.com/cities/mumbai-news', 'HT Mumbai'),
                ('https://www.freepressjournal.in/mumbai', 'FPJ Mumbai'),
            ]
            
            for url, name in web_sources:
                try:
                    self.scrape_with_beautifulsoup(url, name, max_articles=50)
                    time.sleep(2)
                    print(f"  Total so far: {len(self.news_data)} articles")
                except Exception as e:
                    print(f"  ✗ Failed {name}: {str(e)}")
        
        # 3. SELENIUM for dynamic content
        if len(self.news_data) < 100:
            print("\n🌐 Phase 3: Selenium Dynamic Scraping")
            selenium_sources = [
                ('https://www.news18.com/news/india/mumbai/', 'News18'),
                ('https://www.freepressjournal.in/mumbai', 'FPJ'),
                ('https://www.mid-day.com/mumbai/mumbai-crime-news', 'Mid-Day'),
            ]
            
            for url, name in selenium_sources:
                try:
                    self.scrape_with_selenium(url, name, max_articles=50)
                    time.sleep(2)
                    print(f"  Total so far: {len(self.news_data)} articles")
                except Exception as e:
                    print(f"  ✗ Failed {name}: {str(e)}")
        
        # 4. GOOGLE NEWS searches for each crime type
        if len(self.news_data) < 100:
            print("\n🔍 Phase 4: Google News Search (Comprehensive)")
            crime_queries = [
                'Mumbai murder case',
                'Mumbai theft robbery',
                'Mumbai kidnapping missing',
                'Mumbai rape sexual assault',
                'Mumbai extortion blackmail',
                'Mumbai crime police arrest',
                'Mumbai Bandra crime',
                'Mumbai Andheri crime',
                'Mumbai police case'
            ]
            
            for query in crime_queries:
                try:
                    self.scrape_google_news_search(query, max_results=30)
                    time.sleep(3)
                    print(f"  Total so far: {len(self.news_data)} articles")
                    if len(self.news_data) >= 150:
                        break
                except Exception as e:
                    print(f"  ✗ Failed search '{query}': {str(e)}")
        
        # Save results
        filepath = self.save_to_json()
        
        elapsed = time.time() - start_time
        print(f"\n✅ Scraping completed in {elapsed:.2f} seconds")
        print(f"📈 Total unique articles collected: {len(self.news_data)}")
        
        if len(self.news_data) >= 100:
            print("🎉 SUCCESS: Reached target of 100+ articles!")
        else:
            print(f"⚠️  Note: Collected {len(self.news_data)} articles (target was 100+)")
            print("   Tip: RSS feeds only have recent articles. For historical data,")
            print("   consider running this script multiple times over several days.")
        
        print("=" * 80)
        
        return filepath


def main():
    """Run the scraper"""
    scraper = CrimeNewsScraper()
    scraper.run()
    
    print("\n💡 Next Steps:")
    print("   1. Run: python import_news_to_db.py")
    print("   2. Check your Mapbox heatmap!")


if __name__ == "__main__":
    main()
