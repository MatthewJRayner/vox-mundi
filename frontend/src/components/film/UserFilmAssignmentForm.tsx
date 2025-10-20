"use client";

import { useState, useCallback, useEffect } from "react";
import api from "@/lib/api";
import { Culture, Period } from "@/types/culture";
import { UserFilm } from "@/types/media/film";
import { ParamValue } from "next/dist/server/request/params";

type UserFilmAssignmentFormProps = {
  userFilmId: number;
  initialData: UserFilm | null;
  currentCultureCode: ParamValue;
  onSuccess: () => void;
};

export default function UserFilmAssignmentForm({
  userFilmId,
  initialData,
  currentCultureCode,
  onSuccess,
}: UserFilmAssignmentFormProps) {
  const [formData, setFormData] = useState<{
    cultures: Culture[];
    period_id: number | null;
  }>({
    cultures: initialData?.cultures || [],
    period_id: initialData?.period?.id ?? null,
  });

  const [cultures, setCultures] = useState<Culture[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [showCultureSelect, setShowCultureSelect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Fetch culture + period data */
  const fetchData = useCallback(async () => {
    if (!currentCultureCode) return;
    try {
      setLoading(true);
      setError(null);
      const [cultureRes, periodRes] = await Promise.all([
        api.get(`/cultures/?code=${currentCultureCode}`),
        api.get(`/periods/?code=${currentCultureCode}&key=film`),
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
    fetchData();
  }, [fetchData]);

  /** Toggle culture selection */
  const toggleCulture = (culture: Culture) => {
    setFormData((prev) => {
      const exists = prev.cultures.some((c) => c.id === culture.id);
      const updated = exists
        ? prev.cultures.filter((c) => c.id !== culture.id)
        : [...prev.cultures, culture];
      return { ...prev, cultures: updated };
    });
  };

  /** Handle period dropdown */
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? parseInt(e.target.value) : null;
    setFormData((prev) => ({ ...prev, period_id: value }));
  };

  /** Submit to backend */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFilmId) return setError("No UserFilm ID provided.");

    setLoading(true);
    setError(null);

    try {
      const payload = {
        culture_ids: formData.cultures.map((c) => c.id),
        period_id: formData.period_id,
      };

      await api.patch(`/user-films/${userFilmId}/`, payload);
      onSuccess();
    } catch (err) {
      console.error("Failed to save UserFilm assignment:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !cultures.length && !periods.length)
    return <div className="p-4 text-gray-400">Loading...</div>;

  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="flex flex-col w-full p-2 sm:p-4 items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
        {/* CULTURES SELECT */}
        <div className="relative">
          <label className="text-sm sm:text-base font-semibold text-foreground">
            Cultures
          </label>
          <button
            type="button"
            onClick={() => setShowCultureSelect(!showCultureSelect)}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base text-left flex justify-between items-center"
          >
            <span>
              {formData.cultures.length
                ? formData.cultures.map((c) => c.name).join(", ")
                : "Select Cultures"}
            </span>
            <svg
              viewBox="0 0 24 24"
              className={`size-5 fill-current transition-transform duration-300 ${
                showCultureSelect ? "rotate-180" : "rotate-0"
              }`}
            >
              <path d="M7 10l5 5 5-5H7z" />
            </svg>
          </button>

          {showCultureSelect && (
            <div className="absolute z-10 w-full bg-extra shadow rounded mt-1 max-h-60 overflow-y-auto">
              {cultures.map((culture) => (
                <label
                  key={culture.id}
                  className="flex items-center space-x-2 p-2 hover:bg-extra-mid cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.cultures.some((c) => c.id === culture.id)}
                    onChange={() => toggleCulture(culture)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="text-sm sm:text-base">{culture.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* PERIOD SELECT */}
        <div>
          <label className="text-sm sm:text-base font-semibold text-foreground">
            Period
          </label>
          <select
            name="period_id"
            value={formData.period_id ?? ""}
            onChange={handlePeriodChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          >
            <option value="">Select a Period</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.title}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-foreground text-background w-full px-4 py-2 rounded text-sm sm:text-base hover:bg-extra-mid hover:scale-105 transition cursor-pointer disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Assignment"}
        </button>
      </form>
    </div>
  );
}
