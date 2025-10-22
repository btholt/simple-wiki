import { db } from "@/db";
import { articles, user } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // INTENTIONALLY SLOW AND UNOPTIMIZED QUERIES
    // This is for testing SQL optimization tools

    // Anti-pattern 1: Fetch all articles without pagination
    const allArticles = await db.execute(
      sql`SELECT * FROM articles ORDER BY created_at DESC`
    );

    // Anti-pattern 2: N+1 query problem - fetch each author separately
    const articlesWithAuthors = [];
    for (const article of allArticles.rows) {
      // Separate query for each article's author
      const authorResult = await db.execute(
        sql`SELECT * FROM "user" WHERE id = ${article.author_id}`
      );
      const author = authorResult.rows[0];

      // Anti-pattern 3: Another separate query to count user's total articles
      const articleCountResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM articles WHERE author_id = ${article.author_id}`
      );
      const articleCount = articleCountResult.rows[0];

      // Anti-pattern 4: Yet another query to get the latest article date
      const latestArticleResult = await db.execute(
        sql`SELECT MAX(created_at) as latest FROM articles WHERE author_id = ${article.author_id}`
      );
      const latestArticle = latestArticleResult.rows[0];

      // Anti-pattern 5: Unnecessary subquery for each article
      const viewCountResult = await db.execute(
        sql`SELECT (SELECT COUNT(*) FROM articles WHERE author_id = ${article.author_id}) * 100 as estimated_views`
      );

      articlesWithAuthors.push({
        id: article.id,
        title: article.title,
        content: article.content,
        createdAt: article.created_at,
        updatedAt: article.updated_at,
        author: {
          id: author?.id,
          name: author?.name,
          email: author?.email,
          articleCount: articleCount?.count,
          latestArticleDate: latestArticle?.latest,
          estimatedViews: viewCountResult.rows[0]?.estimated_views,
        },
      });
    }

    // Anti-pattern 6: Additional slow aggregation query without indexes
    const statsResult = await db.execute(
      sql`
        SELECT 
          (SELECT COUNT(*) FROM articles) as total_articles,
          (SELECT COUNT(*) FROM "user") as total_users,
          (SELECT AVG(LENGTH(content)) FROM articles) as avg_content_length,
          (SELECT MAX(created_at) FROM articles) as newest_article,
          (SELECT MIN(created_at) FROM articles) as oldest_article
      `
    );

    // Anti-pattern 7: Fetch all users separately to calculate stats
    const allUsers = await db.execute(sql`SELECT * FROM "user"`);
    const userStats = [];
    for (const u of allUsers.rows) {
      const userArticles = await db.execute(
        sql`SELECT * FROM articles WHERE author_id = ${u.id}`
      );
      userStats.push({
        userId: u.id,
        userName: u.name,
        articleCount: userArticles.rows.length,
        totalContentLength: userArticles.rows.reduce(
          (sum: number, a: any) => sum + (a.content?.length || 0),
          0
        ),
      });
    }

    return NextResponse.json({
      success: true,
      articles: articlesWithAuthors,
      stats: statsResult.rows[0],
      userStats,
      metadata: {
        totalQueries: allArticles.rows.length * 4 + allUsers.rows.length + 2,
        warning:
          "This endpoint is intentionally unoptimized for testing purposes",
      },
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
