import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";

import appCss from "../styles.css?url";
const LOGO_URL = "/logo_tracksathi.png";
import { AppShell } from "@/components/app-shell";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Error 404</p>
        <h1 className="mt-4 font-display text-5xl text-foreground">Page not found</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <Button asChild className="mt-8"><Link to="/">Back to dashboard</Link></Button>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-destructive">Something went wrong</p>
        <h1 className="mt-4 font-display text-3xl text-foreground">This page didn't load</h1>
        <p className="mt-4 text-sm text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={() => { router.invalidate(); reset(); }}>Try again</Button>
          <Button variant="outline" asChild><Link to="/">Go home</Link></Button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TrackSathi — Job Application Tracker" },
      { name: "description", content: "A modern, full-stack job application tracker. Track every application from Applied to Offer with search, filters, and analytics." },
      { property: "og:title", content: "TrackSathi — Job Application Tracker" },
      { property: "og:description", content: "Track every application from Applied to Offer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const splashStyle: Record<string, string> = {
  position: "fixed",
  inset: "0",
  zIndex: "9999",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "1.5rem",
  background: "#fff",
  transition: "opacity 0.6s ease",
};

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>
        <div id="splash" style={splashStyle}>
          <img
            src={LOGO_URL}
            alt="TrackSathi"
            style={{ width: 220, height: "auto", animation: "glow 2s ease-in-out infinite alternate" }}
          />
        </div>
        <style>{`@keyframes glow { from { filter: drop-shadow(0 0 15px oklch(0.32 0.055 155 / 0.25)); } to { filter: drop-shadow(0 0 40px oklch(0.32 0.055 155 / 0.6)); } }`}</style>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    const el = document.getElementById("splash");
    const start = Date.now();
    const minDisplay = 3500;

    const hide = () => {
      const elapsed = Date.now() - start;
      const delay = Math.max(0, minDisplay - elapsed);
      setTimeout(() => {
        if (el) {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
          setTimeout(() => el?.remove(), 600);
        }
      }, delay);
    };

    hide();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppShell>
          <Outlet />
        </AppShell>
        <Toaster richColors position="top-right" closeButton />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
