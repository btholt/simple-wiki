# Tagging System Usage Examples

This document provides code examples for using the new tagging system in your wiki application.

## Table of Contents
- [Database Schema Overview](#database-schema-overview)
- [Query Examples](#query-examples)
- [Common Operations](#common-operations)
- [Advanced Queries](#advanced-queries)

## Database Schema Overview

The tagging system consists of three tables:

```typescript
// Tags table - stores unique tag names
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Article Tags junction table - links articles to tags
export const articleTags = pgTable("article_tags", {
  articleId: integer("article_id").notNull().references(() => articles.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.articleId, table.tagId] }),
}));
```

## Query Examples

### 1. Get an Article with All Its Tags

```typescript
import { db } from "@/db";
import { articles, tags, articleTags } from "@/db/schema";
import { eq } from "drizzle-orm";

// Using relations (recommended)
const articleWithTags = await db.query.articles.findFirst({
  where: eq(articles.id, articleId),
  with: {
    articleTags: {
      with: {
        tag: true,
      },
    },
  },
});

// Extract just the tag names
const tagNames = articleWithTags?.articleTags.map(at => at.tag.name) || [];

// Result structure:
// {
//   id: 1,
//   title: "Dogs",
//   content: "...",
//   articleTags: [
//     { tag: { id: 1, name: "animals" } },
//     { tag: { id: 2, name: "pets" } },
//     { tag: { id: 3, name: "cute" } }
//   ]
// }
```

### 2. Get All Articles with a Specific Tag

```typescript
import { db } from "@/db";
import { articles, tags, articleTags } from "@/db/schema";
import { eq } from "drizzle-orm";

// Find articles tagged with "animals"
const articlesWithTag = await db.query.tags.findFirst({
  where: eq(tags.name, "animals"),
  with: {
    articleTags: {
      with: {
        article: {
          with: {
            author: true, // optionally include author
          },
        },
      },
    },
  },
});

const matchingArticles = articlesWithTag?.articleTags.map(at => at.article) || [];
```

### 3. Create a New Tag

```typescript
import { db } from "@/db";
import { tags } from "@/db/schema";

// Insert a new tag
const [newTag] = await db.insert(tags)
  .values({
    name: "javascript",
  })
  .returning();

console.log(newTag);
// { id: 5, name: "javascript", createdAt: Date }
```

### 4. Tag an Article

```typescript
import { db } from "@/db";
import { tags, articleTags } from "@/db/schema";
import { eq } from "drizzle-orm";

// First, ensure the tag exists (get or create)
let tag = await db.query.tags.findFirst({
  where: eq(tags.name, "typescript"),
});

if (!tag) {
  [tag] = await db.insert(tags)
    .values({ name: "typescript" })
    .returning();
}

// Then link the article to the tag
await db.insert(articleTags)
  .values({
    articleId: articleId,
    tagId: tag.id,
  });
```

### 5. Remove a Tag from an Article

```typescript
import { db } from "@/db";
import { articleTags } from "@/db/schema";
import { and, eq } from "drizzle-orm";

await db.delete(articleTags)
  .where(
    and(
      eq(articleTags.articleId, articleId),
      eq(articleTags.tagId, tagId)
    )
  );
```

## Common Operations

### Batch Tag Multiple Articles

```typescript
import { db } from "@/db";
import { articleTags } from "@/db/schema";

// Tag multiple articles with the same tag
await db.insert(articleTags)
  .values([
    { articleId: 1, tagId: tagId },
    { articleId: 2, tagId: tagId },
    { articleId: 3, tagId: tagId },
  ]);
```

### Get All Tags with Article Count

```typescript
import { db } from "@/db";
import { tags, articleTags } from "@/db/schema";
import { sql, eq } from "drizzle-orm";

const tagsWithCount = await db
  .select({
    id: tags.id,
    name: tags.name,
    articleCount: sql<number>`count(${articleTags.articleId})`,
  })
  .from(tags)
  .leftJoin(articleTags, eq(tags.id, articleTags.tagId))
  .groupBy(tags.id);

// Result:
// [
//   { id: 1, name: "animals", articleCount: 5 },
//   { id: 2, name: "pets", articleCount: 3 },
//   ...
// ]
```

### Get Popular Tags (Most Used)

```typescript
import { db } from "@/db";
import { tags, articleTags } from "@/db/schema";
import { sql, eq, desc } from "drizzle-orm";

const popularTags = await db
  .select({
    id: tags.id,
    name: tags.name,
    articleCount: sql<number>`count(${articleTags.articleId})`,
  })
  .from(tags)
  .leftJoin(articleTags, eq(tags.id, articleTags.tagId))
  .groupBy(tags.id)
  .orderBy(desc(sql`count(${articleTags.articleId})`))
  .limit(10);
```

### Update Article Tags (Replace All)

```typescript
import { db } from "@/db";
import { tags, articleTags } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

async function updateArticleTags(articleId: number, tagNames: string[]) {
  // Start a transaction
  await db.transaction(async (tx) => {
    // Remove all existing tags
    await tx.delete(articleTags)
      .where(eq(articleTags.articleId, articleId));
    
    // Get or create tags
    const tagRecords = await Promise.all(
      tagNames.map(async (name) => {
        let tag = await tx.query.tags.findFirst({
          where: eq(tags.name, name),
        });
        
        if (!tag) {
          [tag] = await tx.insert(tags)
            .values({ name })
            .returning();
        }
        
        return tag;
      })
    );
    
    // Link all tags to the article
    if (tagRecords.length > 0) {
      await tx.insert(articleTags)
        .values(
          tagRecords.map(tag => ({
            articleId,
            tagId: tag.id,
          }))
        );
    }
  });
}

// Usage:
await updateArticleTags(1, ["javascript", "typescript", "webdev"]);
```

## Advanced Queries

### Find Articles with Multiple Specific Tags (AND)

```typescript
import { db } from "@/db";
import { articles, tags, articleTags } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";

// Find articles that have BOTH "javascript" AND "typescript" tags
async function findArticlesWithAllTags(tagNames: string[]) {
  // First get tag IDs
  const tagRecords = await db.query.tags.findMany({
    where: inArray(tags.name, tagNames),
  });
  
  const tagIds = tagRecords.map(t => t.id);
  
  // Find articles that have all these tags
  const results = await db
    .select({
      articleId: articleTags.articleId,
      tagCount: sql<number>`count(distinct ${articleTags.tagId})`,
    })
    .from(articleTags)
    .where(inArray(articleTags.tagId, tagIds))
    .groupBy(articleTags.articleId)
    .having(sql`count(distinct ${articleTags.tagId}) = ${tagIds.length}`);
  
  // Get full article details
  const articleIds = results.map(r => r.articleId);
  return await db.query.articles.findMany({
    where: inArray(articles.id, articleIds),
    with: {
      articleTags: {
        with: {
          tag: true,
        },
      },
    },
  });
}
```

### Find Similar Articles (by Shared Tags)

```typescript
import { db } from "@/db";
import { articles, articleTags } from "@/db/schema";
import { eq, sql, ne } from "drizzle-orm";

// Find articles similar to a given article (sharing the most tags)
async function findSimilarArticles(articleId: number, limit: number = 5) {
  const results = await db
    .select({
      articleId: articleTags.articleId,
      sharedTags: sql<number>`count(*)`,
    })
    .from(articleTags)
    .where(
      sql`${articleTags.tagId} IN (
        SELECT ${articleTags.tagId} 
        FROM ${articleTags} 
        WHERE ${articleTags.articleId} = ${articleId}
      )`
    )
    .where(ne(articleTags.articleId, articleId))
    .groupBy(articleTags.articleId)
    .orderBy(sql`count(*) DESC`)
    .limit(limit);
  
  const articleIds = results.map(r => r.articleId);
  return await db.query.articles.findMany({
    where: inArray(articles.id, articleIds),
  });
}
```

### Search Articles by Tag Names

```typescript
import { db } from "@/db";
import { articles, tags, articleTags } from "@/db/schema";
import { like, eq } from "drizzle-orm";

// Search for articles with tags matching a pattern
async function searchByTagPattern(pattern: string) {
  const matchingTags = await db.query.tags.findMany({
    where: like(tags.name, `%${pattern}%`),
    with: {
      articleTags: {
        with: {
          article: true,
        },
      },
    },
  });
  
  // Flatten results to get unique articles
  const articlesMap = new Map();
  matchingTags.forEach(tag => {
    tag.articleTags.forEach(at => {
      if (!articlesMap.has(at.article.id)) {
        articlesMap.set(at.article.id, at.article);
      }
    });
  });
  
  return Array.from(articlesMap.values());
}
```

## Server Action Example

Here's a complete server action for managing tags:

```typescript
"use server";

import { db } from "@/db";
import { tags, articleTags } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function addTagsToArticle(
  articleId: number,
  tagNames: string[]
) {
  try {
    const tagRecords = await Promise.all(
      tagNames.map(async (name) => {
        // Get existing tag or create new one
        let tag = await db.query.tags.findFirst({
          where: eq(tags.name, name.toLowerCase().trim()),
        });
        
        if (!tag) {
          [tag] = await db.insert(tags)
            .values({ name: name.toLowerCase().trim() })
            .returning();
        }
        
        return tag;
      })
    );
    
    // Link tags to article (ignoring duplicates)
    const values = tagRecords.map(tag => ({
      articleId,
      tagId: tag.id,
    }));
    
    await db.insert(articleTags)
      .values(values)
      .onConflictDoNothing(); // Ignore if already tagged
    
    return { success: true, tags: tagRecords };
  } catch (error) {
    console.error("Error adding tags:", error);
    return { success: false, error: "Failed to add tags" };
  }
}

export async function removeTagFromArticle(
  articleId: number,
  tagId: number
) {
  try {
    await db.delete(articleTags)
      .where(
        and(
          eq(articleTags.articleId, articleId),
          eq(articleTags.tagId, tagId)
        )
      );
    
    return { success: true };
  } catch (error) {
    console.error("Error removing tag:", error);
    return { success: false, error: "Failed to remove tag" };
  }
}
```

## Best Practices

1. **Tag Normalization**: Always normalize tag names (lowercase, trim whitespace)
2. **Duplicate Prevention**: Use `onConflictDoNothing()` when inserting article-tag relationships
3. **Transactions**: Use transactions when updating multiple tags at once
4. **Indexing**: The unique constraint on `tags.name` provides fast lookups
5. **Cascade Deletes**: Consider adding `ON DELETE CASCADE` to foreign keys if you want tags/articles to be automatically unlinked when deleted

## Next Steps

Now that you have the database schema set up, you can:

1. Create UI components for tag input/display
2. Add tag filtering to the article list
3. Create a tag cloud or tag directory page
4. Implement tag autocomplete
5. Add tag-based search functionality
