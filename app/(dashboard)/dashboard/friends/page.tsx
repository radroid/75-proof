import { permanentRedirect } from "next/navigation";

// `/dashboard/friends` was merged into `/dashboard/progress` (research
// doc §4 Phase 3). The route stays mounted as a permanent redirect so
// previously issued push notifications and any user bookmarks land on
// the new page. `permanentRedirect` issues a 308 (vs `redirect`'s 307),
// which is what we want here — the move is intentional and final.
export default function FriendsRedirect() {
  permanentRedirect("/dashboard/progress");
}
