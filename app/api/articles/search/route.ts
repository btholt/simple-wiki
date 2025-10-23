import { db } from "@/db";
import { articles, user } from "@/db/schema";
import { ilike, eq, or } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Search articles by title or content
    const results = await db
      .select({
        id: articles.id,
        title: articles.title,
        content: articles.content,
        createdAt: articles.createdAt,
        authorName: user.name,
      })
      .from(articles)
      .leftJoin(user, eq(articles.authorId, user.id))
      .where(
        or(
          ilike(articles.title, `%${query}%`),
          ilike(articles.content, `%${query}%`)
        )
      )
      .limit(50);

    return NextResponse.json({
      results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error searching articles:", error);
    return NextResponse.json(
      { error: "Failed to search articles" },
      { status: 500 }
    );
  }
}
