#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the landing HTML
const landingHtml = fs.readFileSync(path.join(__dirname, '../src/landing.html'), 'utf8');

// Read the worker source
let workerSource = fs.readFileSync(path.join(__dirname, '../src/worker.ts'), 'utf8');

// Escape the HTML for embedding
const escapedHtml = landingHtml
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\$/g, '\\$');

// Replace the placeholder with actual HTML
workerSource = workerSource.replace(
  'const LANDING_HTML = `[LANDING_HTML_CONTENT]`; // Will be replaced during build',
  `const LANDING_HTML = \`${escapedHtml}\`;`
);

// Write the final worker file
fs.writeFileSync(path.join(__dirname, '../src/index.ts'), workerSource);

console.log('✅ Build complete - HTML embedded in worker');