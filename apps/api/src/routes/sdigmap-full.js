import express from 'express';


const router = express.Router();

const CADASTRE_URL =
  'https://services-eu1.arcgis.com/40tFGWzosjaLJpmn/ArcGIS/rest/services/GEOTEMAXIA_LEITOURGOUN_ON_gdb/FeatureServer/0/query';

const SDIGMAP_BASE = 'https://sdigmap.tee.gov.gr/mapping/rest/services/UDM';

const CATEGORIES = [
  {
    key: 'dioikitika',
    label: 'Γεωτεμαχία Εθνικού Κτηματολογίου',
    service: 'UDM_ENGINEER_DHMOI',
    layers: [{ id: 0, label: 'Δημοτικές Ενότητες 2021' }],
  },
  {
    key: 'poleodomika',
    label: 'Πολεοδομική Πληροφορία',
    service: 'UDM_SERVICE_POLEODOMIKI_PLIROFORIA',
    layers: [
      { id: 25, label: 'Χρήσεις Γης' },
      { id: 26, label: 'Χρήσεις Γης ΓΠΣ' },
      { id: 0, label: 'Ρυμοτομικά Σχέδια - Πολεοδ. Μελέτες' },
      { id: 1, label: 'Γραμμές Αιγιαλού και Παραλίας' },
      { id: 2, label: 'Διατηρητέα Κτίσματα' },
      { id: 3, label: 'Καθορισμένο Όριο Οικισμού' },
      { id: 4, label: 'Κορυφές ΟΤ (εγκεκρ. Πολεοδ. Μελέτη ή Π.Ε.)' },
      { id: 5, label: 'Λοιπές Ζώνες Ρυμοτομικού Σχεδίου' },
      { id: 6, label: 'Οικοδομικά Τετράγωνα' },
      { id: 7, label: 'Οριοθετημένο Ρέμα' },
      { id: 8, label: 'Πεζόδρομος' },
      { id: 9, label: 'Περιοχή Εκτός Σχεδίου' },
      { id: 10, label: 'Πολεοδομικές Γραμμές' },
      { id: 11, label: 'Ρυμοτομική Γραμμή' },
      { id: 12, label: 'Οικοδομική Γραμμή' },
      { id: 13, label: 'Λοιπές Πολεοδομικές Γραμμές' },
      { id: 14, label: 'Πολεοδομική Ενότητα - Γειτονιά - Τομέας' },
      { id: 15, label: 'Πολύγωνα Όρων Δόμησης' },
      { id: 16, label: 'Πολύγωνα Όρων Δόμησης Αριθμός Ορόφων - Ύψος' },
      { id: 17, label: 'Πολύγωνα Όρων Δόμησης Αρτιότητα' },
      { id: 18, label: 'Πολύγωνα Όρων Δόμησης Κάλυψη' },
      { id: 19, label: 'Πολύγωνα Όρων Δόμησης Οικοδομικό Σύστημα' },
      { id: 20, label: 'Συντελεστής Δόμησης' },
      { id: 21, label: 'Χρήσεις Γης ΕΡΣ' },
      { id: 22, label: 'Χώροι Κοινόχρηστων - Κοινωφελών Λειτουργιών' },
      { id: 23, label: 'Ζώνη Αρχαιολογική' },
      { id: 24, label: 'Ζώνη Απαλλοτρίωσης' },
    ],
  },
  {
    key: 'poleod_rym_sxd',
    label: 'Ρυμοτομικά Διαγράμματα και Πολεοδομικά Σχέδια',
    service: 'UDM_SERVICE_POLEOD_RYM_SXD',
    layers: [{ id: 0, label: 'Όριο Πολεοδ. Μελέτης – Εγκεκριμένο Σχέδιο' }],
  },
  {
    key: 'sxedia_docs',
    label: 'Αποφάσεις και Διατάγματα Ρυμοτομικών Σχεδίων, Πολεοδομικών Μελετών και Τροποποιήσεων',
    service: 'UDM_SERVICE_SXEDIA_DOCS',
    layers: [{ id: 0, label: 'Περιγράμματα Διαγραμμάτων' }],
  },
  {
    key: 'fek_no_sxedia',
    label: 'ΦΕΚ Χωρίς Διάγραμμα',
    service: 'UDM_SERVICE_FEK_NO_SXEDIA_DOCS',
    layers: [{ id: 0, label: 'ΦΕΚ Χωρίς Διάγραμμα' }],
  },
  {
    key: 'ypd',
    label: 'Ζώνες Τιμών Αντικειμενικού Προσδιορισμού Αξίας Ακινήτων',
    service: 'UDM_SERVICE_YPD',
    layers: [
      { id: 6, label: 'Οικοδομικά Τετράγωνα' },
      { id: 20, label: 'Συντελεστής Δόμησης' },
      { id: 3, label: 'Καθορισμένο Όριο Οικισμού' },
    ],
  },
  {
    key: 'exoastikos',
    label: 'Ρυθμίσεις Εξωαστικού Χώρου',
    service: 'UDM_SERVICE_RYTHMISEIS_EXOASTIKOU_CHOROU',
    layers: [
      { id: 0, label: 'Ζώνες Οικιστικού Ελέγχου (ΖΟΕ)' },
      { id: 1, label: 'Όρια Ζωνών Οικιστικού Ελέγχου (ΖΟΕ)' },
      { id: 2, label: 'Ζώνες ΠΔ Προστασίας' },
      { id: 3, label: 'Όρια ΠΔ Προστασίας' },
      { id: 4, label: 'Ζώνες Α & Β Εντός Αττικής' },
      { id: 5, label: 'Ρέματα Ιδιαίτερου Περιβαλλοντικού Ενδιαφέροντος' },
    ],
  },
  {
    key: 'arxaiologika',
    label: 'Αρχαιολογικό Κτηματολόγιο',
    service: 'UDM_SERVICE_ARCHAIOLOGIKO',
    layers: [
      { id: 0, label: 'Μνημεία' },
      { id: 1, label: 'Μνημεία - Σημεία' },
      { id: 2, label: 'Μνημεία - Γραμμές' },
      { id: 3, label: 'Μνημεία - Πολύγωνα' },
      { id: 4, label: 'Ζώνες Προστασίας' },
      { id: 5, label: 'Ζώνες Προστασίας - Σημεία' },
      { id: 6, label: 'Ζώνες Προστασίας - Γραμμές' },
      { id: 7, label: 'Ζώνες Προστασίας - Πολύγωνα' },
      { id: 8, label: 'Ιστορικοί Τόποι' },
      { id: 9, label: 'Ιστορικοί Τόποι - Σημεία' },
      { id: 10, label: 'Ιστορικοί Τόποι - Γραμμές' },
      { id: 11, label: 'Ιστορικοί Τόποι - Πολύγωνα' },
      { id: 12, label: 'Αρχαιολογικοί Χώροι' },
      { id: 13, label: 'Αρχαιολογικοί Χώροι - Σημεία' },
      { id: 14, label: 'Αρχαιολογικοί Χώροι - Γραμμές' },
      { id: 15, label: 'Αρχαιολογικοί Χώροι - Πολύγωνα' },
      { id: 16, label: 'Τοπία Φυσικού Κάλλους' },
      { id: 17, label: 'Τοπία Φυσικού Κάλλους - Σημεία' },
      { id: 18, label: 'Τοπία Φυσικού Κάλλους - Πολύγωνα' },
    ],
  },
  {
    key: 'dasika',
    label: 'Natura - Δασικοί Χάρτες',
    service: 'UDM_SERVICE_NATURA_DASIKA',
    layers: [
      { id: 0, label: 'Θεσμοθετημένες Περιοχές Natura 2000 (ενημέρωση 10.06.21)' },
      { id: 1, label: 'Μερικώς κυρωμένοι δασικοί χάρτες (02.06.21)' },
      { id: 2, label: 'Περιφέρεια Αν. Μακεδονίας και Θράκης - Μερικώς κυρωμένοι δασικοί χάρτες' },
      { id: 3, label: 'Περιφέρεια Αττικής - Μερικώς κυρωμένοι δασικοί χάρτες' },
      { id: 4, label: 'Περιφέρεια Βορείου Αιγαίου - Μερικώς κυρωμένοι δασικοί χάρτες' },
      { id: 5, label: 'Περιφέρεια Δυτικής Ελλάδας - Μερικώς κυρωμένοι δασικοί χάρτες' },
      { id: 6, label: 'Περιφέρεια Δυτικής Μακεδονίας - Μερικώς κυρωμένοι δασικοί χάρτες' },
      { id: 7, label: 'Περιφέρεια Ηπείρου - Μερικώς κυρωμένοι δασικοί χάρτες' },
      { id: 8, label: 'Περιφέρεια Θεσσαλίας - Μερικώς κυρωμένοι δασικοί χάρτες' },
      { id: 9, label: 'Περιφέρεια Ιονίων Νήσων - Μερικώς κυρωμένοι δασικοί χάρτες' },
      { id: 10, label: 'Περιφέρεια Κεντρικής Μακεδονίας - Μερικώς κυρωμένοι δασικοί χάρτες' },
      { id: 11, label: 'Περιφέρεια Κρήτης - Μερικώς κυρωμένοι δασικοί χάρτες' },
      { id: 12, label: 'Περιφέρεια Νοτίου Αιγαίου - Μερικώς κυρωμένοι δασικοί χάρτες' },
      { id: 13, label: 'Περιφέρεια Πελοποννήσου - Μερικώς κυρωμένοι δασικοί χάρτες' },
      { id: 14, label: 'Περιφέρεια Στερεάς Ελλάδας - Μερικώς κυρωμένοι δασικοί χάρτες' },
      { id: 15, label: 'Αναρτημένοι δασικοί χάρτες 2022 (18.04.22)' },
      { id: 16, label: 'Περιφέρεια Αν. Μακεδονίας και Θράκης - Αναρτημένοι δασικοί χάρτες 2022' },
      { id: 17, label: 'Περιφέρεια Βορείου Αιγαίου - Αναρτημένοι δασικοί χάρτες 2022' },
      { id: 18, label: 'Περιφέρεια Δυτικής Ελλάδας - Αναρτημένοι δασικοί χάρτες 2022' },
      { id: 19, label: 'Περιφέρεια Δυτικής Μακεδονίας - Αναρτημένοι δασικοί χάρτες 2022' },
      { id: 20, label: 'Περιφέρεια Ηπείρου - Αναρτημένοι δασικοί χάρτες 2022' },
      { id: 21, label: 'Περιφέρεια Θεσσαλίας - Αναρτημένοι δασικοί χάρτες 2022' },
      { id: 22, label: 'Περιφέρεια Ιονίων Νήσων - Αναρτημένοι δασικοί χάρτες 2022' },
      { id: 23, label: 'Περιφέρεια Κεντρικής Μακεδονίας - Αναρτημένοι δασικοί χάρτες 2022' },
      { id: 24, label: 'Περιφέρεια Κρήτης - Αναρτημένοι δασικοί χάρτες 2022' },
      { id: 25, label: 'Περιφέρεια Νοτίου Αιγαίου - Αναρτημένοι δασικοί χάρτες 2022' },
      { id: 26, label: 'Περιφέρεια Πελοποννήσου - Αναρτημένοι δασικοί χάρτες 2022' },
      { id: 27, label: 'Περιφέρεια Στερεάς Ελλάδας - Αναρτημένοι δασικοί χάρτες 2022' },
      { id: 28, label: 'Μεγίστη - Αναρτημένοι δασικοί χάρτες 2022' },
      { id: 29, label: 'Αναρτημένοι δασικοί χάρτες (14.06.21)' },
      { id: 30, label: 'Περιφέρεια Αν. Μακεδονίας και Θράκης - Αναρτημένοι δασικοί χάρτες' },
      { id: 31, label: 'Περιφέρεια Αττικής - Αναρτημένοι δασικοί χάρτες' },
      { id: 32, label: 'Περιφέρεια Βορείου Αιγαίου - Αναρτημένοι δασικοί χάρτες' },
      { id: 33, label: 'Περιφέρεια Δυτικής Ελλάδας - Αναρτημένοι δασικοί χάρτες' },
      { id: 34, label: 'Περιφέρεια Δυτικής Μακεδονίας - Αναρτημένοι δασικοί χάρτες' },
      { id: 35, label: 'Περιφέρεια Ηπείρου - Αναρτημένοι δασικοί χάρτες' },
      { id: 36, label: 'Περιφέρεια Θεσσαλίας - Αναρτημένοι δασικοί χάρτες' },
      { id: 37, label: 'Περιφέρεια Ιονίων Νήσων - Αναρτημένοι δασικοί χάρτες' },
      { id: 38, label: 'Περιφέρεια Κεντρικής Μακεδονίας - Αναρτημένοι δασικοί χάρτες' },
      { id: 39, label: 'Περιφέρεια Κρήτης - Αναρτημένοι δασικοί χάρτες' },
      { id: 40, label: 'Περιφέρεια Νοτίου Αιγαίου - Αναρτημένοι δασικοί χάρτες' },
      { id: 41, label: 'Περιφέρεια Πελοποννήσου - Αναρτημένοι δασικοί χάρτες' },
      { id: 42, label: 'Περιφέρεια Στερεάς Ελλάδας - Αναρτημένοι δασικοί χάρτες' },
    ],
  },
  {
    key: 'elstat',
    label: 'Ελληνική Στατιστική Αρχή (ΕΛΣΤΑΤ)',
    service: 'UDM_SERVICE_ELSTAT',
    layers: [
      { id: 0, label: 'Καλλικρατικοί Δήμοι 2021' },
      { id: 1, label: 'Αποκεντρωμένες Διοικήσεις 2021' },
      { id: 2, label: 'Περιφέρειες 2021' },
      { id: 3, label: 'Περιφερειακές Ενότητες 2021' },
      { id: 5, label: 'Δημοτικές Ενότητες 2021' },
      { id: 6, label: 'Δημοτικές Κοινότητες 2021' },
      { id: 7, label: 'Απογραφικά Οικοδομικά Τετράγωνα 2011' },
      { id: 8, label: 'Απογραφή 2011' },
      { id: 10, label: 'Αποκεντρωμένες Διοικήσεις 2011' },
      { id: 11, label: 'Περιφέρειες 2011' },
      { id: 12, label: 'Περιφερειακές Ενότητες 2011' },
      { id: 13, label: 'Καλλικρατικοί Δήμοι 2011' },
      { id: 14, label: 'Δημοτικές Ενότητες 2011' },
      { id: 15, label: 'Δημοτικές - Τοπικές Κοινότητες 2011' },
      { id: 16, label: 'Οικισμοί 2011 (Θέσεις - ονοματολογία)' },
      { id: 17, label: 'Απογραφή 2021' },
      { id: 18, label: 'Οικισμοί 2021 (Θέσεις - ονοματολογία)' },
      { id: 20, label: 'Απογραφικά Οικοδομικά Τετράγωνα 2021' },
    ],
  },
];

