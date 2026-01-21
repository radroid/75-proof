"use client";

import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <AuthLoading>
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </AuthLoading>

      <Authenticated>
        <main className="flex flex-col items-center gap-8 p-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
              75 HARD Tracker
            </h1>
            <UserButton />
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Welcome back! Ready to crush your goals?
          </p>
          <Link
            href="/dashboard"
            className="rounded-full bg-zinc-900 px-6 py-3 text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Go to Dashboard
          </Link>
        </main>
      </Authenticated>

      <Unauthenticated>
        <main className="flex flex-col items-center gap-8 p-8 text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
            75 HARD Tracker
          </h1>
          <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
            Track your 75 HARD challenge journey. Log workouts, water intake,
            reading, and more. Stay accountable with friends.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <SignInButton mode="modal">
              <button className="rounded-full bg-zinc-900 px-6 py-3 text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200">
                Sign In
              </button>
            </SignInButton>
            <Link
              href="/sign-up"
              className="rounded-full border border-zinc-300 px-6 py-3 text-zinc-900 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              Create Account
            </Link>
          </div>
        </main>
      </Unauthenticated>
    </div>
  );
}
