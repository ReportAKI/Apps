import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import { load } from 'cheerio';
import pb from '../utils/pocketbaseClient.js';


const router = express.Router();

const SDIGMAP_API_BASE = 'https://sdigmap.tee.gov.gr/sdmquery/public/';
const CACHE_VALIDITY_DAYS = 7;

function isCacheValid(createdAt) {
  const createdTime = new Date(createdAt).getTime();
  const currentTime = new Date().getTime();
  const ageInDays = (currentTime - createdTime) / (1000 * 60 * 60 * 24);
  return ageInDays < CACHE_VALIDITY_DAYS;
}

function extractText($, selector) {
  const element = $(selector);
  return element.length > 0 ? element.text().trim() : null;
}

function parseCoordinates(text) {
  if (!text) return null;
  const match = text.match(/([\d.]+)[,\s]+([\d.]+)/);
  if (match) {
    return {
      latitude: parseFloat(match[1]),
      longitude: parseFloat(match[2]),
    };
  }
  return null;
}

router.get('/:kaek', async (req, res) => {
  const { kaek } = req.params;

  if (!kaek) {
    return res.status(400).json({ success: false, error: 'KAEK parameter is required' });
  }

  if (!/^\d+$/.test(kaek)) {
    return res.status(400).json({ success: false, error: 'KAEK must contain only numeric characters' });
  }

  console.log(`Scraping property data for KAEK: ${kaek}`);

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
          area: allData.area || null,
          landUse: allData.landUse || null,
          coordinates: allData.coordinates || null,
          address: allData.address || null,
          description: allData.description || null,
        };
        return res.json({
          success: true,
          cached: true,
          data: transformedData,
          allData,
        });
      } else {
        console.log(`Cache expired for KAEK: ${kaek}, fetching fresh data`);
      }
    }
  } catch (error) {
    console.warn(`Cache lookup failed for KAEK ${kaek}: ${error.message}`);
  }

  const response = await axios.get(`${SDIGMAP_API_BASE}${kaek}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.data) {
    throw new Error(`Failed to fetch property data for KAEK ${kaek}`);
  }

  const $ = load(response.data);

  const errorText = $('body').text();
  if (errorText.includes('not found') || errorText.includes('δεν βρέθηκε')) {
    throw new Error(`Property with KAEK ${kaek} not found`);
  }

  const area = extractText($, '[data-field="area"], .area, [class*="area"]');
  const landUse = extractText($, '[data-field="landUse"], .land-use, [class*="land-use"], [class*="usage"]');
  const coordinatesText = extractText($, '[data-field="coordinates"], .coordinates, [class*="coordinates"]');
  const address = extractText($, '[data-field="address"], .address, [class*="address"]');
  const description = extractText($, '[data-field="description"], .description, [class*="description"]');

  const coordinates = parseCoordinates(coordinatesText);

  const allText = $('body').text();

  const transformedData = {
    kaek,
    area: area || null,
    landUse: landUse || null,
    coordinates: coordinates || null,
    address: address || null,
    description: description || null,
  };

  const allData = {
    kaek,
    area,
    landUse,
    coordinates,
    address,
    description,
    rawHtml: allText.substring(0, 5000),
  };

  try {
    if (cachedRecord) {
      await pb.collection('ktimatilogiu_cache').update(cachedRecord.id, {
        kaek,
        allData: JSON.stringify(allData),
        address: transformedData.address,
        area: transformedData.area,
        landUse: transformedData.landUse,
        description: transformedData.description,
        coordinates: transformedData.coordinates ? JSON.stringify(transformedData.coordinates) : null,
      });
      console.log(`Updated cache for KAEK: ${kaek}`);
    } else {
      await pb.collection('ktimatilogiu_cache').create({
        kaek,
        allData: JSON.stringify(allData),
        address: transformedData.address,
        area: transformedData.area,
        landUse: transformedData.landUse,
        description: transformedData.description,
        coordinates: transformedData.coordinates ? JSON.stringify(transformedData.coordinates) : null,
      });
      console.log(`Cached scraped property data for KAEK: ${kaek}`);
    }
  } catch (error) {
    console.warn(`Failed to cache property data for KAEK ${kaek}: ${error.message}`);
  }

  res.json({
    success: true,
    cached: false,
    data: transformedData,
    allData,
  });
});

export default router;
