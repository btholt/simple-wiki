import { db } from "@/db";
import { articles, user } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get latest articles with proper join
    const latestArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        createdAt: articles.createdAt,
        authorId: articles.authorId,
        authorName: user.name,
      })
      .from(articles)
      .leftJoin(user, eq(articles.authorId, user.id))
      .orderBy(desc(articles.createdAt))
      .limit(limit);

    return NextResponse.json({
      articles: latestArticles,
    });
  } catch (error) {
    console.error("Error fetching latest articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
