"use client";

import { useState } from "react";
import api from "@/lib/api";

interface DateWatchedModalProps {
  userFilmId: number;
  initialValue: string | null;
  onSave: (date: string | null) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function DateWatchedModal({
  userFilmId,
  initialValue,
  onSave,
  onClose,
  isOpen,
}: DateWatchedModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(initialValue || "");
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!userFilmId) {
      setError("No user film available to update date watched.");
      return;
    }

    try {
      const res = await api.patch(`/user-films/${userFilmId}/`, {
        date_watched: selectedDate || null,
        seen: !!selectedDate, // Set seen to true if a date is selected, false if cleared
      });
      onSave(selectedDate || null);
      onClose();
    } catch (err: unknown) {
      console.error("Error updating date watched:", err);
      setError("Failed to update date watched.");
    }
  };

  const handleClear = async () => {
    if (!userFilmId) {
      setError("No user film available to clear date watched.");
      return;
    }

    try {
      const res = await api.patch(`/user-films/${userFilmId}/`, {
        date_watched: null,
        seen: false,
      });
      setSelectedDate("");
      onSave(null);
      onClose();
    } catch (err: unknown) {
      console.error("Error clearing date watched:", err);
      setError("Failed to clear date watched.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Select Date Watched
        </h2>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full p-2 rounded border border-gray-400 text-foreground bg-neutral focus:outline-none focus:ring-2 focus:ring-primary"
          max={new Date().toISOString().split("T")[0]} // Prevent future dates
        />
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-gray-400 hover:text-red-500 transition cursor-pointer"
          >
            Clear Date
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-primary transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-primary text-white px-4 py-2 rounded hover:scale-105 transition cursor-pointer active:scale-95"
            disabled={!userFilmId}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}