"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("password", formData);
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <div className="container" style={{ paddingTop: 28 }}>
        <Link href="/" className="brand">Crestline <span>Capital</span></Link>
      </div>
      <div style={{ minHeight: "80vh", display: "grid", placeItems: "center", padding: 24 }}>
        <form onSubmit={submit} className="card" style={{ width: "100%", maxWidth: 440, padding: 28, display: "grid", gap: 16 }}>
          <div>
            <div className="pill">SECURE ACCESS</div>
            <h1 style={{ marginTop: 12 }}>{mode === "signIn" ? "Welcome back" : "Create your account"}</h1>
            <p className="muted">Sign in securely with your Crestline Capital credentials.</p>
          </div>
          <label>Email<input className="input" name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input className="input" name="password" type="password" autoComplete={mode === "signIn" ? "current-password" : "new-password"} minLength={8} required /></label>
          <input type="hidden" name="flow" value={mode} />
          {error && <div role="alert" className="muted">{error}</div>}
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "signIn" ? "Sign in" : "Create account"}</button>
          <button type="button" className="btn-secondary" onClick={() => { setError(""); setMode(mode === "signIn" ? "signUp" : "signIn"); }}>
            {mode === "signIn" ? "Create an account" : "I already have an account"}
          </button>
        </form>
      </div>
    </main>
  );
}
