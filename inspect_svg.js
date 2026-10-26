import fs from 'fs';

const atas = fs.readFileSync('static/img/rahang-atas.svg', 'utf8');
const bawah = fs.readFileSync('static/img/rahang-bawah.svg', 'utf8');
const tengah = fs.readFileSync('static/img/rahang-tengah.svg', 'utf8');
const duri = fs.readFileSync('static/img/duri-hitam.svg', 'utf8');

console.log('Duri header:', duri.match(/<svg[^>]+>/)?.[0]);

// Find all paths in rahang-atas
const regex = /<path\s+d="([^"]+)"(?:\s+fill="([^"]+)")?/g;
let match;
console.log('\n--- ATAS PATHS ---');
while ((match = regex.exec(atas)) !== null) {
  const d = match[1];
  const fill = match[2];
  // extract all numbers
  const nums = d.match(/[-+]?\d*\.?\d+/g)?.map(Number) || [];
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  if (fill && !fill.includes('url')) {
    console.log(`Fill: ${fill}, X: [${minX.toFixed(1)}, ${maxX.toFixed(1)}], Y: [${minY.toFixed(1)}, ${maxY.toFixed(1)}]`);
  }
}

console.log('\n--- BAWAH PATHS ---');
const regexB = /<path\s+d="([^"]+)"(?:\s+fill="([^"]+)")?/g;
while ((match = regexB.exec(bawah)) !== null) {
  const d = match[1];
  const fill = match[2];
  const nums = d.match(/[-+]?\d*\.?\d+/g)?.map(Number) || [];
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  if (fill && !fill.includes('url')) {
    console.log(`Fill: ${fill}, X: [${minX.toFixed(1)}, ${maxX.toFixed(1)}], Y: [${minY.toFixed(1)}, ${maxY.toFixed(1)}]`);
  }
}

// Check teeth bounds in Atas and Bawah
function getTeethBounds(svgStr) {
  const regT = /fill="url\([^"]+\)"/g;
  const regP = /<path\s+d="([^"]+)"\s+fill="url\([^"]+\)"/g;
  let m;
  let allMinX = Infinity, allMaxX = -Infinity, allMinY = Infinity, allMaxY = -Infinity;
  let count = 0;
  while ((m = regP.exec(svgStr)) !== null) {
    count++;
    const nums = m[1].match(/[-+]?\d*\.?\d+/g)?.map(Number) || [];
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    allMinX = Math.min(allMinX, ...xs);
    allMaxX = Math.max(allMaxX, ...xs);
    allMinY = Math.min(allMinY, ...ys);
    allMaxY = Math.max(allMaxY, ...ys);
  }
  return { count, minX: allMinX, maxX: allMaxX, minY: allMinY, maxY: allMaxY };
}

console.log('\n--- TEETH BOUNDS ---');
console.log('Atas teeth:', getTeethBounds(atas));
console.log('Bawah teeth:', getTeethBounds(bawah));
