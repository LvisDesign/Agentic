import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

async function main() {
  const logoPath = path.resolve('public/images/setlla-logo-white.png');
  const trimmedLogoBuffer = await sharp(logoPath).trim().toBuffer();
  const trimmedMeta = await sharp(trimmedLogoBuffer).metadata();
  console.log('Trimmed logo meta:', trimmedMeta.width, 'x', trimmedMeta.height);

  const sizes = [
    { size: 512, logoWidth: 360, dests: ['public/icons/icon-512x512.png'] },
    { size: 192, logoWidth: 136, dests: ['public/icons/icon-192x192.png'] },
    { size: 180, logoWidth: 128, dests: ['public/icons/apple-touch-icon.png', 'public/apple-touch-icon.png'] },
    { size: 64,  logoWidth: 48,  dests: ['public/favicon-64x64.png'] },
    { size: 32,  logoWidth: 26,  dests: ['public/favicon-32x32.png'] },
  ];

  for (const { size, logoWidth, dests } of sizes) {
    const logoHeight = Math.round(logoWidth * trimmedMeta.height / trimmedMeta.width);
    const resizedLogo = await sharp(trimmedLogoBuffer)
      .resize(logoWidth, logoHeight, { fit: 'contain' })
      .toBuffer();

    const canvas = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      }
    })
    .composite([
      {
        input: resizedLogo,
        gravity: 'centre'
      }
    ])
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

    for (const dest of dests) {
      const fullDest = path.resolve(dest);
      fs.mkdirSync(path.dirname(fullDest), { recursive: true });
      fs.writeFileSync(fullDest, canvas);
      console.log(`Generated: ${dest} (${size}x${size}, ${canvas.length} bytes)`);
    }
  }

  const logoBase64 = trimmedLogoBuffer.toString('base64');
  const svg512 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#000000"/>
  <image href="data:image/png;base64,${logoBase64}" x="76" y="202" width="360" height="107"/>
</svg>
`;
  fs.writeFileSync(path.resolve('public/icons/icon.svg'), svg512);
  fs.writeFileSync(path.resolve('public/favicon.svg'), svg512);
  console.log('Generated public/icons/icon.svg and public/favicon.svg');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
