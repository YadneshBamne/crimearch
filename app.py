
import pymongo
import random
from datetime import datetime, timedelta
import os
import urllib.parse
from dotenv import load_dotenv
load_dotenv()
# YOUR ATLAS CONNECTION
MONGODB_URI = os.getenv("MONGO_URI")

# URL encode password (Atlas requirement)
MONGODB_URI = MONGODB_URI.replace("eulig1lt1yXKqN9n", urllib.parse.quote_plus("eulig1lt1yXKqN9n"))

# Mumbai Police Stations + GPS Coordinates
MUMBAI_PS = {
    "Andheri": [19.1183, 72.8355],
    "Bandra": [19.0612, 72.8392],
    "Borivali": [19.2333, 72.8567],
    "Chembur": [19.0511, 72.9087],
    "Dahisar": [19.2524, 72.8446],
    "Ghatkopar": [19.0815, 72.9087],
    "Jogeshwari": [19.1447, 72.8446],
    "Kandivali": [19.2083, 72.8333],
    "Malwani": [19.2333, 72.8000],
    "Mulund": [19.1750, 72.9583],
    "Oshiwara": [19.1333, 72.8250],
    "Powai": [19.1244, 72.9064],
    "Vakola": [19.0850, 72.8250]
}

CRIME_TYPES = {
    "Theft": 0.40,
    "Chain Snatching": 0.15,
    "Burglary": 0.12,
    "Assault": 0.10,
    "Fraud": 0.08,
    "Cybercrime": 0.08,
    "Rape": 0.03,
    "Murder": 0.02,
    "Robbery": 0.02
}

IPC_SECTIONS = ["IPC 379", "IPC 420", "IPC 323", "IPC 406", "IPC 354", "IPC 302", "IPC 392"]

def weighted_random_choice(choices):
    items = list(choices.keys())
    probabilities = list(choices.values())
    return random.choices(items, weights=probabilities, k=1)[0]

print("🔗 Connecting to MongoDB Atlas...")
client = pymongo.MongoClient(MONGODB_URI)
collection = client["fir_data"]["firs"]  # Uses 'fir_data' database

# Test connection
try:
    client.admin.command('ping')
    print("✅ Connected to MongoDB Atlas!")
except Exception as e:
    print(f"❌ Atlas connection failed: {e}")
    print("💡 Check Network Access (0.0.0.0/0) in Atlas dashboard")
    exit(1)

def generate_realistic_fir():
    ps_name, (base_lat, base_lng) = random.choice(list(MUMBAI_PS.items()))

    # GPS jitter
    lat = base_lat + random.uniform(-0.002, 0.002)
    lng = base_lng + random.uniform(-0.003, 0.003)

    days_back = random.randint(0, 30)
    incident_dt = datetime.now() - timedelta(days=days_back)

    crime_type = weighted_random_choice(CRIME_TYPES)

    crime_category_map = {
        "Theft": "Property",
        "Chain Snatching": "Property",
        "Burglary": "Property",
        "Robbery": "Violent",
        "Assault": "Violent",
        "Rape": "Violent",
        "Murder": "Violent",
        "Fraud": "Financial",
        "Cybercrime": "Cyber"
    }

    severity_map = {
        "Theft": "Low",
        "Chain Snatching": "Medium",
        "Burglary": "Medium",
        "Fraud": "Medium",
        "Cybercrime": "Medium",
        "Assault": "High",
        "Robbery": "High",
        "Rape": "Critical",
        "Murder": "Critical"
    }

    fir_delay = random.randint(1, 48)
    response_time = random.randint(5, 60)

    return {
        # Core FIR
        "fir_number": f"{random.randint(100,999)}/2026",
        "crime_type": crime_type,
        "crime_category": crime_category_map[crime_type],
        "severity_level": severity_map[crime_type],
        "sections": random.sample(IPC_SECTIONS, random.randint(1, 3)),
        "description": f"{crime_type} reported in {ps_name} jurisdiction",
        "status": random.choice(["Under Investigation", "Chargesheet Filed", "Closed"]),

        # Location
        "state": "Maharashtra",
        "district": "Mumbai Suburban",
        "police_station": ps_name,
        "area_type": "Urban",
        "latitude": round(lat, 6),
        "longitude": round(lng, 6),

        # Time intelligence
        "incident_date": incident_dt.strftime("%Y-%m-%d"),
        "incident_time": incident_dt.strftime("%H:%M"),
        "day_of_week": incident_dt.strftime("%A"),
        "month": incident_dt.month,
        "year": incident_dt.year,
        "is_festival_day": random.choice([True, False]),

        # People (anonymized)
        "victim_age_group": random.choice(["Child", "Adult", "Senior"]),
        "victim_gender": random.choice(["Male", "Female"]),
        "accused_count": random.randint(1, 4),
        "repeat_offender_flag": random.choice([True, False]),

        # Police response
        "fir_delay_hours": fir_delay,
        "response_time_minutes": response_time,
        "arrest_made": random.choice([True, False]),

        # ML-ready fields
        "crime_risk_score": round(random.uniform(0.3, 0.95), 2),
        "hotspot_label": random.randint(1, 6),
        "next_30_day_risk": random.choice(["Low", "Medium", "High"]),

        # Metadata
        "processed_at": datetime.now().isoformat(),
        "source": "synthetic_maharashtra_police_2026"
    }


# Generate & Insert 500 FIRs
print("\n🚀 Generating 500 realistic Mumbai FIRs...")
firs = [generate_realistic_fir() for _ in range(500)]

# Clear old data
collection.delete_many({})
print("🗑️ Cleared old data")

# Insert new data
result = collection.insert_many(firs)
print(f"✅ Inserted {len(result.inserted_ids)} FIRs into Atlas!")

# Show stats
crime_stats = list(collection.aggregate([
    {"$group": {"_id": "$crime_type", "count": {"$sum": 1}}},
    {"$sort": {"count": -1}}
]))

print("\n📊 Crime Distribution (Last 30 Days):")
for stat in crime_stats:
    print(f"  🔴 {stat['_id']}: {stat['count']} cases ({stat['count']/5:.0f}/day)")

print(f"\n🎉 SUCCESS! Your Atlas cluster is ready:")
print(f"   Database: fir_data")
print(f"   Collection: firs")
print(f"   Records: {collection.count_documents({})}")
print("\n🔥 Next: Start API server → Connect Next.js heatmap!")
