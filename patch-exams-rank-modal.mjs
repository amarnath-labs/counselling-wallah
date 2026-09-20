import fs from 'node:fs';

const file =
  './frontend/src/pages/Exams.jsx';

const backup =
  './frontend/src/pages/Exams.jsx.before-rank-modal';

let source =
  fs.readFileSync(
    file,
    'utf8'
  );

fs.copyFileSync(
  file,
  backup
);

const oldBlock = `          <section
            style={{
              maxWidth:
                '760px',
              margin:
                '36px auto 0',
              padding:
                '26px',
              border:
                '1px solid #e2e8f0',
              borderRadius:
                '18px',
              background:
                '#ffffff',
              boxShadow:
                '0 8px 30px rgba(15, 23, 42, 0.06)',
            }}
          >`;

const newBlock = `          <section
            role="dialog"
            aria-modal="true"
            aria-label="Select rank type"
            style={{
              position:
                'fixed',
              top:
                '50%',
              left:
                '50%',
              transform:
                'translate(-50%, -50%)',
              width:
                'min(760px, calc(100vw - 32px))',
              maxHeight:
                'calc(100vh - 40px)',
              overflowY:
                'auto',
              padding:
                '26px',
              border:
                '1px solid #e2e8f0',
              borderRadius:
                '18px',
              background:
                '#ffffff',
              boxShadow:
                '0 24px 80px rgba(15, 23, 42, 0.28)',
              zIndex:
                9999,
            }}
          >`;

if (
  !source.includes(
    oldBlock
  )
) {
  console.error(
    '❌ Rank selector section not found'
  );

  process.exit(1);
}

source =
  source.replace(
    oldBlock,
    newBlock
  );

fs.writeFileSync(
  file,
  source,
  'utf8'
);

console.log(
  '✅ Rank selector converted to popup/modal'
);

console.log(
  '✅ JoSAA click will show rank options immediately'
);

console.log(
  '✅ CSAB click will show JEE Main rank immediately'
);

console.log(
  '✅ Backend/scoring untouched'
);
