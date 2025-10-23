# Performance Optimizations

This document describes the performance optimizations made to the API endpoints.

## Overview

The API endpoints were experiencing slow query performance due to inefficient database queries. This document outlines the issues found and the optimizations applied.

## Issue Analysis

### Problem: Slow `/api/articles/with-authors` Endpoint

**Original Query Performance:**
- Execution Time: ~1.655 ms per request
- Buffer Hits: 192+ per request
- Query Pattern: Correlated subqueries

**Root Causes:**
1. **Correlated Subqueries**: The query used 5 correlated subqueries per article row:
   - 3 subqueries for author information (name, email, article count)
   - 2 subqueries for global statistics (total articles, total users)
2. **N+1 Query Pattern**: Each article triggered multiple separate database lookups
3. **Redundant Computations**: UPPER/LOWER transformations were computed but never used
4. **Inefficient Stats**: Global statistics were recalculated for every row

### Problem: Slow `/api/articles/search` Endpoint

**Original Query Performance:**
- Execution Time: ~0.46 ms (small dataset)
- Query Pattern: Sequential scan with ILIKE

**Root Causes:**
1. **No Text Search Indexes**: ILIKE queries on title and content required full table scans
2. **Scales Poorly**: Performance degrades linearly with table size

## Optimizations Applied

### 1. Optimized `/api/articles/with-authors`

**Solution:** Replaced correlated subqueries with efficient JOINs

```sql
-- BEFORE: Correlated subqueries (slow)
SELECT 
  a.id,
  (SELECT name FROM "user" WHERE id = a.author_id) as author_name,
  (SELECT email FROM "user" WHERE id = a.author_id) as author_email,
  (SELECT COUNT(*) FROM articles WHERE author_id = a.author_id) as author_article_count,
  (SELECT COUNT(*) FROM articles) as total_articles,
  (SELECT COUNT(*) FROM "user") as total_users
FROM articles a;

-- AFTER: JOINs and separate stats query (fast)
SELECT 
  a.id,
  u.name as author_name,
  u.email as author_email,
  author_stats.article_count
FROM articles a
LEFT JOIN "user" u ON a.author_id = u.id
LEFT JOIN (
  SELECT author_id, COUNT(*) as article_count
  FROM articles
  GROUP BY author_id
) author_stats ON a.author_id = author_stats.author_id;

-- Global stats in separate query
SELECT 
  COUNT(DISTINCT a.id) as total_articles,
  COUNT(DISTINCT u.id) as total_users
FROM articles a
CROSS JOIN "user" u
LIMIT 1;
```

**Performance Improvements:**
- Execution Time: **0.400 ms** (75% faster, 4x improvement)
- Buffer Hits: **30** (84% reduction)
- Single pass through data instead of multiple subquery executions
- Removed unnecessary UPPER/LOWER transformations

### 2. Optimized `/api/articles/search`

**Solution:** Added trigram-based GIN indexes for text search

```sql
-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for efficient text search
CREATE INDEX idx_articles_title_trgm ON articles USING gin (title gin_trgm_ops);
CREATE INDEX idx_articles_content_trgm ON articles USING gin (content gin_trgm_ops);
```

**Performance Considerations:**
- Small tables (<1000 rows): Postgres may still use sequential scan (optimal for small data)
- Large tables (>1000 rows): Indexes provide significant performance improvements
- Trigram indexes support ILIKE queries with leading wildcards (e.g., `%search%`)

## Migration Instructions

### Applying the Search Optimization

Run the migration to add search indexes:

```bash
# The migration file is already created
# Apply it manually or through your migration tool
psql $DATABASE_URL -f drizzle/migrations/0001_search_optimization.sql
```

**Note:** These indexes will be automatically created on Neon's main database when you apply the migration. Always test on a branch first!

## Performance Testing on Neon Branches

This analysis was conducted using Neon database branches to safely test optimizations:

1. **Analysis Branch**: Created to run `pg_stat_statements` and identify slow queries
2. **Test Branch**: Created to test optimizations before applying to main

All analysis and testing was performed on temporary branches with 4-hour TTL, never on the main database branch.

## Key Metrics Summary

| Endpoint | Metric | Before | After | Improvement |
|----------|--------|--------|-------|-------------|
| `/api/articles/with-authors` | Execution Time | 1.655 ms | 0.400 ms | 75% faster (4x) |
| `/api/articles/with-authors` | Buffer Hits | 192+ | 30 | 84% reduction |
| `/api/articles/search` | Has Indexes | No | Yes | Scales better |

## Future Optimization Opportunities

1. **Pagination**: Implement cursor-based pagination for large result sets
2. **Caching**: Add Redis or similar caching for frequently accessed data
3. **Query Result Caching**: Cache expensive aggregations like global stats
4. **Connection Pooling**: Ensure proper connection pooling is configured (already using Neon's pooler)
5. **Read Replicas**: Consider Neon read replicas for read-heavy workloads

## Monitoring

To monitor query performance in the future:

```sql
-- View slowest queries
SELECT
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Reset statistics
SELECT pg_stat_statements_reset();
```

**Note:** `pg_stat_statements` extension is already enabled on your Neon database.
