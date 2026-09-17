import express from 'express';


const router = express.Router();

const ORG_BASE = 'https://services-eu1.arcgis.com/40tFGWzosjaLJpmn/ArcGIS/rest/services';

const LAYERS = [
  { key: 'LEITOURGOUN', label: 'Λειτουργούντα Γεωτεμάχια', service: 'GEOTEMAXIA_LEITOURGOUN_ON_gdb', layer: 0, primary: true },
  { key: 'DOULEIES', label: 'Δουλείες', service: 'GEOTEMAXIA_DOULEIES_ON_gdb', layer: 0 },
  { key: 'APOKLEISTIKES', label: 'Αποκλειστικές Χρήσεις', service: 'GEOTEMAXIA_APOKLEISTIKES_ON_gdb', layer: 0 },
  { key: 'ANARTHSH', label: 'Ανάρτηση', service: 'GEOTEMAXIA_ANARTHSH_ON_gdb', layer: 0 },
  { key: 'PROANARTHSH', label: 'Προανάρτηση', service: 'GEOTEMAXIA_PROANARTHSH_ON_gdb', layer: 0 },
];

async function queryLayerByKaek(layerDef, kaek) {
  const url = `${ORG_BASE}/${layerDef.service}/FeatureServer/${layerDef.layer}/query`;
  const params = new URLSearchParams({
    where: `KAEK = '${kaek}'`,
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json',
  });

  const response = await fetch(`${url}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`ArcGIS ${layerDef.key} error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  if (data.error) {
    console.warn(`ArcGIS ${layerDef.key} query issue: ${data.error.message}`);
    return [];
  }
  return data.features || [];
}

function extractGeometry(geometry) {
  if (!geometry || !Array.isArray(geometry.rings) || geometry.rings.length === 0) {
    return { polygon: null, centroid: null };
  }
  const outerRing = geometry.rings[0];
  let sumLng = 0;
  let sumLat = 0;
  outerRing.forEach(([lng, lat]) => {
    sumLng += lng;
    sumLat += lat;
  });
  const count = outerRing.length || 1;
  return {
    polygon: outerRing,
    centroid: { latitude: sumLat / count, longitude: sumLng / count },
  };
}

function buildPropertyData(kaek, primaryFeature, layerResults) {
  const attrs = primaryFeature ? primaryFeature.attributes || {} : {};
  const { polygon, centroid } = extractGeometry(primaryFeature ? primaryFeature.geometry : null);

  const layers = layerResults
    .filter((r) => r.features.length > 0)
    .map((r) => ({
      key: r.def.key,
      label: r.def.label,
      count: r.features.length,
      records: r.features.map((f) => f.attributes),
    }));

  return {
    kaek,
    address: attrs.LINK ? `Κτηματολόγιο ${kaek}` : `ΚΑΕΚ ${kaek}`,
    polygon,
    coordinates: centroid,
    urbanPlanning: {
      area: attrs.AREA != null ? Math.round(attrs.AREA) : null,
      mainUse: attrs.MAIN_USE || null,
      percentage: attrs.PERCENTAGE || null,
      perimeter: attrs.PERIMETER != null ? Math.round(attrs.PERIMETER) : null,
    },
    description: attrs.DESCR || null,
    link: attrs.LINK || null,
    attributes: attrs,
    layers,
  };
}

async function getPb() {
  const mod = await import('../utils/pocketbaseClient.js');
  return mod.default;
}

async function readCache(kaek) {
  try {
    const pb = await getPb();
    const rec = await pb.collection('ktimatilogiu_cache').getFirstListItem(`kaek="${kaek}"`);
    return rec.allData || null;
  } catch {
    return null;
  }
}

async function writeCache(kaek, data) {
  try {
    const pb = await getPb();
    const payload = {
      kaek,
      address: data.address || '',
      area: data.urbanPlanning?.area || null,
      landUse: data.urbanPlanning?.mainUse || '',
      description: data.description || '',
      coordinates: data.coordinates ? `${data.coordinates.latitude}, ${data.coordinates.longitude}` : '',
      history: data.layers || [],
      allData: data,
    };
    let existing = null;
    try {
      existing = await pb.collection('ktimatilogiu_cache').getFirstListItem(`kaek="${kaek}"`);
    } catch { }
    if (existing) {
      await pb.collection('ktimatilogiu_cache').update(existing.id, payload);
    } else {
      await pb.collection('ktimatilogiu_cache').create(payload);
    }
  } catch (err) {
    console.warn(`Failed to cache KAEK ${kaek}: ${err.message}`);
  }
}

router.get('/search', async (req, res) => {
  const { kaek, refresh } = req.query;

  if (!kaek) {
    return res.status(422).json({ success: false, error: 'kaek parameter is required' });
  }

  const cleanKaek = String(kaek).trim();
  console.log(`Multi-layer ArcGIS search for KAEK: ${cleanKaek}`);

  if (!refresh) {
    const cached = await readCache(cleanKaek);
    if (cached) {
      return res.json({ success: true, data: cached, cached: true });
    }
  }

  const primaryDef = LAYERS.find((l) => l.primary);
  const primaryFeatures = await queryLayerByKaek(primaryDef, cleanKaek);

  if (!primaryFeatures || primaryFeatures.length === 0) {
    return res.json({ success: false, error: `Δεν βρέθηκε ακίνητο με ΚΑΕΚ ${cleanKaek}` });
  }

  const secondary = LAYERS.filter((l) => !l.primary);
  const settled = await Promise.allSettled(secondary.map((def) => queryLayerByKaek(def, cleanKaek)));

  const layerResults = [{ def: primaryDef, features: primaryFeatures }];
  settled.forEach((r, i) => {
    layerResults.push({ def: secondary[i], features: r.status === 'fulfilled' ? r.value : [] });
  });

  const data = buildPropertyData(cleanKaek, primaryFeatures[0], layerResults);

  await writeCache(cleanKaek, data);

  res.json({ success: true, data, cached: false });
});

router.get('/property/:kaek', async (req, res) => {
  const cleanKaek = String(req.params.kaek || '').trim();
  if (!cleanKaek) {
    return res.status(422).json({ error: 'KAEK is required' });
  }

  const cached = await readCache(cleanKaek);
  if (cached) {
    return res.json({ success: true, data: cached, cached: true });
  }

  const primaryDef = LAYERS.find((l) => l.primary);
  const primaryFeatures = await queryLayerByKaek(primaryDef, cleanKaek);
  if (!primaryFeatures || primaryFeatures.length === 0) {
    return res.status(404).json({ success: false, error: `Δεν βρέθηκε ακίνητο με ΚΑΕΚ ${cleanKaek}` });
  }

  const secondary = LAYERS.filter((l) => !l.primary);
  const settled = await Promise.allSettled(secondary.map((def) => queryLayerByKaek(def, cleanKaek)));
  const layerResults = [{ def: primaryDef, features: primaryFeatures }];
  settled.forEach((r, i) => {
    layerResults.push({ def: secondary[i], features: r.status === 'fulfilled' ? r.value : [] });
  });

  const data = buildPropertyData(cleanKaek, primaryFeatures[0], layerResults);
  await writeCache(cleanKaek, data);

  res.json({ success: true, data, cached: false });
});

export default router;
