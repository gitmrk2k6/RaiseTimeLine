"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/api";
import { setTokens, setUserId, setUsername } from "@/lib/auth";
import type { AxiosError } from "axios";

const schema = z.object({
  username: z
    .string()
    .min(1, "ユーザー名を入力してください")
    .max(50, "ユーザー名は50文字以内で入力してください"),
  email: z.string().min(1, "メールアドレスを入力してください").email("メールアドレスの形式が正しくありません"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .regex(/^(?=.*[a-zA-Z])(?=.*\d).+$/, "パスワードは英字と数字を両方含む必要があります"),
});

type FormData = z.infer<typeof schema>;

type ApiError = {
  message: string;
  field?: string;
  errors?: Record<string, string>;
};

export default function RegisterPage() {
  const router = useRouter();
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerErrors({});
    setServerMessage(null);
    try {
      const res = await api.post("/auth/register", data);
      setTokens(res.data.accessToken, res.data.refreshToken);
      setUserId(res.data.userId);
      setUsername(res.data.username);
      router.push("/home");
    } catch (err) {
      const e = err as AxiosError<ApiError>;
      const body = e.response?.data;
      if (body?.errors) {
        setServerErrors(body.errors);
      } else if (body?.field) {
        setServerErrors({ [body.field]: body.message ?? "エラーが発生しました" });
      } else {
        setServerMessage(body?.message ?? "登録に失敗しました");
      }
    } finally {
      setLoading(false);
    }
  };

  const fieldError = (field: keyof FormData) =>
    errors[field]?.message ?? serverErrors[field] ?? null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">新規ユーザー登録</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ユーザー名</label>
            <input
              type="text"
              {...register("username")}
              data-testid="username-input"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="yourname"
            />
            {fieldError("username") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("username")}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              {...register("email")}
              data-testid="email-input"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
            {fieldError("email") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("email")}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input
              type="password"
              {...register("password")}
              data-testid="password-input"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="8文字以上・英数字混在"
            />
            {fieldError("password") && (
              <p className="mt-1 text-xs text-red-500">{fieldError("password")}</p>
            )}
          </div>

          {serverMessage && (
            <p data-testid="server-message" className="text-sm text-red-600 text-center">{serverMessage}</p>
          )}

          <button
            type="submit"
            data-testid="register-submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-lg transition-colors"
          >
            {loading ? "登録中..." : "登録する"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            ログイン画面へ
          </Link>
        </p>
      </div>
    </div>
  );
}
