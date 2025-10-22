-- Migration: Add performance indexes for articles table
-- Created: 2025-10-22
-- Purpose: Optimize query performance for article lookups with author joins

-- Index on author_id for efficient JOIN operations with user table
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);

-- Index on created_at for efficient ORDER BY operations (descending)
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- Composite index for author-specific queries with time-based ordering
-- Useful for queries that filter by author and order by creation date
CREATE INDEX IF NOT EXISTS idx_articles_author_created ON articles(author_id, created_at DESC);
