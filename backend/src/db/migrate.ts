import fs from 'fs';
import path from 'path';
import pool from './pool';

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  await pool.query(schema);
  console.log('Database migrated successfully');
}

if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export default migrate;