"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, login, type AuthState } from "./actions";

export function SignupForm() {
  const [state, action, busy] = useActionState<AuthState, FormData>(signup, { error: "" });
  return (
    <form action={action} className="lost-card account-card">
      <h1>Make an account</h1>
      <p>List your own games. Each one is minted as a collector card.</p>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden="true" />
      <div className="field">
        <label htmlFor="username">Username</label>
        <input className="input" id="username" name="username" autoComplete="username" autoCapitalize="none" pattern="[A-Za-z0-9_\-]{3,24}" required />
        <p className="hint">3 to 24 letters, numbers, - or _. Shown on your cards.</p>
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
        <p className="hint">So we can tell you when your game sells. Never shown publicly.</p>
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </div>
      <div className="field">
        <label htmlFor="password2">Password again</label>
        <input className="input" id="password2" name="password2" type="password" autoComplete="new-password" minLength={10} required />
      </div>
      <label className="choice">
        <input type="checkbox" name="agree" required />
        <span>
          <small>
            I agree to the <Link href="/terms#selling">terms for sellers</Link> and the <Link href="/privacy-policy">privacy policy</Link>.
          </small>
        </span>
      </label>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn btn-buy" type="submit" disabled={busy}>
        {busy ? "Creating" : "Create account"}
      </button>
      <Link href="/account/login" className="text-link">
        Already have an account? Log in
      </Link>
    </form>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, busy] = useActionState<AuthState, FormData>(login, { error: "" });
  return (
    <form action={action} className="lost-card account-card">
      <h1>Log in</h1>
      <p>See your cards and list another game.</p>
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="field">
        <label htmlFor="username">Username</label>
        <input className="input" id="username" name="username" autoComplete="username" autoCapitalize="none" required />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      <button className="btn btn-buy" type="submit" disabled={busy}>
        {busy ? "Logging in" : "Log in"}
      </button>
      <Link href="/account/signup" className="text-link">
        New here? Make an account
      </Link>
    </form>
  );
}
