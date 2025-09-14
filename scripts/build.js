#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the landing HTML
const landingHtml = fs.readFileSync(path.join(__dirname, '../src/landing.html'), 'utf8');

// Read the brain image and convert to base64
const imagePath = path.join(__dirname, '../src/assets/brain-image.jpg');
const imageBase64 = fs.readFileSync(imagePath).toString('base64');

// Read the worker source
let workerSource = fs.readFileSync(path.join(__dirname, '../src/worker.ts'), 'utf8');

// Escape the HTML for embedding
const escapedHtml = landingHtml
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$/g, '\\$');

// Replace the HTML placeholder
workerSource = workerSource.replace(
  'const LANDING_HTML = `[LANDING_HTML_CONTENT]`; // Will be replaced during build',
  `const LANDING_HTML = \`${escapedHtml}\`;`
);

// Replace the image placeholder
workerSource = workerSource.replace(
  'const BRAIN_IMAGE_BASE64 = `[BRAIN_IMAGE_BASE64]`; // Will be replaced during build',
  `const BRAIN_IMAGE_BASE64 = \`${imageBase64}\`;`
);

// Write the final worker file
fs.writeFileSync(path.join(__dirname, '../src/index.ts'), workerSource);

console.log('✅ Build complete - HTML and image embedded in worker');