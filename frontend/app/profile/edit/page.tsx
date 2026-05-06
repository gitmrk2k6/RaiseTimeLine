"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getProfile, updateProfile } from "@/lib/users";
import { getUserId, setUsername } from "@/lib/auth";

export default function ProfileEditPage() {
  const router = useRouter();
  const currentUserId = getUserId();
  const [usernameVal, setUsernameVal] = useState("");
  const [bio, setBio] = useState("");
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUserId) {
      router.replace("/login");
      return;
    }
    getProfile(currentUserId).then((profile) => {
      setUsernameVal(profile.username);
      setBio(profile.bio ?? "");
      setCurrentImageUrl(profile.profileImageUrl);
    }).finally(() => setInitialLoading(false));
  }, [currentUserId, router]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif"].includes(file.type)) {
      setError("JPEG・PNG・GIF 形式の画像を選択してください");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("画像は5MB以下にしてください");
      return;
    }
    setError(null);
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameVal.trim()) {
      setError("ユーザー名を入力してください");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await updateProfile(usernameVal.trim(), bio, image ?? undefined);
      setUsername(usernameVal.trim());
      router.push(`/profile/${currentUserId}`);
    } catch {
      setError("更新に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const displayImage = preview ?? currentImageUrl;

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
          <h1 className="text-lg font-bold text-gray-900">プロフィールを編集</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
          {/* アイコン画像 */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-20 h-20 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center cursor-pointer"
              onClick={() => fileRef.current?.click()}
            >
              {displayImage ? (
                <img src={displayImage} alt="プロフィール画像" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {usernameVal.charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="text-sm text-blue-500 hover:underline"
            >
              アイコン画像を変更
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              className="hidden"
              onChange={handleFile}
            />
            {preview && (
              <button
                type="button"
                onClick={removeImage}
                className="text-xs text-red-400 hover:underline"
              >
                選択した画像を削除
              </button>
            )}
          </div>

          {/* ユーザー名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
            <input
              type="text"
              value={usernameVal}
              onChange={(e) => setUsernameVal(e.target.value)}
              maxLength={50}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ユーザー名"
            />
            <p className="mt-1 text-xs text-gray-400 text-right">{usernameVal.length} / 50</p>
          </div>

          {/* 自己紹介 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">自己紹介</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="自己紹介を入力（160文字以内）"
            />
            <p className="mt-1 text-xs text-gray-400 text-right">{bio.length} / 160</p>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !usernameVal.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-2 rounded-full transition-colors"
          >
            {loading ? "保存中..." : "保存する"}
          </button>
        </form>
      </main>
    </div>
  );
}