const HIDDEN_FIELDS = /^(OBJECTID|OBJECTID_1|FID|GLOBALID|SHAPE|SHAPE_|Shape_|Shape__|SE_ANNO|KEY_FLAG|OID|OID_1|MUNUNITS)/i;

const groupLayerCache = new Map();

async function getGroupLayerIds(service) {
  if (groupLayerCache.has(service)) {
    return groupLayerCache.get(service);
  }
  const ids = new Set();
  try {
    const metaUrl = `${SDIGMAP_BASE}/${service}/MapServer?f=json`;
    const res = await fetch(`${metaUrl}`);
    if (res.ok) {
      const meta = await res.json();
      const layers = meta.layers || [];
      for (const ly of layers) {
        if (ly.type === 'Group Layer' || ly.subLayerIds) {
          ids.add(ly.id);
        }
      }
    }
  } catch (err) {
    console.warn(`SDIGMAP ${service} metadata fetch issue: ${err.message}`);
  }
  groupLayerCache.set(service, ids);
  return ids;
}

const PARCEL_CACHE_TTL_MS = 30 * 60 * 1000;
const parcelCache = new Map();
const FULL_CACHE_TTL_MS = 10 * 60 * 1000;
const fullDataCache = new Map();

let lastCadastreRequestAt = 0;
const MIN_CADASTRE_INTERVAL_MS = 600;
let cadastreQueue = Promise.resolve();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withJitter(baseMs) {
  const jitter = baseMs * 0.3 * (Math.random() * 2 - 1);
  return Math.max(200, Math.round(baseMs + jitter));
}

