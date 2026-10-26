import fs from 'fs';

const atas = fs.readFileSync('static/img/rahang-atas.svg', 'utf8');
const bawah = fs.readFileSync('static/img/rahang-bawah.svg', 'utf8');
const tengah = fs.readFileSync('static/img/rahang-tengah.svg', 'utf8');
const duri = fs.readFileSync('static/img/duri-hitam.svg', 'utf8');

// Let's check how rahang-tengah is drawn
console.log('Tengah content:\n', tengah);
