"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getProfile, getUserPosts, followUser, unfollowUser, type UserProfile } from "@/lib/users";
import { type Post } from "@/lib/posts";
import { updatePost, deletePost } from "@/lib/posts";
import { getUserId } from "@/lib/auth";
import PostCard from "@/app/components/PostCard";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";

const PAGE_SIZE = 20;

export default function ProfileClient({ userId }: { userId: number }) {
  useAuthGuard();
  const router = useRouter();
  const currentUserId = getUserId();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const loadProfile = useCallback(async () => {
    try {
      const [prof, initialPosts] = await Promise.all([
        getProfile(userId),
        getUserPosts(userId, undefined, PAGE_SIZE),
      ]);
      setProfile(prof);
      setPosts(initialPosts);
      setHasMore(initialPosts.length === PAGE_SIZE);
    } catch {
      setError("プロフィールの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // 無限スクロール
  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loadingMoreRef.current || !hasMore) return;
        loadingMoreRef.current = true;
        try {
          const last = posts[posts.length - 1];
          if (!last) return;
          const older = await getUserPosts(userId, last.createdAt, PAGE_SIZE);
          if (older.length === 0) {
            setHasMore(false);
          } else {
            setPosts((prev) => {
              const ids = new Set(prev.map((p) => p.id));
              return [...prev, ...older.filter((p) => !ids.has(p.id))];
            });
            if (older.length < PAGE_SIZE) setHasMore(false);
          }
        } finally {
          loadingMoreRef.current = false;
        }
      },
      { threshold: 0.1 }
    );
    const el = sentinelRef.current;
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, [hasMore, posts, userId]);

  const handleToggleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      const result = profile.isFollowing
        ? await unfollowUser(userId)
        : await followUser(userId);
      setProfile((prev) =>
        prev ? { ...prev, isFollowing: result.isFollowing, followerCount: result.followerCount } : prev
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUpdate = async (id: number, content: string) => {
    const updated = await updatePost(id, content);
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleDelete = async (id: number) => {
    await deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const isOwnProfile = currentUserId === userId;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{error ?? "ユーザーが見つかりません"}</p>
      </div>
    );
  }

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
          <h1 className="text-lg font-bold text-gray-900">{profile.username}</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-4">
            {profile.profileImageUrl ? (
              <img src={profile.profileImageUrl} alt={profile.username} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xl font-bold">{profile.username.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1">
              <p data-testid="profile-username" className="font-bold text-gray-900 text-lg">{profile.username}</p>
              <div className="flex gap-4 mt-1">
                <Link
                  data-testid="following-count"
                  href={`/profile/${userId}/follows?tab=following`}
                  className="text-sm text-gray-600 hover:underline"
                >
                  <span className="font-semibold">{profile.followingCount}</span> フォロー中
                </Link>
                <Link
                  data-testid="follower-count"
                  href={`/profile/${userId}/follows?tab=followers`}
                  className="text-sm text-gray-600 hover:underline"
                >
                  <span className="font-semibold">{profile.followerCount}</span> フォロワー
                </Link>
              </div>
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
          )}

          {isOwnProfile ? (
            <Link
              href="/profile/edit"
              className="block w-full text-center text-sm font-semibold py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              プロフィールを編集
            </Link>
          ) : (
            <button
              data-testid="follow-toggle"
              onClick={handleToggleFollow}
              disabled={followLoading}
              className={`w-full text-sm font-semibold py-2 rounded-full border transition-colors ${
                profile.isFollowing
                  ? "border-gray-300 text-gray-700 hover:border-red-400 hover:text-red-500"
                  : "bg-blue-500 border-blue-500 text-white hover:bg-blue-600"
              }`}
            >
              {followLoading ? "..." : profile.isFollowing ? "フォロー中" : "フォローする"}
            </button>
          )}
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-gray-400 py-8">まだ投稿がありません</p>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-8 flex items-center justify-center">
          {hasMore && (
            <div className="w-6 h-6 border-4 border-gray-300 border-t-blue-400 rounded-full animate-spin" />
          )}
          {!hasMore && posts.length > 0 && (
            <p className="text-xs text-gray-400">すべての投稿を読み込みました</p>
          )}
        </div>
      </main>
    </div>
  );
}
