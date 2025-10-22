# Tagging System Migration Guide

This guide explains how to apply the new tagging system migration to your Neon database.

## What's New

The tagging system adds the following to your database:

### New Tables

1. **`tags`** - Stores unique tags
   - `id` (serial primary key)
   - `name` (text, unique, not null)
   - `created_at` (timestamp)

2. **`article_tags`** - Junction table for many-to-many relationship between articles and tags
   - `article_id` (integer, references articles.id)
   - `tag_id` (integer, references tags.id)
   - `created_at` (timestamp)
   - Primary key on (article_id, tag_id)

### New Relations

- Articles can have many tags through the `article_tags` junction table
- Tags can be associated with many articles
- Proper Drizzle ORM relations are defined for easy querying

## Migration Files

The migration has been generated and is located at:
- `drizzle/migrations/0001_sloppy_maria_hill.sql`

## How to Apply the Migration

### Option 1: Using Drizzle Kit Migrate (Recommended)

This applies migrations in order and tracks which ones have been applied:

```bash
# Make sure your .env or .env.local has the DATABASE_URL set
npm run db:migrate
```

### Option 2: Using Drizzle Kit Push

This syncs the schema directly without tracking migrations:

```bash
npm run db:push
```

### Option 3: Manual Application via Neon Console

If you prefer to apply the migration manually:

1. Log in to your Neon console at https://console.neon.tech
2. Navigate to your project
3. Go to the SQL Editor
4. Copy and paste the contents of `drizzle/migrations/0001_sloppy_maria_hill.sql`
5. Execute the SQL

## Verifying the Migration

After applying the migration, verify it was successful:

### Using Drizzle Studio

```bash
npm run db:studio
```

This will open Drizzle Studio where you can:
- See the new `tags` and `article_tags` tables
- Verify the schema structure
- Test adding tags to articles

### Using SQL Query

You can also verify using a SQL query in Neon console:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tags', 'article_tags');

-- Verify the schema
\d tags
\d article_tags
```

## Using the Tagging System in Your Code

Once the migration is applied, you can use the tagging system in your application:

```typescript
import { db } from './db';
import { tags, articleTags, articles } from './db/schema';
import { eq } from 'drizzle-orm';

// Create a new tag
const newTag = await db.insert(tags).values({
  name: 'JavaScript',
}).returning();

// Associate a tag with an article
await db.insert(articleTags).values({
  articleId: 1,
  tagId: newTag[0].id,
});

// Query articles with their tags
const articlesWithTags = await db.query.articles.findMany({
  with: {
    articleTags: {
      with: {
        tag: true,
      },
    },
  },
});

// Query tags with their articles
const tagsWithArticles = await db.query.tags.findMany({
  with: {
    articleTags: {
      with: {
        article: true,
      },
    },
  },
});
```

## Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove foreign key constraints first
ALTER TABLE article_tags DROP CONSTRAINT article_tags_article_id_articles_id_fk;
ALTER TABLE article_tags DROP CONSTRAINT article_tags_tag_id_tags_id_fk;

-- Drop the tables
DROP TABLE article_tags;
DROP TABLE tags;
```

## Troubleshooting

### Connection Issues

If you get connection errors:
1. Verify your `DATABASE_URL` in `.env` or `.env.local`
2. Ensure the connection string includes `?sslmode=require`
3. Check that your Neon database is active

### Migration Already Applied Error

If the migration was already applied, you'll see an error. This is safe to ignore.

### Schema Mismatch

If you modified the schema after generating the migration:
1. Delete the generated migration file
2. Run `npm run db:generate` again
3. Apply the new migration

## Next Steps

After applying the migration:
1. Update your UI to support adding/removing tags from articles
2. Add API endpoints for managing tags
3. Implement tag filtering on the articles list
4. Consider adding tag suggestions or autocomplete

## Support

For issues or questions:
- Check the Drizzle ORM documentation: https://orm.drizzle.team
- Review the Neon documentation: https://neon.tech/docs
- See the main README.md for project-specific information
