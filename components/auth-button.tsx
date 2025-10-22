"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AuthButton() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <Button disabled>Loading...</Button>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {session.user.name}
        </span>
        <Button
          variant="outline"
          onClick={async () => {
            await signOut();
          }}
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button asChild variant="outline">
        <Link href="/login">Sign In</Link>
      </Button>
      <Button asChild>
        <Link href="/signup">Sign Up</Link>
      </Button>
    </div>
  );
}
