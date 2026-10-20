const fs = require('fs');
const path = require('path');

const dir = __dirname;
let html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(dir, 'style.css'), 'utf8');
const introJs = fs.readFileSync(path.join(dir, 'canvas-intro.js'), 'utf8');
const oilJs = fs.readFileSync(path.join(dir, 'oil-simulation.js'), 'utf8');
const appJs = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');

// Replace CSS link with inline style
html = html.replace('<link rel="stylesheet" href="style.css">', `<style>\n${css}\n</style>`);

// Replace external JS script tags with inline scripts
const scriptsBlock = `
  <script>
    // --- 1. INTRO ENGINE ---
    ${introJs}

    // --- 2. OIL DYNAMICS & LAB SIMULATION ---
    ${oilJs}

    // --- 3. APPLICATION LOGIC ---
    ${appJs}
  </script>
`;

html = html.replace(
  /<script src="canvas-intro\.js"><\/script>\s*<script src="oil-simulation\.js"><\/script>\s*<script src="app\.js"><\/script>/,
  scriptsBlock
);

fs.writeFileSync(path.join(dir, 'google-sites-embed.html'), html, 'utf8');
console.log('Successfully created google-sites-embed.html (Single-file bundle)');
