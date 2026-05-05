"use client";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "削除",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onCancel}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl shadow-xl w-80 p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            className="text-sm text-white bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-full transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
