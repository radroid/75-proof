"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

export default function FriendsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const friends = useQuery(
    api.friends.getFriends,
    user ? { userId: user._id } : "skip"
  );
  const pendingRequests = useQuery(
    api.friends.getPendingRequests,
    user ? { userId: user._id } : "skip"
  );
  const friendProgress = useQuery(
    api.feed.getFriendProgress,
    user ? { userId: user._id } : "skip"
  );

  const [searchTerm, setSearchTerm] = useState("");
  const searchResults = useQuery(
    api.friends.searchUsers,
    searchTerm.length >= 2 ? { searchTerm } : "skip"
  );

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Friends
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Connect with friends and stay accountable together.
      </p>

      {/* Search */}
      <div className="mt-8">
        <input
          type="text"
          placeholder="Search for friends..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
        />
        {searchResults && searchResults.length > 0 && (
          <div className="mt-2 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {searchResults
              .filter((u) => u._id !== user?._id)
              .map((searchUser) => (
                <SearchResult
                  key={searchUser._id}
                  searchUser={searchUser}
                  currentUserId={user?._id}
                />
              ))}
          </div>
        )}
      </div>

      {/* Pending requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
            Pending Requests
          </h2>
          <div className="space-y-2">
            {pendingRequests.map(({ request, user: requester }) => (
              <PendingRequest
                key={request._id}
                requestId={request._id}
                user={requester}
              />
            ))}
          </div>
        </div>
      )}

      {/* Friend progress */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          Friends&apos; Progress
        </h2>
        {friendProgress?.length === 0 && (
          <p className="text-zinc-500 dark:text-zinc-400">
            Add friends to see their progress here.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {friendProgress?.map((friend) => (
            <div
              key={friend.user._id}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  {friend.user.avatarUrl ? (
                    <img
                      src={friend.user.avatarUrl}
                      alt={friend.user.displayName}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <span className="text-lg">
                      {friend.user.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {friend.user.displayName}
                  </p>
                  <p className="text-sm text-zinc-500">
                    Day {friend.challenge.currentDay} / 75
                  </p>
                </div>
                {friend.todayComplete && (
                  <span className="text-green-500 text-xl">✓</span>
                )}
              </div>
              <div className="mt-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{
                      width: `${(friend.challenge.currentDay / 75) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All friends */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          All Friends ({friends?.length ?? 0})
        </h2>
        <div className="space-y-2">
          {friends?.map((friend) => (
            <div
              key={friend?._id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                  {friend?.avatarUrl ? (
                    <img
                      src={friend.avatarUrl}
                      alt={friend.displayName}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <span className="text-lg">
                      {friend?.displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {friend?.displayName}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchResult({
  searchUser,
  currentUserId,
}: {
  searchUser: { _id: Id<"users">; displayName: string; avatarUrl?: string };
  currentUserId?: Id<"users">;
}) {
  const sendRequest = useMutation(api.friends.sendFriendRequest);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!currentUserId) return;
    try {
      await sendRequest({
        fromUserId: currentUserId,
        toUserId: searchUser._id,
      });
      setSent(true);
    } catch (err) {
      // Already friends or request exists
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0 border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
          {searchUser.avatarUrl ? (
            <img
              src={searchUser.avatarUrl}
              alt={searchUser.displayName}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <span className="text-lg">
              {searchUser.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          {searchUser.displayName}
        </p>
      </div>
      <button
        onClick={handleSend}
        disabled={sent}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {sent ? "Sent" : "Add Friend"}
      </button>
    </div>
  );
}

function PendingRequest({
  requestId,
  user,
}: {
  requestId: Id<"friendships">;
  user: { _id: Id<"users">; displayName: string; avatarUrl?: string } | null;
}) {
  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const declineRequest = useMutation(api.friends.declineFriendRequest);

  if (!user) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <span className="text-lg">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          {user.displayName}
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => acceptRequest({ friendshipId: requestId })}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
        >
          Accept
        </button>
        <button
          onClick={() => declineRequest({ friendshipId: requestId })}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
