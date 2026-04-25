"use client";

import { setNotificationsGranted } from "./mutations";

/**
 * Local-mode notification permission flow. We use the Notification API to
 * ask permission and persist the grant state in the local store. We do
 * NOT register a Web Push subscription — local mode has no server
 * endpoint to deliver from, and that would compromise the privacy
 * guarantee anyway. So "reminders" are aspirational in v1: we record the
 * preference; future iterations can wire SW-based local schedules.
 */

export type LocalPermissionStatus =
  | "unsupported"
  | "denied"
  | "granted"
  | "default";

export function detectPermission(): LocalPermissionStatus {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as LocalPermissionStatus;
}

export async function requestLocalNotificationPermission(): Promise<{
  granted: boolean;
}> {
  if (typeof window === "undefined") return { granted: false };
  if (!("Notification" in window)) return { granted: false };
  let permission: NotificationPermission;
  try {
    permission = await Notification.requestPermission();
  } catch {
    permission = Notification.permission;
  }
  if (permission === "granted") {
    setNotificationsGranted();
    return { granted: true };
  }
  return { granted: false };
}
