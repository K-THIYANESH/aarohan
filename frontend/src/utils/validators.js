export const validateGPS = (gpsStr) => {
  if (!gpsStr) return 'GPS coordinates are required';
  const parts = gpsStr.split(',');
  if (parts.length !== 2) return 'Format must be "lat, long" (e.g. 11.4916, 76.0522)';
  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());
  if (isNaN(lat) || lat < 6.0 || lat > 37.0) return 'Latitude must be between 6.0°N and 37.0°N (India)';
  if (isNaN(lng) || lng < 68.0 || lng > 97.0) return 'Longitude must be between 68.0°E and 97.0°E (India)';
  return null;
};

export const validatePhone = (phoneStr) => {
  if (!phoneStr) return null;
  const clean = phoneStr.replace(/\D/g, '');
  if (clean.length < 10) return 'Enter a valid 10-digit Indian phone number';
  return null;
};
