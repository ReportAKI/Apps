import express from 'express';


const router = express.Router();

const SDIG_API_BASE = 'https://sdigmap.tee.gov.gr/sdmquery/public/';

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Property ID is required' });
  }

  console.log(`Fetching property details for ID: ${id}`);

  const response = await fetch(`${SDIG_API_BASE}${id}`);

  if (!response.ok) {
    throw new Error(`ΣΔΙΓ API error: ${response.status} ${response.statusText}`);
  }

  const propertyData = await response.json();

  const enrichedProperty = {
    kaek: propertyData.kaek || propertyData.kaekCode || '',
    address: propertyData.address || propertyData.addressText || '',
    area: propertyData.area || propertyData.buildingArea || null,
    landUse: propertyData.landUse || propertyData.usage || null,
    description: propertyData.description || propertyData.remarks || null,
    coordinates: propertyData.coordinates || propertyData.geometry || null,
    history: propertyData.history || propertyData.historicalData || null,
  };

  res.json(enrichedProperty);
});

export default router;
