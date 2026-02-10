/**
 * Icon Generation Script
 * 
 * Generiert alle benötigten Icon-Größen aus einer SVG-Vorlage.
 * 
 * Verwendung:
 * 1. Ersetze icon-192.svg mit eurem echten Logo
 * 2. npm install sharp
 * 3. node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Falls sharp installiert ist
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('sharp nicht installiert. Installiere mit: npm install sharp');
  console.log('Oder erstelle die Icons manuell in folgenden Größen:');
  console.log('- icon-16.png');
  console.log('- icon-25.png');
  console.log('- icon-32.png');
  console.log('- icon-48.png');
  console.log('- icon-64.png');
  console.log('- icon-80.png');
  console.log('- icon-128.png');
  console.log('- icon-192.png');
  console.log('- settings-16.png');
  console.log('- settings-32.png');
  console.log('- settings-80.png');
  process.exit(0);
}

const sizes = [16, 25, 32, 48, 64, 80, 128, 192];
const assetsDir = path.join(__dirname, '..', 'apps', 'outlook-addin', 'assets');
const svgPath = path.join(assetsDir, 'icon-192.svg');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);
  
  for (const size of sizes) {
    const outputPath = path.join(assetsDir, `icon-${size}.png`);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`Generated: icon-${size}.png`);
  }
  
  // Settings Icons (falls ein separates Icon gewünscht)
  // Vorerst das gleiche Icon verwenden
  for (const size of [16, 32, 80]) {
    const src = path.join(assetsDir, `icon-${size}.png`);
    const dest = path.join(assetsDir, `settings-${size}.png`);
    fs.copyFileSync(src, dest);
    console.log(`Copied: settings-${size}.png`);
  }
  
  console.log('Done!');
}

generateIcons().catch(console.error);
