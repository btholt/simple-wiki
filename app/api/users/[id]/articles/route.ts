import { db } from "@/db";
import { articles, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get all articles by a specific user
    const userArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .where(eq(articles.authorId, id))
      .orderBy(articles.createdAt);

    // Get user info
    const userInfo = await db
      .select({
        id: user.id,
        name: user.name,
      })
      .from(user)
      .where(eq(user.id, id))
      .limit(1);

    if (userInfo.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: userInfo[0],
      articles: userArticles,
      count: userArticles.length,
    });
  } catch (error) {
    console.error("Error fetching user articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch user articles" },
      { status: 500 }
    );
  }
}
