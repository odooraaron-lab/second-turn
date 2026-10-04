import { redirect } from "next/navigation";
import { login } from "../actions";
import { isAdmin } from "@/lib/auth";
import { site } from "@/site.config";
import { GameBoxArt } from "./GameBoxArt";

export const metadata = { title: "Log in" };

type Props = { searchParams: Promise<{ error?: string }> };

export default async function Login({ searchParams }: Props) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await searchParams;
  return (
    <main className="lost">
      <div className="login-inner">
        <GameBoxArt name={site.name} />

        <form action={login} className="lost-card">
          <p className="lost-brand">{site.name}</p>
          <h1>Log in</h1>
          <p>List new games and look after orders.</p>

          {error && (
            <p className="form-error" role="alert">
              That username or password isn't right.
            </p>
          )}
          <div className="field">
            <label htmlFor="username">Username</label>
            <input className="input" id="username" name="username" autoComplete="username" autoCapitalize="none" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="btn btn-buy" type="submit">
            Log in
          </button>
        </form>
      </div>
    </main>
  );
}
