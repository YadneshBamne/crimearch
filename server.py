from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import pymongo
import urllib.parse
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
from crime_analytics import CrimeAnalytics

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": ["https://crimepulse-virid.vercel.app", "http://localhost:5173", "http://localhost:5000"]}})

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

bcrypt = Bcrypt(app)
jwt = JWTManager(app)

# MongoDB connection
MONGODB_URI = os.getenv("MONGO_URI")
if not MONGODB_URI:
    raise ValueError("MONGO_URI not found in environment variables")

client = pymongo.MongoClient(MONGODB_URI)
db = client["fir_data"]
collection = db["firs"]
crime_news_collection = db["crime_news"]
users_collection = db["users"]

# Authentication Routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        name = data.get('name', '').strip()
        
        # Check if user already exists
        if users_collection.find_one({'email': email}):
            return jsonify({
                'success': False,
                'error': 'Email already registered'
            }), 409
        
        # Hash password
        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        
        # Create user document
        user = {
            'email': email,
            'password': hashed_password,
            'name': name,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Insert user
        result = users_collection.insert_one(user)
        
        # Create access token
        access_token = create_access_token(identity=email)
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'token': access_token,
            'user': {
                'email': email,
                'name': name
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        # Validate input
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        # Find user
        user = users_collection.find_one({'email': email})
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401
        
        # Check password
        if not bcrypt.check_password_hash(user['password'], password):
            return jsonify({
                'success': False,
                'error': 'Invalid email or password'
            }), 401
        
        # Create access token
        access_token = create_access_token(identity=email)
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'token': access_token,
            'user': {
                'email': user['email'],
                'name': user.get('name', '')
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user profile"""
    try:
        current_user_email = get_jwt_identity()
        user = users_collection.find_one(
            {'email': current_user_email},
            {'password': 0, '_id': 0}
        )
        
        if not user:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
        
        return jsonify({
            'success': True,
            'user': {
                'email': user['email'],
                'name': user.get('name', ''),
                'created_at': user.get('created_at')
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/crime-data', methods=['GET'])
def get_crime_data():
    try:
        # Fetch all crime news data with images and coordinates
        crimes = list(crime_news_collection.find({}, {
            'latitude': 1,
            'longitude': 1,
            'crime_type': 1,
            'severity_level': 1,
            'location': 1,
            'incident_date': 1,
            'fir_number': 1,
            'title': 1,
            'description': 1,
            'image_url': 1,
            'source': 1,
            'news_url': 1,
            '_id': 0
        }))
        
        return jsonify({
            'success': True,
            'data': crimes,
            'count': len(crimes)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        # Get crime statistics from crime_news collection
        stats = list(crime_news_collection.aggregate([
            {"$group": {"_id": "$crime_type", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        severity_stats = list(crime_news_collection.aggregate([
            {"$group": {"_id": "$severity_level", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]))
        
        return jsonify({
            'success': True,
            'crime_types': stats,
            'severity_levels': severity_stats,
            'total_records': crime_news_collection.count_documents({})
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/crime-data/new', methods=['GET'])
def get_new_crime_data():
    """Get only new crime data since a given timestamp"""
    try:
        # Get 'since' parameter (ISO format datetime string)
        since = request.args.get('since')
        
        query = {}
        if since:
            try:
                since_date = datetime.fromisoformat(since.replace('Z', '+00:00'))
                query = {'created_at': {'$gt': since_date}}
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date format. Use ISO format.'
                }), 400
        
        # Fetch new crimes
        new_crimes = list(crime_news_collection.find(query, {
            'latitude': 1,
            'longitude': 1,
            'crime_type': 1,
            'severity_level': 1,
            'location': 1,
            'incident_date': 1,
            'fir_number': 1,
            'title': 1,
            'description': 1,
            'image_url': 1,
            'source': 1,
            'news_url': 1,
            'created_at': 1,
            '_id': 0
        }).sort('created_at', -1))
        
        return jsonify({
            'success': True,
            'data': new_crimes,
            'count': len(new_crimes),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/hotspots', methods=['GET'])
def get_hotspots():
    """Get crime hotspots (high-risk areas)"""
    try:
        analytics = CrimeAnalytics()
        hotspots = analytics.get_hotspots()
        analytics.close()
        
        return jsonify({
            'success': True,
            'data': hotspots,
            'count': len(hotspots)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/patterns', methods=['GET'])
def get_patterns():
    """Get crime time patterns"""
    try:
        analytics = CrimeAnalytics()
        patterns = analytics.get_time_patterns()
        analytics.close()
        
        return jsonify({
            'success': True,
            'data': patterns
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/risk-score', methods=['GET'])
def get_risk_score():
    """Calculate risk score for a location"""
    try:
        lat = float(request.args.get('lat', 19.0760))
        lon = float(request.args.get('lon', 72.8777))
        radius = float(request.args.get('radius', 2))
        
        analytics = CrimeAnalytics()
        risk = analytics.get_risk_score(lat, lon, radius)
        analytics.close()
        
        return jsonify({
            'success': True,
            'data': risk
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/trends', methods=['GET'])
def get_trends():
    """Get crime trends over time"""
    try:
        days = int(request.args.get('days', 30))
        
        analytics = CrimeAnalytics()
        trends = analytics.get_crime_trends(days)
        analytics.close()
        
        return jsonify({
            'success': True,
            'data': trends
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/analytics/patrol-routes', methods=['GET'])
def get_patrol_routes():
    """Get suggested patrol routes for officers"""
    try:
        officer_count = int(request.args.get('officers', 5))
        
        analytics = CrimeAnalytics()
        routes = analytics.get_patrol_suggestions(officer_count)
        analytics.close()
        
        return jsonify({
            'success': True,
            'data': routes,
            'count': len(routes)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)))
