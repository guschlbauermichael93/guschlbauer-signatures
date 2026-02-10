/**
 * Generiert einfache PNG-Icons für das Outlook Add-In
 * Erzeugt einen orangenen Kreis (Guschlbauer Brand Color)
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c >>> 0;
  }

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const typeBuffer = Buffer.from(type);
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crcValue = Buffer.alloc(4);
    crcValue.writeUInt32BE(crc32(crcData));
    return Buffer.concat([length, typeBuffer, data, crcValue]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // 8-bit
  ihdr[9] = 2;  // RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Pixel data: orangener Kreis auf weißem Hintergrund
  const rawData = Buffer.alloc(size * (1 + size * 3));
  let offset = 0;
  const cx = size / 2, cy = size / 2, r = size * 0.4;

  for (let y = 0; y < size; y++) {
    rawData[offset++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const dx = x - cx + 0.5, dy = y - cy + 0.5;
      if (dx * dx + dy * dy < r * r) {
        rawData[offset++] = 0xed; // R
        rawData[offset++] = 0x75; // G
        rawData[offset++] = 0x1d; // B
      } else {
        rawData[offset++] = 255;
        rawData[offset++] = 255;
        rawData[offset++] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

const assetsDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

[16, 25, 32, 48, 64, 80, 128, 192].forEach(size => {
  fs.writeFileSync(path.join(assetsDir, `icon-${size}.png`), createPng(size));
  console.log(`icon-${size}.png`);
});

[16, 32, 80].forEach(size => {
  fs.writeFileSync(path.join(assetsDir, `settings-${size}.png`), createPng(size));
  console.log(`settings-${size}.png`);
});

console.log('Alle Icons generiert!');
