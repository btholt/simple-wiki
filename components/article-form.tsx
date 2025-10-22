"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActionState } from "react";

type ArticleFormProps = {
  title?: string;
  content?: string;
  action: (
    prevState: { error?: string } | null,
    formData: FormData
  ) => Promise<{ error?: string } | null>;
  submitLabel: string;
};

export function ArticleForm({
  title = "",
  content = "",
  action,
  submitLabel,
}: ArticleFormProps) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{submitLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={title}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content (Markdown supported)</Label>
            <Textarea
              id="content"
              name="content"
              defaultValue={content}
              required
              disabled={isPending}
              rows={15}
              className="font-mono"
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
