import express from 'express';
import pb from '../utils/pocketbaseClient.js';


const router = express.Router();

const SDIGMAP_API_BASE = 'https://sdigmap.tee.gov.gr/sdmquery/public/';
const CACHE_VALIDITY_HOURS = 24;

function isCacheValid(createdAt) {
  const createdTime = new Date(createdAt).getTime();
  const currentTime = new Date().getTime();
  const ageInHours = (currentTime - createdTime) / (1000 * 60 * 60);
  return ageInHours < CACHE_VALIDITY_HOURS;
}

router.get('/:kaek', async (req, res) => {
  const { kaek } = req.params;

  if (!kaek) {
    return res.status(400).json({ success: false, error: 'KAEK parameter is required' });
  }

  if (!/^\d+$/.test(kaek)) {
    return res.status(400).json({ success: false, error: 'KAEK must contain only numeric characters' });
  }

  console.log(`Fetching property data for KAEK: ${kaek}`);

  let cachedRecord = null;
  try {
    const records = await pb.collection('ktimatilogiu_cache').getFullList({
      filter: `kaek = "${kaek}"`,
    });
    if (records && records.length > 0) {
      cachedRecord = records[0];
      if (isCacheValid(cachedRecord.created)) {
        console.log(`Found valid cached data for KAEK: ${kaek}`);
        const allData = cachedRecord.allData ? JSON.parse(cachedRecord.allData) : cachedRecord;
        const transformedData = {
          kaek: allData.kaek || kaek,
          area: allData.area || allData.buildingArea || null,
          landUse: allData.landUse || allData.usage || null,
          description: allData.description || allData.remarks || null,
          coordinates: allData.coordinates || allData.geometry || null,
          address: allData.address || allData.addressText || null,
          history: allData.history || allData.historicalData || null,
        };
        return res.json({
          success: true,
          cached: true,
          data: transformedData,
        });
      } else {
        console.log(`Cache expired for KAEK: ${kaek}, fetching fresh data`);
      }
    }
  } catch (error) {
    console.warn(`Cache lookup failed for KAEK ${kaek}: ${error.message}`);
  }

  const response = await fetch(`${SDIGMAP_API_BASE}${kaek}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Property with KAEK ${kaek} not found`);
    }
    throw new Error(`SDIGMAP API error: ${response.status} ${response.statusText}`);
  }

  const propertyData = await response.json();

  if (!propertyData || typeof propertyData !== 'object') {
    throw new Error('Invalid response format from SDIGMAP API');
  }

  const transformedData = {
    kaek: propertyData.kaek || kaek,
    area: propertyData.area || propertyData.buildingArea || null,
    landUse: propertyData.landUse || propertyData.usage || null,
    description: propertyData.description || propertyData.remarks || null,
    coordinates: propertyData.coordinates || propertyData.geometry || null,
    address: propertyData.address || propertyData.addressText || null,
    history: propertyData.history || propertyData.historicalData || null,
  };

  try {
    if (cachedRecord) {
      await pb.collection('ktimatilogiu_cache').update(cachedRecord.id, {
        kaek,
        allData: JSON.stringify(propertyData),
        address: transformedData.address,
        area: transformedData.area,
        landUse: transformedData.landUse,
        description: transformedData.description,
        coordinates: transformedData.coordinates ? JSON.stringify(transformedData.coordinates) : null,
        history: transformedData.history ? JSON.stringify(transformedData.history) : null,
      });
      console.log(`Updated cache for KAEK: ${kaek}`);
    } else {
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
    }
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
