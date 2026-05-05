"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { removeTokens, getUserId, getAccessToken } from "@/lib/auth";
import { fetchTimeline, createPost, updatePost, deletePost, type Post } from "@/lib/posts";
import PostForm from "@/app/components/PostForm";
import PostCard from "@/app/components/PostCard";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";
const PAGE_SIZE = 20;

export default function HomePage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPostsBuffer, setNewPostsBuffer] = useState<Post[]>([]);
  const currentUserId = getUserId();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  const loadInitial = useCallback(async () => {
    try {
      const data = await fetchTimeline(undefined, PAGE_SIZE);
      setPosts(data);
      setHasMore(data.length === PAGE_SIZE);
    } catch {
      setError("タイムラインの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // SSE でリアルタイム受信 → バッファに蓄積
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    const source = new EventSource(`${API_URL}/posts/stream?token=${encodeURIComponent(token)}`);

    source.addEventListener("new-post", (e) => {
      const newPost: Post = JSON.parse(e.data);
      // 自分の投稿（handleCreate で既に追加済み）は除外
      if (newPost.userId === currentUserId) return;
      setNewPostsBuffer((prev) => {
        if (prev.some((p) => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });
    });

    source.onerror = () => source.close();

    return () => source.close();
  }, [currentUserId]);

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
          const older = await fetchTimeline(last.createdAt, PAGE_SIZE);
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
  }, [hasMore, posts]);

  const handleShowNewPosts = () => {
    setPosts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const toAdd = newPostsBuffer.filter((p) => !existingIds.has(p.id));
      return [...toAdd, ...prev];
    });
    setNewPostsBuffer([]);
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCreate = async (content: string) => {
    const newPost = await createPost(content);
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
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* 新着通知バナー */}
      {newPostsBuffer.length > 0 && (
        <div className="sticky top-[57px] z-10 flex justify-center pt-2 px-4">
          <button
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
          <p className="text-center text-gray-400 py-12">まだ投稿がありません。最初の投稿をしましょう！</p>
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
