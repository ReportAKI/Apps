import express from 'express';
import pb from '../utils/pocketbaseClient.js';


const router = express.Router();

const KTIMATILOGIU_API_BASE = 'https://ktimatilogiu.gov.gr/api/property';

router.get('/:kaek', async (req, res) => {
  const { kaek } = req.params;

  if (!kaek) {
    return res.status(400).json({ error: 'KAEK parameter is required' });
  }

  console.log(`Fetching property data for KAEK: ${kaek}`);

  let cachedRecord = null;
  try {
    const records = await pb.collection('ktimatilogiu_cache').getFullList({
      filter: `kaek = "${kaek}"`,
    });
    if (records && records.length > 0) {
      cachedRecord = records[0];
      console.log(`Found cached data for KAEK: ${kaek}`);
    }
  } catch (error) {
    console.warn(`Cache lookup failed for KAEK ${kaek}: ${error.message}`);
  }

  if (cachedRecord) {
    const allData = cachedRecord.allData ? JSON.parse(cachedRecord.allData) : cachedRecord;
    const transformedData = {
      kaek: allData.kaek || kaek,
      address: allData.address || allData.addressText || null,
      area: allData.area || allData.buildingArea || null,
      landUse: allData.landUse || allData.usage || null,
      description: allData.description || allData.remarks || null,
      coordinates: allData.coordinates || allData.geometry || null,
      history: allData.history || allData.historicalData || null,
    };
    return res.json({
      success: true,
      cached: true,
      data: transformedData,
    });
  }

  const response = await fetch(`${KTIMATILOGIU_API_BASE}/${kaek}`);

  if (!response.ok) {
    throw new Error(`ΚΤΗΜΑΤΟΛΟΓΙΟΥ API error: ${response.status} ${response.statusText}`);
  }

  const propertyData = await response.json();

  const transformedData = {
    kaek: propertyData.kaek || kaek,
    address: propertyData.address || propertyData.addressText || null,
    area: propertyData.area || propertyData.buildingArea || null,
    landUse: propertyData.landUse || propertyData.usage || null,
    description: propertyData.description || propertyData.remarks || null,
    coordinates: propertyData.coordinates || propertyData.geometry || null,
    history: propertyData.history || propertyData.historicalData || null,
  };

  try {
    await pb.collection('ktimatilogiu_cache').create({
      kaek,
      allData: JSON.stringify(propertyData),
      address: transformedData.address,
      area: transformedData.area,
      landUse: transformedData.landUse,
      description: transformedData.description,
      coordinates: transformedData.coordinates ? JSON.stringify(transformedData.coordinates) : null,
      history: transformedData.history ? JSON.stringify(transformedData.history) : null,
    });
    console.log(`Cached property data for KAEK: ${kaek}`);
  } catch (error) {
    console.warn(`Failed to cache property data for KAEK ${kaek}: ${error.message}`);
  }

  res.json({
    success: true,
    cached: false,
    data: transformedData,
  });
});

export default router;
