# Hubdex — Job Application Tracker

<p align="center">
  <img src="public/logo.svg" alt="Hubdex logo" width="72" />
</p>

**Hubdex** is a focused, open-source job application tracker: one hub for every role, stage, and decision in your job search. Log every application, move it through a five-stage pipeline (Wishlist → Applied → Interview → Offer → Rejected), and see exactly where your search stands — without a spreadsheet in sight.

Built as a real-world example of a full-stack, real-time React app with a Convex backend.

## ✨ Features

- **Five-stage pipeline** — Wishlist, Applied, Interview, Offer, Rejected, with live per-stage counts that update everywhere instantly.
- **Real-time stats** — Total, active, interview, and offer counts are computed on the server and stay in sync automatically via Convex's reactive queries.
- **Search & filter** — Instantly filter by keyword or stage; the pipeline tiles double as quick filters.
- **Inline stage editing** — Click a stage tag in the table to promote a role the moment the recruiter calls.
- **Full application records** — Company, role, location, salary, posting URL, priority, applied date, and private notes.
- **Auth built-in** — Email OTP, email + password, or anonymous guest sessions, powered by Convex Auth. Every application is scoped to the signed-in user, and all reads/writes are enforced server-side.
- **Carbon-inspired design** — Sharp geometry, hairline grids, tabular numerals, mobile responsive, with dark mode support.

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui, Lucide icons |
| Motion | Framer Motion |
| Backend & DB | Convex (queries, mutations, reactive subscriptions) |
| Auth | Convex Auth (email OTP, password, anonymous) |

## 📁 Project Structure

```
src/
├── components/      # App components + shadcn/ui primitives (src/components/ui)
├── convex/          # Convex backend: schema, queries, mutations, auth
│   ├── schema.ts        # users + applications tables
│   ├── applications.ts  # CRUD + stats, scoped to the signed-in user
│   ├── auth.ts          # Convex Auth setup
│   └── http.ts          # HTTP routes for auth
├── hooks/           # use-auth and helpers
├── pages/           # Landing, Auth, Dashboard, NotFound
└── main.tsx         # Router + ConvexAuthProvider entrypoint
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+ (Node 20 recommended)
- [Bun](https://bun.sh) — or npm/pnpm if you prefer (just swap the `bun` commands)
- A free [Convex](https://www.convex.dev) account (backend + database hosting)

### 1. Clone and install

```bash
git clone https://github.com/Akinmoldun/hubdex-tracker.git
cd hubdex-tracker
bun install
```

### 2. Start the Convex backend

```bash
bunx convex dev
```

The first run will:

- Open your browser to log in to Convex
- Ask you to create a new Convex project (or pick an existing one)
- Write `VITE_CONVEX_URL` into a local `.env.local` for you

Keep this command running — it pushes your backend functions to Convex and regenerates `src/convex/_generated/` as you develop.

### 3. Start the frontend (second terminal)

```bash
bun run dev
```

Then open the local URL it prints (usually `http://localhost:5173`).

### 4. Create your account

Go to `/auth` in the running app and sign in with:

- **Email OTP** — a one-time code sent to your email, or
- **Email + password**, or
- **Continue as guest** — an anonymous session for a quick try

That's it — add your first application and start moving it through the pipeline.

## 🔧 Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_CONVEX_URL` | `.env.local` (frontend) | URL of your Convex deployment — created automatically by `convex dev` |
| `CONVEX_DEPLOYMENT` | `.env.local` (frontend) | Name of your Convex deployment — also created by `convex dev` |

Convex Auth secrets (JWT keys, site URL) are managed on the Convex side and are set up automatically for local development. You should never need to create these by hand.

> ⚠️ Never commit your `.env.local` — it's already excluded by `.gitignore`.

## 📜 Scripts

| Command | What it does |
|---------|--------------|
| `bun run dev` | Start the Vite dev server |
| `bun run build` | Type-check and build for production (`dist/`) |
| `bun run preview` | Preview the production build locally |
| `bun run lint` | Run ESLint |
| `bun run format` | Format the codebase with Prettier |
| `bunx convex dev` | Push Convex functions + regenerate types (dev) |

## 🤝 Contributing

Issues and pull requests are welcome! If you spot a bug or have an idea for an improvement, feel free to open an issue.

## 👤 Credits

Hubdex was created and is maintained by **[Akinmoldun](https://github.com/Akinmoldun)**.

If you fork or build on this project, please keep attribution and link back to the original repository.

## 📄 License

This project is licensed under the [MIT License](LICENSE) — you're free to use, modify, and distribute it, as long as the original copyright and license notice are included.
