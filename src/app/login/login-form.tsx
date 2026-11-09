"use client";

import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { signIn } from "@/app/login/actions";

type LoginState = { error: string | null };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    signIn,
    { error: null },
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />
      <div className="space-y-2">
        <label
          htmlFor="username"
          className="block text-xs font-medium text-white/75"
        >
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          autoFocus
          className="h-12 w-full rounded-md border border-white/15 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-xs font-medium text-white/75"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-12 w-full rounded-md border border-white/15 bg-white/[0.04] px-3.5 text-sm text-white outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
        />
      </div>
      {state.error && (
        <p role="alert" className="text-xs leading-5 text-rose-300">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-between rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-70"
      >
        <span>{pending ? "Signing in..." : "Sign in to workspace"}</span>
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <ArrowRight className="size-4" />
        )}
      </button>
      <p className="text-center text-[11px] leading-5 text-white/40">
        Access is managed by your workspace administrator.
      </p>
    </form>
  );
}