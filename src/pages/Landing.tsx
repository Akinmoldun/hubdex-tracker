// Hubdex landing page. IBM.com visual language: Plex typography,
// Carbon palette, eyebrow labels, hairline grids, sharp geometry.
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { HubdexWordmark } from "@/components/hubdex";
import { STAGES } from "@/convex/schema";
import { STAGE_VARS } from "@/components/hubdex";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const DEMO_COUNTS: Record<string, number> = {
  Wishlist: 12,
  Applied: 34,
  Interview: 9,
  Offer: 3,
  Rejected: 18,
};

const FEATURES = [
  {
    no: "01",
    title: "Pipeline at a glance",
    body: "Track every opportunity across five stages, from wishlist to offer, with live counts and a searchable, sortable register of every application.",
  },
  {
    no: "02",
    title: "Move rows, not tabs",
    body: "Promote a role the moment the recruiter calls. Inline stage switching updates your pipeline instantly, everywhere it's counted.",
  },
  {
    no: "03",
    title: "Context that wins interviews",
    body: "Salary bands, locations, links to the posting, and private notes live next to each application, so you walk into every call prepared.",
  },
  {
    no: "04",
    title: "Built for the long search",
    body: "Prioritize what matters, archive the noise, and keep months of job hunting organized in one fast, focused workspace.",
  },
];

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* IBM-style top navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-10">
            <Link to="/" aria-label="Hubdex home">
              <HubdexWordmark />
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
              <a href="#pipeline" className="hover:text-foreground transition-colors">
                Pipeline
              </a>
              <a href="#features" className="hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#how" className="hover:text-foreground transition-colors">
                How it works
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && isAuthenticated ? (
              <Link
                to="/dashboard"
                className="inline-flex h-10 items-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Open dashboard
                <ArrowRight className="size-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="inline-flex h-10 items-center px-3 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth?returnTo=%2Fdashboard"
                  className="inline-flex h-10 items-center gap-2 bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Get started
                  <ArrowRight className="size-4" />
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="h-0.5 w-full bg-primary" />
      </header>

      {/* Hero */}
      <section className="ibm-grid relative overflow-hidden border-b border-border">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 380px at 85% 0%, rgba(15,98,254,0.08), transparent 70%)",
          }}
        />
        <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid lg:grid-cols-12 lg:gap-8 lg:pb-28">
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="ibm-eyebrow text-[#0f62fe]"
            >
              Hubdex: Application tracking
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-4 max-w-2xl text-5xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-6xl lg:text-[4.25rem]"
            >
              Every application.
              <br />
              One hub.
              <span className="text-[#0f62fe]"> Zero</span> chaos.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground"
            >
              Hubdex is the job search tracker for people applying at volume.
              Log every role, move it through the pipeline, and see exactly
              where your search stands, without a spreadsheet in sight.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/auth?returnTo=%2Fdashboard"
                className="inline-flex h-12 items-center gap-2 bg-primary px-7 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start tracking, it's free
                <ArrowRight className="size-4" />
              </Link>
              <a
                href="#how"
                className="inline-flex h-12 items-center border border-[#161616] px-7 text-base font-medium text-foreground transition-colors hover:bg-[#161616] hover:text-white dark:border-foreground dark:hover:bg-foreground dark:hover:text-background"
              >
                See how it works
              </a>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="ibm-eyebrow mt-8 text-muted-foreground"
            >
              No credit card · Email or guest sign-in · Your data, your account
            </motion.p>
          </div>

          {/* Hero pipeline card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-14 border border-border bg-background shadow-[8px_8px_0_0_rgba(22,22,22,0.06)] lg:col-span-5 lg:mt-0"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <span className="ibm-eyebrow text-muted-foreground">
                pipeline / this week
              </span>
              <span className="ibm-tag" style={{ backgroundColor: "var(--tag-applied-bg)", color: "var(--tag-applied-fg)" }}>
                live view
              </span>
            </div>
            <div className="divide-y divide-border">
              {STAGES.map((stage, i) => (
                <div key={stage} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="ibm-eyebrow w-6 text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="ibm-tag"
                      style={{
                        backgroundColor: STAGE_VARS[stage].bg,
                        color: STAGE_VARS[stage].fg,
                      }}
                    >
                      {stage}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden h-1 w-24 bg-muted sm:block">
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.min(100, DEMO_COUNTS[stage] * 2.5)}%`,
                          backgroundColor:
                            stage === "Offer"
                              ? "var(--tag-offer-fg)"
                              : stage === "Rejected"
                                ? "var(--tag-rejected-fg)"
                                : "#0f62fe",
                        }}
                      />
                    </div>
                    <span className="font-mono text-lg font-medium tabular-nums">
                      {String(DEMO_COUNTS[stage]).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border bg-muted px-5 py-3 text-xs text-muted-foreground">
              Illustrative workspace. Sign in to build your own.
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pipeline section */}
      <section id="pipeline" className="border-b border-border bg-[#161616] text-white">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <motion.div {...fadeUp}>
            <p className="ibm-eyebrow text-[#78a9ff]">The pipeline</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
              Five stages. One honest picture of your search.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#c6c6c6]">
              Most searches stall because nothing is visible. Hubdex keeps the
              entire funnel on one screen, so "where am I with that company?"
              always has a one-word answer.
            </p>
          </motion.div>

          <motion.ol
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="mt-12 grid grid-cols-1 border-l border-t border-[#393939] sm:grid-cols-2 lg:grid-cols-5"
          >
            {STAGES.map((stage, i) => (
              <li
                key={stage}
                className="group border-b border-r border-[#393939] p-6 transition-colors hover:bg-[#262626]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-[#8d8d8d]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    aria-hidden="true"
                    className="inline-block size-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        stage === "Wishlist"
                          ? "#a8a8a8"
                          : stage === "Applied"
                            ? "#4589ff"
                            : stage === "Interview"
                              ? "#be95ff"
                              : stage === "Offer"
                                ? "#42be65"
                                : "#fa4d56",
                    }}
                  />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{stage}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#a8a8a8]">
                  {
                    {
                      Wishlist: "Roles worth chasing. Save them before they close.",
                      Applied: "In the market. Counts toward your weekly velocity.",
                      Interview: "Live conversations, prep notes attached.",
                      Offer: "The finish line. Compare and decide with context.",
                      Rejected: "Closed loops, kept for pattern-spotting, not shame.",
                    }[stage]
                  }
                </p>
              </li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* Features grid */}
      <section id="features" className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <motion.div {...fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="ibm-eyebrow text-[#0f62fe]">Capabilities</p>
              <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
                Built for how hiring actually happens
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Opinionated defaults, zero configuration. Create an account and
              log your first application in under a minute.
            </p>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="mt-12 grid grid-cols-1 border-l border-t border-border sm:grid-cols-2"
          >
            {FEATURES.map((f) => (
              <div
                key={f.no}
                className="group border-b border-r border-border p-8 transition-colors hover:bg-muted/60"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-[#0f62fe]">{f.no}</span>
                  <ArrowRight className="size-4 text-transparent transition-all group-hover:translate-x-1 group-hover:text-[#0f62fe]" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-[-0.01em]">
                  {f.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="ibm-grid border-b border-border bg-muted/40">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <motion.div {...fadeUp}>
            <p className="ibm-eyebrow text-[#0f62fe]">How it works</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
              From application to offer in four moves
            </h2>
          </motion.div>
          <motion.ol
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
            className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              {
                step: "Step 01",
                title: "Create your hub",
                body: "Sign in with email or as a guest. Your workspace is ready instantly.",
              },
              {
                step: "Step 02",
                title: "Log the role",
                body: "Company, title, salary, link, priority: thirty seconds, one form.",
              },
              {
                step: "Step 03",
                title: "Work the pipeline",
                body: "Move stages inline as you hear back. Filters keep the register focused.",
              },
              {
                step: "Step 04",
                title: "Read the signals",
                body: "Live stats show where effort converts, and where it doesn't.",
              },
            ].map((s) => (
              <li key={s.step} className="relative border-t-2 border-[#161616] pt-5">
                <p className="ibm-eyebrow text-muted-foreground">{s.step}</p>
                <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </p>
              </li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* CTA band */}
      <section className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="ibm-eyebrow text-[#d0e2ff]">Get started</p>
            <h2 className="mt-2 max-w-xl text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
              Your next offer starts with better tracking.
            </h2>
          </div>
          <Link
            to="/auth?returnTo=%2Fdashboard"
            className="inline-flex h-12 shrink-0 items-center gap-2 bg-white px-7 text-base font-semibold text-[#0f62fe] transition-colors hover:bg-[#d0e2ff]"
          >
            Create your hub
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-[#161616] text-[#f4f4f4]">
        <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <HubdexWordmark inverted />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#a8a8a8]">
                Hubdex is a focused job application tracker: a single hub for
                every role, stage, and decision in your search.
              </p>
            </div>
            <div className="md:col-span-7 grid grid-cols-2 gap-8 sm:grid-cols-3">
              {[
                {
                  h: "Product",
                  links: ["Pipeline", "Features", "How it works"],
                },
                {
                  h: "Account",
                  links: ["Sign in", "Get started", "Your dashboard"],
                },
                {
                  h: "Resources",
                  links: ["Search strategy", "Interview prep", "Changelog"],
                },
              ].map((col) => (
                <div key={col.h}>
                  <p className="ibm-eyebrow text-[#8d8d8d]">{col.h}</p>
                  <ul className="mt-4 space-y-2.5 text-sm">
                    {col.links.map((l) => (
                      <li key={l}>
                        <Link
                          to={l === "Sign in" || l === "Get started" || l === "Your dashboard" ? "/auth" : "#"}
                          className="text-[#c6c6c6] underline-offset-4 hover:text-white hover:underline"
                        >
                          {l}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t border-[#393939] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-xs text-[#8d8d8d]">
              © {new Date().getFullYear()} Hubdex. Built for job seekers.
            </p>
            <p className="ibm-eyebrow text-[#8d8d8d]">
              Track · Move · Land the offer
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
