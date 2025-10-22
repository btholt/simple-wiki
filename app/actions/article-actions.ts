"use server";

import { db } from "@/db";
import { articles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createArticle(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content) {
    throw new Error("Title and content are required");
  }

  const [article] = await db
    .insert(articles)
    .values({
      title,
      content,
      authorId: session.user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  revalidatePath("/");
  redirect(`/article/${article.id}`);
}

export async function updateArticle(id: number, formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  if (!title || !content) {
    throw new Error("Title and content are required");
  }

  const existingArticle = await db.query.articles.findFirst({
    where: eq(articles.id, id),
  });

  if (!existingArticle) {
    throw new Error("Article not found");
  }

  if (existingArticle.authorId !== session.user.id) {
    throw new Error("Unauthorized - you can only edit your own articles");
  }

  await db
    .update(articles)
    .set({
      title,
      content,
      updatedAt: new Date(),
    })
    .where(eq(articles.id, id));

  revalidatePath(`/article/${id}`);
  revalidatePath(`/article/${id}/edit`);
  revalidatePath("/");
  redirect(`/article/${id}`);
}

export async function deleteArticle(id: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const existingArticle = await db.query.articles.findFirst({
    where: eq(articles.id, id),
  });

  if (!existingArticle) {
    throw new Error("Article not found");
  }

  if (existingArticle.authorId !== session.user.id) {
    throw new Error("Unauthorized - you can only delete your own articles");
  }

  await db.delete(articles).where(eq(articles.id, id));

  revalidatePath("/");
  redirect("/");
}
