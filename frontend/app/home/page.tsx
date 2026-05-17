"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { removeTokens, getUserId, getAccessToken, getRefreshToken, setAccessToken } from "@/lib/auth";
import { fetchTimeline, createPost, updatePost, deletePost, type Post } from "@/lib/posts";
import PostForm from "@/app/components/PostForm";
import PostCard from "@/app/components/PostCard";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";
const PAGE_SIZE = 20;

type Tab = "all" | "following";

function createSseConnection(
  token: string,
  onNewPost: (post: Post) => void,
  onTokenExpired: () => Promise<string | null>
): () => void {
  let source: EventSource | null = null;
  let closed = false;
  let retryTimeout: ReturnType<typeof setTimeout> | null = null;

  const connect = (accessToken: string) => {
    if (closed) return;
    source = new EventSource(`${API_URL}/posts/stream?token=${encodeURIComponent(accessToken)}`);

    source.addEventListener("new-post", (e) => {
      const post: Post = JSON.parse(e.data);
      onNewPost(post);
    });

    source.onerror = async () => {
      source?.close();
      source = null;
      if (closed) return;

      const newToken = await onTokenExpired();
      if (!newToken) return;

      retryTimeout = setTimeout(() => connect(newToken), 3000);
    };
  };

  connect(token);

  return () => {
    closed = true;
    if (retryTimeout) clearTimeout(retryTimeout);
    source?.close();
  };
}

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostsBuffer, setNewPostsBuffer] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    setCurrentUserId(getUserId());
  }, []);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const loadInitial = useCallback(async (tab: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTimeline(undefined, PAGE_SIZE, tab === "following");
      setPosts(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setError("タイムラインの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPosts([]);
    setHasMore(true);
    setNewPostsBuffer([]);
    loadingMoreRef.current = false;
    loadInitial(activeTab);
  }, [activeTab, loadInitial]);

  // SSE リアルタイム受信 → バッファに蓄積（トークン期限切れ時は自動再接続）
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const handleTokenExpired = async (): Promise<string | null> => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        removeTokens();
        router.push("/login");
        return null;
      }
      try {
        const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken } = res.data;
        setAccessToken(accessToken);
        return accessToken;
      } catch {
        removeTokens();
        router.push("/login");
        return null;
      }
    };

    const cleanup = createSseConnection(
      token,
      (newPost) => {
        if (newPost.userId === currentUserId) return;
        setNewPostsBuffer((prev) => {
          if (prev.some((p) => p.id === newPost.id)) return prev;
          return [newPost, ...prev];
        });
      },
      handleTokenExpired
    );

    return cleanup;
  }, [currentUserId, router]);

  // 無限スクロール（IntersectionObserver）
  useEffect(() => {
    if (!hasMore) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (!entries[0].isIntersecting || loadingMoreRef.current || !hasMore) return;
        loadingMoreRef.current = true;
        try {
          const last = posts[posts.length - 1];
          if (!last) return;
          const older = await fetchTimeline(last.createdAt, PAGE_SIZE, activeTab === "following");
          if (older.length === 0) {
            setHasMore(false);
          } else {
            setPosts((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const newOnes = older.filter((p) => !existingIds.has(p.id));
              return [...prev, ...newOnes];
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
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, posts, activeTab]);

  const handleShowNewPosts = () => {
    if (activeTab === "following") {
      // フォロー中モードはサーバーから再取得して正確なデータを表示
      setNewPostsBuffer([]);
      loadInitial(activeTab);
    } else {
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const toAdd = newPostsBuffer.filter((p) => !existingIds.has(p.id));
        return [...toAdd, ...prev];
      });
      setNewPostsBuffer([]);
    }
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCreate = async (content: string, image?: File) => {
    const newPost = await createPost(content, image);
    setPosts((prev) => {
      if (prev.some((p) => p.id === newPost.id)) return prev;
      return [newPost, ...prev];
    });
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleUpdate = async (id: number, content: string) => {
    const updated = await updatePost(id, content);
    setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const handleDelete = async (id: number) => {
    await deletePost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleLogout = () => {
    removeTokens();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">RaiseTimeLine</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/search")}
              className="text-gray-500 hover:text-blue-500 transition-colors"
              aria-label="ユーザーを検索"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
            {currentUserId && (
              <button
                onClick={() => router.push(`/profile/${currentUserId}`)}
                className="text-sm text-gray-500 hover:text-blue-500 transition-colors"
              >
                マイページ
              </button>
            )}
            <button
              data-testid="logout-button"
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>

        {/* タブ切り替え */}
        <div className="max-w-xl mx-auto flex border-t border-gray-100">
          <button
            data-testid="tab-all"
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
            }`}
          >
            すべて
          </button>
          <button
            data-testid="tab-following"
            onClick={() => setActiveTab("following")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "following"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700 border-b-2 border-transparent"
            }`}
          >
            フォロー中
          </button>
        </div>
      </header>

      {/* 新着通知バナー */}
      {newPostsBuffer.length > 0 && (
        <div className="sticky top-[97px] z-10 flex justify-center pt-2 px-4">
          <button
            data-testid="new-posts-banner"
            onClick={handleShowNewPosts}
            className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-sm font-semibold px-5 py-2 rounded-full shadow-lg transition-colors animate-bounce"
          >
            {newPostsBuffer.length}件の新しい投稿があります
          </button>
        </div>
      )}

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        <div ref={topRef} />

        <PostForm onSubmit={handleCreate} />

        {error && (
          <p className="text-center text-sm text-red-500">{error}</p>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-center text-gray-400 py-12">
            {activeTab === "following"
              ? "フォロー中のユーザーの投稿がありません。ユーザーをフォローしてみましょう！"
              : "まだ投稿がありません。最初の投稿をしましょう！"}
          </p>
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
          {!loading && hasMore && (
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
