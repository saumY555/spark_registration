import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  EyeOff,
  Filter,
  KeyRound,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  X,
  ExternalLink,
  Phone,
  Mail,
  UserCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminGetApplications,
  adminUpdateApplication,
  adminVerifyPassword,
  adminDeleteApplication,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal | Spark Recruitment 2026" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

interface ApplicationRecord {
  id: string;
  registration_no: string;
  full_name: string;
  scholar_number: string;
  institute_email: string;
  phone_number: string;
  primary_track: string;
  secondary_track: string | null;
  portfolio_url: string | null;
  motivation: string;
  first_year_confirmed: boolean;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const TRACK_LIST = [
  "All Tracks",
  "Code and Web",
  "AI and Data",
  "Hardware and Robotics",
  "Design and Media",
  "Events and Outreach",
];

const STATUS_LIST = ["All Statuses", "pending", "shortlisted", "selected", "rejected"];

function formatTimestampIST(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function AdminPage() {
  const verifyPassFn = useServerFn(adminVerifyPassword);
  const getAppsFn = useServerFn(adminGetApplications);
  const updateAppFn = useServerFn(adminUpdateApplication);
  const deleteAppFn = useServerFn(adminDeleteApplication);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("All Tracks");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");

  const [activeCandidate, setActiveCandidate] = useState<ApplicationRecord | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");

  // Check saved session on mount
  useEffect(() => {
    try {
      const savedPass = sessionStorage.getItem("spark_admin_auth");
      if (savedPass) {
        setPassword(savedPass);
        handleLogin(savedPass);
      }
    } catch {
      // Ignore sessionStorage errors
    }
  }, []);

  async function handleLogin(passToTest?: string) {
    const pass = passToTest || password;
    if (!pass.trim()) {
      setAuthError("Please enter the admin password.");
      return;
    }
    setAuthError("");
    setIsVerifying(true);

    try {
      await verifyPassFn({ data: { password: pass } });
      setIsAuthenticated(true);
      try {
        sessionStorage.setItem("spark_admin_auth", pass);
      } catch {
        // Ignore
      }
      loadApplications(pass);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : "Invalid password. Access denied.");
      setIsAuthenticated(false);
    } finally {
      setIsVerifying(false);
    }
  }

  function handleLogout() {
    setIsAuthenticated(false);
    setPassword("");
    setApplications([]);
    try {
      sessionStorage.removeItem("spark_admin_auth");
    } catch {
      // Ignore
    }
  }

  async function loadApplications(passOverride?: string) {
    const pass = passOverride || password;
    if (!pass) return;
    setIsLoading(true);
    setFetchError("");

    try {
      const res = await getAppsFn({ data: { password: pass } });
      setApplications(res.applications as ApplicationRecord[]);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch candidates.");
    } finally {
      setIsLoading(false);
    }
  }

  // Open detail modal
  function openCandidateDetails(cand: ApplicationRecord) {
    setActiveCandidate(cand);
    setEditNotes(cand.admin_notes || "");
    setEditStatus(cand.status || "pending");
    setSaveSuccessMsg("");
  }

  // Save changes from candidate modal
  async function handleSaveCandidateDetails() {
    if (!activeCandidate) return;
    setIsSavingDetails(true);
    setSaveSuccessMsg("");

    try {
      await updateAppFn({
        data: {
          password,
          id: activeCandidate.id,
          status: editStatus,
          adminNotes: editNotes.trim() || null,
        },
      });

      setApplications(prev =>
        prev.map(a =>
          a.id === activeCandidate.id
            ? { ...a, status: editStatus, admin_notes: editNotes.trim() || null }
            : a
        )
      );

      setActiveCandidate(prev =>
        prev ? { ...prev, status: editStatus, admin_notes: editNotes.trim() || null } : null
      );

      setSaveSuccessMsg("Changes saved successfully!");
      setTimeout(() => setSaveSuccessMsg(""), 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update candidate.");
    } finally {
      setIsSavingDetails(false);
    }
  }

  // Delete candidate
  async function handleDeleteCandidate(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}'s application? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteAppFn({ data: { password, id } });
      setApplications(prev => prev.filter(a => a.id !== id));
      if (activeCandidate?.id === id) {
        setActiveCandidate(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete candidate.");
    }
  }

  // Filtered applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.full_name?.toLowerCase().includes(q) ||
        app.scholar_number?.toLowerCase().includes(q) ||
        app.institute_email?.toLowerCase().includes(q) ||
        app.phone_number?.toLowerCase().includes(q) ||
        app.registration_no?.toLowerCase().includes(q);

      const matchesTrack =
        selectedTrack === "All Tracks" ||
        app.primary_track === selectedTrack ||
        app.secondary_track === selectedTrack;

      const matchesStatus =
        selectedStatus === "All Statuses" ||
        (app.status || "pending").toLowerCase() === selectedStatus.toLowerCase();

      return matchesSearch && matchesTrack && matchesStatus;
    });
  }, [applications, searchQuery, selectedTrack, selectedStatus]);

  // Track Metrics
  const metrics = useMemo(() => {
    const total = applications.length;
    const codeWeb = applications.filter(a => a.primary_track === "Code and Web").length;
    const aiData = applications.filter(a => a.primary_track === "AI and Data").length;
    const robotics = applications.filter(a => a.primary_track === "Hardware and Robotics").length;
    const design = applications.filter(a => a.primary_track === "Design and Media").length;
    const events = applications.filter(a => a.primary_track === "Events and Outreach").length;
    const shortlisted = applications.filter(a => a.status === "shortlisted").length;
    const selected = applications.filter(a => a.status === "selected").length;

    return { total, codeWeb, aiData, robotics, design, events, shortlisted, selected };
  }, [applications]);

  // Export to CSV
  function handleExportCsv() {
    if (!filteredApps.length) {
      alert("No records to export.");
      return;
    }

    const headers = [
      "Registration No",
      "Full Name",
      "Scholar Number",
      "Email",
      "Phone",
      "Primary Track",
      "Secondary Track",
      "Portfolio URL",
      "Motivation",
      "Status",
      "Admin Notes",
      "Submitted At (IST)",
    ];

    const rows = filteredApps.map(app => [
      `"${app.registration_no}"`,
      `"${app.full_name.replace(/"/g, '""')}"`,
      `"${app.scholar_number}"`,
      `"${app.institute_email}"`,
      `"${app.phone_number}"`,
      `"${app.primary_track}"`,
      `"${app.secondary_track || ""}"`,
      `"${app.portfolio_url || ""}"`,
      `"${app.motivation.replace(/"/g, '""')}"`,
      `"${app.status || "pending"}"`,
      `"${(app.admin_notes || "").replace(/"/g, '""')}"`,
      `"${formatTimestampIST(app.created_at)}"`,
    ]);

    const csvString = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Spark_Applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // -------------------------------------------------------------
  // LOGIN SCREEN
  // -------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-md border-2 border-foreground bg-card p-6 shadow-[10px_10px_0_var(--primary)] sm:p-8">
          <div className="flex items-center gap-3 border-b border-foreground/20 pb-4">
            <div className="grid size-12 place-items-center bg-secondary font-bold text-foreground">
              <Shield className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl uppercase tracking-wider">Spark Admin</h1>
              <p className="text-xs font-semibold text-muted-foreground">Organizer Access Portal</p>
            </div>
          </div>

          <form
            onSubmit={e => {
              e.preventDefault();
              handleLogin();
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="mb-2 block text-xs font-extrabold uppercase text-foreground">
                Enter Admin Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4 text-primary" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {authError && (
              <p className="border border-destructive bg-destructive/10 p-2.5 text-xs font-bold text-destructive">
                {authError}
              </p>
            )}

            <Button
              type="submit"
              variant="electric"
              size="lg"
              disabled={isVerifying}
              className="w-full font-bold uppercase tracking-wider"
            >
              {isVerifying ? "Authenticating…" : "Unlock Portal"}
            </Button>

            <div className="pt-2 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" /> Back to Registration Page
              </Link>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // DASHBOARD SCREEN
  // -------------------------------------------------------------
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-foreground/20 bg-background/95 backdrop-blur px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 text-xs font-bold hover:text-primary">
              <img src="/spark-logo.png" alt="Spark Logo" className="size-8 rounded object-contain" />
              <span className="hidden uppercase font-extrabold sm:inline">Spark Recruitment · Admin</span>
            </Link>
            <span className="rounded bg-primary px-2.5 py-0.5 text-xs font-extrabold text-primary-foreground uppercase">
              {applications.length} Candidates
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadApplications()}
              disabled={isLoading}
              title="Refresh candidate data"
            >
              <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportCsv} title="Download CSV">
              <Download className="size-3.5 text-primary" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {/* Metrics Counter Bar */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <div className="border border-foreground/20 bg-card p-3 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Total Applicants</span>
            <p className="font-display text-3xl font-extrabold text-primary">{metrics.total}</p>
          </div>
          <div className="border border-foreground/20 bg-card p-3 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Code & Web</span>
            <p className="font-display text-2xl font-bold">{metrics.codeWeb}</p>
          </div>
          <div className="border border-foreground/20 bg-card p-3 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground">AI & Data</span>
            <p className="font-display text-2xl font-bold">{metrics.aiData}</p>
          </div>
          <div className="border border-foreground/20 bg-card p-3 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Robotics & HW</span>
            <p className="font-display text-2xl font-bold">{metrics.robotics}</p>
          </div>
          <div className="border border-foreground/20 bg-card p-3 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Design & Media</span>
            <p className="font-display text-2xl font-bold">{metrics.design}</p>
          </div>
          <div className="border border-foreground/20 bg-card p-3 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Events & PR</span>
            <p className="font-display text-2xl font-bold">{metrics.events}</p>
          </div>
          <div className="border border-foreground/20 bg-secondary/20 p-3 shadow-sm">
            <span className="text-[10px] font-extrabold uppercase text-foreground">Shortlisted</span>
            <p className="font-display text-2xl font-extrabold text-primary">{metrics.shortlisted}</p>
          </div>
        </section>

        {/* Search & Filter Bar */}
        <section className="mb-6 flex flex-col gap-3 rounded-md border border-foreground/20 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, scholar no, email, phone, or SGT26 ID…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTrack}
              onChange={e => setSelectedTrack(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TRACK_LIST.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {STATUS_LIST.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {(searchQuery || selectedTrack !== "All Tracks" || selectedStatus !== "All Statuses") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTrack("All Tracks");
                  setSelectedStatus("All Statuses");
                }}
                className="text-xs font-bold"
              >
                Clear
              </Button>
            )}
          </div>
        </section>

        {/* Table Section */}
        {fetchError && (
          <div className="mb-4 border border-destructive bg-destructive/10 p-4 text-sm font-bold text-destructive">
            {fetchError}
          </div>
        )}

        <div className="overflow-x-auto border-2 border-foreground bg-card shadow-[6px_6px_0_var(--foreground)]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="border-b-2 border-foreground bg-foreground text-background">
              <tr>
                <th className="p-3 font-extrabold uppercase">#</th>
                <th className="p-3 font-extrabold uppercase">Reg No</th>
                <th className="p-3 font-extrabold uppercase">Candidate</th>
                <th className="p-3 font-extrabold uppercase">Scholar No</th>
                <th className="p-3 font-extrabold uppercase">Contact</th>
                <th className="p-3 font-extrabold uppercase">Tracks</th>
                <th className="p-3 font-extrabold uppercase">Status</th>
                <th className="p-3 font-extrabold uppercase">Submitted (IST)</th>
                <th className="p-3 text-right font-extrabold uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/10 font-medium">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    {isLoading ? "Loading candidates…" : "No matching candidate records found."}
                  </td>
                </tr>
              ) : (
                filteredApps.map((app, index) => {
                  const statusColor =
                    app.status === "selected"
                      ? "bg-secondary text-foreground font-extrabold"
                      : app.status === "shortlisted"
                      ? "bg-primary text-primary-foreground font-extrabold"
                      : app.status === "rejected"
                      ? "bg-destructive/20 text-destructive font-bold"
                      : "bg-muted text-muted-foreground font-semibold";

                  return (
                    <tr
                      key={app.id}
                      className="transition-colors hover:bg-muted/40 cursor-pointer"
                      onClick={() => openCandidateDetails(app)}
                    >
                      <td className="p-3 text-muted-foreground font-bold">{index + 1}</td>
                      <td className="p-3 font-extrabold text-primary whitespace-nowrap">
                        {app.registration_no}
                      </td>
                      <td className="p-3">
                        <div className="font-extrabold text-foreground">{app.full_name}</div>
                        {app.admin_notes && (
                          <span className="inline-block mt-0.5 rounded bg-yellow-400/20 px-1.5 py-0.2 text-[10px] font-bold text-yellow-800 dark:text-yellow-200">
                            📝 Has Note
                          </span>
                        )}
                      </td>
                      <td className="p-3 uppercase font-extrabold">{app.scholar_number}</td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="text-xs text-foreground font-medium">{app.institute_email}</div>
                        <div className="text-xs text-muted-foreground">{app.phone_number}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-primary">{app.primary_track}</span>
                        {app.secondary_track && (
                          <div className="text-[11px] text-muted-foreground">
                            2nd: {app.secondary_track}
                          </div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className={`inline-block rounded px-2 py-0.5 text-[11px] uppercase ${statusColor}`}>
                          {app.status || "pending"}
                        </span>
                      </td>
                      <td className="p-3 whitespace-nowrap text-xs text-muted-foreground">
                        {formatTimestampIST(app.created_at)}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCandidateDetails(app)}
                          className="h-8 px-2 text-xs font-bold"
                        >
                          <Eye className="mr-1 size-3.5" /> View
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CANDIDATE DETAIL MODAL */}
      {/* ------------------------------------------------------------- */}
      {activeCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col border-2 border-foreground bg-card shadow-[12px_12px_0_var(--primary)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-foreground bg-muted/40 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary px-2 py-0.5 text-xs font-extrabold text-primary-foreground">
                    {activeCandidate.registration_no}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {formatTimestampIST(activeCandidate.created_at)}
                  </span>
                </div>
                <h2 className="mt-1 font-display text-2xl uppercase tracking-wide">
                  {activeCandidate.full_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setActiveCandidate(null)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-6" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="space-y-4 overflow-y-auto p-5 text-sm">
              {/* Contact Cards */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="border border-foreground/20 bg-background p-3">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Scholar Number</span>
                  <p className="font-extrabold uppercase text-foreground">{activeCandidate.scholar_number}</p>
                </div>

                <div className="border border-foreground/20 bg-background p-3">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Phone Number</span>
                  <p className="font-bold">
                    <a
                      href={`tel:${activeCandidate.phone_number}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Phone className="size-3" /> {activeCandidate.phone_number}
                    </a>
                  </p>
                </div>

                <div className="border border-foreground/20 bg-background p-3">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Email Address</span>
                  <p className="font-bold truncate" title={activeCandidate.institute_email}>
                    <a
                      href={`mailto:${activeCandidate.institute_email}`}
                      className="inline-flex items-center gap-1 text-primary hover:underline truncate"
                    >
                      <Mail className="size-3 shrink-0" /> {activeCandidate.institute_email}
                    </a>
                  </p>
                </div>
              </div>

              {/* Tracks & Portfolio */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="border border-foreground/20 bg-background p-3">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Track Preferences</span>
                  <p className="font-extrabold text-primary">1st: {activeCandidate.primary_track}</p>
                  <p className="text-xs text-muted-foreground font-semibold">
                    2nd: {activeCandidate.secondary_track || "None"}
                  </p>
                </div>

                <div className="border border-foreground/20 bg-background p-3">
                  <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Portfolio / Links</span>
                  {activeCandidate.portfolio_url ? (
                    <p className="font-bold">
                      <a
                        href={activeCandidate.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline break-all"
                      >
                        <ExternalLink className="size-3 shrink-0" /> {activeCandidate.portfolio_url}
                      </a>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">No portfolio link provided</p>
                  )}
                </div>
              </div>

              {/* Motivation */}
              <div>
                <span className="mb-1 block text-xs font-extrabold uppercase text-foreground">
                  Candidate Motivation / Statement
                </span>
                <div className="rounded border border-foreground/20 bg-background p-3.5 text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-wrap">
                  {activeCandidate.motivation}
                </div>
              </div>

              {/* Admin Evaluation Section */}
              <div className="border-t border-foreground/20 pt-4">
                <h3 className="text-xs font-extrabold uppercase text-primary mb-3">Organizer Evaluation</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold">Candidate Status</label>
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      className="h-10 w-full rounded border border-input bg-background px-3 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="pending">Pending Review</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="selected">Selected for Spark</option>
                      <option value="rejected">Rejected / Not Selected</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold">Internal Notes</label>
                    <Input
                      type="text"
                      placeholder="e.g. strong portfolio, interview scheduled…"
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                {saveSuccessMsg && (
                  <p className="mt-2 text-xs font-bold text-green-600 dark:text-green-400">
                    ✓ {saveSuccessMsg}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between border-t border-foreground/20 bg-muted/20 p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteCandidate(activeCandidate.id, activeCandidate.full_name)}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground font-bold text-xs"
              >
                <Trash2 className="mr-1 size-3.5" /> Delete Candidate
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveCandidate(null)}>
                  Close
                </Button>
                <Button
                  variant="electric"
                  size="sm"
                  onClick={handleSaveCandidateDetails}
                  disabled={isSavingDetails}
                  className="font-bold"
                >
                  {isSavingDetails ? "Saving…" : "Save Evaluation"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
