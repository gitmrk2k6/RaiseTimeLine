"use client";

import { useState, useEffect } from "react";
import type { Comment } from "@/lib/posts";
import { fetchComments, createComment, deleteComment } from "@/lib/posts";

interface CommentSectionProps {
  postId: number;
  currentUserId: number | null;
  onCommentCountChange: (delta: number) => void;
}

export default function CommentSection({
  postId,
  currentUserId,
  onCommentCountChange,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = 140 - newContent.length;

  useEffect(() => {
    fetchComments(postId)
      .then(setComments)
      .catch(() => setError("コメントの取得に失敗しました"))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSubmit = async () => {
    if (!newContent.trim() || remaining < 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const comment = await createComment(postId, newContent.trim());
      setComments((prev) => [...prev, comment]);
      setNewContent("");
      onCommentCountChange(1);
    } catch {
      setError("コメントの投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm("このコメントを削除しますか？")) return;
    try {
      await deleteComment(postId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCommentCountChange(-1);
    } catch {
      setError("コメントの削除に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center py-2">
        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {comments.length > 0 && (
        <ul className="space-y-2 mb-3">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-start gap-2">
              {comment.profileImageUrl ? (
                <img
                  src={comment.profileImageUrl}
                  alt={comment.username}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">
                    {comment.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-gray-700 mr-1">
                  {comment.username}
                </span>
                <span className="text-xs text-gray-600 break-words">{comment.content}</span>
              </div>
              {comment.userId === currentUserId && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-xs text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  削除
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 items-end">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="コメントを入力..."
          rows={2}
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 resize-none"
        />
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs ${remaining < 0 ? "text-red-500" : "text-gray-400"}`}>
            {remaining}
          </span>
          <button
            onClick={handleSubmit}
            disabled={submitting || !newContent.trim() || remaining < 0}
            className="text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-1 rounded-full transition-colors"
          >
            {submitting ? "送信中..." : "送信"}
          </button>
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
