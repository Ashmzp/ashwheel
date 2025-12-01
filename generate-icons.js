import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple SVG icon and convert to base64 PNG
const createIcon = (size) => {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#6d28d9"/>
    <text x="50%" y="50%" font-size="${size * 0.4}" fill="white" text-anchor="middle" dy=".35em" font-family="Arial, sans-serif" font-weight="bold">A</text>
  </svg>`;
  return svg;
};

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'public', 'images');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG icons (browsers support SVG in manifest)
const sizes = [192, 512];
sizes.forEach(size => {
  const svg = createIcon(size);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  fs.writeFileSync(path.join(iconsDir, `icon-maskable-${size}x${size}.svg`), svg);
  console.log(`Created icon-${size}x${size}.svg`);
});

console.log('Icons generated successfully!');
console.log('Note: For production, replace these with proper PNG icons using an image editor or online tool.');
