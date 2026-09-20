import fs from 'fs';

const data = JSON.parse(
  fs.readFileSync('./cwrec-production-seed.json', 'utf8')
);

for (const [table, rows] of Object.entries(data)) {
  console.log('');
  console.log('TABLE:', table);
  console.log('ROWS :', rows.length);

  if (rows.length > 0) {
    console.log(
      'COLUMNS:',
      Object.keys(rows[0]).join(', ')
    );
  }
}
