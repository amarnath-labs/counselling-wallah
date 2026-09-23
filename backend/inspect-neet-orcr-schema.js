import fs from 'fs';
import path from 'path';

const root =
  path.resolve(
    './data/neet/mcc'
  );

function walk(dir) {
  const out = [];

  for (
    const item of
    fs.readdirSync(
      dir,
      {
        withFileTypes: true,
      }
    )
  ) {
    const full =
      path.join(
        dir,
        item.name
      );

    if (
      item.isDirectory()
    ) {
      out.push(
        ...walk(full)
      );
      continue;
    }

    if (
      /orcr/i.test(
        item.name
      ) &&
      item.name.endsWith(
        '.json'
      )
    ) {
      out.push(full);
    }
  }

  return out;
}

const files =
  walk(root);

for (
  const file of
  files
) {
  let data;

  try {
    data =
      JSON.parse(
        fs.readFileSync(
          file,
          'utf8'
        )
      );
  } catch (error) {
    console.log(
      '\nINVALID JSON:',
      file,
      error.message
    );

    continue;
  }

  const rows =
    Array.isArray(data)
      ? data
      : Array.isArray(
          data?.rows
        )
        ? data.rows
        : Array.isArray(
            data?.data
          )
          ? data.data
          : [];

  console.log(
    '\n----------------------------------------'
  );

  console.log(
    path.relative(
      process.cwd(),
      file
    )
  );

  console.log(
    'Rows:',
    rows.length
  );

  console.log(
    'First row:'
  );

  console.log(
    JSON.stringify(
      rows[0] ?? null,
      null,
      2
    )
  );
}
