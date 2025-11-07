"use client";

import { useState, useCallback, useEffect } from "react";
import { ParamValue } from "next/dist/server/request/params";

import api from "@/lib/api";
import { SVGPath } from "@/utils/path";
import { Culture, Period } from "@/types/culture";
import { UserBook } from "@/types/media/book";

type UserBookAssignmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  userBookId: number;
  initialData: UserBook | null;
  currentCultureCode: ParamValue;
  onSuccess: () => void;
};

export default function UserBookAssignmentModal({
  isOpen,
  onClose,
  userBookId,
  initialData,
  currentCultureCode,
  onSuccess,
}: UserBookAssignmentModalProps) {
  const [formData, setFormData] = useState<{
    cultures: Culture[];
    period_id: number | null;
  }>({
    cultures: [],
    period_id: null,
  });

  const [cultures, setCultures] = useState<Culture[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [showCultureSelect, setShowCultureSelect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentCultureCode) return;
    try {
      setLoading(true);
      setError(null);
      const [cultureRes, periodRes] = await Promise.all([
        api.get(`/cultures/?code=${currentCultureCode}`),
        api.get(`/periods/?code=${currentCultureCode}&key=literature`),
      ]);

      setCultures(cultureRes.data);
      setPeriods(periodRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load cultures or periods.");
    } finally {
      setLoading(false);
    }
  }, [currentCultureCode]);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        cultures: initialData.cultures || [],
        period_id: initialData.period?.id ?? null,
      });
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (isOpen) fetchData();
  }, [isOpen, fetchData]);

  const toggleCulture = (culture: Culture) => {
    setFormData((prev) => {
      const exists = prev.cultures.some((c) => c.id === culture.id);
      const updated = exists
        ? prev.cultures.filter((c) => c.id !== culture.id)
        : [...prev.cultures, culture];
      return { ...prev, cultures: updated };
    });
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setFormData((prev) => ({ ...prev, period_id: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userBookId) return setError("No UserBook ID provided.");
    setLoading(true);
    setError(null);
    try {
      const payload = {
        culture_ids: formData.cultures.map((c) => c.id),
        period_id: formData.period_id,
      };
      await api.patch(`/user-books/${userBookId}/`, payload);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save UserBook assignment:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-background rounded-xl shadow-lg p-6 w-full max-w-md relative">
        <h2 className="text-xl font-semibold mb-4 text-center">
          Assign Book to Culture & Period
        </h2>

        {loading && !cultures.length && !periods.length ? (
          <p className="text-center text-foreground/50">Loading...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-foreground mb-1">
                Cultures
              </label>
              <button
                type="button"
                onClick={() => setShowCultureSelect(!showCultureSelect)}
                className="bg-extra w-full p-2 rounded-lg border border-neutral-mid flex justify-between items-center"
              >
                <span className="truncate">
                  {formData.cultures.length
                    ? formData.cultures.map((c) => c.name).join(", ")
                    : "Select Cultures"}
                </span>
                <span
                  className={`transition-transform duration-300 ${
                    showCultureSelect ? "rotate-180" : "rotate-0"
                  }`}
                >
                  <svg
                    viewBox={SVGPath.chevron.viewBox}
                    className="size-5 fill-current transition hover:scale-105 active:scale-95"
                  >
                    <path d={SVGPath.chevron.path} />
                  </svg>
                </span>
              </button>

              {showCultureSelect && (
                <div className="absolute z-10 w-full bg-extra rounded-lg border border-neutral-mid mt-1 max-h-60 overflow-y-auto">
                  {cultures.map((culture) => (
                    <label
                      key={culture.id}
                      className="flex items-center space-x-2 p-2 hover:bg-extra-mid cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.cultures.some(
                          (c) => c.id === culture.id
                        )}
                        onChange={() => toggleCulture(culture)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span className="text-sm">{culture.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Period
              </label>
              <select
                name="period_id"
                value={formData.period_id ?? ""}
                onChange={handlePeriodChange}
                className="bg-extra w-full p-2 rounded-lg border border-neutral-mid"
              >
                <option value="">Select a Period</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-neutral-mid/30 hover:bg-neutral-mid/50 transition text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-primary text-background hover:bg-primary/80 transition text-sm"
              >
                {loading ? "Saving..." : "Save Assignment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
