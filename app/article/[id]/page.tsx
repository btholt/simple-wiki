import { db } from "@/db";
import { articles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ArticlePage({
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

  const article = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
    with: {
      author: true,
    },
  });

  if (!article) {
    notFound();
  }

  const isAuthor = session?.user?.id === article.authorId;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold">
            <Link href="/">Wiki</Link>
          </h1>
          <div className="flex gap-2">
            {isAuthor && (
              <Button asChild variant="outline">
                <Link href={`/article/${articleId}/edit`}>Edit</Link>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-4xl">{article.title}</CardTitle>
            <div className="text-sm text-muted-foreground">
              By {article.author?.name || "Unknown"} • Created:{" "}
              {article.createdAt.toLocaleDateString()} • Last updated:{" "}
              {article.updatedAt.toLocaleDateString()}
            </div>
          </CardHeader>
          <CardContent>
            <MarkdownRenderer content={article.content} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
