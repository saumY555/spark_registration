import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowRight, Check, ChevronDown, Clock3, Trophy, Users } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

import sparkPoster from "@/assets/spark-poster.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitRegistration } from "@/lib/registration.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Register | Spark Got Talent 2026" },
      { name: "description", content: "Register for Spark Club's first-year recruitment competition at IIIT Bhopal." },
      { property: "og:title", content: "Register for Spark Got Talent 2026" },
      { property: "og:description", content: "Two days. Five tracks. One path into Spark Club for IIIT Bhopal first-years." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const tracks = [
  { name: "Code + Web", value: "Code and Web", tag: "01", detail: "Programming · Web Dev" },
  { name: "AI + Data", value: "AI and Data", tag: "02", detail: "AI/ML · Data Science · Signal Processing" },
  { name: "Hardware + Robotics", value: "Hardware and Robotics", tag: "03", detail: "Robotics · Automation · Embedded · VLSI" },
  { name: "Design + Media", value: "Design and Media", tag: "04", detail: "Graphic Design · Video · Social Media" },
  { name: "Events + Outreach", value: "Events and Outreach", tag: "05", detail: "Events · PR · Sponsorship" },
] as const;

const stages = [
  ["01", "Learn + Submit", "Beginner resources and an online task test effort, taste and learning speed."],
  ["02", "Live Challenge", "A supervised two-hour domain challenge on Day 1."],
  ["03", "Team Finale", "Mixed teams solve, prototype and pitch a real campus problem on Day 2."],
];

function Index() {
  const submit = useServerFn(submitRegistration);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ registrationNo?: string; candidateId?: string; sheetSynced: boolean } | null>(null);
  const [error, setError] = useState("");
  const [primaryTrack, setPrimaryTrack] = useState("");
  const secondaryOptions = useMemo(() => tracks.filter((track) => track.value !== primaryTrack), [primaryTrack]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);

    if (form.get("consent") !== "on") {
      setError("Please confirm your eligibility before submitting.");
      return;
    }

    const scholarNumber = String(form.get("scholarNumber") ?? "").trim().toUpperCase();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const motivation = String(form.get("motivation") ?? "").trim();

    // Scholar number validation (e.g. 25U010061 or 25P02F1028)
    const scholarNumberRegex = /^[0-9]{2}[a-zA-Z0-9]{6,10}$/;
    if (!scholarNumberRegex.test(scholarNumber)) {
      setError("Please enter a valid scholar number (e.g. 25U010061 or 25P02F1028).");
      return;
    }

    // Standard email validation (name@domain.ext)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address (e.g. name@example.com).");
      return;
    }

    // 10-digit phone validation
    let cleanPhone = phone.trim().replace(/[\s\-\(\)]/g, "");
    if (cleanPhone.startsWith("+91")) {
      cleanPhone = cleanPhone.slice(3);
    } else if (cleanPhone.startsWith("91") && cleanPhone.length === 12) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.startsWith("0") && cleanPhone.length === 11) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit phone number (e.g. 9876543210 or +91 9876543210).");
      return;
    }

    if (motivation.length < 20) {
      setError("Please write at least 20 characters explaining why you want to join Spark.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await submit({
        data: {
          fullName: String(form.get("fullName") ?? ""),
          email,
          phone,
          scholarNumber: String(form.get("scholarNumber") ?? ""),
          primaryTrack: String(form.get("primaryTrack") ?? "") as (typeof tracks)[number]["value"],
          secondaryTrack: form.get("secondaryTrack")
            ? (String(form.get("secondaryTrack")) as (typeof tracks)[number]["value"])
            : undefined,
          portfolioUrl: String(form.get("portfolioUrl") ?? ""),
          motivation,
          consent: true,
        },
      });
      setResult(response);
      router.invalidate();
      window.scrollTo({ top: document.getElementById("register")?.offsetTop ?? 0, behavior: "smooth" });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="overflow-hidden bg-background text-foreground">
      <header className="mx-auto flex max-w-7xl items-center justify-between border-b border-foreground/20 px-5 py-4 md:px-10">
        <a href="#top" className="flex items-center gap-3" aria-label="Spark Got Talent home">
          <span className="grid size-10 place-items-center bg-stage"><img src="/favicon.png" alt="Spark Club" className="h-8 w-8 object-contain" /></span>
          <span className="text-xs font-extrabold uppercase leading-tight">Spark Club<br /><span className="font-medium text-muted-foreground">IIIT Bhopal</span></span>
        </a>
        <nav className="hidden items-center gap-8 text-xs font-bold uppercase md:flex">
          <a href="#tracks" className="hover:text-primary">Tracks</a>
          <a href="#format" className="hover:text-primary">How it works</a>
          <a href="#register" className="hover:text-primary">Register</a>
        </nav>
        <Button variant="electric" asChild><a href="#register">Register <ArrowRight /></a></Button>
      </header>

      <section id="top" className="relative mx-auto grid min-h-[78vh] max-w-7xl items-center gap-10 px-5 py-12 md:grid-cols-[1.15fr_.85fr] md:px-10 md:py-16">
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 border border-foreground px-3 py-1 text-xs font-extrabold uppercase">
            <span className="size-2 bg-secondary" /> First-year recruitment · 2026
          </div>
          <h1 className="font-display text-[clamp(5rem,12vw,10rem)] leading-[.78] uppercase">
            Search for<br /><span className="text-primary">Spark.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg font-semibold leading-relaxed md:text-xl">
            Your potential is the qualification. Compete across five tracks and earn your place in Spark Club.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="electric" size="lg" asChild><a href="#register">Claim your spot <ArrowDown /></a></Button>
            <Button variant="outline" size="lg" asChild><a href="#format">See the competition</a></Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-foreground/20 pt-5 text-sm font-bold">
            <span className="flex items-center gap-2"><Clock3 className="text-primary" /> 2 days</span>
            <span className="flex items-center gap-2"><Trophy className="text-primary" /> 16–17 selected</span>
            <span className="flex items-center gap-2"><Users className="text-primary" /> First-years only</span>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -left-8 -top-8 size-28 bg-secondary spark-pulse" />
          <div className="relative rotate-2 border-2 border-foreground bg-stage p-3 shadow-[12px_12px_0_var(--primary)]">
            <img src={sparkPoster} alt="Search for Spark recruitment poster" className="aspect-[4/5] w-full object-cover object-top" />
          </div>
          <div className="absolute -bottom-6 -left-8 -rotate-3 border-2 border-foreground bg-card px-5 py-3 text-sm font-extrabold uppercase shadow-[5px_5px_0_var(--foreground)]">No prior experience needed</div>
        </div>
      </section>

      <div className="overflow-hidden border-y border-stage bg-stage py-3 text-stage-foreground">
        <div className="marquee-track flex w-max text-sm font-extrabold uppercase">
          {[0, 1].map((copy) => <div key={copy} className="flex gap-10 pr-10">{tracks.map((track) => <span key={`${copy}-${track.tag}`}>✦ {track.name}</span>)}</div>)}
        </div>
      </div>

      <section id="tracks" className="mx-auto max-w-7xl px-5 py-20 md:px-10">
        <div className="mb-10 grid gap-4 md:grid-cols-2 md:items-end">
          <div><p className="text-xs font-extrabold uppercase text-primary">Find where you belong</p><h2 className="mt-2 font-display text-6xl uppercase md:text-8xl">Five tracks.</h2></div>
          <p className="max-w-lg text-muted-foreground md:justify-self-end">Choose one primary track and one optional second preference. You’ll compete live in the track where you perform best.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-6">
          {tracks.map((track, index) => (
            <article key={track.tag} className={`group border border-foreground bg-card p-5 transition-transform hover:-translate-y-1 ${index < 2 ? "md:col-span-3" : "md:col-span-2"}`}>
              <div className="flex items-start justify-between"><span className="font-display text-4xl text-primary">{track.tag}</span><ArrowRight className="transition-transform group-hover:translate-x-1" /></div>
              <h3 className="mt-10 text-xl font-extrabold uppercase">{track.name}</h3><p className="mt-2 text-sm text-muted-foreground">{track.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="format" className="bg-stage py-20 text-stage-foreground">
        <div className="mx-auto max-w-7xl px-5 md:px-10">
          <div className="grid gap-10 md:grid-cols-[.7fr_1.3fr]">
            <div><p className="text-xs font-extrabold uppercase text-secondary">Competition-based recruitment</p><h2 className="mt-3 font-display text-6xl uppercase md:text-8xl">Learn.<br />Build.<br /><span className="text-secondary">Stand out.</span></h2></div>
            <div className="border-t border-stage-foreground/30">
              {stages.map(([number, title, detail]) => <div key={number} className="grid gap-4 border-b border-stage-foreground/30 py-7 sm:grid-cols-[4rem_1fr_2fr]"><span className="font-display text-3xl text-secondary">{number}</span><h3 className="text-xl font-extrabold uppercase">{title}</h3><p className="text-stage-foreground/70">{detail}</p></div>)}
              <p className="mt-7 text-sm text-stage-foreground/70">A domain-neutral logic quiz is held only if registrations cross approximately 80.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="register" className="mx-auto max-w-7xl px-5 py-20 md:px-10">
        <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="text-xs font-extrabold uppercase text-primary">Applications open</p>
            <h2 className="mt-3 font-display text-6xl uppercase md:text-8xl">Your turn<br />to <span className="text-primary">spark.</span></h2>
            <p className="mt-6 max-w-md text-muted-foreground">Open only to first-year students of IIIT Bhopal. Detailed timings and Phase A tasks will be shared after registration closes.</p>
            <div className="mt-8 border-l-4 border-secondary bg-card p-5 text-sm"><strong>Remember:</strong> selection rewards reasoning, initiative and learning speed—not prior experience.</div>
          </div>

          {result ? (
            <div className="self-start border-2 border-foreground bg-card p-8 shadow-[10px_10px_0_var(--secondary)]" role="status">
              <div className="mb-6 grid size-14 place-items-center bg-secondary"><Check className="size-8" /></div>
              <p className="text-xs font-extrabold uppercase text-primary">Registration complete</p>
              <h3 className="mt-2 font-display text-5xl uppercase">You’re in.</h3>
              <p className="mt-4 text-muted-foreground">Save your registration number. The Spark team will use your email for event updates.</p>
              <div className="mt-6 border border-foreground bg-background p-5"><span className="text-xs font-bold uppercase text-muted-foreground">Registration Number</span><p className="mt-1 text-2xl font-extrabold">{result.registrationNo || result.candidateId}</p></div>
              {!result.sheetSynced && <p className="mt-4 text-sm text-muted-foreground">Your application is safely stored in Supabase.</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="border-2 border-foreground bg-card p-5 shadow-[10px_10px_0_var(--primary)] sm:p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name"><Input name="fullName" autoComplete="name" placeholder="Your full name" required maxLength={100} /></Field>
                <Field label="Scholar number"><Input name="scholarNumber" placeholder="e.g. 25U010061 or 25P02F1028" required maxLength={30} /></Field>
                <Field label="Email address"><Input name="email" type="email" autoComplete="email" placeholder="name@example.com" required maxLength={255} /></Field>
                <Field label="Phone number"><Input name="phone" type="tel" autoComplete="tel" placeholder="10-digit mobile number" required minLength={10} maxLength={15} /></Field>
                <Field label="Primary track">
                  <Select name="primaryTrack" required value={primaryTrack} onChange={(event) => setPrimaryTrack(event.target.value)}><option value="">Choose your main track</option>{tracks.map((track) => <option key={track.value} value={track.value}>{track.name}</option>)}</Select>
                </Field>
                <Field label="Second track (optional)">
                  <Select name="secondaryTrack"><option value="">No second preference</option>{secondaryOptions.map((track) => <option key={track.value} value={track.value}>{track.name}</option>)}</Select>
                </Field>
                <div className="sm:col-span-2"><Field label="Portfolio or GitHub (optional)"><Input name="portfolioUrl" type="url" placeholder="https://" maxLength={500} /></Field></div>
                <div className="sm:col-span-2"><Field label="Why do you want to join Spark?"><Textarea name="motivation" required minLength={20} maxLength={800} placeholder="Tell us what you want to learn, build, or contribute…" /></Field></div>
              </div>
              <label className="mt-5 flex items-start gap-3 text-sm"><input name="consent" type="checkbox" required className="mt-1 size-4 accent-primary" /><span>I confirm that I am a first-year student at IIIT Bhopal and the information above is accurate.</span></label>
              {error && <p className="mt-4 border border-destructive bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}
              <Button type="submit" variant="electric" size="lg" disabled={submitting} className="mt-6 w-full">{submitting ? "Submitting…" : "Submit registration"}<ArrowRight /></Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">Your response is stored securely and shared only with the Spark recruitment team.</p>
            </form>
          )}
        </div>
      </section>

      <footer className="border-t border-foreground/20 px-5 py-8 md:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-xs font-bold uppercase sm:flex-row"><span>Spark Club · IIIT Bhopal</span><span>Society for Programming, Automation, Robotics and Knowledge</span></div></footer>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold"><span className="mb-2 block">{label}</span>{children}</label>;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <div className="relative"><select {...props} className="h-12 w-full appearance-none rounded-md border border-input bg-card px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /><ChevronDown className="pointer-events-none absolute right-3 top-4 size-4" /></div>;
}