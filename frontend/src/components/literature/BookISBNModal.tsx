"use client";

import React, { useState } from "react";

import api from "@/lib/api";

interface BookISBNModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBookId?: number;
  onUpdated?: () => void;
}

export default function BookISBNModal({
  isOpen,
  onClose,
  userBookId,
  onUpdated,
}: BookISBNModalProps) {
  const [isbn, setIsbn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError("");
    setSuccess(false);
    if (!userBookId) {
      setError("No user book found.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/update-userbook/", {
        userbook_id: userBookId,
        isbn,
      });
      setSuccess(true);
      if (onUpdated) onUpdated();
      setTimeout(() => onClose(), 1000);
    } catch (err) {
      console.error("Failed to update ISBN.", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-center">Add ISBN</h2>
        <p className="text-sm text-foreground/60 mb-2">
          {`Enter your edition’s ISBN or ISBN10 to auto-fill details like
          publisher, language, and page count.`}
        </p>
        <input
          type="text"
          placeholder="Enter ISBN"
          value={isbn}
          onChange={(e) => setIsbn(e.target.value)}
          className="w-full border border-neutral-mid rounded-lg p-2 bg-background"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {success && (
          <p className="text-green-500 text-sm mt-2">
            Book updated successfully!
          </p>
        )}
        <div className="flex justify-end space-x-3 mt-5">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-md text-sm bg-red-500 hover:bg-red-400 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/80 transition cursor-pointer"
          >
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>
    </div>
  );
}
