import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    crc ^= byte;
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generatePNG(size, outPath) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Uncompressed scanlines
  const rowStride = 1 + size * 4;
  const rawData = Buffer.alloc(size * rowStride);

  // Background color: #275DAD -> R: 39, G: 93, B: 173, A: 255
  // Foreground / Glyph: White (255, 255, 255, 255)
  const bgR = 39, bgG = 93, bgB = 173;
  const fgR = 255, fgG = 255, fgB = 255;

  const center = size / 2;
  const radius = size * 0.45;
  const boxHalf = size * 0.22;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowStride;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < size; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Draw rounded container and house/building silhouette
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Simple icon drawing: White house / building in center
      // Roof: triangle from (center, center - boxHalf*1.2) down to (center - boxHalf, center - boxHalf*0.2) and (center + boxHalf, center - boxHalf*0.2)
      // Body: rect from (center - boxHalf*0.8, center - boxHalf*0.2) to (center + boxHalf*0.8, center + boxHalf)
      // Door: center - boxHalf*0.3 to center + boxHalf*0.3, center + boxHalf*0.2 to center + boxHalf
      const inRoof = (y >= center - boxHalf * 1.3) && (y <= center - boxHalf * 0.1) &&
                     (Math.abs(dx) <= (y - (center - boxHalf * 1.3)) * 0.9);

      const inBody = (y >= center - boxHalf * 0.1) && (y <= center + boxHalf * 0.9) &&
                     (Math.abs(dx) <= boxHalf * 0.75);

      const inDoor = (y >= center + boxHalf * 0.25) && (y <= center + boxHalf * 0.9) &&
                     (Math.abs(dx) <= boxHalf * 0.28);

      const isGlyph = (inRoof || inBody) && !inDoor;

      if (isGlyph) {
        rawData[pxOffset] = fgR;
        rawData[pxOffset + 1] = fgG;
        rawData[pxOffset + 2] = fgB;
        rawData[pxOffset + 3] = 255;
      } else {
        rawData[pxOffset] = bgR;
        rawData[pxOffset + 1] = bgG;
        rawData[pxOffset + 2] = bgB;
        rawData[pxOffset + 3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  const png = Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, png);
  console.log(`Generated: ${outPath} (${size}x${size}, ${png.length} bytes)`);
}

const iconsDir = path.resolve('public', 'icons');
generatePNG(192, path.join(iconsDir, 'icon-192x192.png'));
generatePNG(512, path.join(iconsDir, 'icon-512x512.png'));
