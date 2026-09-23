import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';


const BASE =
  path.resolve(
    './data/neet/mcc/2024'
  );


const RAW =
  path.join(
    BASE,
    'raw'
  );


const TEXT =
  path.join(
    BASE,
    'text'
  );


fs.mkdirSync(
  TEXT,
  {
    recursive:
      true,
  }
);


const rounds = [
  'round-1',
  'round-2',
  'round-3',
];


function sha256(
  file
) {
  return crypto
    .createHash(
      'sha256'
    )
    .update(
      fs.readFileSync(
        file
      )
    )
    .digest(
      'hex'
    );
}


/*
|--------------------------------------------------------------------------
| Create Python extractor
|--------------------------------------------------------------------------
*/

const pyFile =
  path.resolve(
    './backend/extract-neet-mcc-2024.py'
  );


const pySource = `
from pathlib import Path
import sys

try:
    from pypdf import PdfReader
except ImportError:
    print("MISSING_PYPDF")
    sys.exit(10)

pdf_path = Path(sys.argv[1])
txt_path = Path(sys.argv[2])

reader = PdfReader(str(pdf_path))

parts = []

for page_no, page in enumerate(reader.pages, start=1):
    try:
        text = page.extract_text() or ""
    except Exception as exc:
        text = ""
        print(
            f"WARNING page {page_no}: {exc}",
            file=sys.stderr
        )

    parts.append(text)

txt_path.write_text(
    "\\n\\n".join(parts),
    encoding="utf-8"
)

print(
    f"PAGES={len(reader.pages)}"
)

print(
    f"CHARS={sum(len(x) for x in parts)}"
)
`;


fs.writeFileSync(
  pyFile,
  pySource,
  'utf8'
);


/*
|--------------------------------------------------------------------------
| Resolve Python executable
|--------------------------------------------------------------------------
*/

function resolvePython() {

  const candidates = [
    'python',
    'py',
  ];


  for (
    const candidate of
    candidates
  ) {

    const test =
      spawnSync(
        candidate,
        [
          '--version'
        ],
        {
          encoding:
            'utf8',
        }
      );


    if (
      !test.error &&
      test.status ===
        0
    ) {
      return candidate;
    }
  }


  throw new Error(
    'Python not found on PATH.'
  );
}


const python =
  resolvePython();


console.log(
  `Using Python: ${python}`
);


/*
|--------------------------------------------------------------------------
| Ensure pypdf exists
|--------------------------------------------------------------------------
*/

let test =
  spawnSync(
    python,
    [
      '-c',
      'import pypdf; print(pypdf.__version__)'
    ],
    {
      encoding:
        'utf8',
    }
  );


if (
  test.status !==
  0
) {

  console.log(
    '\npypdf not installed. Installing...'
  );


  const install =
    spawnSync(
      python,
      [
        '-m',
        'pip',
        'install',
        'pypdf'
      ],
      {
        stdio:
          'inherit',
      }
    );


  if (
    install.status !==
    0
  ) {
    throw new Error(
      'pypdf installation failed.'
    );
  }
}


/*
|--------------------------------------------------------------------------
| Extract all rounds
|--------------------------------------------------------------------------
*/

const report = [];


for (
  const round of
  rounds
) {

  const pdf =
    path.join(
      RAW,
      `${round}.pdf`
    );


  const txt =
    path.join(
      TEXT,
      `${round}.txt`
    );


  if (
    !fs.existsSync(
      pdf
    )
  ) {
    throw new Error(
      `Missing PDF: ${pdf}`
    );
  }


  console.log(
    `\nExtracting ${round}...`
  );


  const result =
    spawnSync(
      python,
      [
        pyFile,
        pdf,
        txt
      ],
      {
        encoding:
          'utf8',
      }
    );


  if (
    result.stdout
  ) {
    console.log(
      result.stdout.trim()
    );
  }


  if (
    result.stderr
  ) {
    console.error(
      result.stderr.trim()
    );
  }


  if (
    result.status !==
    0
  ) {
    throw new Error(
      `${round} extraction failed with code ${result.status}`
    );
  }


  const text =
    fs.readFileSync(
      txt,
      'utf8'
    );


  const lines =
    text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .map(
        line =>
          line
            .replace(/\s+/g, ' ')
            .trim()
      )
      .filter(Boolean);


  const item = {
    round,

    pdfBytes:
      fs.statSync(
        pdf
      ).size,

    pdfSha256:
      sha256(
        pdf
      ),

    textChars:
      text.length,

    nonEmptyLines:
      lines.length,

    first60Lines:
      lines.slice(
        0,
        60
      ),
  };


  report.push(
    item
  );


  console.log(
    `${round}: ${lines.length} non-empty lines`
  );
}


/*
|--------------------------------------------------------------------------
| Save report
|--------------------------------------------------------------------------
*/

const reportFile =
  path.join(
    BASE,
    'extraction-report.json'
  );


fs.writeFileSync(
  reportFile,
  JSON.stringify(
    report,
    null,
    2
  ),
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 PYTHON EXTRACTION COMPLETE'
);

console.log(
  '========================================'
);


for (
  const item of
  report
) {

  console.log(
    `\n===== ${item.round.toUpperCase()} =====`
  );


  console.log(
    `PDF bytes: ${item.pdfBytes}`
  );


  console.log(
    `SHA256: ${item.pdfSha256}`
  );


  console.log(
    `Text chars: ${item.textChars}`
  );


  console.log(
    `Non-empty lines: ${item.nonEmptyLines}`
  );


  console.log(
    '\nFIRST 60 LINES'
  );


  item.first60Lines
    .forEach(
      (
        line,
        index
      ) => {

        console.log(
          `${String(index).padStart(2, '0')}: ${line}`
        );
      }
    );
}
