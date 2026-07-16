import { chromium } from 'playwright';
import fs from 'fs';

const html = fs.readFileSync('scripts/_out-email.html', 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 640, height: 1000 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'scripts/_email-preview.png', fullPage: true });

// mobile
await page.setViewportSize({ width: 380, height: 900 });
await page.screenshot({ path: 'scripts/_email-mobile.png', fullPage: true });

// PDF html preview
const pdfHtml = fs.readFileSync('scripts/_out-pdf.html', 'utf8');
await page.setViewportSize({ width: 850, height: 1100 });
await page.setContent(pdfHtml, { waitUntil: 'networkidle' });
await page.screenshot({ path: 'scripts/_pdf-preview.png', fullPage: true });

await browser.close();
console.log('screenshots written');