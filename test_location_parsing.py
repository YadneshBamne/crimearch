"""Test the improved location parsing"""
import re

def extract_location(text):
    """Extract location from text using regex patterns and prioritize specific over general"""
    # Common location patterns in Indian news headlines
    patterns = [
        r"in\s+([A-Z][a-zA-Z\s]+?)(?:'s|,|\.|near|of)",  # "in Punjab's Gurdaspur" -> Punjab
        r"in\s+([A-Z][a-zA-Z\s]+?)(?:\s+district)",      # "in Gurdaspur district" -> Gurdaspur
        r"near\s+([A-Z][a-zA-Z\s]+?)(?:'s|,|\.|in)",     # "near Indo-Pak border in Punjab" -> Punjab
        r"([A-Z][a-zA-Z\s]+?)(?:'s)\s+([A-Z][a-zA-Z]+)", # "Punjab's Gurdaspur" -> both Punjab and Gurdaspur
        r"in\s+([A-Z][a-zA-Z\s]+?)(?:\s|,|$)",           # "in Mumbai" -> Mumbai
        r"at\s+([A-Z][a-zA-Z\s]+?)(?:\s|,|$)",           # "at Bandra" -> Bandra
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


# Test with the example headline
test_headlines = [
    "Two policemen shoot dead each other after heated argument in near Indo-Pak border in Punjab's Gurdaspur",
    "Murder case registered in Mumbai after body found",
    "Robbery at Delhi's Connaught Place",
    "Woman assaulted in Bangalore",
    "Theft reported in Hyderabad's Banjara Hills"
]

print("Testing Location Extraction:")
print("=" * 80)
for headline in test_headlines:
    location = extract_location(headline)
    print(f"\nHeadline: {headline}")
    print(f"Extracted Location: {location}")
print("\n" + "=" * 80)
