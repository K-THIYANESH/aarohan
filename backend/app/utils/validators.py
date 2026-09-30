import re

def validate_gps_coordinates(coords: str) -> bool:
    """Validates lat,long strings for India boundaries (6.0 - 37.0 N, 68.0 - 97.0 E)"""
    if not coords or ',' not in coords:
        return False
    try:
        parts = coords.split(',')
        lat = float(parts[0].strip())
        lon = float(parts[1].strip())
        if 6.0 <= lat <= 37.0 and 68.0 <= lon <= 97.0:
            return True
        return False
    except ValueError:
        return False

def validate_phone_number(phone: str) -> bool:
    """Basic phone validation"""
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)
    return len(cleaned) >= 10 and cleaned.isdigit()
