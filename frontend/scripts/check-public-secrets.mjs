import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// Supply synthetic sentinel values when building, then the same values here.
// Scan JS/CSS/static assets plus pre-rendered public HTML. Never print secrets.
const values = (process.env.PUBLIC_SECRET_SENTINELS ?? '').split(',').filter(Boolean);
if (!values.length) throw new Error('PUBLIC_SECRET_SENTINELS must contain the synthetic build sentinel values');
let checked = 0;
async function scan(directory, htmlOnly = false) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await scan(file, htmlOnly);
    else if (!htmlOnly || entry.name.endsWith('.html')) {
      const bytes = await readFile(file);
      if (values.some(value => bytes.includes(Buffer.from(value)))) {
        throw new Error('Server-only sentinel was found in public build output: ' + file);
      }
      checked++;
    }
  }
}
await scan('.next/static');
await scan('.next/server/app', true);
console.log(`PASS: ${checked} public assets/HTML files contain no server-only sentinel values`);
