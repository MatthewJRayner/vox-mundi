"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { CalendarDate } from "@/types/calendar";
import { Culture } from "@/types/culture";
import { SVGPath } from "@/utils/path";
import { CalendarSystem } from "./CalendarAdapter";
import dayjs from "dayjs";

interface CalendarFormProps {
  cultureCode: string;
  initialDate: Date;
  initialData?: CalendarDate;
  referenceSystem?: CalendarSystem; // add this
  onClose: () => void;
  onSaved: () => void;
}



export default function CalendarDateForm({
  cultureCode,
  initialDate,
  onClose,
  onSaved,
  initialData,
  referenceSystem,
}: CalendarFormProps) {
  const [formData, setFormData] = useState<CalendarDate>(
    initialData || {
      holiday_name: "",
      meaning: "",
      traditions: "",
      visibility: "private",
      cultures: [],
      isAnnual: false,
      type: "",
      calendar_date: initialDate ? dayjs(initialDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
      reference_system: "gregorian",
    }
  );
  const [selectedDate, setSelectedDate] = useState(
    initialDate ? dayjs(initialDate).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD")
  );
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCultureSelect, setShowCultureSelect] = useState(false);

  const fetchCultures = useCallback(async () => {
    try {
      const res = await api.get(`/cultures/?code=${cultureCode}`);
      setCultures(res.data);
    } catch (err) {
      console.error("Error loading cultures:", err);
    }
  }, [cultureCode]);

  useEffect(() => {
    fetchCultures();
  }, [fetchCultures]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked =
      e.target instanceof HTMLInputElement ? e.target.checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setFormData((prev) => ({
      ...prev,
      calendar_date: newDate,
    }));
  };

  const toggleCulture = (culture: Culture) => {
    setFormData((prev) => {
      const exists = prev.cultures.some((c) => c.id === culture.id);
      const updated = exists
        ? prev.cultures.filter((c) => c.id !== culture.id)
        : [...prev.cultures, culture];
      return { ...prev, cultures: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        holiday_name: formData.holiday_name,
        meaning: formData.meaning,
        traditions: formData.traditions,
        photo: formData.photo,
        visibility: formData.visibility,
        culture_ids: formData.cultures.map((c) => c.id),
        calendar_date: selectedDate, // Use selected date
        isAnnual: formData.isAnnual,
        type: formData.type,
        reference_system: formData.reference_system || 'gregorian',
      };

      const url = initialData
        ? `/calendar-dates/${initialData.id}/`
        : `/calendar-dates/`;

      if (initialData) {
        await api.put(url, payload);
      } else {
        await api.post(url, payload);
      }

      onSaved();
    } catch (error) {
      console.error("Error saving calendar date:", error);
      alert("Error saving calendar date.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2 w-full p-2 relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-black"
      >
        <svg
          viewBox={SVGPath.arrow.viewBox}
          className="size-5 fill-foreground/50 hover:fill-main transition hover:scale-105 active:scale-95 cursor-pointer"
        >
          <path d={SVGPath.arrow.path} />
        </svg>
      </button>
      <h2 className="text-base md:text-xl font-semibold mb-4">
        {initialData ? "Edit Event" : "Add New Event"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="date"
          name="calendar_date"
          value={selectedDate}
          onChange={handleDateChange}
          className="text-sm md:text-base bg-extra shadow-lg p-2 w-full rounded"
          required
        />
        <input
          type="text"
          name="holiday_name"
          placeholder="Event Name"
          value={formData.holiday_name}
          onChange={handleChange}
          className="text-sm md:text-base bg-extra shadow-lg p-2 w-full rounded"
          required
        />
        <input
          type="text"
          name="type"
          placeholder="Type of Event"
          value={formData.type}
          onChange={handleChange}
          className="text-sm md:text-base bg-extra shadow-lg p-2 w-full rounded"
          required
        />
        <textarea
          name="meaning"
          placeholder="Meaning or Significance"
          value={formData.meaning || ""}
          onChange={handleChange}
          className="text-sm md:text-base bg-extra shadow-lg p-2 w-full rounded"
        />
        <textarea
          name="traditions"
          placeholder="Traditions or Customs"
          value={formData.traditions || ""}
          onChange={handleChange}
          className="text-sm md:text-base bg-extra shadow-lg p-2 w-full rounded"
        />
        <input
          type="url"
          name="photo"
          placeholder="Photo URL"
          value={formData.photo || ""}
          onChange={handleChange}
          className="text-sm md:text-base bg-extra shadow-lg p-2 w-full rounded"
        />
        <div className="bg-extra shadow-lg p-2 rounded">
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
            name="isAnnual"
            checked={formData.isAnnual || false}
            onChange={handleChange}
          />
          <span>Annual Event</span>
        </label>
        <select
          name="reference_system"
          value={formData.reference_system}
          onChange={handleChange}
          className="text-sm md:text-base bg-extra shadow-lg p-2 w-full rounded"
        >
          <option value="gregorian">Gregorian</option>
          <option value="egyptian">Ancient Egyptian</option>
          <option value="islamic">Islamic</option>
        </select>
        <select
          name="visibility"
          value={formData.visibility}
          onChange={handleChange}
          className="text-sm md:text-base bg-extra shadow-lg p-2 w-full rounded"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="bg-foreground text-background w-full md:w-1/3 cursor-pointer py-2 rounded hover:bg-primary  hover:text-white active:scale-90 transition"
        >
          {loading
            ? "Saving..."
            : initialData
            ? "Update Event"
            : "Add Event"}
        </button>
      </form>
    </div>
  );
}