function throttledCadastreCall(fn) {
  const run = cadastreQueue.then(async () => {
    const now = Date.now();
    const wait = Math.max(0, lastCadastreRequestAt + MIN_CADASTRE_INTERVAL_MS - now);
    if (wait > 0) await sleep(wait);
    lastCadastreRequestAt = Date.now();
    return fn();
  });
  cadastreQueue = run.catch(() => {});
  return run;
}

async function fetchWithTimeout(url, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isRateLimitMessage(message) {
  return typeof message === 'string' && /too many requests/i.test(message);
}

function centroidOfRing(ring) {
  let sx = 0;
  let sy = 0;
  ring.forEach(([x, y]) => {
    sx += x;
    sy += y;
  });
  const n = ring.length || 1;
  return { longitude: sx / n, latitude: sy / n };
}

async function resolveParcel(kaek) {
  const cached = parcelCache.get(kaek);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const params = new URLSearchParams({
    where: `KAEK = '${kaek}'`,
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json',
  });
  const url = `${CADASTRE_URL}?${params.toString()}`;

  const maxAttempts = 6;
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await throttledCadastreCall(async () => {
        const res = await fetchWithTimeout(url, 20000);
        if (!res.ok) {
          throw new Error(`Cadastre lookup failed: ${res.status} ${res.statusText}`);
        }
        return res.json();
      });

      if (data.error) {
        const message = data.error.message || 'unknown';
        if (isRateLimitMessage(message) && attempt < maxAttempts) {
          const backoff = withJitter(800 * 2 ** (attempt - 1));
          console.warn(`Cadastre rate limited (attempt ${attempt}/${maxAttempts}), retrying in ${backoff}ms`);
          await sleep(backoff);
          continue;
        }
        throw new Error(`Cadastre error: ${message}`);
      }

      const feature = data.features && data.features[0];
      if (!feature || !feature.geometry || !Array.isArray(feature.geometry.rings)) {
        return null;
      }
      const ring = feature.geometry.rings[0];
      const parcel = {
        attributes: feature.attributes || {},
        polygon: ring,
        centroid: centroidOfRing(ring),
      };
      parcelCache.set(kaek, { data: parcel, expiresAt: Date.now() + PARCEL_CACHE_TTL_MS });
      return parcel;
    } catch (err) {
      lastError = err;
      const isTimeoutOrNetwork = err.name === 'AbortError' || err.message?.includes('fetch failed');
      if ((isTimeoutOrNetwork || isRateLimitMessage(err.message)) && attempt < maxAttempts) {
        const backoff = withJitter(800 * 2 ** (attempt - 1));
        console.warn(`Cadastre lookup issue (attempt ${attempt}/${maxAttempts}): ${err.message}. Retrying in ${backoff}ms`);
        await sleep(backoff);
        continue;
      }
      break;
    }
  }

  console.error(`Cadastre lookup exhausted retries for KAEK ${kaek}: ${lastError?.message}`);
  throw new Error(
    'Η υπηρεσία Κτηματολογίου είναι προσωρινά μη διαθέσιμη λόγω μεγάλου φόρτου (πολλά αιτήματα). Δοκιμάστε ξανά σε λίγα δευτερόλεπτα.',
  );
}

