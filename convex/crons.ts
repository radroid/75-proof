import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Every 4 hours, scan active challenges for missed days past the 7-day
// reconciliation window. Primary reconciliation happens via the dialog on
// client visit; this cron only auto-fails challenges that have sat idle
// past the hard cap.
crons.interval(
  "check active challenges",
  { hours: 4 },
  internal.challenges.checkAllActiveChallenges
);

// Every 15 minutes, look for users whose morning/evening reminder time is
// within this window and fan out web-push notifications. The delivery log
// (`notificationDeliveries`) ensures each slot fires at most once per day
// per user. 15 minutes matches the window width used in reminders.ts.
crons.interval(
  "send due push reminders",
  { minutes: 15 },
  internal.reminders.dispatchDueReminders
);

// Daily TTL purge for coach memory + threads (C-1, C-2). Users opt in
// to memory and can opt out of TTL per-account; the default retention
// is 90 days. The mutation is bounded by `batchSize` so each firing
// stays inside Convex's transaction limits.
crons.interval(
  "purge expired coach memory and threads",
  { hours: 24 },
  internal.coach.purgeExpired,
  { batchSize: 50 },
);

export default crons;
