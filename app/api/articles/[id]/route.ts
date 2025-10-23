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
    const articleId = parseInt(id);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { error: "Invalid article ID" },
        { status: 400 }
      );
    }

    // Get single article with author
    const result = await db
      .select({
        id: articles.id,
        title: articles.title,
        content: articles.content,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
        authorId: articles.authorId,
        authorName: user.name,
        authorEmail: user.email,
      })
      .from(articles)
      .leftJoin(user, eq(articles.authorId, user.id))
      .where(eq(articles.id, articleId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json({
      article: result[0],
    });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}
