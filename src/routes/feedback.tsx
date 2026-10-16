import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Home, Sparkles } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

import { Button } from "@/components/ui/button";
import { FeedbackWall } from "@/components/feedback-wall";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Community Feedback Wall 📝 | Spark Club IIIT Bhopal" },
      {
        name: "description",
        content:
          "Drop your candid thoughts, session feedback, and shoutouts onto the live physical-style sticky note wall for Spark Club IIIT Bhopal.",
      },
      { property: "og:title", content: "Community Feedback Wall | Spark Club" },
      {
        property: "og:description",
        content:
          "Leave a note, share what you built, and see what fellow students are saying.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: FeedbackPage,
});

function FeedbackPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top Navigation */}
      <header className="border-b border-foreground/20 px-4 py-3 sm:px-6 md:px-10 md:py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 group"
            aria-label="Back to Spark home"
          >
            <img
              src="/spark-logo.png"
              alt="Spark Club"
              className="size-9 sm:size-11 shrink-0 object-contain rounded-lg shadow-sm group-hover:scale-105 transition-transform"
            />
            <span className="text-xs sm:text-sm font-extrabold uppercase leading-tight">
              Spark Club
              <br />
              <span className="font-medium text-muted-foreground">IIIT Bhopal</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9 px-3 text-xs font-extrabold uppercase border-foreground/30 hover:border-foreground"
            >
              <Link to="/" aria-label="Return to Main Page">
                <ArrowLeft className="mr-1.5 size-3.5" />
                <span>Home</span>
              </Link>
            </Button>

            <Button
              variant="electric"
              size="sm"
              asChild
              className="h-9 px-3.5 text-xs font-extrabold shadow-sm"
            >
              <Link to="/" hash="register">
                <Sparkles className="mr-1.5 size-3.5" />
                <span>Recruitment</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Feedback Wall Component */}
      <div className="py-6 sm:py-10">
        <FeedbackWall />
      </div>

      {/* Footer */}
      <footer className="border-t border-foreground/20 px-5 py-8 md:px-10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-xs font-bold uppercase sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1">
            <span>Spark Club · IIIT Bhopal</span>
            <span className="text-[11px] text-muted-foreground">
              Society for Programming, Automation, Robotics and Knowledge
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1.5">
              <Home className="size-3.5" />
              <span>Main Site</span>
            </Link>

            <a
              href="https://chat.whatsapp.com/D6J3KnMJgUkKyCiU4u54lr"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              <FaWhatsapp className="size-4" />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
