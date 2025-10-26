"use client";

import React, { useState } from "react";
import api from "@/lib/api";

interface BookDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBookId?: number;
  onSaved?: () => void;
  initialStarted?: string | null;
  initialFinished?: string | null;
}

export default function BookDatesModal({
  isOpen,
  onClose,
  userBookId,
  onSaved,
  initialStarted,
  initialFinished,
}: BookDatesModalProps) {
  const [dateStarted, setDateStarted] = useState(initialStarted || "");
  const [dateFinished, setDateFinished] = useState(initialFinished || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!userBookId) return;
    setLoading(true);
    setError("");
    try {
      await api.patch(`/user-books/${userBookId}/`, {
        date_started: dateStarted || null,
        date_finished: dateFinished || null,
      });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error("Error saving dates", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-center">Reading Dates</h2>
        <div className="space-y-3">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-foreground/70">Date Started</span>
            <input
              type="date"
              value={dateStarted || ""}
              onChange={(e) => setDateStarted(e.target.value)}
              className="border rounded-lg p-2 bg-background border-neutral-mid"
            />
          </label>
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-foreground/70">Date Finished</span>
            <input
              type="date"
              value={dateFinished || ""}
              onChange={(e) => setDateFinished(e.target.value)}
              className="border rounded-lg p-2 bg-background border-neutral-mid"
            />
          </label>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex justify-end space-x-3 mt-5">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-md text-sm bg-red-500 hover:bg-red-400 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/80 transition cursor-pointer"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