async function resolveNeighbors(kaek, ring) {
  if (!Array.isArray(ring) || ring.length < 3) return [];
  const c = centroidOfRing(ring);
  const buffer = 0.00009;
  const bufferedRing = ring.map(([x, y]) => [
    x + (x >= c.longitude ? buffer : -buffer),
    y + (y >= c.latitude ? buffer : -buffer),
  ]);
  const params = new URLSearchParams({
    geometry: JSON.stringify({ rings: [bufferedRing], spatialReference: { wkid: 4326 } }),
    geometryType: 'esriGeometryPolygon',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'KAEK',
    returnGeometry: 'true',
    resultRecordCount: '100',
    f: 'json',
  });
  const url = `${CADASTRE_URL}?${params.toString()}`;
  try {
    const data = await throttledCadastreCall(async () => {
      const res = await fetchWithTimeout(url, 20000);
      if (!res.ok) {
        throw new Error(`Cadastre neighbors failed: ${res.status} ${res.statusText}`);
      }
      return res.json();
    });
    if (data.error) return [];
    const out = [];
    for (const f of data.features || []) {
      const k = f.attributes?.KAEK;
      if (k && String(k) === String(kaek)) continue;
      const norm = normalizeGeometry(f.geometry);
      if (norm && norm.type === 'polygon' && norm.rings?.length) out.push(norm);
    }
    return out;
  } catch (err) {
    console.warn(`Cadastre neighbors lookup issue for KAEK ${kaek}: ${err.message}`);
    return [];
  }
}

