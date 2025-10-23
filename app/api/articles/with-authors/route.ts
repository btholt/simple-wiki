import { db } from "@/db";
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Get all articles with author info using efficient JOINs instead of correlated subqueries
    const result = await db.execute(sql`
      SELECT 
        a.id,
        a.title,
        a.content,
        a.created_at,
        a.updated_at,
        a.author_id,
        u.name as author_name,
        u.email as author_email,
        author_stats.article_count as author_article_count,
        LENGTH(a.content) as content_length
      FROM articles a
      LEFT JOIN "user" u ON a.author_id = u.id
      LEFT JOIN (
        SELECT author_id, COUNT(*) as article_count
        FROM articles
        GROUP BY author_id
      ) author_stats ON a.author_id = author_stats.author_id
      ORDER BY a.created_at DESC
    `);

    // Get global stats in a single separate query
    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(DISTINCT a.id) as total_articles,
        COUNT(DISTINCT u.id) as total_users
      FROM articles a
      CROSS JOIN "user" u
      LIMIT 1
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

    const stats = statsResult.rows[0] || { total_articles: 0, total_users: 0 };

    return NextResponse.json({
      articles,
      stats: {
        totalArticles: stats.total_articles,
        totalUsers: stats.total_users,
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
