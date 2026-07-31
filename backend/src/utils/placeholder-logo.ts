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

export async function ensurePlaceholderLogo(): Promise<void> {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  if (!fs.existsSync(LOGO_PATH)) {
    // Generate a simple blue shield SVG as placeholder PNG
    const svgLogo = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24">
      <rect width="24" height="24" fill="#0f172a" rx="4"/>
      <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5L12 2z" fill="#3b82f6"/>
      <path d="M12 4L6 6.5V11c0 4.28 2.96 8.28 6 9.58 3.04-1.3 6-5.3 6-9.58V6.5L12 4z" fill="#1e40af"/>
      <text x="12" y="15" text-anchor="middle" font-family="Arial" font-size="8" fill="#60a5fa" font-weight="bold">SP</text>
    </svg>`;

    await sharp(Buffer.from(svgLogo))
      .resize(200, 200)
      .png()
      .toFile(LOGO_PATH);

    console.log('[LOGO] Placeholder shield logo generated at assets/shield-logo.png');
    console.log('[LOGO] Replace with your actual Shield Protocol logo PNG for best results.');
  }
}
