"use client";

import { useState } from "react";

interface PostFormProps {
  onSubmit: (content: string) => Promise<void>;
}

export default function PostForm({ onSubmit }: PostFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_LENGTH = 280;
  const remaining = MAX_LENGTH - content.length;
  const isOverLimit = remaining < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isOverLimit) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(content.trim());
      setContent("");
    } catch {
      setError("投稿に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="いまどうしてる？"
        rows={3}
        className="w-full resize-none text-sm border-none outline-none placeholder-gray-400 text-gray-900"
      />
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className={`text-sm font-medium ${isOverLimit ? "text-red-500" : "text-gray-400"}`}>
          {remaining}
        </span>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading || !content.trim() || isOverLimit}
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold px-4 py-1.5 rounded-full transition-colors"
        >
          {loading ? "投稿中..." : "投稿する"}
        </button>
      </div>
    </form>
  );
}
