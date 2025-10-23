const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_eX6xik3PSwfM@ep-odd-hall-a4gaso70.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkSchema() {
  try {
    console.log('Tables in the database:');
    console.log('======================\n');
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    for (const row of tables.rows) {
      console.log(`Table: ${row.table_name}`);
      
      // Get columns
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `, [row.table_name]);
      
      console.log('  Columns:');
      columns.rows.forEach(col => {
        console.log(`    - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
      
      // Get indexes
      const indexes = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public' AND tablename = $1;
      `, [row.table_name]);
      
      console.log('  Indexes:');
      if (indexes.rows.length === 0) {
        console.log('    - No indexes found!');
      } else {
        indexes.rows.forEach(idx => {
          console.log(`    - ${idx.indexname}`);
          console.log(`      ${idx.indexdef}`);
        });
      }
      
      // Get row count
      const count = await pool.query(`SELECT COUNT(*) as count FROM "${row.table_name}"`);
      console.log(`  Row count: ${count.rows[0].count}\n`);
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkSchema();
