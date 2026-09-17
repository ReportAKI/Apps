import express from 'express';


const router = express.Router();

const SDIG_API_BASE = 'https://sdigmap.tee.gov.gr/sdmquery/public/';

router.post('/', async (req, res) => {
  const { query, type } = req.body;

  if (!query || !type) {
    return res.status(400).json({ error: 'query and type parameters are required' });
  }

  if (!['address', 'kaek'].includes(type)) {
    return res.status(400).json({ error: 'type must be either "address" or "kaek"' });
  }

  console.log(`Searching ΣΔΙΓ API with query: ${query}, type: ${type}`);

  const response = await fetch(`${SDIG_API_BASE}?query=${encodeURIComponent(query)}&type=${type}`);

  if (!response.ok) {
    throw new Error(`ΣΔΙΓ API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  const results = Array.isArray(data) ? data : data.results || [];

  const parsedResults = results.map((item) => ({
    id: item.id || item.objectId,
    address: item.address || item.addressText || '',
    kaek: item.kaek || item.kaekCode || '',
    coordinates: item.coordinates || item.geometry || null,
    basicInfo: {
      buildingType: item.buildingType || null,
      area: item.area || null,
      yearBuilt: item.yearBuilt || null,
    },
  }));

  res.json(parsedResults);
});

export default router;
