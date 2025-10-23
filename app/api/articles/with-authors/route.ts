import { db } from "@/db";
import { articles, user } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all articles
    const allArticles = await db.execute(
      sql`SELECT * FROM articles ORDER BY created_at DESC`
    );

    // Build response with author info
    const articlesWithAuthors = [];
    for (const article of allArticles.rows) {
      // Get the author for this article
      const authorResult = await db.execute(
        sql`SELECT * FROM "user" WHERE id = ${article.author_id}`
      );
      const author = authorResult.rows[0];

      // Get author's article count
      const countResult = await db.execute(
        sql`SELECT COUNT(*) as count FROM articles WHERE author_id = ${article.author_id}`
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
          totalArticles: countResult.rows[0]?.count || 0,
        },
      });
    }

    // Get some overall stats
    const totalArticlesResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM articles`
    );
    const totalUsersResult = await db.execute(
      sql`SELECT COUNT(*) as count FROM "user"`
    );

    return NextResponse.json({
      articles: articlesWithAuthors,
      stats: {
        totalArticles: totalArticlesResult.rows[0]?.count || 0,
        totalUsers: totalUsersResult.rows[0]?.count || 0,
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

