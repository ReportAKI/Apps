import express from 'express';


const router = express.Router();

const NOMINATIM_API_BASE = 'https://nominatim.openstreetmap.org/reverse';
const GOOGLE_GEOCODE_BASE = 'https://maps.googleapis.com/maps/api/geocode/json';
const ARCGIS_REVERSE_BASE = 'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

router.get('/reverse-geocode', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'lat and lon query parameters are required' });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'lat and lon must be valid numbers' });
  }

  console.log(`Reverse geocoding coordinates: lat=${latitude}, lon=${longitude}`);

  try {
    const arcgisResult = await reverseGeocodeWithArcGIS(latitude, longitude);
    if (arcgisResult) {
      return res.json(arcgisResult);
    }
  } catch (err) {
    console.error('ArcGIS reverse geocode failed, falling back:', err.message);
  }

  if (GOOGLE_MAPS_API_KEY) {
    try {
      const googleResult = await reverseGeocodeWithGoogle(latitude, longitude);
      if (googleResult) {
        return res.json(googleResult);
      }
    } catch (err) {
      console.error('Google reverse geocode failed, falling back to Nominatim:', err.message);
    }
  }

  const nominatimResult = await reverseGeocodeWithNominatim(latitude, longitude);
  res.json(nominatimResult);
});

async function reverseGeocodeWithArcGIS(latitude, longitude) {
  const params = new URLSearchParams({
    location: `${longitude},${latitude}`,
    f: 'json',
    langCode: 'el',
    featureTypes: 'StreetAddress,PointAddress,Locality,Subregion',
  });

  const response = await fetch(`${ARCGIS_REVERSE_BASE}?${params.toString()}`, {
    headers: { 'User-Agent': 'ReportAKI/1.0 (property lookup service)' },
  });

  if (!response.ok) {
    throw new Error(`ArcGIS Geocoder error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    console.warn(`ArcGIS Geocoder: ${data.error.message}`);
    return null;
  }

  const addr = data.address || {};
  const matchAddr = addr.Match_addr || '';
  const addNum = addr.AddNum || '';
  const streetAddr = addr.Address || '';

  let road = streetAddr;
  if (addNum && road) {
    const stripped = road.replace(new RegExp(`\\s*${addNum.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`), '').trim();
    if (stripped) road = stripped;
  }

  const houseNumber = addNum;
  const postalCode = normalizePostalCode(addr.Postal || addr.PostCode || '');
  const suburb = addr.Neighborhood || '';
  const city = addr.City || addr.Subregion || '';
  const municipality = addr.Subregion || addr.City || '';
  const county = addr.Region || '';
  const region = addr.Region || '';

  const displayName = matchAddr.replace(/,\s*\d{3}\s*\d{2}/g, '').replace(/,\s*\d{5}/g, '').trim();

  if (!road && !city && !suburb) {
    return null;
  }

  return buildAddressResponse({
    road,
    houseNumber,
    suburb,
    city,
    municipality,
    county,
    region,
    postalCode,
    displayName,
  });
}

async function reverseGeocodeWithGoogle(latitude, longitude) {
  const params = new URLSearchParams({
    latlng: `${latitude},${longitude}`,
    language: 'el',
    key: GOOGLE_MAPS_API_KEY,
  });

  const response = await fetch(`${GOOGLE_GEOCODE_BASE}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Google Geocoding API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' || !data.results || data.results.length === 0) {
    console.error(`Google Geocoding status: ${data.status} ${data.error_message || ''}`);
    return null;
  }

  const result = data.results[0];
  const comps = {};
  for (const c of result.address_components || []) {
    for (const t of c.types || []) {
      if (!(t in comps)) comps[t] = c.long_name;
    }
  }

  const road = comps.route || '';
  const houseNumber = comps.street_number || '';
  const postalCode = normalizePostalCode(comps.postal_code || '');
  const suburb = comps.sublocality || comps.neighborhood || '';
  const city = comps.locality || comps.administrative_area_level_3 || comps.administrative_area_level_2 || '';
  const municipality = comps.administrative_area_level_2 || '';
  const county = comps.administrative_area_level_1 || '';
  const region = comps.administrative_area_level_1 || '';

  return buildAddressResponse({
    road,
    houseNumber,
    suburb,
    city,
    municipality,
    county,
    region,
    postalCode,
    displayName: result.formatted_address || '',
  });
}

async function reverseGeocodeWithNominatim(latitude, longitude) {
  const params = new URLSearchParams({
    format: 'json',
    lat: latitude.toString(),
    lon: longitude.toString(),
    zoom: '18',
    addressdetails: '1',
  });

  const response = await fetch(`${NOMINATIM_API_BASE}?${params.toString()}`, {
    headers: {
      'User-Agent': 'ReportAKI/1.0 (property lookup service)',
      'Accept-Language': 'el,en;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Nominatim API error: ${data.error}`);
  }

  const addressObj = data.address || {};
  const road = addressObj.road || '';
  const houseNumber = addressObj.house_number || '';
  const suburb = addressObj.suburb || addressObj.neighbourhood || '';
  const city = addressObj.city || addressObj.town || addressObj.village || addressObj.municipality || '';
  const municipality = addressObj.municipality || '';
  const county = addressObj.county || addressObj.state || '';
  const region = addressObj.state || addressObj.region || '';
  const postalCode = normalizePostalCode(addressObj.postcode || '');

  return buildAddressResponse({
    road,
    houseNumber,
    suburb,
    city,
    municipality,
    county,
    region,
    postalCode,
    displayName: data.display_name || '',
  });
}

function normalizePostalCode(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 5) return '';
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}

function buildAddressResponse({ road, houseNumber, suburb, city, municipality, county, region, postalCode, displayName }) {
  const streetLine = [road ? `Οδός ${road}` : '', houseNumber].filter(Boolean).join(' ');
  const localityParts = [suburb, city].filter((v, i, arr) => v && arr.indexOf(v) === i);
  const localityLine = localityParts.join(', ');
  const postalPart = postalCode ? `ΤΚ ${postalCode}` : '';
  const formattedAddress = [streetLine, localityLine, postalPart].filter(Boolean).join(', ') || displayName || '';

  const area = suburb || city || municipality || '';
  const fullAddressParts = [
    road ? `Οδός ${road}` : '',
    houseNumber ? `Αριθμός ${houseNumber}` : '',
    area,
    postalPart,
  ].filter(Boolean);
  const fullAddress = fullAddressParts.length > 0 ? fullAddressParts.join(', ') : (displayName || '');

  const streetAndNumber = [
    road || '',
    houseNumber ? houseNumber : (road ? 'Πλησιέστερος αριθμός' : ''),
  ].filter(Boolean).join(' ');

  const otaMunicipality = municipality || city || suburb || '';
  const regionalUnit = county || region || '';

  return {
    address: formattedAddress,
    fullAddress,
    road,
    houseNumber,
    postalCode,
    city: city || suburb,
    area,
    municipality,
    county,
    region,
    structuredAddress: {
      streetAndNumber: streetAndNumber || 'Μη διαθέσιμο',
      postalCode: postalCode || 'Μη διαθέσιμο',
      municipality: otaMunicipality || 'Μη διαθέσιμο',
      regionalUnit: regionalUnit || 'Μη διαθέσιμο',
    },
  };
}

export default router;
