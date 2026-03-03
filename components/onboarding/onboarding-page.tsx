"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/cn";

interface AccountsData {
  connected: boolean;
  connectedAt?: string;
  pages: { id: string; name: string }[];
  instagramAccounts: { igId: string; pageId: string; pageName: string }[];
}

export default function OnboardingPage() {
  const [accounts, setAccounts] = useState<AccountsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [urlMsg, setUrlMsg] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error")) {
      setUrlMsg({ type: "error", text: decodeURIComponent(params.get("error")!) });
    } else if (params.get("connected")) {
      setUrlMsg({ type: "success", text: "Accounts connected successfully!" });
    }
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  useEffect(() => {
    fetch("/api/auth/accounts")
      .then((r) => r.json())
      .then((d: AccountsData) => setAccounts(d))
      .finally(() => setLoading(false));
  }, []);

  const disconnect = async () => {
    setDisconnecting(true);
    await fetch("/api/auth/accounts", { method: "DELETE" });
    setAccounts({ connected: false, pages: [], instagramAccounts: [] });
    setDisconnecting(false);
    setUrlMsg({ type: "success", text: "Accounts disconnected." });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-2">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Connect your social accounts</h2>
        <p className="mt-2 text-sm text-gray-500">
          Link your Facebook and Instagram to enable real posting.
        </p>
      </div>

      {urlMsg && (
        <div className={cn(
          "flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium",
          urlMsg.type === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-red-200 bg-red-50 text-red-700"
        )}>
          {urlMsg.type === "success"
            ? <CheckCircle2 className="h-4 w-4 shrink-0" />
            : <AlertCircle className="h-4 w-4 shrink-0" />}
          {urlMsg.text}
        </div>
      )}

      {/* Facebook + Instagram via Meta OAuth */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Facebook className="h-5 w-5 text-channel-facebook" />
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-50">
              <Instagram className="h-5 w-5 text-channel-instagram" />
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Facebook &amp; Instagram</p>
            <p className="text-xs text-gray-400">One click connects both via Meta</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking connection…
          </div>
        ) : accounts?.connected ? (
          <div className="space-y-3">
            {accounts.pages.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Connected Facebook Pages</p>
                {accounts.pages.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    {p.name}
                    <span className="text-xs text-emerald-400">ID: {p.id}</span>
                  </div>
                ))}
              </div>
            )}
            {accounts.instagramAccounts.length > 0 ? (
              <div className="rounded-xl border border-pink-200 bg-pink-50 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-pink-700">Connected Instagram Accounts</p>
                {accounts.instagramAccounts.map((ig) => (
                  <div key={ig.igId} className="flex items-center gap-2 text-sm text-pink-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-pink-500" />
                    {ig.pageName}
                    <span className="text-xs text-pink-400">IG ID: {ig.igId}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                <AlertCircle className="mb-1 inline h-4 w-4" /> No Instagram Business Account found.
                Make sure your Instagram is a <strong>Business or Creator account</strong> linked to your Facebook Page.
              </div>
            )}
            <button onClick={disconnect} disabled={disconnecting}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-red-600">
              {disconnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
              Disconnect accounts
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Click below to authorize SocialDukaan to manage your Facebook Pages and Instagram Business Account.
            </p>
            <a href="/api/auth/meta" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm">
              <Facebook className="h-4 w-4" />
              Connect with Facebook
              <ExternalLink className="h-3.5 w-3.5 opacity-70" />
            </a>
            <p className="text-xs text-gray-400">
              You&apos;ll be redirected to Facebook to approve access.
            </p>
          </div>
        )}
      </div>

      {/* LinkedIn coming soon */}
      <div className="card p-6 opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
              <Linkedin className="h-5 w-5 text-channel-linkedin" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">LinkedIn</p>
              <p className="text-xs text-gray-400">Connect your LinkedIn company page</p>
            </div>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">Coming soon</span>
        </div>
      </div>

      {/* Twitter coming soon */}
      <div className="card p-6 opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
              <Twitter className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Twitter / X</p>
              <p className="text-xs text-gray-400">Connect your Twitter account</p>
            </div>
          </div>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">Coming soon</span>
        </div>
      </div>

      {/* Setup guide */}
      <div className="rounded-2xl border border-sun-200 bg-sun-50 p-5 text-sm text-sun-900 space-y-2">
        <p className="font-semibold">New to Meta Developer Apps? Follow these steps:</p>
        <ol className="list-decimal pl-4 space-y-1 text-sun-800 text-xs">
          <li>Go to <a href="https://developers.facebook.com/apps/" target="_blank" rel="noreferrer" className="underline">developers.facebook.com/apps</a> → create app (type: <strong>Business</strong>).</li>
          <li>Add products: <strong>Facebook Login</strong> + <strong>Instagram Graph API</strong>.</li>
          <li>Facebook Login → Settings → Valid OAuth Redirect URI:<br /><code className="rounded bg-sun-100 px-1">http://localhost:3000/api/auth/meta/callback</code></li>
          <li>Copy your <strong>App ID</strong> and <strong>App Secret</strong> into <code className="rounded bg-sun-100 px-1">.env.local</code>.</li>
          <li>Restart the dev server, then click <strong>Connect with Facebook</strong> above.</li>
        </ol>
      </div>

      <div className="flex justify-center pb-4">
        <Link
          href="/dashboard/compose"
          className={cn("btn-primary px-8 py-3 text-sm", !accounts?.connected && "pointer-events-none opacity-40")}
        >
          Go to Compose →
        </Link>
      </div>
    </div>
  );
}
