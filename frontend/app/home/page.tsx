"use client";

import { useRouter } from "next/navigation";
import { removeToken } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Hello World</h1>
        <p className="text-gray-500 mb-8">ログイン成功！タイムライン機能は近日実装予定です。</p>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}
