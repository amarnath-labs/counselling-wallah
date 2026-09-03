import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';

const __dirname =
  path.dirname(
    fileURLToPath(import.meta.url)
  );

const migrationsDir =
  path.resolve(
    __dirname,
    '../../../database/migrations'
  );

try {
  const files =
    (await fs.readdir(migrationsDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

  for (const file of files) {
    const migrationPath =
      path.join(migrationsDir, file);

    const rawSql =
      await fs.readFile(
        migrationPath,
        'utf8'
      );

    const sql =
      rawSql.replace(/^\uFEFF/, '');

    console.log(
      `Running migration: ${file}`
    );

    await pool.query(sql);

    console.log(
      `Completed migration: ${file}`
    );
  }

  console.log(
    'Database migration completed.'
  );
} catch (error) {
  console.error(
    'Database migration failed:',
    error.message
  );

  process.exitCode = 1;
} finally {
  await pool.end();
}
