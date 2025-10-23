import { db } from "@/db";
import { articles, user } from "@/db/schema";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get basic stats efficiently
    const stats = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM articles) as total_articles,
        (SELECT COUNT(*) FROM "user") as total_users,
        (SELECT COUNT(DISTINCT author_id) FROM articles) as active_authors
    `);

    return NextResponse.json({
      stats: stats.rows[0],
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
