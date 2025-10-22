import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Article = {
  id: number;
  title: string;
  authorName: string;
  updatedAt: Date;
};

export function ArticleList({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No articles yet. Create the first one!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {articles.map((article) => (
        <Card key={article.id}>
          <CardHeader>
            <CardTitle>
              <Link href={`/article/${article.id}`} className="hover:underline">
                {article.title}
              </Link>
            </CardTitle>
            <CardDescription>
              By {article.authorName} • Last updated:{" "}
              {article.updatedAt.toLocaleDateString()}
            </CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
