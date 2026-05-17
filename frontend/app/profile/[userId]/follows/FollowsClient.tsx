"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getFollowers, getFollowing, followUser, unfollowUser, type UserProfile } from "@/lib/users";
import { getUserId } from "@/lib/auth";

type Tab = "following" | "followers";

function FollowButton({
  user,
  currentUserId,
  onFollowChange,
}: {
  user: UserProfile;
  currentUserId: number | null;
  onFollowChange: (userId: number, result: { followerCount: number; isFollowing: boolean }) => void;
}) {
  const [loading, setLoading] = useState(false);

  if (user.id === currentUserId) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = user.isFollowing
        ? await unfollowUser(user.id)
        : await followUser(user.id);
      onFollowChange(user.id, result);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`text-sm font-semibold px-4 py-1.5 rounded-full border transition-colors ${
        user.isFollowing
          ? "border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-500"
          : "bg-blue-500 border-blue-500 text-white hover:bg-blue-600"
      }`}
    >
      {loading ? "..." : user.isFollowing ? "フォロー中" : "フォローする"}
    </button>
  );
}

function UserList({
  users,
  currentUserId,
  onFollowChange,
}: {
  users: UserProfile[];
  currentUserId: number | null;
  onFollowChange: (userId: number, result: { followerCount: number; isFollowing: boolean }) => void;
}) {
  if (users.length === 0) {
    return <p className="text-center text-gray-400 py-8">ユーザーがいません</p>;
  }
  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div
          key={user.id}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm"
        >
          {user.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={user.username} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">{user.username.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <Link href={`/profile/${user.id}`} className="font-semibold text-sm text-gray-900 hover:underline">
              {user.username}
            </Link>
            <p className="text-xs text-gray-400">フォロワー {user.followerCount}</p>
          </div>
          <FollowButton user={user} currentUserId={currentUserId} onFollowChange={onFollowChange} />
        </div>
      ))}
    </div>
  );
}

function FollowsContent() {
  const { userId: userIdStr } = useParams<{ userId: string }>();
  const userId = Number(userIdStr);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) ?? "following";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [following, setFollowing] = useState<UserProfile[]>([]);
  const [followers, setFollowers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = getUserId();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [f1, f2] = await Promise.all([
          getFollowing(userId),
          getFollowers(userId),
        ]);
        setFollowing(f1);
        setFollowers(f2);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleFollowChange = (
    uid: number,
    result: { followerCount: number; isFollowing: boolean }
  ) => {
    const update = (list: UserProfile[]) =>
      list.map((u) =>
        u.id === uid ? { ...u, isFollowing: result.isFollowing, followerCount: result.followerCount } : u
      );
    setFollowing(update);
    setFollowers(update);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-800"
            aria-label="戻る"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">フォロー / フォロワー</h1>
        </div>
        <div className="max-w-xl mx-auto flex border-t border-gray-100">
          {(["following", "followers"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "following" ? "フォロー中" : "フォロワー"}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <UserList
            users={activeTab === "following" ? following : followers}
            currentUserId={currentUserId}
            onFollowChange={handleFollowChange}
          />
        )}
      </main>
    </div>
  );
}

export default function FollowsClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <FollowsContent />
    </Suspense>
  );
}
