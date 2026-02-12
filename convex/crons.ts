import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Every 4 hours, scan active challenges for missed days past their grace period.
// This is a safety net — the primary check happens lazily on client visit.
crons.interval(
  "check active challenges",
  { hours: 4 },
  internal.challenges.checkAllActiveChallenges
);

export default crons;
