const TILE_SIZE = 256;

function lonToX(lon, zoom) {
  return ((lon + 180) / 360) * TILE_SIZE * Math.pow(2, zoom);
}

function latToY(lat, zoom) {
  const rad = (lat * Math.PI) / 180;
  const y = Math.log(Math.tan(rad) + 1 / Math.cos(rad));
  return (1 - y / Math.PI) / 2 * TILE_SIZE * Math.pow(2, zoom);
}

function loadTile(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function renderPropertyMapImage(coords, options = {}) {
  if (!coords || coords.length < 3) return null;

  const width = options.width || 1000;
  const height = options.height || 640;
  const padding = options.padding != null ? options.padding : 60;
  const maxZoom = 19;

  const lats = coords.map((c) => c[0]);
  const lons = coords.map((c) => c[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  let zoom = maxZoom;
  for (let z = maxZoom; z >= 1; z--) {
    const w = Math.abs(lonToX(maxLon, z) - lonToX(minLon, z));
    const h = Math.abs(latToY(minLat, z) - latToY(maxLat, z));
    if (w <= width - padding * 2 && h <= height - padding * 2) {
      zoom = z;
      break;
    }
  }

  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;
  const centerX = lonToX(centerLon, zoom);
  const centerY = latToY(centerLat, zoom);

  const originX = centerX - width / 2;
  const originY = centerY - height / 2;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e5e5e5';
  ctx.fillRect(0, 0, width, height);

  const tileCount = Math.pow(2, zoom);
  const firstTileX = Math.floor(originX / TILE_SIZE);
  const lastTileX = Math.floor((originX + width) / TILE_SIZE);
  const firstTileY = Math.floor(originY / TILE_SIZE);
  const lastTileY = Math.floor((originY + height) / TILE_SIZE);

  const jobs = [];
  for (let tx = firstTileX; tx <= lastTileX; tx++) {
    for (let ty = firstTileY; ty <= lastTileY; ty++) {
      if (ty < 0 || ty >= tileCount) continue;
      const wrappedX = ((tx % tileCount) + tileCount) % tileCount;
      const url = `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`;
      const dx = tx * TILE_SIZE - originX;
      const dy = ty * TILE_SIZE - originY;
      jobs.push(loadTile(url).then((img) => ({ img, dx, dy })));
    }
  }

  const tiles = await Promise.all(jobs);
  tiles.forEach(({ img, dx, dy }) => {
    if (img) ctx.drawImage(img, Math.round(dx), Math.round(dy), TILE_SIZE, TILE_SIZE);
  });

  ctx.beginPath();
  coords.forEach((c, i) => {
    const px = lonToX(c[1], zoom) - originX;
    const py = latToY(c[0], zoom) - originY;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(51, 51, 51, 0.35)';
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.font = '12px sans-serif';
  const text = '© OpenStreetMap contributors';
  const tw = ctx.measureText(text).width;
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(width - tw - 12, height - 22, tw + 12, 22);
  ctx.fillStyle = '#333333';
  ctx.fillText(text, width - tw - 6, height - 7);

  try {
    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Map canvas export error:', err);
    return null;
  }
}
