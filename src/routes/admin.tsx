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
  Globe,
  Rocket,
  Flame,
  Check,
  Copy,
  Activity,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  adminGetApplications,
  adminUpdateApplication,
  adminVerifyPassword,
  adminDeleteApplication,
  adminGetBuildSubmissions,
  type AdminBuildSubmissionItem,
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

function formatDisplayUrl(raw?: string | null): string {
  if (!raw) return "—";
  try {
    const url = new URL(raw);
    const domain = url.hostname.replace(/^www\./, "");
    const pathname = url.pathname === "/" ? "" : url.pathname;
    return `${domain}${pathname}`;
  } catch {
    return raw.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }
}

function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diffMs)) return "—";
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function AdminPage() {
  const verifyPassFn = useServerFn(adminVerifyPassword);
  const getAppsFn = useServerFn(adminGetApplications);
  const updateAppFn = useServerFn(adminUpdateApplication);
  const deleteAppFn = useServerFn(adminDeleteApplication);
  const getBuildsFn = useServerFn(adminGetBuildSubmissions);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Top View Switcher: "registrations" (Candidate registrations) vs "drop_builds" (Drop Your Build Station)
  const [adminView, setAdminView] = useState<"registrations" | "drop_builds">("registrations");

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");

  // Drop Your Build Station state
  const [buildSubmissions, setBuildSubmissions] = useState<AdminBuildSubmissionItem[]>([]);
  const [isLoadingBuilds, setIsLoadingBuilds] = useState(false);
  const [buildSearchQuery, setBuildSearchQuery] = useState("");
  const [autoRefreshBuilds, setAutoRefreshBuilds] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [copiedAllUrlsMsg, setCopiedAllUrlsMsg] = useState("");
  const [buildSourceFilter, setBuildSourceFilter] = useState<"all_submitted_links" | "drop_your_build_only">("all_submitted_links");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("All Tracks");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [linkFilter, setLinkFilter] = useState<"all" | "drop_build" | "with_link" | "without_link">("all");

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
      loadBuildSubmissions(pass, true);
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
    setBuildSubmissions([]);
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
      loadBuildSubmissions(pass, true);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to fetch candidates.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadBuildSubmissions(passOverride?: string, silent = false) {
    const pass = passOverride || password;
    if (!pass) return;
    if (!silent) setIsLoadingBuilds(true);

    try {
      const res = await getBuildsFn({ data: { password: pass } });
      setBuildSubmissions(res.submissions || []);
    } catch (err) {
      console.warn("[Failed to load build submissions]", err);
    } finally {
      if (!silent) setIsLoadingBuilds(false);
    }
  }

  // Auto-refresh builds every 10 seconds if toggled on
  useEffect(() => {
    if (!isAuthenticated || !autoRefreshBuilds || !password) return;
    const interval = setInterval(() => {
      loadBuildSubmissions(password, true);
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefreshBuilds, password]);

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

  // Set of scholar numbers that submitted via Drop Your Build
  const dropBuildScholarSet = useMemo(() => {
    const set = new Set<string>();
    buildSubmissions.forEach(b => {
      if (b.scholarNumber) set.add(b.scholarNumber.toUpperCase().trim());
    });
    applications.forEach(a => {
      if (a.admin_notes && a.admin_notes.includes("[DROP_YOUR_BUILD]")) {
        set.add((a.scholar_number || "").toUpperCase().trim());
      }
    });
    return set;
  }, [buildSubmissions, applications]);

  // Total Drop Your Build submissions count
  const dropBuildCount = useMemo(() => {
    let count = 0;
    applications.forEach(a => {
      if (dropBuildScholarSet.has((a.scholar_number || "").toUpperCase().trim())) {
        count++;
      }
    });
    return Math.max(count, buildSubmissions.length);
  }, [applications, dropBuildScholarSet, buildSubmissions]);

  // Filtered applications for main table
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const q = searchQuery.toLowerCase().trim();
      const hasLink = Boolean(app.portfolio_url && app.portfolio_url.trim().length > 0);
      const isDropBuild = dropBuildScholarSet.has((app.scholar_number || "").toUpperCase().trim());

      const matchesSearch =
        !q ||
        app.full_name?.toLowerCase().includes(q) ||
        app.scholar_number?.toLowerCase().includes(q) ||
        app.institute_email?.toLowerCase().includes(q) ||
        app.phone_number?.toLowerCase().includes(q) ||
        app.registration_no?.toLowerCase().includes(q) ||
        (app.portfolio_url && app.portfolio_url.toLowerCase().includes(q));

      const matchesTrack =
        selectedTrack === "All Tracks" ||
        app.primary_track === selectedTrack ||
        app.secondary_track === selectedTrack;

      const matchesStatus =
        selectedStatus === "All Statuses" ||
        (app.status || "pending").toLowerCase() === selectedStatus.toLowerCase();

      const matchesLink =
        linkFilter === "all" ||
        (linkFilter === "drop_build" && isDropBuild) ||
        (linkFilter === "with_link" && hasLink) ||
        (linkFilter === "without_link" && !hasLink);

      return matchesSearch && matchesTrack && matchesStatus && matchesLink;
    });
  }, [applications, searchQuery, selectedTrack, selectedStatus, linkFilter, dropBuildScholarSet]);

  // Submissions for the Drop Your Build Live Station View
  const displayBuilds = useMemo(() => {
    const map = new Map<string, AdminBuildSubmissionItem>();

    // 1. Direct / local submissions
    for (const b of buildSubmissions) {
      map.set(b.scholarNumber.toUpperCase().trim(), b);
    }

    // 2. Applications tagged with [DROP_YOUR_BUILD] in Supabase
    for (const app of applications) {
      const scholar = (app.scholar_number || "").toUpperCase().trim();
      if (!scholar) continue;

      const isMarked = app.admin_notes && app.admin_notes.includes("[DROP_YOUR_BUILD]");
      if (isMarked && !map.has(scholar)) {
        const webMatch = app.admin_notes?.match(/Web:\s*(https?:\/\/[^\s|]+)/i);
        const ghMatch = app.admin_notes?.match(/GitHub:\s*(https?:\/\/[^\s|)]+)/i);
        map.set(scholar, {
          id: app.id,
          scholarNumber: scholar,
          studentName: app.full_name,
          websiteUrl: webMatch ? webMatch[1] : app.portfolio_url || "",
          githubUrl: ghMatch ? ghMatch[1] : null,
          screenshotUrl: null,
          submittedAt: app.updated_at || app.created_at,
          posterGenerated: false,
          isRegisteredCandidate: true,
          registrationNo: app.registration_no,
          email: app.institute_email,
          phone: app.phone_number,
          track: app.primary_track,
          status: app.status,
        });
      }
    }

    // 3. If source filter is "all_submitted_links", also include any candidate with a portfolio/build link
    if (buildSourceFilter === "all_submitted_links") {
      for (const app of applications) {
        const scholar = (app.scholar_number || "").toUpperCase().trim();
        if (!scholar || !app.portfolio_url) continue;
        if (!map.has(scholar)) {
          map.set(scholar, {
            id: app.id,
            scholarNumber: scholar,
            studentName: app.full_name,
            websiteUrl: app.portfolio_url,
            githubUrl: null,
            screenshotUrl: null,
            submittedAt: app.updated_at || app.created_at,
            posterGenerated: false,
            isRegisteredCandidate: true,
            registrationNo: app.registration_no,
            email: app.institute_email,
            phone: app.phone_number,
            track: app.primary_track,
            status: app.status,
          });
        }
      }
    }

    let list = Array.from(map.values());

    if (buildSearchQuery.trim()) {
      const q = buildSearchQuery.toLowerCase().trim();
      list = list.filter(
        b =>
          b.studentName.toLowerCase().includes(q) ||
          b.scholarNumber.toLowerCase().includes(q) ||
          b.websiteUrl.toLowerCase().includes(q) ||
          (b.githubUrl && b.githubUrl.toLowerCase().includes(q)) ||
          (b.track && b.track.toLowerCase().includes(q))
      );
    }

    return list.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [buildSubmissions, applications, buildSourceFilter, buildSearchQuery]);

  // Copy all build URLs to clipboard
  function handleCopyAllBuildUrls() {
    const urls = displayBuilds.map(b => b.websiteUrl).filter(Boolean);
    if (!urls.length) {
      alert("No build URLs available to copy.");
      return;
    }
    navigator.clipboard.writeText(urls.join("\n"));
    setCopiedAllUrlsMsg(`Copied ${urls.length} URLs!`);
    setTimeout(() => setCopiedAllUrlsMsg(""), 3000);
  }

  // Export Builds to CSV
  function handleExportBuildsCsv() {
    if (!displayBuilds.length) {
      alert("No build records to export.");
      return;
    }

    const headers = [
      "Scholar Number",
      "Student Name",
      "Website URL",
      "GitHub URL",
      "Submitted At (IST)",
      "Registered Status",
      "Primary Track",
      "Email",
      "Phone",
    ];

    const rows = displayBuilds.map(b => [
      `"${b.scholarNumber}"`,
      `"${b.studentName.replace(/"/g, '""')}"`,
      `"${b.websiteUrl}"`,
      `"${b.githubUrl || ""}"`,
      `"${formatTimestampIST(b.submittedAt)}"`,
      `"${b.isRegisteredCandidate ? "Registered" : "Walk-in"}"`,
      `"${b.track || ""}"`,
      `"${b.email || ""}"`,
      `"${b.phone || ""}"`,
    ]);

    const csvString = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Spark_DropYourBuild_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Track & Submission Metrics
  const metrics = useMemo(() => {
    const total = applications.length;
    const codeWeb = applications.filter(a => a.primary_track === "Code and Web").length;
    const aiData = applications.filter(a => a.primary_track === "AI and Data").length;
    const robotics = applications.filter(a => a.primary_track === "Hardware and Robotics").length;
    const design = applications.filter(a => a.primary_track === "Design and Media").length;
    const events = applications.filter(a => a.primary_track === "Events and Outreach").length;
    const withLinks = applications.filter(a => Boolean(a.portfolio_url && a.portfolio_url.trim().length > 0)).length;
    const withoutLinks = total - withLinks;
    const shortlisted = applications.filter(a => a.status === "shortlisted").length;
    const selected = applications.filter(a => a.status === "selected").length;

    return { total, codeWeb, aiData, robotics, design, events, withLinks, withoutLinks, shortlisted, selected };
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

      {/* Top Navigation Tabs: Candidate Registrations vs Drop Your Build Live Station */}
      <div className="border-b-2 border-foreground/30 bg-muted/20 px-4 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setAdminView("registrations")}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              adminView === "registrations"
                ? "border-primary text-primary bg-primary/10 shadow-sm"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Users className="size-4" />
            <span>Candidate Registrations</span>
            <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-bold text-foreground">
              {applications.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAdminView("drop_builds");
              loadBuildSubmissions(password);
            }}
            className={`flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap relative ${
              adminView === "drop_builds"
                ? "border-primary text-primary bg-primary/15 shadow-sm"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Rocket className="size-4 text-primary animate-bounce" />
            <span>Drop Your Build Live Feed</span>
            <span className="rounded bg-primary px-2 py-0.5 text-[11px] font-black text-primary-foreground shadow-sm">
              {displayBuilds.length}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-black text-primary tracking-widest uppercase ml-1">
              <span className="size-1.5 rounded-full bg-primary animate-ping" />
              LIVE
            </span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        {adminView === "drop_builds" ? (
          /* ============================================================== */
          /* DEDICATED DROP YOUR BUILD STATION VIEW                          */
          /* ============================================================== */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Live Station Banner */}
            <section className="rounded-lg border-2 border-primary bg-gradient-to-r from-primary/15 via-primary/5 to-background p-4 sm:p-6 shadow-[6px_6px_0_var(--foreground)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="grid size-9 place-items-center rounded bg-primary text-primary-foreground shadow-sm font-black">
                      <Rocket className="size-5" />
                    </span>
                    <h2 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wider text-foreground">
                      Drop Your Build · Live Station
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/20 px-2.5 py-0.5 text-[11px] font-black text-primary uppercase">
                      <span className="size-2 rounded-full bg-primary animate-ping" />
                      Live Feed
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-semibold text-muted-foreground max-w-2xl">
                    Dedicated live feed of all projects & deployed websites submitted from the home page <strong>"Drop Your Build"</strong> option.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadBuildSubmissions(password)}
                    disabled={isLoadingBuilds}
                    className="font-bold text-xs"
                    title="Fetch latest build drops"
                  >
                    <RefreshCw className={`mr-1.5 size-3.5 ${isLoadingBuilds ? "animate-spin" : ""}`} />
                    Refresh Feed
                  </Button>

                  <Button
                    variant={autoRefreshBuilds ? "electric" : "outline"}
                    size="sm"
                    onClick={() => setAutoRefreshBuilds(prev => !prev)}
                    className="font-bold text-xs"
                    title="Auto-refresh incoming submissions every 10 seconds"
                  >
                    <Activity className={`mr-1.5 size-3.5 ${autoRefreshBuilds ? "animate-pulse" : ""}`} />
                    {autoRefreshBuilds ? "Auto-Refresh: ON (10s)" : "Auto-Refresh: OFF"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAllBuildUrls}
                    className="font-bold text-xs border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                    title="Copy all live project URLs for evaluation"
                  >
                    <Copy className="mr-1.5 size-3.5" />
                    {copiedAllUrlsMsg || "Copy All URLs"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportBuildsCsv}
                    className="font-bold text-xs"
                    title="Export build submissions to CSV"
                  >
                    <Download className="mr-1.5 size-3.5" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </section>

            {/* Metric Summary Cards */}
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-foreground/20 bg-card p-4 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground flex items-center gap-1">
                  <Rocket className="size-3 text-primary" /> Total Builds Dropped
                </span>
                <p className="font-display text-3xl font-extrabold text-primary mt-1">{displayBuilds.length}</p>
                <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Projects received</p>
              </div>

              <div className="border border-foreground/20 bg-card p-4 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground flex items-center gap-1">
                  <FaGithub className="size-3 text-foreground" /> With GitHub Repos
                </span>
                <p className="font-display text-3xl font-bold mt-1">
                  {displayBuilds.filter(b => b.githubUrl).length}
                </p>
                <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Source code linked</p>
              </div>

              <div className="border border-foreground/20 bg-card p-4 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground flex items-center gap-1">
                  <UserCheck className="size-3 text-foreground" /> Registered Members
                </span>
                <p className="font-display text-3xl font-bold mt-1">
                  {displayBuilds.filter(b => b.isRegisteredCandidate).length}
                </p>
                <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">Matched with applicant profile</p>
              </div>

              <div className="border border-foreground/20 bg-card p-4 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3 text-primary" /> Latest Drop
                </span>
                <p className="font-display text-2xl font-black text-primary mt-1 truncate">
                  {displayBuilds[0] ? formatTimeAgo(displayBuilds[0].submittedAt) : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 truncate">
                  {displayBuilds[0] ? displayBuilds[0].studentName : "Waiting for submission"}
                </p>
              </div>
            </section>

            {/* Search & Source Filter Bar */}
            <section className="flex flex-col gap-3 rounded-md border border-foreground/20 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search builds by student name, scholar no, website URL, or GitHub repo…"
                  value={buildSearchQuery}
                  onChange={e => setBuildSearchQuery(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>

              <div className="inline-flex rounded-md border border-foreground/20 bg-muted/30 p-1">
                <button
                  type="button"
                  onClick={() => setBuildSourceFilter("all_submitted_links")}
                  className={`rounded px-3 py-1.5 text-xs font-black uppercase transition-all ${
                    buildSourceFilter === "all_submitted_links"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Submitted Builds ({applications.filter(a => a.portfolio_url).length})
                </button>
                <button
                  type="button"
                  onClick={() => setBuildSourceFilter("drop_your_build_only")}
                  className={`rounded px-3 py-1.5 text-xs font-black uppercase transition-all ${
                    buildSourceFilter === "drop_your_build_only"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🚀 Drop Station Only ({buildSubmissions.length})
                </button>
              </div>
            </section>

            {/* Builds Table */}
            <div className="overflow-x-auto border-2 border-foreground bg-card shadow-[6px_6px_0_var(--foreground)]">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b-2 border-foreground bg-foreground text-background">
                  <tr>
                    <th className="p-3 font-extrabold uppercase">#</th>
                    <th className="p-3 font-extrabold uppercase">Candidate</th>
                    <th className="p-3 font-extrabold uppercase">Scholar No</th>
                    <th className="p-3 font-extrabold uppercase">Live Deployed Website</th>
                    <th className="p-3 font-extrabold uppercase">GitHub Repo</th>
                    <th className="p-3 font-extrabold uppercase">Submitted (IST)</th>
                    <th className="p-3 font-extrabold uppercase">Source / Status</th>
                    <th className="p-3 text-right font-extrabold uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10 font-medium">
                  {displayBuilds.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center">
                        <div className="mx-auto max-w-md space-y-3">
                          <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
                            <Rocket className="size-6 animate-bounce" />
                          </div>
                          <h3 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
                            Waiting for Incoming Builds
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Students who submit their deployed websites via the <strong>"Drop Your Build"</strong> modal will appear here in real time.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayBuilds.map((build, index) => {
                      const isDropStation =
                        buildSubmissions.some(b => b.scholarNumber.toUpperCase().trim() === build.scholarNumber.toUpperCase().trim()) ||
                        applications.some(
                          a =>
                            (a.scholar_number || "").toUpperCase().trim() === build.scholarNumber.toUpperCase().trim() &&
                            a.admin_notes &&
                            a.admin_notes.includes("[DROP_YOUR_BUILD]")
                        );

                      return (
                        <tr key={build.id || build.scholarNumber} className="transition-colors hover:bg-muted/40">
                          <td className="p-3 text-muted-foreground font-bold">{index + 1}</td>
                          <td className="p-3">
                            <div className="font-extrabold text-foreground">{build.studentName}</div>
                            {build.email && (
                              <div className="text-[11px] text-muted-foreground truncate max-w-[180px]">{build.email}</div>
                            )}
                          </td>
                          <td className="p-3 uppercase font-extrabold">
                            <span className="font-mono bg-muted/60 px-2 py-0.5 rounded border border-foreground/10">
                              {build.scholarNumber}
                            </span>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <a
                                href={build.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-1.5 rounded border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-black text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                                title={build.websiteUrl}
                              >
                                <ExternalLink className="size-3.5 shrink-0" />
                                <span className="max-w-[190px] truncate">
                                  {formatDisplayUrl(build.websiteUrl)}
                                </span>
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(build.websiteUrl);
                                  setCopiedUrl(build.websiteUrl);
                                  setTimeout(() => setCopiedUrl(null), 2000);
                                }}
                                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                title="Copy URL"
                              >
                                {copiedUrl === build.websiteUrl ? (
                                  <Check className="size-3.5 text-primary" />
                                ) : (
                                  <Copy className="size-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {build.githubUrl ? (
                              <a
                                href={build.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded border border-foreground/20 bg-background px-2.5 py-1 text-xs font-bold text-foreground hover:border-foreground transition-all"
                                title={build.githubUrl}
                              >
                                <FaGithub className="size-3 shrink-0" />
                                <span className="max-w-[130px] truncate">{formatDisplayUrl(build.githubUrl)}</span>
                              </a>
                            ) : (
                              <span className="text-muted-foreground/40 text-xs font-semibold">—</span>
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-bold text-foreground">{formatTimeAgo(build.submittedAt)}</div>
                            <div className="text-[11px] text-muted-foreground">{formatTimestampIST(build.submittedAt)}</div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex flex-col gap-1 items-start">
                              {isDropStation ? (
                                <span className="inline-flex items-center gap-1 rounded bg-primary/15 border border-primary/40 px-2 py-0.5 text-[10px] font-black text-primary uppercase">
                                  <Rocket className="size-2.5" /> DROP STATION
                                </span>
                              ) : (
                                <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase">
                                  REGISTRATION
                                </span>
                              )}
                              {build.isRegisteredCandidate ? (
                                <span className="text-[10px] font-bold text-muted-foreground">
                                  {build.track || "Registered"}
                                </span>
                              ) : (
                                <span className="text-[10px] font-extrabold text-primary">Walk-in</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={build.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
                              >
                                <ExternalLink className="size-3" /> Open
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* CANDIDATE REGISTRATIONS VIEW (MAIN TABLE)                       */
          /* ============================================================== */
          <div>
            {/* Metrics Counter Bar */}
            <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
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
              {/* Submitted Links Card (Clickable Quick Filter) */}
              <div
                onClick={() => setLinkFilter(prev => (prev === "with_link" ? "all" : "with_link"))}
                className={`cursor-pointer border p-3 shadow-sm transition-all hover:-translate-y-0.5 ${
                  linkFilter === "with_link"
                    ? "border-primary bg-primary/15 ring-2 ring-primary shadow-[3px_3px_0_var(--foreground)]"
                    : "border-foreground/20 bg-card hover:border-foreground"
                }`}
                title="Click to toggle: Show only candidates who submitted links"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-primary flex items-center gap-1">
                    <span>🔥</span> Submitted Links
                  </span>
                  {linkFilter === "with_link" && (
                    <span className="rounded bg-primary px-1 text-[9px] font-black uppercase text-primary-foreground">
                      Active
                    </span>
                  )}
                </div>
                <p className="font-display text-2xl font-extrabold text-primary">{metrics.withLinks}</p>
              </div>
              <div className="border border-foreground/20 bg-secondary/20 p-3 shadow-sm">
                <span className="text-[10px] font-extrabold uppercase text-foreground">Shortlisted</span>
                <p className="font-display text-2xl font-extrabold text-primary">{metrics.shortlisted}</p>
              </div>
            </section>

            {/* Dedicated Option Segment: View All vs Drop Your Build vs With Submitted Links */}
            <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex flex-wrap items-center gap-1.5 rounded-lg border-2 border-foreground bg-muted/40 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setLinkFilter("all")}
                  className={`rounded px-3 py-1.5 text-xs font-black uppercase transition-all ${
                    linkFilter === "all"
                      ? "bg-foreground text-background shadow-[2px_2px_0_var(--foreground)]"
                      : "text-muted-foreground hover:bg-background hover:text-foreground"
                  }`}
                >
                  All Candidates ({metrics.total})
                </button>
                <button
                  type="button"
                  onClick={() => setLinkFilter("drop_build")}
                  className={`flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-black uppercase transition-all ${
                    linkFilter === "drop_build"
                      ? "bg-primary text-primary-foreground shadow-[2px_2px_0_var(--foreground)]"
                      : "text-foreground hover:bg-primary/15"
                  }`}
                >
                  <Rocket className="size-3.5" />
                  <span>Drop Your Build ({dropBuildCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLinkFilter("with_link")}
                  className={`flex items-center gap-1.5 rounded px-3.5 py-1.5 text-xs font-black uppercase transition-all ${
                    linkFilter === "with_link"
                      ? "bg-primary text-primary-foreground shadow-[2px_2px_0_var(--foreground)]"
                      : "text-foreground hover:bg-primary/15"
                  }`}
                >
                  <span className="text-sm">🔥</span>
                  <span>With Any Link ({metrics.withLinks})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLinkFilter("without_link")}
                  className={`rounded px-3 py-1.5 text-xs font-black uppercase transition-all ${
                    linkFilter === "without_link"
                      ? "bg-foreground text-background shadow-[2px_2px_0_var(--foreground)]"
                      : "text-muted-foreground hover:bg-background hover:text-foreground"
                  }`}
                >
                  No Link ({metrics.withoutLinks})
                </button>
              </div>

              {linkFilter === "drop_build" && (
                <div className="inline-flex items-center gap-2 rounded border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary animate-in fade-in duration-200">
                  <Rocket className="size-3.5 animate-bounce" />
                  Showing <strong>{filteredApps.length}</strong> candidates who submitted via <strong>Drop Your Build</strong>
                </div>
              )}

              {linkFilter === "with_link" && (
                <div className="inline-flex items-center gap-2 rounded border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary animate-in fade-in duration-200">
                  <span className="flex size-2 rounded-full bg-primary animate-pulse" />
                  Showing <strong>{filteredApps.length}</strong> candidates who dropped a website or portfolio link
                </div>
              )}
            </section>

            {/* Search & Filter Bar */}
            <section className="mb-6 flex flex-col gap-3 rounded-md border border-foreground/20 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, scholar no, email, phone, link domain, or Reg ID…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={linkFilter}
                  onChange={e => setLinkFilter(e.target.value as "all" | "drop_build" | "with_link" | "without_link")}
                  className={`h-10 rounded-md border px-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ring ${
                    linkFilter === "drop_build" || linkFilter === "with_link"
                      ? "border-primary bg-primary/10 text-primary font-black"
                      : "border-input bg-background"
                  }`}
                >
                  <option value="all">Links: All Candidates</option>
                  <option value="drop_build">🚀 Drop Your Build Submissions ({dropBuildCount})</option>
                  <option value="with_link">🔥 With Any Submitted Link ({metrics.withLinks})</option>
                  <option value="without_link">Without Links ({metrics.withoutLinks})</option>
                </select>

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

                {(searchQuery || selectedTrack !== "All Tracks" || selectedStatus !== "All Statuses" || linkFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedTrack("All Tracks");
                      setSelectedStatus("All Statuses");
                      setLinkFilter("all");
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
                    <th className="p-3 font-extrabold uppercase">Link / Build</th>
                    <th className="p-3 font-extrabold uppercase">Status</th>
                    <th className="p-3 font-extrabold uppercase">Submitted (IST)</th>
                    <th className="p-3 text-right font-extrabold uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/10 font-medium">
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        {isLoading
                          ? "Loading candidates…"
                          : linkFilter === "drop_build"
                          ? "No candidates found who submitted via Drop Your Build."
                          : linkFilter === "with_link"
                          ? "No candidates found with submitted links for this filter."
                          : "No matching candidate records found."}
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

                      const isDropBuildCandidate = dropBuildScholarSet.has(
                        (app.scholar_number || "").toUpperCase().trim()
                      );

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
                          <td className="p-3 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                            {app.portfolio_url ? (
                              <div className="flex items-center gap-1.5">
                                <a
                                  href={app.portfolio_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group inline-flex items-center gap-1.5 rounded border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-black text-primary transition-all hover:bg-primary hover:text-primary-foreground hover:shadow-sm"
                                  title={app.portfolio_url}
                                >
                                  <ExternalLink className="size-3 shrink-0" />
                                  <span className="max-w-[130px] truncate">
                                    {formatDisplayUrl(app.portfolio_url)}
                                  </span>
                                </a>
                                {isDropBuildCandidate && (
                                  <span
                                    className="inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-black uppercase text-primary-foreground shadow-sm"
                                    title="Submitted via Drop Your Build station"
                                  >
                                    <Rocket className="size-2.5" /> BUILD
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40 text-xs font-semibold">—</span>
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
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openCandidateDetails(app)}
                                className="h-8 px-2 text-xs font-bold"
                              >
                                <Eye className="mr-1 size-3.5" /> View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCandidate(app.id, app.full_name)}
                                className="h-8 px-2 text-xs font-bold text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/30"
                                title={`Delete ${app.full_name}`}
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

                <div className={`p-3 border transition-colors ${activeCandidate.portfolio_url ? "border-primary/40 bg-primary/5" : "border-foreground/20 bg-background"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-muted-foreground flex items-center gap-1">
                      {activeCandidate.portfolio_url && <span>🔥</span>} Portfolio / Build Link
                    </span>
                    {activeCandidate.portfolio_url && (
                      <span className="text-[9px] font-black uppercase rounded bg-primary px-1.5 py-0.2 text-primary-foreground">
                        Submitted
                      </span>
                    )}
                  </div>
                  {activeCandidate.portfolio_url ? (
                    <div className="mt-1.5 space-y-1">
                      <a
                        href={activeCandidate.portfolio_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground hover:bg-primary/90 transition-all break-all shadow-sm"
                      >
                        <ExternalLink className="size-3.5 shrink-0" /> Open Live Build ({formatDisplayUrl(activeCandidate.portfolio_url)})
                      </a>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">No portfolio or build link provided</p>
                  )}
                </div>
              </div>

              {/* Drop Your Build Specific Highlight */}
              {(dropBuildScholarSet.has(activeCandidate.scholar_number?.toUpperCase().trim()) ||
                activeCandidate.admin_notes?.includes("[DROP_YOUR_BUILD]")) && (
                <div className="rounded border-2 border-primary bg-primary/10 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 font-black text-xs uppercase text-primary">
                      <Rocket className="size-4 animate-bounce" /> Drop Your Build Station Submitter
                    </span>
                    <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-black uppercase text-primary-foreground">
                      Live Build Dropped
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/80 font-medium">
                    This candidate submitted their website / project directly via the Spark Drop Your Build station.
                  </p>
                </div>
              )}

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
