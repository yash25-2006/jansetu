export async function reverseGeocodeCoords(latitude, longitude) {
  if (!latitude || !longitude) {
    return {
      formattedAddress: 'Location details unavailable',
      district: 'Local District',
      state: 'Maharashtra',
      pincode: ''
    };
  }

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'IndiaDevIntelligenceMobile/1.0 (Native App)'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const addr = data.address || {};

    const locality = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || '';
    const district = addr.state_district || addr.county || addr.district || addr.city || 'Pune';
    const state = addr.state || 'Maharashtra';
    const postcode = addr.postcode || '';

    const parts = [locality, district, state, postcode].filter(Boolean);
    const formattedAddress = parts.length > 0 ? parts.join(', ') : (data.display_name || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);

    return {
      formattedAddress,
      locality,
      district,
      state,
      pincode: postcode,
      raw: data
    };
  } catch (err) {
    console.warn('[Reverse Geocoder] Fallback used:', err.message);
    return {
      formattedAddress: `Coordinates: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      district: 'Pune',
      state: 'Maharashtra',
      pincode: ''
    };
  }
}

export default reverseGeocodeCoords;
