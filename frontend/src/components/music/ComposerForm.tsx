"use client";

import { useState, useCallback, useEffect } from "react";
import { UserMusicComposer } from "@/types/media/music";
import { Culture, Period } from "@/types/culture";
import api from "@/lib/api";
import { ParamValue } from "next/dist/server/request/params";
import { SVGPath } from "@/utils/path";

type ComposerFormProps = {
  initialData?: UserMusicComposer;
  onSuccess: () => void;
  currentCultureCode: ParamValue;
};

export default function ComposerForm({
  initialData,
  onSuccess,
  currentCultureCode,
}: ComposerFormProps) {
  const [formData, setFormData] = useState<UserMusicComposer>(
    initialData || {
      name: "",
      cultures: [],
      visibility: "private",
      period: undefined,
      occupations: [],
      famous: [],
      themes: [],
      instruments: [],
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
        api.get(`/periods/?code=${currentCultureCode}&key=music`),
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
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? value === ""
            ? undefined
            : parseInt(value)
          : value,
    }));
  };

  const [occupationInput, setOccupationInput] = useState((formData.occupations || []).join(", "));
  const [instrumentsInput, setInstrumentsInput] = useState((formData.instruments || []).join(", "));
  const [famousInput, setFamousInput] = useState((formData.famous || []).join(", "));
  const [themesInput, setThemesInput] = useState((formData.themes || []).join(", "));

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
        occupations: occupationInput
            .split(",")
            .map((o) => o.trim()),
        instruments: instrumentsInput
            .split(",")
            .map((i) => i.trim())
            .filter(Boolean),
        famous: famousInput
            .split(",")
            .map((w) => w.trim())
            .filter(Boolean),
        themes: themesInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        culture_ids: formData.cultures.map((c) => c.id),
        period_id: formData.period_id ?? null,
      };

      const url = initialData
        ? `/user-composers/${initialData.id}/`
        : `/user-composers/`;

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
            name="name"
            placeholder="Composer Name"
            value={formData.name || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="text"
            name="alt_name"
            placeholder="Alternate Name"
            value={formData.alt_name || ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="number"
            name="birth_year"
            placeholder="Birth Year"
            value={formData.birth_year ?? ""}
            onChange={handleChange}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="number"
            name="death_year"
            placeholder="Death Year (Optional)"
            value={formData.death_year ?? ""}
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox={SVGPath.chevron.viewBox}
                  fill="currentColor"
                  className={`w-4 h-4 transition-transform ${
                    showCultureSelect ? "rotate-180" : ""
                  }`}
                >
                  <path
                    fillRule="evenodd"
                    d={SVGPath.chevron.path}
                    clipRule="evenodd"
                  />
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
          <input
            type="text"
            name="occupations"
            placeholder="Occupations (comma-separated)"
            value={occupationInput}
            onChange={(e) => setOccupationInput(e.target.value)}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="text"
            name="instruments"
            placeholder="Instruments (comma-separated)"
            value={instrumentsInput}
            onChange={(e) => setInstrumentsInput(e.target.value)}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="text"
            name="famous"
            placeholder="Famous Works (comma-separated)"
            value={famousInput}
            onChange={(e) => setFamousInput(e.target.value)}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
          <input
            type="text"
            name="themes"
            placeholder="Themes (comma-separated)"
            value={themesInput}
            onChange={(e) => setThemesInput(e.target.value)}
            className="bg-extra shadow p-2 w-full rounded text-sm sm:text-base"
          />
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
                alt="Composer photo preview"
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
          <button
            type="submit"
            disabled={loading}
            className="bg-foreground text-background w-full md:w-1/4 px-4 py-2 rounded text-sm sm:text-base hover:bg-extra-mid hover:scale-105 transition cursor-pointer"
          >
            {loading
              ? "Saving..."
              : initialData
              ? "Update Composer"
              : "Add Composer"}
          </button>
        </form>
      </div>
    </div>
  );
}
