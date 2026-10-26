import fs from 'fs';

const atas = fs.readFileSync('static/img/rahang-atas.svg', 'utf8');
const bawah = fs.readFileSync('static/img/rahang-bawah.svg', 'utf8');
const tengah = fs.readFileSync('static/img/rahang-tengah.svg', 'utf8');

// In rahang-atas.svg, what are the coordinates of the back-right green body?
// In rahang-bawah.svg, what are the coordinates of the back-right green body?

console.log('Checking alignment:');
// rahang-atas width = 1095
// rahang-bawah width = 1090
// rahang-tengah width = 166 (maroon: 73.9, green: 92.0)

// Let's check X ranges of green in atas and bawah on the right side:
// In atas, path 33 (fill="#2E5823") ends at X = 1057.3
// In bawah, path 29 (fill="#2E5823") is: M1045.57 32.0469H907.402V133.528...
