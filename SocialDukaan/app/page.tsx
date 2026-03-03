import Link from "next/link";
import {
  ArrowRight,
  Zap,
  CalendarDays,
  BarChart3,
  Target,
  Bot,
  Sparkles,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "Autopilot Posting",
    desc: "Set it and forget it. Our AI watches your competitors and auto-generates + schedules posts that outperform theirs.",
    accent: "bg-sun-100 text-sun-700"
  },
  {
    icon: Target,
    title: "Competitor Intelligence",
    desc: "Track any competitor's handles. See their posting patterns, top hashtags, and engagement - then beat them automatically.",
    accent: "bg-orange-100 text-orange-700"
  },
  {
    icon: Sparkles,
    title: "AI Content Studio",
    desc: "Generate captions, hashtags, and CTAs trained on what's working right now in your niche.",
    accent: "bg-amber-100 text-amber-700"
  },
  {
    icon: CalendarDays,
    title: "Visual Calendar",
    desc: "See your entire month at a glance. Drag, drop, and reschedule across all channels instantly.",
    accent: "bg-yellow-100 text-yellow-700"
  },
  {
    icon: BarChart3,
    title: "Smart Analytics",
    desc: "Know what works. Compare your performance against competitors with side-by-side engagement charts.",
    accent: "bg-lime-100 text-lime-700"
  },
  {
    icon: Zap,
    title: "One-Click Setup",
    desc: "Connect Instagram, Facebook, LinkedIn, and Twitter in under 60 seconds. We guide you through every step.",
    accent: "bg-emerald-100 text-emerald-700"
  }
];

const steps = [
  { num: "01", title: "Connect Your Accounts", desc: "Link Instagram, Facebook, LinkedIn, or Twitter in a single click." },
  { num: "02", title: "Add Competitors", desc: "Enter competitor handles - we start tracking their activity immediately." },
  { num: "03", title: "Enable Autopilot", desc: "Turn on autonomous posting. AI creates, schedules, and publishes for you." }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sun-500 shadow-glow">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-extrabold tracking-tight text-gray-900">
              Social<span className="text-sun-500">Dukaan</span>
            </span>
          </div>
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-500 md:flex">
            <a href="#features" className="transition hover:text-gray-900">Features</a>
            <a href="#how" className="transition hover:text-gray-900">How it works</a>
            <a href="#pricing" className="transition hover:text-gray-900">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn-ghost text-sm">Sign in</Link>
            <Link href="/dashboard/onboarding" className="btn-primary text-sm">
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 60%)"
          }}
        />
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-sun-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 top-40 h-52 w-52 rounded-full bg-amber-200/20 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-sun-200 bg-sun-50 px-4 py-1.5 text-xs font-semibold text-sun-700">
            <Bot className="h-3.5 w-3.5" />
            Autonomous Social Media Posting - Powered by AI
          </span>
          <h1 className="mt-4 text-5xl font-extrabold leading-[1.1] tracking-tight text-gray-900 md:text-7xl">
            Post smarter{" "}
            <span className="bg-gradient-to-r from-sun-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              than your competitors
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500">
            Connect your socials, track competitor activity, and let AI autonomously create and schedule winning content - while you focus on growing your business.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard/onboarding" className="btn-primary px-8 py-3.5 text-base shadow-lg shadow-sun-200">
              Start free - 60 second setup <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how" className="btn-outline px-6 py-3 text-sm">
              See how it works
            </a>
          </div>
          <p className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-sun-500" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-sun-500" /> 3 channels free</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-sun-500" /> Cancel anytime</span>
          </p>
        </div>

        {/* Channel icons row */}
        <div className="mx-auto mt-16 flex max-w-md items-center justify-center gap-6">
          {[
            { Icon: Instagram, color: "#e1306c", name: "Instagram" },
            { Icon: Facebook, color: "#1877f2", name: "Facebook" },
            { Icon: Linkedin, color: "#0077b5", name: "LinkedIn" },
            { Icon: Twitter, color: "#1da1f2", name: "Twitter" }
          ].map(({ Icon, color, name }) => (
            <div key={name} className="group flex flex-col items-center gap-2">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg transition group-hover:scale-110 group-hover:shadow-xl"
                style={{ borderBottom: `3px solid ${color}` }}
              >
                <Icon className="h-6 w-6" style={{ color }} />
              </div>
              <span className="text-xs font-medium text-gray-400">{name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-page-bg py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-sun-600">3 simple steps</p>
            <h2 className="mt-3 text-3xl font-extrabold text-gray-900 md:text-4xl">
              From zero to autopilot in 60 seconds
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map(({ num, title, desc }) => (
              <div key={num} className="relative rounded-2xl border border-page-border bg-white p-8 shadow-card transition hover:shadow-lg">
                <span className="mb-4 inline-block text-4xl font-extrabold text-sun-200">{num}</span>
                <h3 className="mb-2 text-lg font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/dashboard/onboarding" className="btn-primary px-8 py-3 text-sm">
              Connect your first account <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-sun-600">Everything you need</p>
            <h2 className="mt-3 text-3xl font-extrabold text-gray-900 md:text-4xl">
              Beat competitors on autopilot
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, desc, accent }) => (
              <div key={title} className="card p-6 transition hover:shadow-lg hover:border-sun-200">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-bold text-gray-900">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section id="pricing" className="pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sun-400 via-sun-500 to-orange-500 p-14 text-center">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <h2 className="relative text-3xl font-extrabold text-white md:text-4xl">
              Ready to outperform your competition?
            </h2>
            <p className="relative mt-3 text-lg text-white/80">
              Join thousands of creators who let AI do the heavy lifting.
            </p>
            <Link href="/dashboard/onboarding" className="btn-secondary relative mt-8 px-8 py-3.5 text-sm">
              Start free today <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-sun-500" />
            <span className="font-semibold text-gray-600">SocialDukaan</span> &copy; 2026
          </div>
          <div className="flex gap-6">
            <a href="/api/health" className="hover:text-gray-700">API Status</a>
            <a href="#" className="hover:text-gray-700">Privacy</a>
            <a href="#" className="hover:text-gray-700">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
