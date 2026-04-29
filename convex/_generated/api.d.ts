/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as challenges from "../challenges.js";
import type * as coach from "../coach.js";
import type * as coachActions from "../coachActions.js";
import type * as crons from "../crons.js";
import type * as dailyLogs from "../dailyLogs.js";
import type * as feed from "../feed.js";
import type * as friends from "../friends.js";
import type * as habitDefinitions from "../habitDefinitions.js";
import type * as habitEntries from "../habitEntries.js";
import type * as leaderboard from "../leaderboard.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_dayCalculation from "../lib/dayCalculation.js";
import type * as lib_displayName from "../lib/displayName.js";
import type * as lib_habitCategories from "../lib/habitCategories.js";
import type * as lib_identityStatement from "../lib/identityStatement.js";
import type * as lib_llmPrompts from "../lib/llmPrompts.js";
import type * as lib_popularRoutinesSeed from "../lib/popularRoutinesSeed.js";
import type * as lib_routineTemplatesSeed from "../lib/routineTemplatesSeed.js";
import type * as lib_standardHabits from "../lib/standardHabits.js";
import type * as nudges from "../nudges.js";
import type * as onboarding from "../onboarding.js";
import type * as personalize from "../personalize.js";
import type * as popularRoutines from "../popularRoutines.js";
import type * as pushActions from "../pushActions.js";
import type * as pushSubscriptions from "../pushSubscriptions.js";
import type * as reactions from "../reactions.js";
import type * as reminders from "../reminders.js";
import type * as routineTemplates from "../routineTemplates.js";
import type * as todayPulse from "../todayPulse.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  challenges: typeof challenges;
  coach: typeof coach;
  coachActions: typeof coachActions;
  crons: typeof crons;
  dailyLogs: typeof dailyLogs;
  feed: typeof feed;
  friends: typeof friends;
  habitDefinitions: typeof habitDefinitions;
  habitEntries: typeof habitEntries;
  leaderboard: typeof leaderboard;
  "lib/auth": typeof lib_auth;
  "lib/dayCalculation": typeof lib_dayCalculation;
  "lib/displayName": typeof lib_displayName;
  "lib/habitCategories": typeof lib_habitCategories;
  "lib/identityStatement": typeof lib_identityStatement;
  "lib/llmPrompts": typeof lib_llmPrompts;
  "lib/popularRoutinesSeed": typeof lib_popularRoutinesSeed;
  "lib/routineTemplatesSeed": typeof lib_routineTemplatesSeed;
  "lib/standardHabits": typeof lib_standardHabits;
  nudges: typeof nudges;
  onboarding: typeof onboarding;
  personalize: typeof personalize;
  popularRoutines: typeof popularRoutines;
  pushActions: typeof pushActions;
  pushSubscriptions: typeof pushSubscriptions;
  reactions: typeof reactions;
  reminders: typeof reminders;
  routineTemplates: typeof routineTemplates;
  todayPulse: typeof todayPulse;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
