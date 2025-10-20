"use client";

import { useState } from "react";

type ReviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (review: string) => Promise<void>;
  initialValue?: string;
};

export default function ReviewModal({
  isOpen,
  onClose,
  onSave,
  initialValue = "",
}: ReviewModalProps) {
  const [review, setReview] = useState(initialValue);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    await onSave(review);
    onClose();
  };

  return (
    <div className="fixed p-4 inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-md">
      <div className="bg-background p-6 rounded-lg w-254 shadow-lg relative">
        <h2 className="text-lg font-bold mb-4">Write your review</h2>
        <textarea
          className="w-full p-2 border rounded mb-4 bg-neutral"
          rows={6}
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your thoughts about this film..."
        />
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-extra rounded hover:bg-red-400 transition active:scale-95 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-primary text-white rounded hover:text-background hover:bg-neutral-mid hover:scale-105 transition cursor-pointer active:scale-95"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}