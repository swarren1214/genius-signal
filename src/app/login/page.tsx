import { Activity, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { LoginForm } from "@/app/login/login-form";
import { safeRedirectPath } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  const nextPath = safeRedirectPath(typeof next === "string" ? next : null);

  return (
    <main className="relative flex min-h-dvh overflow-hidden bg-[#101311] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_22%,rgba(159,205,96,0.12),transparent_38%),linear-gradient(130deg,#101311_0%,#171c19_52%,#111513_100%)]" />
      <div className="relative mx-auto grid min-h-dvh w-full max-w-[1440px] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden flex-col justify-between px-12 py-10 lg:flex xl:px-20">
          <Link href="/" className="flex w-fit items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </span>
            <span className="text-sm font-semibold tracking-wide">
              GENIUS SIGNAL
            </span>
          </Link>
          <div className="max-w-lg pb-16">
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary/75">
              Market intelligence / product analytics
            </p>
            <h1 className="text-5xl font-medium leading-[1.08] tracking-[-0.035em] xl:text-6xl">
              See the signals behind what&apos;s next.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-6 text-white/55">
              One workspace for product activity, market reporting, and
              evidence-backed intelligence.
            </p>
          </div>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/30">
            GENIUS PRODUCT / RESTAURANT VERTICAL
          </p>
        </section>

        <section className="relative flex min-h-dvh items-center justify-center px-6 py-12 sm:px-10 lg:border-l lg:border-white/10">
          <div className="w-full max-w-[390px]">
            <Link href="/" className="mb-14 flex w-fit items-center gap-3 lg:hidden">
              <span className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Activity className="size-[18px]" />
              </span>
              <span className="text-xs font-semibold tracking-wide">
                GENIUS SIGNAL
              </span>
            </Link>
            <div className="mb-9">
              <span className="mb-5 flex size-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-primary">
                <LockKeyhole className="size-[18px]" />
              </span>
              <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-primary/70">
                Secure workspace
              </p>
              <h2 className="mt-3 text-3xl font-medium tracking-[-0.025em]">
                Welcome back
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Sign in to continue to Genius Signal.
              </p>
            </div>
            <LoginForm nextPath={nextPath} />
          </div>
        </section>
      </div>
    </main>
  );
}