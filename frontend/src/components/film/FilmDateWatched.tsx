"use client";

import { useState, useEffect } from "react";

import api from "@/lib/api";

/**
 * Modal component for selecting and updating the date a film was watched.
 * 
 * @param userFilmId - ID of the user film to update
 * @param initialValue - Initial date watched value
 * @param onSave - Callback when date is saved
 * @param onClose - Callback to close the modal
 * @param isOpen - Whether the modal is open
 * @example
 * <DateWatchedModal
 *   userFilmId={userFilmId}
 *   initialValue={initialDate}
 *   onSave={(date) => console.log("Date saved:", date)}
 *   onClose={() => setShowModal(false)}
 *   isOpen={showModal}
 * />
 */

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

  useEffect(() => {
    if (initialValue) {
      const date = new Date(initialValue);
      const formatted = date.toISOString().split("T")[0]; // "2025-04-05"
      setSelectedDate(formatted);
    } else {
      setSelectedDate("");
    }
  }, [initialValue]);

  const handleSave = async () => {
    if (!userFilmId) {
      setError("No user film available to update date watched.");
      return;
    }
    try {
      const res = await api.patch(`/user-films/${userFilmId}/`, {
        date_watched: selectedDate || null,
        seen: !!selectedDate,
      });
      if (res.data.date_watched) {
        onSave(selectedDate || null);
        onClose();
      } else {
        setError("Failed to update date watched.");
        return;
      }
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
      setSelectedDate(res.data.date_watched || "");
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
          max={new Date().toISOString().split("T")[0]}
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
