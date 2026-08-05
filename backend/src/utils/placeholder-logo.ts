/**
 * This utility creates a placeholder SVG shield logo
 * if no PNG logo is present in the assets directory.
 * Once you have your actual shield-logo.png, place it
 * in backend/assets/ and this fallback won't be needed.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ASSETS_DIR = path.join(process.cwd(), 'assets');
const LOGO_PATH = path.join(ASSETS_DIR, 'shield-logo.png');

export function getShieldLogoSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <!-- Metallic outer border gradient -->
    <linearGradient id="metalBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="25%" stop-color="#94a3b8" />
      <stop offset="50%" stop-color="#e2e8f0" />
      <stop offset="75%" stop-color="#475569" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>

    <!-- Inner rim gradient -->
    <linearGradient id="innerBevel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>

    <!-- Core shield cyan/blue gradient -->
    <radialGradient id="shieldCore" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="40%" stop-color="#0284c7" />
      <stop offset="85%" stop-color="#0c4a6e" />
      <stop offset="100%" stop-color="#082f49" />
    </radialGradient>

    <!-- Glow & drop shadow -->
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#0284c7" flood-opacity="0.5" />
    </filter>

    <filter id="textGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.7" />
    </filter>

    <!-- SP Metallic Text Gradient -->
    <linearGradient id="spTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="40%" stop-color="#f1f5f9" />
      <stop offset="50%" stop-color="#cbd5e1" />
      <stop offset="100%" stop-color="#94a3b8" />
    </linearGradient>
  </defs>

  <!-- Dark Background Container with rounded corners -->
  <rect width="512" height="512" fill="#060b18" rx="64"/>

  <!-- Outer Metallic Shield Frame -->
  <path d="M 256 40 
           C 310 40, 420 65, 430 80 
           C 440 180, 420 330, 256 460 
           C 92 330, 72 180, 82 80 
           C 92 65, 202 40, 256 40 Z" 
        fill="url(#metalBorder)" 
        filter="url(#dropShadow)" />

  <!-- Inner Bevel Rim -->
  <path d="M 256 54 
           C 305 54, 404 77, 413 90 
           C 422 178, 404 314, 256 434 
           C 108 314, 90 178, 99 90 
           C 108 77, 207 54, 256 54 Z" 
        fill="url(#innerBevel)" />

  <!-- Main Shield Body (Cyan/Blue) -->
  <path d="M 256 68 
           C 300 68, 388 88, 396 100 
           C 404 176, 388 298, 256 408 
           C 124 298, 108 176, 116 100 
           C 124 88, 212 68, 256 68 Z" 
        fill="url(#shieldCore)" />

  <!-- Glossy Reflection Highlight -->
  <path d="M 256 74 
           C 295 74, 375 92, 386 103 
           C 390 140, 380 200, 360 250 
           C 310 200, 200 200, 152 250 
           C 132 200, 122 140, 126 103 
           C 137 92, 217 74, 256 74 Z" 
        fill="#ffffff" 
        opacity="0.15" />

  <!-- Central "SP" Text replacing tick mark -->
  <text x="256" y="270" 
        text-anchor="middle" 
        dominant-baseline="central"
        font-family="'Inter', 'Arial Black', sans-serif" 
        font-size="140" 
        font-weight="900" 
        letter-spacing="4"
        fill="url(#spTextGrad)"
        stroke="#0f172a"
        stroke-width="4"
        filter="url(#textGlow)">SP</text>
</svg>`;
}

export async function ensurePlaceholderLogo(): Promise<void> {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  const svgLogo = getShieldLogoSvg();

  await sharp(Buffer.from(svgLogo))
    .resize(512, 512)
    .png()
    .toFile(LOGO_PATH);

  console.log('[LOGO] Shield Protocol "SP" logo updated at assets/shield-logo.png');
}

