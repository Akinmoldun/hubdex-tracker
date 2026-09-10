import { Link } from "react-router";
import { HubdexWordmark } from "@/components/hubdex";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="ibm-grid flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="Hubdex home">
            <HubdexWordmark />
          </Link>
          <span className="ibm-eyebrow text-muted-foreground">
            Error 404
          </span>
        </div>
        <div className="h-0.5 w-full bg-primary" />
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md border border-border bg-background shadow-[8px_8px_0_0_rgba(22,22,22,0.06)]">
          <div className="h-1 w-full bg-primary" />
          <div className="px-8 py-10">
            <p className="ibm-eyebrow text-[#0f62fe]">Error 404</p>
            <h1 className="mt-2 text-5xl font-bold tracking-[-0.02em]">
              404
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              This page isn't part of your hub. It may have been moved, or the
              link may be out of date.
            </p>
            <Link
              to="/"
              className="mt-8 inline-flex h-11 items-center gap-2 bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <ArrowLeft className="size-4" />
              Back to home
            </Link>
          </div>
          <div className="border-t border-border bg-muted px-8 py-3 text-center text-xs text-muted-foreground">
            Hubdex — Every application. One hub.
          </div>
        </div>
      </div>
    </div>
  );
}
