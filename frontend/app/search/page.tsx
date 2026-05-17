"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { searchUsers, followUser, unfollowUser, type UserProfile } from "@/lib/users";
import { getUserId } from "@/lib/auth";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

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
      data-testid="follow-button"
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

export default function SearchPage() {
  useAuthGuard();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const currentUserId = getUserId();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchUsers(query.trim());
      setResults(data);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (
    userId: number,
    result: { followerCount: number; isFollowing: boolean }
  ) => {
    setResults((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, isFollowing: result.isFollowing, followerCount: result.followerCount }
          : u
      )
    );
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
          <h1 className="text-lg font-bold text-gray-900">ユーザーを検索</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            data-testid="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ユーザー名を入力"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            data-testid="search-submit"
            disabled={loading || !query.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? "検索中..." : "検索する"}
          </button>
        </form>

        {searched && results.length === 0 && (
          <p className="text-center text-gray-400 py-8">ユーザーが見つかりませんでした</p>
        )}

        <div className="space-y-2">
          {results.map((user) => (
            <div
              key={user.id}
              data-testid="search-result-item"
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
              <FollowButton
                user={user}
                currentUserId={currentUserId}
                onFollowChange={handleFollowChange}
              />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
