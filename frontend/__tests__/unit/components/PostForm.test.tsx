/**
 * PostForm コンポーネントテスト
 *
 * テスト技法: ブラックボックス（境界値分析 + 同値分割）
 *
 * 境界値:
 *   文字数: 280文字（有効上限）・281文字（無効）
 *
 * 同値分割:
 *   有効ファイル: image/jpeg, image/png, image/gif
 *   無効ファイル: image/bmp, 5MB超
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PostForm from "../../../app/components/PostForm";

// URL.createObjectURL は jsdom に存在しないためモック
global.URL.createObjectURL = vi.fn(() => "blob:http://localhost/mock-url");
global.URL.revokeObjectURL = vi.fn();

describe("PostForm コンポーネント", () => {
  const MAX_LENGTH = 280;
  const MAX_SIZE = 5 * 1024 * 1024;

  // ─────────────────────────────────────────────
  // PF-01: 有効テキスト入力 → 送信ボタンが有効
  // ─────────────────────────────────────────────
  it("PF-01: 有効テキスト入力 → 送信ボタンが有効になる（正常系）", async () => {
    const user = userEvent.setup();
    render(<PostForm onSubmit={vi.fn()} />);

    const textarea = screen.getByPlaceholderText("いまどうしてる？");
    const submitBtn = screen.getByRole("button", { name: "投稿する" });

    // 初期状態では disabled
    expect(submitBtn).toBeDisabled();

    await user.type(textarea, "テスト投稿");

    expect(submitBtn).not.toBeDisabled();
  });

  // ─────────────────────────────────────────────
  // PF-02: 280文字ちょうど → 残り0・送信可能
  // ─────────────────────────────────────────────
  it("PF-02: 280文字ちょうど → 残り0表示・送信ボタンが有効（境界値: 上限ちょうど）", async () => {
    const user = userEvent.setup();
    render(<PostForm onSubmit={vi.fn()} />);

    const textarea = screen.getByPlaceholderText("いまどうしてる？");
    const text = "a".repeat(MAX_LENGTH);

    await user.type(textarea, text);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "投稿する" })).not.toBeDisabled();
  });

  // ─────────────────────────────────────────────
  // PF-03: 281文字 → 残り-1（赤色）・送信ボタン disabled
  // ─────────────────────────────────────────────
  it("PF-03: 281文字 → 残り-1表示（赤色）・送信ボタンが disabled（境界値: 上限超過）", async () => {
    const user = userEvent.setup();
    render(<PostForm onSubmit={vi.fn()} />);

    const textarea = screen.getByPlaceholderText("いまどうしてる？");
    const text = "a".repeat(MAX_LENGTH + 1);

    await user.type(textarea, text);

    const remaining = screen.getByText("-1");
    expect(remaining).toBeInTheDocument();
    expect(remaining).toHaveClass("text-red-500");
    expect(screen.getByRole("button", { name: "投稿する" })).toBeDisabled();
  });

  // ─────────────────────────────────────────────
  // PF-04: 5MB超のファイル → エラーメッセージ表示
  // ─────────────────────────────────────────────
  it("PF-04: 5MB超のファイル → エラーメッセージ表示（同値分割: 無効クラス）", async () => {
    const user = userEvent.setup();
    render(<PostForm onSubmit={vi.fn()} />);

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const oversizedFile = new File(
      [new ArrayBuffer(MAX_SIZE + 1)],
      "big.jpg",
      { type: "image/jpeg" }
    );

    await user.upload(fileInput, oversizedFile);

    expect(
      screen.getByText("画像は5MB以下にしてください")
    ).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────
  // PF-05: BMP ファイル → "JPEG・PNG・GIF" エラー
  // ─────────────────────────────────────────────
  it("PF-05: BMP ファイル → JPEG・PNG・GIF エラー（同値分割: 無効クラス）", async () => {
    // applyAccept: false → accept 属性を無視して BMP をアップロードする
    const user = userEvent.setup({ applyAccept: false });
    render(<PostForm onSubmit={vi.fn()} />);

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const bmpFile = new File([new ArrayBuffer(100)], "test.bmp", {
      type: "image/bmp",
    });

    await user.upload(fileInput, bmpFile);

    expect(
      screen.getByText("JPEG・PNG・GIFのみ対応しています")
    ).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────
  // PF-06: JPEG ファイル → プレビュー画像が表示される
  // ─────────────────────────────────────────────
  it("PF-06: JPEG ファイル → プレビュー画像が表示される（同値分割: 有効クラス）", async () => {
    const user = userEvent.setup();
    render(<PostForm onSubmit={vi.fn()} />);

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const jpegFile = new File([new ArrayBuffer(100)], "photo.jpg", {
      type: "image/jpeg",
    });

    await user.upload(fileInput, jpegFile);

    const preview = screen.getByAltText("プレビュー");
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveAttribute("src", "blob:http://localhost/mock-url");
  });

  // ─────────────────────────────────────────────
  // PF-07: 送信成功 → フォームがリセットされる
  // ─────────────────────────────────────────────
  it("PF-07: 送信成功 → テキストと画像がリセットされる（正常系）", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn().mockResolvedValue(undefined);
    render(<PostForm onSubmit={mockSubmit} />);

    const textarea = screen.getByPlaceholderText("いまどうしてる？");
    await user.type(textarea, "送信テスト");

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const jpegFile = new File([new ArrayBuffer(100)], "photo.jpg", {
      type: "image/jpeg",
    });
    await user.upload(fileInput, jpegFile);

    // 送信前にプレビューが存在する
    expect(screen.getByAltText("プレビュー")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "投稿する" }));

    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
    expect(screen.queryByAltText("プレビュー")).not.toBeInTheDocument();
    expect(mockSubmit).toHaveBeenCalledWith("送信テスト", jpegFile);
  });

  // ─────────────────────────────────────────────
  // PF-08: onSubmit が reject → エラーメッセージ表示
  // ─────────────────────────────────────────────
  it("PF-08: onSubmit が reject → '投稿に失敗しました' エラー表示（異常系）", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn().mockRejectedValue(new Error("server error"));
    render(<PostForm onSubmit={mockSubmit} />);

    const textarea = screen.getByPlaceholderText("いまどうしてる？");
    await user.type(textarea, "失敗するテスト投稿");

    await user.click(screen.getByRole("button", { name: "投稿する" }));

    await waitFor(() => {
      expect(screen.getByText("投稿に失敗しました")).toBeInTheDocument();
    });
  });
});
