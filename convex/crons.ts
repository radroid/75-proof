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

// Every 15 minutes, look for users whose morning/evening reminder time is
// within this window and fan out web-push notifications. The delivery log
// (`notificationDeliveries`) ensures each slot fires at most once per day
// per user. 15 minutes matches the window width used in reminders.ts.
crons.interval(
  "send due push reminders",
  { minutes: 15 },
  internal.reminders.dispatchDueReminders
);

export default crons;
