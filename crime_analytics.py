"""
Crime Analytics & ML Module
Handles: Hotspot detection, Pattern analysis, Risk scoring, Predictions
"""

import pymongo
import os
from datetime import datetime, timedelta
from collections import defaultdict
import math
from dotenv import load_dotenv

load_dotenv()


class CrimeAnalytics:
    def __init__(self):
        self.mongo_uri = os.getenv("MONGO_URI")
        self.client = pymongo.MongoClient(self.mongo_uri)
        self.db = self.client["fir_data"]
        self.collection = self.db["crime_news"]
    
    def get_hotspots(self, min_crimes=3, radius_km=2):
        """
        Identify crime hotspots using density-based clustering
        Returns areas with high crime concentration
        """
        crimes = list(self.collection.find({}, {
            'latitude': 1, 'longitude': 1, 'location': 1, 
            'crime_type': 1, 'severity_level': 1, '_id': 0
        }))
        
        if len(crimes) < min_crimes:
            return []
        
        # Group crimes by approximate location (grid-based clustering)
        hotspots = defaultdict(lambda: {
            'crimes': [],
            'count': 0,
            'critical_count': 0,
            'high_count': 0,
            'lat_sum': 0,
            'lon_sum': 0
        })
        
        for crime in crimes:
            # Round coordinates to create grid cells (~0.5km precision)
            lat_key = round(crime['latitude'] * 20) / 20  # ~2.5km grid
            lon_key = round(crime['longitude'] * 20) / 20
            key = f"{lat_key},{lon_key}"
            
            hotspots[key]['crimes'].append(crime)
            hotspots[key]['count'] += 1
            hotspots[key]['lat_sum'] += crime['latitude']
            hotspots[key]['lon_sum'] += crime['longitude']
            
            if crime.get('severity_level') == 'Critical':
                hotspots[key]['critical_count'] += 1
            elif crime.get('severity_level') == 'High':
                hotspots[key]['high_count'] += 1
        
        # Filter and calculate centers
        result = []
        for key, data in hotspots.items():
            if data['count'] >= min_crimes:
                avg_lat = data['lat_sum'] / data['count']
                avg_lon = data['lon_sum'] / data['count']
                
                # Get most common location name
                locations = [c.get('location', 'Unknown') for c in data['crimes']]
                location = max(set(locations), key=locations.count)
                
                # Calculate risk score
                risk_score = (
                    data['count'] * 10 +
                    data['critical_count'] * 30 +
                    data['high_count'] * 15
                )
                risk_score = min(risk_score, 100)  # Cap at 100
                
                result.append({
                    'location': location,
                    'latitude': avg_lat,
                    'longitude': avg_lon,
                    'crime_count': data['count'],
                    'critical_crimes': data['critical_count'],
                    'high_crimes': data['high_count'],
                    'risk_score': risk_score,
                    'radius_km': 1.5
                })
        
        # Sort by risk score
        result.sort(key=lambda x: x['risk_score'], reverse=True)
        return result[:10]  # Top 10 hotspots
    
    def get_time_patterns(self):
        """
        Analyze crime patterns by time (hour, day, month)
        """
        crimes = list(self.collection.find({}, {
            'incident_date': 1, 'crime_type': 1, 'created_at': 1, '_id': 0
        }))
        
        hourly = defaultdict(int)
        daily = defaultdict(int)
        crime_type_by_hour = defaultdict(lambda: defaultdict(int))
        
        for crime in crimes:
            try:
                # Try to parse incident_date or created_at
                date_str = crime.get('incident_date') or crime.get('created_at')
                if isinstance(date_str, str):
                    dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                elif isinstance(date_str, datetime):
                    dt = date_str
                else:
                    continue
                
                hour = dt.hour
                day = dt.strftime('%A')
                crime_type = crime.get('crime_type', 'other')
                
                hourly[hour] += 1
                daily[day] += 1
                crime_type_by_hour[hour][crime_type] += 1
                
            except Exception:
                continue
        
        # Find peak hours and days
        peak_hour = max(hourly.items(), key=lambda x: x[1]) if hourly else (0, 0)
        peak_day = max(daily.items(), key=lambda x: x[1]) if daily else ('Unknown', 0)
        
        # Format hourly data
        hourly_data = [
            {'hour': h, 'count': hourly.get(h, 0)}
            for h in range(24)
        ]
        
        # Format daily data
        day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        daily_data = [
            {'day': day, 'count': daily.get(day, 0)}
            for day in day_order
        ]
        
        return {
            'hourly': hourly_data,
            'daily': daily_data,
            'peak_hour': peak_hour[0],
            'peak_hour_count': peak_hour[1],
            'peak_day': peak_day[0],
            'peak_day_count': peak_day[1],
            'high_risk_hours': [h for h, c in hourly.items() if c > (peak_hour[1] * 0.6)]
        }
    
    def get_risk_score(self, latitude, longitude, radius_km=2):
        """
        Calculate real-time risk score for a specific location
        Based on: recent crimes, severity, distance, time
        """
        current_time = datetime.now()
        recent_cutoff = current_time - timedelta(days=7)  # Last 7 days
        
        # Find nearby crimes
        crimes = list(self.collection.find({
            'latitude': {'$exists': True},
            'longitude': {'$exists': True}
        }, {
            'latitude': 1, 'longitude': 1, 'severity_level': 1,
            'created_at': 1, 'crime_type': 1, '_id': 0
        }))
        
        nearby_crimes = []
        for crime in crimes:
            distance = self._haversine_distance(
                latitude, longitude,
                crime['latitude'], crime['longitude']
            )
            
            if distance <= radius_km:
                nearby_crimes.append({
                    'distance': distance,
                    'severity': crime.get('severity_level', 'Low'),
                    'created_at': crime.get('created_at'),
                    'type': crime.get('crime_type', 'other')
                })
        
        if not nearby_crimes:
            return {
                'risk_score': 0,
                'risk_level': 'Safe',
                'nearby_crimes': 0,
                'factors': []
            }
        
        # Calculate weighted risk score
        risk_score = 0
        recent_count = 0
        critical_count = 0
        
        for crime in nearby_crimes:
            # Distance weight (closer = higher risk)
            distance_weight = max(0, (radius_km - crime['distance']) / radius_km)
            
            # Severity weight
            severity_weights = {
                'Critical': 40,
                'High': 25,
                'Medium': 15,
                'Low': 5
            }
            severity_score = severity_weights.get(crime['severity'], 5)
            
            # Recency weight
            recency_weight = 1.0
            if crime.get('created_at'):
                try:
                    crime_date = crime['created_at'] if isinstance(crime['created_at'], datetime) else datetime.fromisoformat(str(crime['created_at']).replace('Z', '+00:00'))
                    days_ago = (current_time - crime_date).days
                    if days_ago <= 7:
                        recent_count += 1
                        recency_weight = 1.5
                    elif days_ago <= 30:
                        recency_weight = 1.2
                except:
                    pass
            
            if crime['severity'] == 'Critical':
                critical_count += 1
            
            crime_risk = severity_score * distance_weight * recency_weight
            risk_score += crime_risk
        
        # Normalize to 0-100
        risk_score = min(risk_score, 100)
        
        # Determine risk level
        if risk_score >= 70:
            risk_level = 'Critical'
        elif risk_score >= 50:
            risk_level = 'High'
        elif risk_score >= 30:
            risk_level = 'Medium'
        else:
            risk_level = 'Low'
        
        factors = []
        if recent_count > 0:
            factors.append(f"{recent_count} crime(s) in last 7 days")
        if critical_count > 0:
            factors.append(f"{critical_count} critical incident(s)")
        factors.append(f"{len(nearby_crimes)} total crimes within {radius_km}km")
        
        return {
            'risk_score': round(risk_score, 1),
            'risk_level': risk_level,
            'nearby_crimes': len(nearby_crimes),
            'recent_crimes': recent_count,
            'critical_crimes': critical_count,
            'factors': factors
        }
    
    def get_crime_trends(self, days=30):
        """
        Analyze crime trends over time
        """
        cutoff_date = datetime.now() - timedelta(days=days)
        
        crimes = list(self.collection.find({
            'created_at': {'$gte': cutoff_date}
        }, {
            'created_at': 1, 'crime_type': 1, 'severity_level': 1, '_id': 0
        }).sort('created_at', 1))
        
        daily_counts = defaultdict(int)
        type_trends = defaultdict(lambda: defaultdict(int))
        
        for crime in crimes:
            try:
                crime_date = crime.get('created_at')
                if isinstance(crime_date, datetime):
                    date_key = crime_date.strftime('%Y-%m-%d')
                    daily_counts[date_key] += 1
                    type_trends[date_key][crime.get('crime_type', 'other')] += 1
            except:
                continue
        
        # Calculate trend (increasing/decreasing)
        dates = sorted(daily_counts.keys())
        if len(dates) >= 2:
            first_half = sum(daily_counts[d] for d in dates[:len(dates)//2])
            second_half = sum(daily_counts[d] for d in dates[len(dates)//2:])
            trend = 'increasing' if second_half > first_half else 'decreasing'
            change_percent = ((second_half - first_half) / max(first_half, 1)) * 100
        else:
            trend = 'stable'
            change_percent = 0
        
        return {
            'daily_counts': [{'date': d, 'count': daily_counts[d]} for d in dates],
            'total_crimes': len(crimes),
            'trend': trend,
            'change_percent': round(change_percent, 1),
            'average_per_day': round(len(crimes) / max(days, 1), 1)
        }
    
    def get_patrol_suggestions(self, officer_count=5):
        """
        Suggest patrol route priorities based on risk scores
        """
        hotspots = self.get_hotspots(min_crimes=2)
        
        if not hotspots:
            return []
        
        # Distribute officers to top locations
        suggestions = []
        for i, hotspot in enumerate(hotspots[:officer_count]):
            suggestions.append({
                'priority': i + 1,
                'location': hotspot['location'],
                'latitude': hotspot['latitude'],
                'longitude': hotspot['longitude'],
                'risk_score': hotspot['risk_score'],
                'crime_count': hotspot['crime_count'],
                'reason': f"High-risk area with {hotspot['crime_count']} crimes, {hotspot['critical_crimes']} critical"
            })
        
        return suggestions
    
    def _haversine_distance(self, lat1, lon1, lat2, lon2):
        """Calculate distance between two coordinates in km"""
        R = 6371  # Earth radius in km
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_lat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) *
             math.sin(delta_lon / 2) ** 2)
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def close(self):
        """Close MongoDB connection"""
        self.client.close()