async function queryLayer(service, layerId, ring, lng, lat) {
  const groupIds = await getGroupLayerIds(service);
  if (groupIds.has(layerId)) {
    return [];
  }

  const url = `${SDIGMAP_BASE}/${service}/MapServer/${layerId}/query`;

  async function runQuery(geometry, geometryType) {
    const params = new URLSearchParams({
      geometry: JSON.stringify(geometry),
      geometryType,
      inSR: '4326',
      outSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      outFields: '*',
      returnGeometry: 'true',
      f: 'json',
    });
    const res = await fetch(`${url}?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`SDIGMAP ${service}/${layerId} failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }

  let data;
  if (Array.isArray(ring) && ring.length >= 3) {
    data = await runQuery({ rings: [ring], spatialReference: { wkid: 4326 } }, 'esriGeometryPolygon');
    if (data.error) {
      console.warn(`SDIGMAP ${service}/${layerId} polygon query issue: ${data.error.message}, retrying with point`);
      data = await runQuery({ x: lng, y: lat, spatialReference: { wkid: 4326 } }, 'esriGeometryPoint');
    }
  } else {
    data = await runQuery({ x: lng, y: lat, spatialReference: { wkid: 4326 } }, 'esriGeometryPoint');
  }

  if (data.error) {
    console.warn(`SDIGMAP ${service}/${layerId} query issue: ${data.error.message}`);
    return [];
  }
  return (data.features || []).map((f) => ({ attributes: f.attributes || {}, geometry: f.geometry || null }));
}

function normalizeGeometry(geom) {
  if (!geom) return null;
  if (Array.isArray(geom.rings) && geom.rings.length > 0) {
    return { type: 'polygon', rings: geom.rings.map((ring) => ring.map(([x, y]) => [y, x])) };
  }
  if (Array.isArray(geom.paths) && geom.paths.length > 0) {
    return { type: 'polyline', paths: geom.paths.map((path) => path.map(([x, y]) => [y, x])) };
  }
  if (geom.x != null && geom.y != null) {
    return { type: 'point', lat: geom.y, lon: geom.x };
  }
  return null;
}

function toRows(attrs) {
  const rows = [];
  for (const [name, value] of Object.entries(attrs)) {
    if (HIDDEN_FIELDS.test(name)) continue;
    if (value === null || value === undefined || value === '') continue;
    const isUrl = /_URL$/i.test(name) || (typeof value === 'string' && /^https?:\/\//i.test(value));
    rows.push({
      field: name,
      value: String(value),
      url: isUrl ? String(value) : null,
    });
  }
  return rows;
}

function boundsFromRing(ring, pad = 0.35) {
  if (!Array.isArray(ring) || ring.length < 2) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const pt of ring) {
    const x = pt[0];
    const y = pt[1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
  const dx = Math.max(maxX - minX, 0.00025);
  const dy = Math.max(maxY - minY, 0.00025);
  const px = dx * pad;
  const py = dy * pad;
  return {
    west: minX - px,
    south: minY - py,
    east: maxX + px,
    north: maxY + py,
  };
}

function leafletBoundsFromGeom(norm) {
  if (!norm) return null;
  let minLat = Infinity;
  let minLon = Infinity;
  let maxLat = -Infinity;
  let maxLon = -Infinity;
  const feed = (lat, lon) => {
    if (lat < minLat) minLat = lat;
    if (lon < minLon) minLon = lon;
    if (lat > maxLat) maxLat = lat;
    if (lon > maxLon) maxLon = lon;
  };
  if (norm.type === 'polygon' && norm.rings) {
    for (const ring of norm.rings) {
      for (const [lat, lon] of ring) feed(lat, lon);
    }
  } else if (norm.type === 'polyline' && norm.paths) {
    for (const path of norm.paths) {
      for (const [lat, lon] of path) feed(lat, lon);
    }
  } else if (norm.type === 'point') {
    feed(norm.lat, norm.lon);
    const d = 0.0004;
    return [
      [norm.lat - d, norm.lon - d],
      [norm.lat + d, norm.lon + d],
    ];
  } else {
    return null;
  }
  if (!Number.isFinite(minLat)) return null;
  const dLat = Math.max((maxLat - minLat) * 0.05, 0.00005);
  const dLon = Math.max((maxLon - minLon) * 0.05, 0.00005);
  return [
    [minLat - dLat, minLon - dLon],
    [maxLat + dLat, maxLon + dLon],
  ];
}

function isImageDiagramUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!/^https?:\/\//i.test(url)) return false;
  if (/\.pdf(\?|$)/i.test(url) && !/DIAGRAM|diagram|georef/i.test(url)) return false;
  return true;
}

const DIAGRAM_EXPORT_SERVICES = [
  {
    key: 'poleodomika',
    service: 'UDM_SERVICE_POLEODOMIKI_PLIROFORIA',
    label: 'Πολεοδομική Πληροφορία (διάγραμμα)',
    layers: 'show:1,2,3,4,5,6,7,8,9,10,11,12,13,14,22,23,24',
  },
  {
    key: 'poleod_rym_sxd',
    service: 'UDM_SERVICE_POLEOD_RYM_SXD',
    label: 'Ρυμοτομικά Διαγράμματα',
    layers: 'show:0',
  },
  {
    key: 'sxedia_docs',
    service: 'UDM_SERVICE_SXEDIA_DOCS',
    label: 'Περιγράμματα Διαγραμμάτων',
    layers: 'show:0',
  },
];

function buildExportOverlay(serviceEntry, bbox) {
  if (!bbox) return null;
  const params = new URLSearchParams({
    bbox: `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`,
    bboxSR: '4326',
    imageSR: '4326',
    size: '1280,1280',
    dpi: '96',
    format: 'png32',
    transparent: 'true',
    f: 'image',
    layers: serviceEntry.layers,
  });
  const upstream = `${SDIGMAP_BASE}/${serviceEntry.service}/MapServer/export?${params.toString()}`;
  return {
    id: `export-${serviceEntry.key}`,
    kind: 'export',
    label: serviceEntry.label,
    categoryKey: serviceEntry.key,
    proxyPath: `/sdigmap-full/overlay-image?src=${encodeURIComponent(upstream)}`,
    bounds: [
      [bbox.south, bbox.west],
      [bbox.north, bbox.east],
    ],
    opacity: 0.72,
  };
}

function collectDiagramOverlays(categories, parcelRing) {
  const overlays = [];
  const seen = new Set();
  const parcelBbox = boundsFromRing(parcelRing, 0.45);

  for (const cat of categories || []) {
    for (const layer of cat.layers || []) {
      const items = layer._rawItems || [];
      for (let i = 0; i < items.length; i++) {
        const rows = items[i]._rows || [];
        const geom = items[i]._feature || null;
        const attrs = items[i].attributes || {};
        const candidates = [];
        for (const row of rows) {
          if (row.url && /GEOREF_DIAGRAM|INITIAL_DIAGRAM|DIAGRAM_URL|GEOTIFF|WORLDFILE/i.test(row.field || '')) {
            candidates.push({ url: row.url, field: row.field });
          }
        }
        for (const [name, value] of Object.entries(attrs)) {
          if (/DIAGRAM|GEOTIFF/i.test(name) && typeof value === 'string' && /^https?:\/\//i.test(value)) {
            if (!candidates.some((c) => c.url === value)) {
              candidates.push({ url: value, field: name });
            }
          }
        }
        candidates.sort((a, b) => {
          const score = (f) => (/GEOREF/i.test(f) ? 0 : /INITIAL/i.test(f) ? 1 : 2);
          return score(a.field) - score(b.field);
        });
        for (const c of candidates) {
          if (!isImageDiagramUrl(c.url)) continue;
          if (seen.has(c.url)) continue;
          if (/\.pdf(\?|$)/i.test(c.url)) continue;
          seen.add(c.url);
          let bounds = leafletBoundsFromGeom(geom);
          if (!bounds && parcelBbox) {
            bounds = [
              [parcelBbox.south, parcelBbox.west],
              [parcelBbox.north, parcelBbox.east],
            ];
          }
          if (!bounds) continue;
          overlays.push({
            id: `diagram-${overlays.length}`,
            kind: 'diagram',
            label: layer.label || cat.label || 'Διάγραμμα ΤΕΕ',
            categoryKey: cat.key,
            proxyPath: `/sdigmap-full/overlay-image?src=${encodeURIComponent(c.url)}`,
            bounds,
            opacity: 0.65,
          });
          break;
        }
      }
    }
  }

  const presentKeys = new Set((categories || []).map((c) => c.key));
  for (const entry of DIAGRAM_EXPORT_SERVICES) {
    if (!presentKeys.has(entry.key)) continue;
    const ov = buildExportOverlay(entry, parcelBbox);
    if (ov) overlays.push(ov);
  }

  if (parcelBbox && !overlays.some((o) => o.id === 'export-poleodomika')) {
    const ov = buildExportOverlay(DIAGRAM_EXPORT_SERVICES[0], parcelBbox);
    if (ov) overlays.push(ov);
  }

  return overlays;
}

async function buildFullData(kaek) {
  const cached = fullDataCache.get(kaek);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const parcel = await resolveParcel(kaek);
  if (!parcel) return null;

  const { longitude: lng, latitude: lat } = parcel.centroid;
  const ring = parcel.polygon;

  const categories = await Promise.all(
    CATEGORIES.map(async (cat) => {
      const layerResults = await Promise.allSettled(
        cat.layers.map(async (ly) => {
          const records = await queryLayer(cat.service, ly.id, ring, lng, lat);
          return { label: ly.label, records };
        }),
      );
      const layers = layerResults
        .filter((r) => r.status === 'fulfilled' && r.value.records.length > 0)
        .map((r) => {
          const items = r.value.records;
          const paired = items.map((item) => {
            const feature = normalizeGeometry(item.geometry);
            const attrs = item.attributes || {};
            if (feature) {
              const bn = attrs.OT_NUM;
              if (bn != null && String(bn).trim() !== '') {
                feature.blockNumber = String(bn).trim();
              }
            }
            return {
              rows: toRows(item.attributes),
              feature,
              attributes: attrs,
            };
          });
          const records = paired.map((p) => p.rows);
          const features = paired.map((p) => p.feature).filter(Boolean);
          return {
            label: r.value.label,
            records: records.filter((rows) => rows.length > 0),
            features,
            _rawItems: paired.map((p) => ({ attributes: p.attributes, geometry: null, _feature: p.feature, _rows: p.rows })),
          };
        })
        .filter((l) => l.records.length > 0 || l.features.length > 0);
      return { key: cat.key, label: cat.label, layers };
    }),
  );

  const filteredCats = categories.filter((c) => c.layers.length > 0);
  const diagramOverlays = collectDiagramOverlays(filteredCats, ring);

  let neighbors = [];
  try {
    neighbors = await resolveNeighbors(kaek, ring);
  } catch (err) {
    neighbors = [];
  }

  const publicCategories = filteredCats.map((c) => ({
    ...c,
    layers: c.layers.map(({ label, records, features }) => ({ label, records, features })),
  }));

  const a = parcel.attributes;
  const result = {
    kaek,
    parcel: {
      kaek,
      area: a.AREA != null ? Math.round(a.AREA) : null,
      perimeter: a.PERIMETER != null ? Math.round(a.PERIMETER) : null,
      mainUse: a.DESCR || null,
      mainUseCode: a.MAIN_USE || null,
      percentage: a.PERCENTAGE != null ? a.PERCENTAGE : null,
      link: a.LINK || null,
    },
    centroid: parcel.centroid,
    polygon: parcel.polygon,
    categories: publicCategories,
    diagramOverlays,
    neighbors,
  };

  fullDataCache.set(kaek, { data: result, expiresAt: Date.now() + FULL_CACHE_TTL_MS });
  return result;
}

router.get('/overlay-image', async (req, res) => {
  try {
    const src = String(req.query.src || '').trim();
    if (!src || !/^https:\/\/sdigmap\.tee\.gov\.gr\//i.test(src)) {
      return res.status(400).json({ success: false, error: 'Μη έγκυρη πηγή διαγράμματος' });
    }
    const upstream = await fetchWithTimeout(src, 45000);
    if (!upstream.ok) {
      return res.status(502).json({ success: false, error: `Αποτυχία λήψης διαγράμματος (${upstream.status})` });
    }
    const contentType = upstream.headers.get('content-type') || 'image/png';
    if (/text\/html/i.test(contentType)) {
      return res.status(502).json({ success: false, error: 'Η πηγή δεν επέστρεψε εικόνα' });
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(buf);
  } catch (err) {
    console.error('overlay-image proxy error:', err.message);
    return res.status(502).json({ success: false, error: 'Αποτυχία proxy διαγράμματος' });
  }
});

router.get('/:kaek', async (req, res) => {
  const kaek = String(req.params.kaek || '').trim();
  if (!kaek || !/^\d+$/.test(kaek)) {
    return res.status(422).json({ success: false, error: 'Απαιτείται έγκυρος αριθμητικός ΚΑΕΚ' });
  }

  console.log(`Full SDIGMAP lookup for KAEK: ${kaek}`);

  const data = await buildFullData(kaek);
  if (!data) {
    return res.status(404).json({ success: false, error: `Δεν βρέθηκε ακίνητο με ΚΑΕΚ ${kaek}` });
  }

  res.json({ success: true, data });
});

export default router;
