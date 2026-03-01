import pymongo
import os
from dotenv import load_dotenv

load_dotenv()
client = pymongo.MongoClient(os.getenv('MONGO_URI'))
db = client['fir_data']

count = db.crime_news.count_documents({})
print(f'\n✅ Total records in crime_news collection: {count}')

if count > 0:
    sample = db.crime_news.find_one()
    print(f'\n📄 Sample Record:')
    print(f'   Title: {sample.get("title", "N/A")[:60]}...')
    print(f'   Crime Type: {sample.get("crime_type")}')
    print(f'   Location: {sample.get("location")}')
    print(f'   Latitude: {sample.get("latitude")}')
    print(f'   Longitude: {sample.get("longitude")}')
    print(f'   Has Image: {"✓ Yes" if sample.get("image_url") else "✗ No"}')
    if sample.get("image_url"):
        print(f'   Image URL: {sample.get("image_url")[:60]}...')
    
    # Check how many have images
    with_images = db.crime_news.count_documents({'image_url': {'$exists': True, '$ne': None}})
    print(f'\n📊 Records with images: {with_images}/{count} ({with_images*100//count}%)')
    
    # Crime type breakdown
    pipeline = [
        {"$group": {"_id": "$crime_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    stats = list(db.crime_news.aggregate(pipeline))
    print(f'\n📈 Crime Type Breakdown:')
    for stat in stats:
        print(f'   {stat["_id"]}: {stat["count"]}')

client.close()
