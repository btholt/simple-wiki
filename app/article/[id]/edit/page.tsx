import { db } from "@/db";
import { articles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { ArticleForm } from "@/components/article-form";
import { updateArticle } from "@/app/actions/article-actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const articleId = parseInt(id);

  if (isNaN(articleId)) {
    notFound();
  }

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const article = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });

  if (!article) {
    notFound();
  }

  if (article.authorId !== session.user.id) {
    redirect(`/article/${articleId}`);
  }

  const updateArticleWithId = async (
    prevState: { error?: string } | null,
    formData: FormData
  ): Promise<{ error?: string } | null> => {
    "use server";
    try {
      await updateArticle(articleId, formData);
      return null;
    } catch (error) {
      // Check if it's a Next.js redirect error
      if (
        error &&
        typeof error === "object" &&
        "digest" in error &&
        String(error.digest).startsWith("NEXT_REDIRECT")
      ) {
        throw error;
      }
      return { error: (error as Error).message };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">
            <Link href="/">Wiki</Link>
          </h1>
          <Button asChild variant="outline">
            <Link href={`/article/${articleId}`}>Cancel</Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <ArticleForm
          title={article.title}
          content={article.content}
          action={updateArticleWithId}
          submitLabel="Update Article"
        />
      </main>
    </div>
  );
}
