export const parsePolygonString = (str) => {
  if (!str) return null;
  if (Array.isArray(str)) return str;
  
  try {
    let cleaned = String(str).trim();
    
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.slice(1, -1);
    }
    cleaned = cleaned.replace(/\\"/g, '"');
    
    if (cleaned.toUpperCase().includes('POLYGON')) {
      const coordsMatch = cleaned.match(/\(\((.*?)\)\)/);
      if (coordsMatch && coordsMatch[1]) {
        return coordsMatch[1].split(',').map(pair => {
          const [lng, lat] = pair.trim().split(/\s+/).map(Number);
          return [lng, lat];
        });
      }
    }
    
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn('Failed to parse polygon string:', error);
    return null;
  }
};

export const isEGSA87 = (coords) => {
  if (!Array.isArray(coords) || coords.length < 2) return false;
  return Math.abs(Number(coords[0])) > 10000 || Math.abs(Number(coords[1])) > 10000;
};

export const egsa87ToWGS84 = (xIn, yIn) => {
  let x = Number(xIn);
  let y = Number(yIn);

  if (x > 2000000 && y < 2000000) {
    const temp = x;
    x = y;
    y = temp;
  }

  const a = 6378137.0;
  const f = 1 / 298.257222101;
  const b = a * (1 - f);
  const e2 = (a * a - b * b) / (a * a);
  
  const lon0 = 24.0 * Math.PI / 180.0;
  const k0 = 0.9996;
  const falseEasting = 500000.0;
  const falseNorthing = 0.0;

  const x_TM = (x - falseEasting) / k0;
  const y_TM = (y - falseNorthing) / k0;

  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  const M = y_TM;
  const mu = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * Math.pow(e2, 3) / 256));
  
  const phi1Rad = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu) 
                   + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu)
                   + (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu);
                   
  const N1 = a / Math.sqrt(1 - e2 * Math.pow(Math.sin(phi1Rad), 2));
  const T1 = Math.pow(Math.tan(phi1Rad), 2);
  const C1 = (e2 / (1 - e2)) * Math.pow(Math.cos(phi1Rad), 2);
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.pow(Math.sin(phi1Rad), 2), 1.5);
  const D = x_TM / N1;
  
  const latRad = phi1Rad - (N1 * Math.tan(phi1Rad) / R1) * (
    D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * e2) * Math.pow(D, 4) / 24
    + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * e2 - 3 * C1 * C1) * Math.pow(D, 6) / 720
  );
  
  const lonRad = lon0 + (
    D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 
    + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * e2 + 24 * T1 * T1) * Math.pow(D, 5) / 120
  ) / Math.cos(phi1Rad);

  const h = 0;
  const N = a / Math.sqrt(1 - e2 * Math.pow(Math.sin(latRad), 2));
  const X = (N + h) * Math.cos(latRad) * Math.cos(lonRad);
  const Y = (N + h) * Math.cos(latRad) * Math.sin(lonRad);
  const Z = (N * (1 - e2) + h) * Math.sin(latRad);

  const dX = -199.87;
  const dY = 74.79;
  const dZ = 246.62;

  const Xw = X + dX;
  const Yw = Y + dY;
  const Zw = Z + dZ;

  const e2w = 0.00669437999014;
  const aw = 6378137.0;

  const p = Math.sqrt(Xw * Xw + Yw * Yw);
  let latWRad = Math.atan2(Zw, p * (1 - e2w));
  let lonWRad = Math.atan2(Yw, Xw);
  
  for (let i = 0; i < 5; i++) {
    const Nw = aw / Math.sqrt(1 - e2w * Math.pow(Math.sin(latWRad), 2));
    latWRad = Math.atan2(Zw + Nw * e2w * Math.sin(latWRad), p);
  }

  return [lonWRad * 180.0 / Math.PI, latWRad * 180.0 / Math.PI];
};

export const validateGeometry = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  
  let coords = arr;
  if (Array.isArray(arr[0]) && Array.isArray(arr[0][0])) {
    coords = arr[0];
  }

  const validCoords = [];
  
  for (const pt of coords) {
    if (Array.isArray(pt) && pt.length >= 2) {
      let lng = Number(pt[0]);
      let lat = Number(pt[1]);
      
      if (isNaN(lng) || isNaN(lat)) continue;

      if (isEGSA87([lng, lat])) {
        const wgs = egsa87ToWGS84(lng, lat);
        lng = wgs[0];
        lat = wgs[1];
      }

      validCoords.push([lng, lat]);
    }
  }

  return validCoords.length >= 3 ? validCoords : null;
};
