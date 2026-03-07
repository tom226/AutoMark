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
    title: "Auto Post Creation",
    desc: "The app writes ready-to-use post ideas and captions for you, so you do not have to start from a blank page.",
    accent: "bg-sun-100 text-sun-700"
  },
  {
    icon: Target,
    title: "See What Competitors Post",
    desc: "Add competitor pages and quickly understand what they post, how often they post, and what performs well.",
    accent: "bg-orange-100 text-orange-700"
  },
  {
    icon: Sparkles,
    title: "Ready Captions and Hashtags",
    desc: "Get simple caption options and useful hashtags based on your business type and target audience.",
    accent: "bg-amber-100 text-amber-700"
  },
  {
    icon: CalendarDays,
    title: "Monthly Content Calendar",
    desc: "See your upcoming posts in one clean calendar so you always know what is going out and when.",
    accent: "bg-yellow-100 text-yellow-700"
  },
  {
    icon: BarChart3,
    title: "Easy Performance Report",
    desc: "Understand what is working with plain language insights like: post more reels, post at 7 PM, use these hashtags.",
    accent: "bg-lime-100 text-lime-700"
  },
  {
    icon: Zap,
    title: "Simple Setup",
    desc: "Connect your social accounts and start in minutes. No technical setup, no complicated dashboards.",
    accent: "bg-emerald-100 text-emerald-700"
  }
];

const steps = [
  {
    num: "01",
    title: "Sign up and choose your business type",
    desc: "Tell us if you are a shop owner, creator, coach, agency, or any other business. This helps the app suggest the right content style."
  },
  {
    num: "02",
    title: "Connect your social accounts",
    desc: "Connect Instagram, Facebook, LinkedIn, or X using simple login buttons. No coding or technical setup required."
  },
  {
    num: "03",
    title: "Add your goals",
    desc: "Choose what you want: more sales, more followers, more profile visits, or more messages."
  },
  {
    num: "04",
    title: "Review AI suggestions",
    desc: "The app creates post ideas, captions, and hashtags for your business. You can edit, approve, or skip any suggestion."
  },
  {
    num: "05",
    title: "Set your posting schedule",
    desc: "Pick days and times once. The app keeps posting at the best times without daily manual work."
  },
  {
    num: "06",
    title: "Track results in plain language",
    desc: "Check weekly progress with simple tips that tell you exactly what to do next."
  }
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
            Simple social media help for busy business owners
          </span>
          <h1 className="mt-4 text-5xl font-extrabold leading-[1.1] tracking-tight text-gray-900 md:text-7xl">
            Grow on social media{" "}
            <span className="bg-gradient-to-r from-sun-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              without hiring a team
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-500">
            SocialDukaan helps you plan, write, and post content for your business in simple steps. You get ready captions, smart posting times, and clear growth tips - even if you are not a marketing expert.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard/onboarding" className="btn-primary px-8 py-3.5 text-base shadow-lg shadow-sun-200">
              Start free in minutes <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#how" className="btn-outline px-6 py-3 text-sm">
              See step-by-step guide
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

      {/* What this app does */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="rounded-3xl border border-page-border bg-white p-8 shadow-card md:p-10">
            <p className="text-xs font-bold uppercase tracking-widest text-sun-600">What this app does</p>
            <h2 className="mt-3 text-2xl font-extrabold text-gray-900 md:text-3xl">
              Think of SocialDukaan as your small social media team
            </h2>
            <div className="mt-6 grid gap-4 text-sm leading-relaxed text-gray-600 md:grid-cols-2">
              <p>
                It helps you decide <strong>what to post</strong>, <strong>when to post</strong>, and <strong>how to improve</strong>.
              </p>
              <p>
                You can keep full control or let autopilot handle posting while you run your business.
              </p>
              <p>
                It is built for people who want results without learning complex marketing tools.
              </p>
              <p>
                If you can use WhatsApp and Instagram, you can use SocialDukaan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-page-bg py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-sun-600">Step-by-step guide</p>
            <h2 className="mt-3 text-3xl font-extrabold text-gray-900 md:text-4xl">
              How to use SocialDukaan (no technical knowledge needed)
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
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
              Start your first step <ChevronRight className="h-4 w-4" />
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
              What you can do inside the app
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
              Ready to make social media easier?
            </h2>
            <p className="relative mt-3 text-lg text-white/80">
              Start free and follow the step-by-step onboarding.
            </p>
            <Link href="/dashboard/onboarding" className="btn-secondary relative mt-8 px-8 py-3.5 text-sm">
              Try SocialDukaan now <ArrowRight className="h-4 w-4" />
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
