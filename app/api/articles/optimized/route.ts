import { db } from "@/db";
import { articles, user } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // OPTIMIZED VERSION - for comparison
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Single optimized query with JOIN
    const result = await db.execute(sql`
      WITH article_stats AS (
        SELECT 
          author_id,
          COUNT(*) as article_count,
          MAX(created_at) as latest_article_date,
          SUM(LENGTH(content)) as total_content_length
        FROM articles
        GROUP BY author_id
      ),
      global_stats AS (
        SELECT 
          COUNT(DISTINCT a.id) as total_articles,
          COUNT(DISTINCT u.id) as total_users,
          AVG(LENGTH(a.content))::INTEGER as avg_content_length,
          MAX(a.created_at) as newest_article,
          MIN(a.created_at) as oldest_article
        FROM articles a
        CROSS JOIN "user" u
      )
      SELECT 
        a.id,
        a.title,
        a.content,
        a.created_at,
        a.updated_at,
        u.id as author_id,
        u.name as author_name,
        u.email as author_email,
        COALESCE(ast.article_count, 0) as author_article_count,
        ast.latest_article_date as author_latest_article,
        ast.total_content_length as author_total_content_length,
        gs.total_articles,
        gs.total_users,
        gs.avg_content_length,
        gs.newest_article,
        gs.oldest_article
      FROM articles a
      LEFT JOIN "user" u ON a.author_id = u.id
      LEFT JOIN article_stats ast ON u.id = ast.author_id
      CROSS JOIN global_stats gs
      ORDER BY a.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const articlesData = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: {
        id: row.author_id,
        name: row.author_name,
        email: row.author_email,
        articleCount: row.author_article_count,
        latestArticleDate: row.author_latest_article,
        totalContentLength: row.author_total_content_length,
      },
    }));

    const stats =
      result.rows.length > 0
        ? {
            total_articles: result.rows[0].total_articles,
            total_users: result.rows[0].total_users,
            avg_content_length: result.rows[0].avg_content_length,
            newest_article: result.rows[0].newest_article,
            oldest_article: result.rows[0].oldest_article,
          }
        : null;

    return NextResponse.json({
      success: true,
      articles: articlesData,
      stats,
      metadata: {
        totalQueries: 1,
        limit,
        offset,
        note: "This endpoint is optimized with a single query using JOINs and CTEs",
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
