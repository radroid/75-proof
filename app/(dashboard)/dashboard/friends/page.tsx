import { redirect } from "next/navigation";

// `/dashboard/friends` was merged into `/dashboard/progress` (research
// doc §4 Phase 3). The route stays mounted as a redirect so previously
// issued push notifications and any user bookmarks land on the new page.
export default function FriendsRedirect() {
  redirect("/dashboard/progress");
}
