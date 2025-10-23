const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_eX6xik3PSwfM@ep-odd-hall-a4gaso70.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function explainQuery() {
  try {
    console.log('EXPLAIN ANALYZE for home page query:');
    console.log('====================================\n');
    
    // This is the query from app/page.tsx
    const result = await pool.query(`
      EXPLAIN (ANALYZE, BUFFERS, VERBOSE) 
      SELECT 
        articles.id,
        articles.title,
        articles.updated_at,
        articles.author_id,
        "user".name as author_name
      FROM articles
      LEFT JOIN "user" ON articles.author_id = "user".id
      ORDER BY articles.updated_at;
    `);
    
    result.rows.forEach(row => {
      console.log(row['QUERY PLAN']);
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

explainQuery();
