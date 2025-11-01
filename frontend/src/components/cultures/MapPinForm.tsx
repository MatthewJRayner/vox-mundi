"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin } from "@/types/map";
import { Culture, Period } from "@/types/culture";
import api from "@/lib/api";
import { SVGPath } from "@/utils/path";

interface MapPinFormModalProps {
  initialData?: MapPin;
  latPin?: number;
  lngPin?: number;
  cultureCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MapPinFormModal({
  initialData,
  latPin,
  lngPin,
  cultureCode,
  onClose,
  onSuccess,
}: MapPinFormModalProps) {
  const [formData, setFormData] = useState<MapPin>(
    initialData || {
      title: "",
      cultures: [],
      visibility: "private",
      type: "",
      loc: { lat: latPin || 0, lng: lngPin || 0 },
    }
  );

  const [periods, setPeriods] = useState<Period[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [showCultureSelect, setShowCultureSelect] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!cultureCode) return;
    try {
      setLoading(true);
      const [periodRes, cultureRes] = await Promise.all([
        api.get(`/periods/?code=${cultureCode}&key=history`),
        api.get(`/cultures/?code=${cultureCode}`),
      ]);

      setPeriods(periodRes.data);
      setCultures(cultureRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [cultureCode]);

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
        period_id: formData.period_id ?? undefined,
        date: {
          date_known: formData.date?.date_known,
          date: formData.date?.date,
          date_estimate_start: formData.date?.date_estimate_start,
          date_estimate_end: formData.date?.date_estimate_end,
          date_precision: formData.date?.date_precision,
        },
        cultures: undefined,
      };

      const url = initialData ? `/map-pins/${initialData.id}/` : `/map-pins/`;

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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-extra rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 md:p-6 relative">
        <span className="absolute top-4 right-2 text-w">
          <svg
            viewBox={SVGPath.close.viewBox}
            className="size-5 fill-current text-foreground cursor-pointer hover:scale-110 hover:fill-red-400 active:scale-95 transition"
          >
            <path d={SVGPath.close.path} />
          </svg>
        </span>
        <h2 className="text-xl font-bold mb-4 mt-2">Add Map Pin</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <input
            type="text"
            name="title"
            placeholder="Title"
            value={formData.title || ""}
            onChange={handleChange}
            className="bg-background shadow p-2 w-full rounded text-sm sm:text-base"
          />

          {/* Type */}
          <input
            type="text"
            name="type"
            placeholder="Type (e.g. Battle, Treaty)"
            value={formData.type || ""}
            onChange={handleChange}
            className="bg-background shadow p-2 w-full rounded text-sm sm:text-base"
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Filter
            </label>
            <select
              name="filter"
              value={formData.filter || "other"}
              onChange={handleChange}
              className="w-full bg-background rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="landmark">Landmark</option>
              <option value="event">Event</option>
              <option value="travel">Travel</option>
              <option value="figure">Figure</option>
              <option value="artwork">Artwork</option>
              <option value="other">Other</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Categorize this pin for better filtering on the map.
            </p>
          </div>

          {/* Period */}
          <select
            name="period_id"
            value={formData.period_id || ""}
            onChange={handleChange}
            className="bg-background shadow p-2 w-full rounded text-sm sm:text-base"
          >
            <option value="">-- Select Period --</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>

          {/* Cultures */}
          <div className="bg-background shadow p-2 rounded text-sm sm:text-base">
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
                <svg
                  viewBox={SVGPath.chevron.viewBox}
                  className={`size-5 fill-current transition hover:scale-105 active:scale-95 ${
                    showCultureSelect ? "transform rotate-180" : ""
                  }`}
                >
                  <path d={SVGPath.chevron.path} />
                </svg>
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

          {/* Location Name */}
          <input
            type="text"
            name="location"
            placeholder="Location Name"
            value={formData.location || ""}
            onChange={handleChange}
            className="bg-background shadow p-2 w-full rounded text-sm sm:text-base"
          />

          {/* Description */}
          <textarea
            name="happened"
            placeholder="What happened?"
            value={formData.happened || ""}
            onChange={handleChange}
            rows={3}
            className="bg-background shadow p-2 w-full rounded text-sm sm:text-base"
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

          {/* Photo URL */}
          <input
            type="url"
            name="photo"
            placeholder="Photo URL"
            value={formData.photo || ""}
            onChange={handleChange}
            className="bg-background shadow p-2 w-full rounded text-sm sm:text-base"
          />

          
          <input
            type="url"
            name="external_link"
            placeholder="Link URL (for more info)"
            value={formData.external_link || ""}
            onChange={handleChange}
            className="bg-background shadow p-2 w-full rounded text-sm sm:text-base"
          />

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="date_known"
              checked={formData.date?.date_known || false}
              onChange={handleDateChange}
            />
            <span>Exact Date Known</span>
          </label>
          <div className="bg-background flex shadow p-2 space-x-2">
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
            className="bg-background shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="number"
            name="date_estimate_end"
            placeholder="Estimated End Year (If Needed)"
            value={formData.date?.date_estimate_end || ""}
            onChange={handleDateChange}
            className="bg-background shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <select
            name="date_precision"
            value={formData.date?.date_precision || "unknown"}
            onChange={handleDateChange}
            className="bg-background shadow p-2 w-full rounded text-sm sm:text-base"
          >
            <option value="exact">Exact</option>
            <option value="year">Year</option>
            <option value="decade">Decade</option>
            <option value="century">Century</option>
            <option value="millennium">Millennium</option>
            <option value="unknown">Unknown</option>
          </select>

          {/* Significance */}
          <textarea
            name="significance"
            placeholder="Significance"
            value={formData.significance || ""}
            onChange={handleChange}
            rows={2}
            className="bg-background shadow p-2 w-full rounded text-sm sm:text-base"
          />

          {/* Visibility */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={formData.visibility === "public"}
                onChange={handleChange}
              />
              Public
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={formData.visibility === "private"}
                onChange={handleChange}
              />
              Private
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-foreground text-background rounded hover:bg-red-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Saving..." : initialData ? "Update Pin" : "Add Pin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
