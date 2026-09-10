import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { STAGES, type Stage, type Priority } from "@/convex/schema";
import { useAuth } from "@/hooks/use-auth";
import { HubdexWordmark, StageTag, PriorityDot } from "@/components/hubdex";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  LogOut,
  Plus,
  Search,
  Pencil,
  Trash2,
  ExternalLink,
  Inbox,
} from "lucide-react";

type AppDoc = Doc<"applications">;

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

const emptyForm = {
  company: "",
  role: "",
  location: "",
  salary: "",
  url: "",
  stage: "Wishlist" as Stage,
  priority: "Medium" as Priority,
  appliedDate: "",
  notes: "",
};

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="border border-border bg-background px-5 py-4">
      <p className="ibm-eyebrow text-muted-foreground">{label}</p>
      <p
        className="mt-2 font-mono text-3xl font-semibold tabular-nums leading-none"
        style={accent ? { color: accent } : undefined}
      >
        {String(value).padStart(2, "0")}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { user, signOut } = useAuth();

  const applications = useQuery(api.applications.list);
  const stats = useQuery(api.applications.stats);

  const createApp = useMutation(api.applications.create);
  const updateApp = useMutation(api.applications.update);
  const updateStage = useMutation(api.applications.updateStage);
  const removeApp = useMutation(api.applications.remove);

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<"All" | Stage>("All");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AppDoc | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AppDoc | null>(null);

  const filtered = useMemo(() => {
    if (!applications) return [];
    const q = search.trim().toLowerCase();
    return applications
      .filter((a) => {
        if (stageFilter !== "All" && a.stage !== stageFilter) return false;
        if (!q) return true;
        return (
          a.company.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q) ||
          (a.location ?? "").toLowerCase().includes(q) ||
          (a.salary ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b._creationTime - a._creationTime);
  }, [applications, search, stageFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (app: AppDoc) => {
    setEditing(app);
    setForm({
      company: app.company,
      role: app.role,
      location: app.location ?? "",
      salary: app.salary ?? "",
      url: app.url ?? "",
      stage: app.stage,
      priority: app.priority,
      appliedDate: app.appliedDate ?? "",
      notes: app.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      company: form.company,
      role: form.role,
      location: form.location || undefined,
      salary: form.salary || undefined,
      url: form.url || undefined,
      stage: form.stage,
      priority: form.priority,
      appliedDate: form.appliedDate || undefined,
      notes: form.notes || undefined,
    };
    try {
      if (editing) {
        await updateApp({ id: editing._id, ...payload });
        toast.success("Application updated");
      } else {
        await createApp(payload);
        toast.success("Application added to your hub");
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async (id: Id<"applications">, stage: Stage) => {
    try {
      await updateStage({ id, stage });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move stage");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeApp({ id: deleteTarget._id });
      toast.success("Application removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const isLoading = applications === undefined;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <HubdexWordmark />
          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
                {user.email}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2"
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </div>
        </div>
        <div className="h-0.5 w-full bg-primary" />
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        {/* Title row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ibm-eyebrow text-[#0f62fe]">Your hub</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
              Application tracker
            </h1>
          </div>
          <Button onClick={openCreate} className="h-11 gap-2 self-start sm:self-auto">
            <Plus className="size-4" />
            Add application
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-px border border-border bg-border lg:grid-cols-4">
          <StatCard label="Total applications" value={stats?.total ?? 0} />
          <StatCard label="Active (applied + interview)" value={stats?.active ?? 0} />
          <StatCard label="Interviews" value={stats?.interviews ?? 0} accent="#6929c4" />
          <StatCard label="Offers" value={stats?.offers ?? 0} accent="#0e6027" />
        </div>

        {/* Pipeline strip */}
        <div className="mt-10">
          <p className="ibm-eyebrow text-muted-foreground">Pipeline</p>
          <div className="mt-3 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
            {(["All", ...STAGES] as const).map((s) => {
              const count =
                s === "All"
                  ? (stats?.total ?? 0)
                  : (stats?.byStage?.[s] ?? 0);
              const active = stageFilter === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStageFilter(s)}
                  className="flex items-center justify-between px-4 py-3 text-left transition-colors"
                  style={{ backgroundColor: active ? "#0f62fe" : "#ffffff" }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = "#f4f4f4";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = "#ffffff";
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: active ? "#ffffff" : "#161616" }}
                  >
                    {s}
                  </span>
                  <span
                    className="font-mono text-sm tabular-nums"
                    style={{
                      color: active ? "#d0e2ff" : "#525252",
                    }}
                  >
                    {String(count).padStart(2, "0")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company, role, location…"
              className="h-10 pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={stageFilter}
              onValueChange={(v) => setStageFilter(v as "All" | Stage)}
            >
              <SelectTrigger className="h-10 w-[160px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All stages</SelectItem>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || stageFilter !== "All") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStageFilter("All");
                }}
              >
                Clear
              </Button>
            )}
          </div>
          <p className="ibm-eyebrow ml-auto hidden text-muted-foreground sm:block">
            {filtered.length} shown
          </p>
        </div>

        {/* Table */}
        <div className="mt-4 border border-border">
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <p className="ibm-eyebrow text-muted-foreground">Loading your hub…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center">
              <Inbox className="size-8 text-muted-foreground" />
              <p className="text-lg font-semibold">
                {applications && applications.length > 0
                  ? "No applications match your filters"
                  : "Your hub is empty"}
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {applications && applications.length > 0
                  ? "Try clearing the search or switching stages."
                  : "Add your first application and start moving it through the pipeline."}
              </p>
              {(!applications || applications.length === 0) && (
                <Button onClick={openCreate} className="mt-2 gap-2">
                  <Plus className="size-4" />
                  Add your first application
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="px-4 py-3">
                    <span className="ibm-eyebrow text-muted-foreground">Company</span>
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    <span className="ibm-eyebrow text-muted-foreground">Role</span>
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    <span className="ibm-eyebrow text-muted-foreground">Stage</span>
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    <span className="ibm-eyebrow text-muted-foreground">Priority</span>
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    <span className="ibm-eyebrow text-muted-foreground">Applied</span>
                  </TableHead>
                  <TableHead className="px-4 py-3">
                    <span className="ibm-eyebrow text-muted-foreground">Salary</span>
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right">
                    <span className="ibm-eyebrow text-muted-foreground">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((app) => (
                  <TableRow key={app._id} className="border-border">
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{app.company}</span>
                        {app.url && (
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open posting for ${app.company}`}
                            className="text-[#0f62fe] hover:text-[#0353e8]"
                          >
                            <ExternalLink className="size-3.5" />
                          </a>
                        )}
                      </div>
                      {app.location && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {app.location}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-sm">{app.role}</span>
                      {app.notes && (
                        <p className="mt-0.5 max-w-[220px] truncate text-xs text-muted-foreground">
                          {app.notes}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Select
                        value={app.stage}
                        onValueChange={(v) => handleStageChange(app._id, v as Stage)}
                      >
                        <SelectTrigger
                          size="sm"
                          className="h-8 gap-1.5 border-0 bg-transparent px-2 shadow-none hover:bg-muted focus-visible:ring-1"
                        >
                          <StageTag stage={app.stage} />
                        </SelectTrigger>
                        <SelectContent>
                          {STAGES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <PriorityDot priority={app.priority} />
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs tabular-nums text-muted-foreground">
                      {app.appliedDate ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs tabular-nums">
                      {app.salary ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${app.company}`}
                          onClick={() => openEdit(app)}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${app.company}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(app)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <p className="ibm-eyebrow mt-6 text-muted-foreground">
          Tip: click a stage tag in the table to move an application — counts
          update everywhere instantly.
        </p>
      </main>

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none p-0 sm:max-w-lg">
          <div className="h-1 w-full bg-primary" />
          <DialogHeader className="px-6 pt-5">
            <p className="ibm-eyebrow text-[#0f62fe]">
              {editing ? "Edit application" : "New application"}
            </p>
            <DialogTitle className="mt-1 text-2xl font-bold tracking-[-0.01em]">
              {editing ? `Update ${editing.company}` : "Log a role"}
            </DialogTitle>
            <DialogDescription>
              Company and role are required. Everything else is optional — add
              it as you learn it.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 px-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    placeholder="Acme Corp"
                    required
                    maxLength={120}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    placeholder="Frontend Engineer"
                    required
                    maxLength={120}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Remote / Berlin"
                    maxLength={200}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="salary">Salary</Label>
                  <Input
                    id="salary"
                    value={form.salary}
                    onChange={(e) => setForm({ ...form, salary: e.target.value })}
                    placeholder="€70–90k"
                    maxLength={100}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="url">Job posting URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://careers.example.com/role/123"
                  maxLength={500}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label>Stage</Label>
                  <Select
                    value={form.stage}
                    onValueChange={(v) => setForm({ ...form, stage: v as Stage })}
                  >
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Priority</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) =>
                      setForm({ ...form, priority: v as Priority })
                    }
                  >
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="appliedDate">Applied date</Label>
                  <Input
                    id="appliedDate"
                    type="date"
                    value={form.appliedDate}
                    onChange={(e) =>
                      setForm({ ...form, appliedDate: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Recruiter contact, interview prep, referral name…"
                  rows={3}
                  maxLength={2000}
                />
              </div>
            </div>
            <DialogFooter className="mt-6 gap-2 border-t border-border bg-muted px-6 py-4 sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : "Add application"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {deleteTarget?.company} — {deleteTarget?.role}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the application from your hub. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              Delete application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
