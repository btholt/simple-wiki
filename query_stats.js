const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_eX6xik3PSwfM@ep-odd-hall-a4gaso70.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function getSlowQueries() {
  try {
    const result = await pool.query(`
      SELECT 
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        rows,
        shared_blks_hit,
        shared_blks_read
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_stat_statements%'
        AND query NOT LIKE '%EXPLAIN%'
        AND query NOT LIKE '%DO \$%'
        AND query NOT LIKE '%SELECT pg_catalog.sum%'
        AND calls > 0
      ORDER BY mean_exec_time DESC
      LIMIT 10;
    `);
    
    console.log('Slow Queries Analysis:');
    console.log('======================\n');
    result.rows.forEach((row, i) => {
      console.log(`Query #${i + 1}:`);
      console.log(`Query: ${row.query.substring(0, 200)}`);
      console.log(`Calls: ${row.calls}`);
      console.log(`Mean exec time: ${row.mean_exec_time} ms`);
      console.log(`Total exec time: ${row.total_exec_time} ms`);
      console.log(`Rows returned: ${row.rows}`);
      console.log(`Shared blocks hit: ${row.shared_blks_hit}`);
      console.log(`Shared blocks read: ${row.shared_blks_read}`);
      console.log('---\n');
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

getSlowQueries();
