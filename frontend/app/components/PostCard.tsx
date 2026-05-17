"use client";

import { useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/posts";
import { likePost, unlikePost } from "@/lib/posts";
import CommentSection from "@/app/components/CommentSection";
import ConfirmModal from "@/app/components/ConfirmModal";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [likedByCurrentUser, setLikedByCurrentUser] = useState(post.likedByCurrentUser);
  const [commentCount, setCommentCount] = useState(post.commentCount);
  const [showComments, setShowComments] = useState(false);

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

  const handleDeleteConfirm = async () => {
    setShowDeleteModal(false);
    setLoading(true);
    try {
      await onDelete(post.id);
    } catch {
      setError("削除に失敗しました");
      setLoading(false);
    }
  };

  const handleToggleLike = async () => {
    try {
      const result = likedByCurrentUser
        ? await unlikePost(post.id)
        : await likePost(post.id);
      setLikeCount(result.likeCount);
      setLikedByCurrentUser(result.likedByCurrentUser);
    } catch {
      // サイレントに失敗 — UI は変更前の状態を維持
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
    <>
      {showDeleteModal && (
        <ConfirmModal
          title="投稿を削除"
          message="この投稿を削除しますか？紐づくコメント・いいねも削除されます。"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <div data-testid="post-card" className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
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
                <Link href={`/profile/${post.userId}`} className="font-semibold text-sm text-gray-900 hover:underline">{post.username}</Link>
                <span className="text-xs text-gray-400">{formattedDate}</span>
              </div>
              {isOwner && !isEditing && (
                <div className="flex gap-2">
                  <button
                    data-testid="edit-button"
                    onClick={() => {
                      setEditContent(post.content);
                      setIsEditing(true);
                    }}
                    className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    編集
                  </button>
                  <button
                    data-testid="delete-button"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={loading}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    削除
                  </button>
                </div>
              )}
            </div>

            {post.imageUrl && !isEditing && (
              <img
                src={post.imageUrl}
                alt="投稿画像"
                className="mt-2 rounded-lg max-h-80 object-cover w-full"
              />
            )}

            {isEditing ? (
              <div className="mt-2">
                <textarea
                  data-testid="edit-textarea"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs ${remaining < 0 ? "text-red-500" : "text-gray-400"}`}>
                    {remaining}
                  </span>
                  <div className="flex gap-2">
                    <button
                      data-testid="edit-cancel"
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      キャンセル
                    </button>
                    <button
                      data-testid="edit-save"
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
              <p data-testid="post-content" className="mt-1 text-sm text-gray-800 whitespace-pre-wrap break-words">{post.content}</p>
            )}

            {!isEditing && (
              <div className="mt-3 flex items-center gap-4">
                <button
                  data-testid="like-button"
                  onClick={handleToggleLike}
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    likedByCurrentUser
                      ? "text-red-500 hover:text-red-600"
                      : "text-gray-400 hover:text-red-400"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={likedByCurrentUser ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                    />
                  </svg>
                  <span data-testid="like-count">{likeCount}</span>
                </button>

                <button
                  data-testid="comment-toggle"
                  onClick={() => setShowComments((prev) => !prev)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                    />
                  </svg>
                  <span data-testid="comment-count">{commentCount}</span>
                </button>
              </div>
            )}

            {showComments && (
              <CommentSection
                postId={post.id}
                currentUserId={currentUserId}
                onCommentCountChange={(delta) => setCommentCount((c) => c + delta)}
              />
            )}

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
        </div>
      </div>
    </>
  );
}
