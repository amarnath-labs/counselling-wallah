import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.resolve(
  __dirname,
  '../../data/official/josaa-institutes.html'
);

function cleanText(value) {
  return value
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function getTypeFromCode(code) {
  if (code >= 100 && code < 200) return 'IIT';
  if (code >= 200 && code < 300) return 'NIT';
  if (code >= 300 && code < 400) return 'IIIT';
  return 'GFTI';
}

function makeId(name) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function inferState(address = '') {
  const states = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Delhi',
    'Jammu and Kashmir',
  ];

  const found = states.find((state) =>
    address.toLowerCase().includes(state.toLowerCase())
  );

  return found || 'India';
}

function inferCity(address = '') {
  const parts = address
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

  return parts.length ? parts[0] : 'India';
}

function parseInstitutes(html) {
  const institutes = [];

  const regex =
    /<span[^>]*id="[^"]*lblinstcd"[^>]*>([\s\S]*?)<\/span>/gi;

  let match;

  while ((match = regex.exec(html)) !== null) {
    const raw = cleanText(match[1]);

    const codeMatch = raw.match(/^(\d+)\s+(.+)$/);

    if (!codeMatch) continue;

    const code = Number(codeMatch[1]);
    const name = codeMatch[2].trim();

    if (!name) continue;

    // Find the table row surrounding this institute.
    const start = Math.max(0, match.index - 1500);
    const end = Math.min(html.length, match.index + 5000);

    const surrounding = html.slice(start, end);

    const addressMatch = surrounding.match(
      /<td[^>]*>\s*([\s\S]{0,3000}?)<\/td>/gi
    );

    let address = '';

    if (addressMatch && addressMatch.length >= 2) {
      address = cleanText(addressMatch[1]);
    }

    const type = getTypeFromCode(code);

    institutes.push({
      code,
      name,
      type,
      address,
      city: inferCity(address),
      state: inferState(address),
      source: 'JoSAA',
      sourceUrl:
        'https://josaa.admissions.nic.in/applicant/seatmatrix/instituteview.aspx',
      year: 2026,
    });
  }

  // Remove duplicate institute codes.
  const unique = new Map();

  for (const institute of institutes) {
    unique.set(institute.code, institute);
  }

  return [...unique.values()];
}

async function main() {
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`JoSAA HTML not found: ${htmlPath}`);
  }

  const html = fs.readFileSync(htmlPath, 'utf8');

  const institutes = parseInstitutes(html);

  console.log(`Found ${institutes.length} JoSAA institutes.`);

  if (!institutes.length) {
    throw new Error(
      'No institutes were detected. JoSAA HTML structure may have changed.'
    );
  }

  const outputPath = path.resolve(
    __dirname,
    '../../data/official/institutes-2026.json'
  );

  fs.writeFileSync(
    outputPath,
    JSON.stringify(institutes, null, 2),
    'utf8'
  );

  console.log(`Saved JSON: ${outputPath}`);

  let inserted = 0;
  let updated = 0;

  for (const institute of institutes) {
    const id = makeId(institute.name);

    const result = await pool.query(
      `
      INSERT INTO colleges (
        id,
        name,
        city,
        state,
        type,
        website,
        portal
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        type = EXCLUDED.type,
        portal = EXCLUDED.portal,
        updated_at = NOW()
      RETURNING (xmax = 0) AS inserted
      `,
      [
        id,
        institute.name,
        institute.city,
        institute.state,
        institute.type,
        null,
        'https://josaa.nic.in/',
      ]
    );

    if (result.rows[0]?.inserted) {
      inserted++;
    } else {
      updated++;
    }
  }

  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Total processed: ${institutes.length}`);

  await pool.end();
}

main().catch(async (error) => {
  console.error('IMPORT FAILED');
  console.error(error);

  try {
    await pool.end();
  } catch {}

  process.exit(1);
});