import { db } from "@/db";
import { articles, user } from "@/db/schema";
import { ArticleList } from "@/components/article-list";
import { AuthButton } from "@/components/auth-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const allArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      updatedAt: articles.updatedAt,
      authorId: articles.authorId,
      authorName: user.name,
    })
    .from(articles)
    .leftJoin(user, eq(articles.authorId, user.id))
    .orderBy(articles.updatedAt);

  const articleList = allArticles.map((article) => ({
    id: article.id,
    title: article.title,
    updatedAt: article.updatedAt,
    authorName: article.authorName || "Unknown",
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">
            <Link href="/">Wiki</Link>
          </h1>
          <AuthButton />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Articles</h2>
          {session && (
            <Button asChild>
              <Link href="/article/new">Create Article</Link>
            </Button>
          )}
        </div>
        <ArticleList articles={articleList} />
      </main>
    </div>
  );
}
