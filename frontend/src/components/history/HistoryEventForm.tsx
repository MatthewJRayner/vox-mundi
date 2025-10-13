"use client";

import { useState, useCallback, useEffect } from "react";
import { UserHistoryEvent } from "@/types/history";
import { Culture, Period } from "@/types/culture";
import api from "@/lib/api";
import { ParamValue } from "next/dist/server/request/params";

type HistoryEventFormProps = {
  initialData?: UserHistoryEvent;
  onSuccess: () => void;
  currentCultureCode: ParamValue;
};

export default function HistoryEventForm({
  initialData,
  onSuccess,
  currentCultureCode,
}: HistoryEventFormProps) {
  const [formData, setFormData] = useState<UserHistoryEvent>(
    initialData || {
      title: "",
      cultures: [],
      visibility: "private",
      type: "",
    }
  );

  const [cultures, setCultures] = useState<Culture[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [showCultureSelect, setShowCultureSelect] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentCultureCode) return;
    try {
      setLoading(true);
      const [periodRes, cultureRes] = await Promise.all([
        api.get(`/periods/?code=${currentCultureCode}`),
        api.get(`/cultures/?code=${currentCultureCode}`),
      ]);

      setPeriods(periodRes.data);
      setCultures(cultureRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentCultureCode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked =
      e.target instanceof HTMLInputElement ? e.target.checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseFloat(value)
          : value,
    }));
  };

  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      e.target instanceof HTMLInputElement ? e.target.checked : undefined;

    setFormData((prev) => ({
      ...prev,
      date: {
        ...prev.date,
        [name]:
          type === "checkbox"
            ? checked
            : type === "number"
            ? parseFloat(value)
            : value,
      },
    }));
  };

  const toggleCulture = (culture: Culture) => {
    setFormData((prev) => {
      const exists = prev.cultures.some((c) => c.id === culture.id);
      const updated = exists
        ? prev.cultures.filter((c) => c.id !== culture.id)
        : [...prev.cultures.filter((c) => c.id !== culture.id), culture]; // remove duplicates
      return { ...prev, cultures: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        culture_ids: formData.cultures.map((c) => c.id),
        period_id: formData.period_id ?? null,
        date: {
          date_known: formData.date?.date_known,
          date: formData.date?.date,
          date_estimate_start: formData.date?.date_estimate_start,
          date_estimate_end: formData.date?.date_estimate_end,
          date_precision: formData.date?.date_precision,
        },
      };

      const url = initialData
        ? `/user-history-events/${initialData.id}/`
        : `/user-history-events/`;

      if (initialData) {
        await api.put(url, payload);
      } else {
        await api.post(url, payload);
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to save:", error);
      alert(`Failed to save: ${JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <main className="p-4">Loading...</main>;

  return (
    <div className="flex flex-col md:flex-row w-full p-2 sm:p-4 items-center justify-center">
      <div className="">
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="title"
            placeholder="Event Title"
            value={formData.title || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="text"
            name="alt_title"
            placeholder="Original Language Title"
            value={formData.alt_title || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="text"
            name="type"
            placeholder="Type"
            value={formData.type || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <select
            name="period_id"
            value={formData.period_id || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          >
            <option value="">-- Select Period --</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <div className="bg-extra shadow p-2 rounded text-sm sm:text-base">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setShowCultureSelect(!showCultureSelect)}
            >
              <span>
                Cultures:{" "}
                {formData.cultures.map((c) => c.name).join(", ") ||
                  "None selected"}
              </span>
              <span className="text-xs text-gray-500">
                {showCultureSelect ? "▲" : "▼"}
              </span>
            </div>
            {showCultureSelect && (
              <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border-t border-gray-300 pt-2">
                {cultures.map((culture) => {
                  const selected = formData.cultures.some(
                    (c) => c.id === culture.id
                  );
                  return (
                    <label
                      key={culture.id}
                      className={`flex items-center space-x-2 cursor-pointer ${
                        selected ? "text-main rounded px-1" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleCulture(culture)}
                      />
                      <span>{culture.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="date_known"
              checked={formData.date?.date_known || false}
              onChange={handleDateChange}
            />
            <span>Date Known</span>
          </label>
          <div className="bg-extra flex shadow p-2 space-x-2">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date?.date || ""}
              onChange={handleDateChange}
              className=" w-full rounded text-sm sm:text-base"
            />
          </div>
          <input
            type="number"
            name="date_estimate_start"
            placeholder="Estimated Start Year"
            value={formData.date?.date_estimate_start || ""}
            onChange={handleDateChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="number"
            name="date_estimate_end"
            placeholder="Estimated End Year (If Needed)"
            value={formData.date?.date_estimate_end || ""}
            onChange={handleDateChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <select
            name="date_precision"
            value={formData.date?.date_precision || "unknown"}
            onChange={handleDateChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          >
            <option value="exact">Exact</option>
            <option value="year">Year</option>
            <option value="decade">Decade</option>
            <option value="century">Century</option>
            <option value="millennium">Millennium</option>
            <option value="unknown">Unknown</option>
          </select>
          <textarea
            name="summary"
            placeholder="Summary"
            value={formData.summary || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          {formData.photo && (
            <div className="mb-3 flex flex-col items-center">
              <p className="text-xs sm:text-sm text-silver mb-1 w-full text-left">
                Current Photo Preview:
              </p>
              <img
                src={formData.photo}
                alt="Cover preview"
                className="object-contain rounded max-w-[200px] sm:max-w-[300px] md:max-w-[400px] lg:max-w-[500px]"
              />
            </div>
          )}
          <input
            type="text"
            name="photo"
            placeholder="Photo URL"
            value={formData.photo || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <select
            name="visibility"
            value={formData.visibility || "public"}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <textarea
            name="notes"
            placeholder="Notes"
            value={formData.notes || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-foreground text-background w-full md:w-1/4 px-4 py-2 rounded text-sm sm:text-base hover:bg-extra-mid hover:scale-105 transition cursor-pointer"
          >
            {loading ? "Saving..." : initialData ? "Update Event" : "Add Event"}
          </button>
        </form>
      </div>
    </div>
  );
}
