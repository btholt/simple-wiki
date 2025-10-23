import { db } from "@/db";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get all articles with author info
    const result = await db.execute(sql`
      SELECT 
        a.id,
        a.title,
        a.content,
        a.created_at,
        a.updated_at,
        a.author_id,
        (SELECT name FROM "user" WHERE id = a.author_id) as author_name,
        (SELECT email FROM "user" WHERE id = a.author_id) as author_email,
        (SELECT COUNT(*) FROM articles WHERE author_id = a.author_id) as author_article_count,
        (SELECT COUNT(*) FROM articles) as total_articles,
        (SELECT COUNT(*) FROM "user") as total_users,
        LENGTH(a.content) as content_length,
        UPPER(a.title) as title_upper,
        LOWER(a.title) as title_lower
      FROM articles a
      ORDER BY a.created_at DESC
    `);

    const articles = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      contentLength: row.content_length,
      author: {
        id: row.author_id,
        name: row.author_name,
        email: row.author_email,
        totalArticles: row.author_article_count,
      },
    }));

    const stats =
      result.rows.length > 0
        ? {
            totalArticles: result.rows[0].total_articles,
            totalUsers: result.rows[0].total_users,
          }
        : { totalArticles: 0, totalUsers: 0 };

    return NextResponse.json({
      articles,
      stats,
    });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
