"use client";

import { useActionState } from "react";
import { createWebhook, type WebhookState } from "../../actions";

export function WebhookButton() {
  const [state, action, pending] = useActionState<WebhookState>(createWebhook, {});
  return (
    <form action={action} className="setup-action">
      <button className="btn btn-small" type="submit" disabled={pending}>
        {pending ? "Setting up" : "Set up the webhook for me"}
      </button>
      {state.error && <p className="form-error">{state.error}</p>}
      {state.done && <p className="hint">{state.done}</p>}
      {state.secret && (
        <div className="secret">
          <p>
            Done. Copy this signing secret into Vercel as <strong>STRIPE_WEBHOOK_SECRET</strong>, then redeploy. It's
            only shown once.
          </p>
          <code>{state.secret}</code>
        </div>
      )}
    </form>
  );
}
