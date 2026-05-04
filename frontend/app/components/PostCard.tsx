"use client";

import { useState } from "react";
import type { Post } from "@/lib/posts";

interface PostCardProps {
  post: Post;
  currentUserId: number | null;
  onUpdate: (id: number, content: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export default function PostCard({ post, currentUserId, onUpdate, onDelete }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = post.userId === currentUserId;
  const remaining = 280 - editContent.length;

  const handleUpdate = async () => {
    if (!editContent.trim() || remaining < 0) return;
    setLoading(true);
    setError(null);
    try {
      await onUpdate(post.id, editContent.trim());
      setIsEditing(false);
    } catch {
      setError("更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("この投稿を削除しますか？")) return;
    setLoading(true);
    try {
      await onDelete(post.id);
    } catch {
      setError("削除に失敗しました");
      setLoading(false);
    }
  };

  const formattedDate = new Date(post.createdAt).toLocaleString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {post.profileImageUrl ? (
          <img
            src={post.profileImageUrl}
            alt={post.username}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">
              {post.username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900">{post.username}</span>
              <span className="text-xs text-gray-400">{formattedDate}</span>
            </div>
            {isOwner && !isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditContent(post.content);
                    setIsEditing(true);
                  }}
                  className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
                >
                  編集
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  削除
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${remaining < 0 ? "text-red-500" : "text-gray-400"}`}>
                  {remaining}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={loading || !editContent.trim() || remaining < 0}
                    className="text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-1 rounded-full transition-colors"
                  >
                    {loading ? "保存中..." : "保存"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>
          )}

          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
