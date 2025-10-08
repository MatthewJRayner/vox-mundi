"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";

interface Category {
  id: number;
  key: string;
  display_name: string;
}

interface PeriodFormData {
  id?: number;
  title: string;
  start_year: string;
  end_year: string;
  short_intro?: string;
  desc?: string;
  category_id?: number;
}

interface ApiResponse<T> {
  data: T;
}

export default function PeriodForm({ period }: { period?: PeriodFormData }) {
  const router = useRouter();
  const params = useParams();
  const culture = Array.isArray(params?.culture) ? params.culture[0] : params?.culture;

  const [data, setData] = useState<PeriodFormData>(
    period
      ? {
          ...period,
          start_year: period.start_year.toString(),
          end_year: period.end_year.toString(),
          short_intro: period.short_intro || "",
          desc: period.desc || "",
        }
      : {
          title: "",
          start_year: "",
          end_year: "",
          short_intro: "",
          desc: "",
          category_id: undefined,
        }
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!culture) {
      setError("Invalid culture parameter.");
      setLoading(false);
      return;
    }

    const fetchCategories = async () => {
      try {
        const res = await api.get<ApiResponse<Category[]>>(`/categories/?code=${culture}`);
        if (Array.isArray(res.data)) {
          setCategories(res.data);
        } else {
          throw new Error("Invalid categories response");
        }
      } catch (err: unknown) {
        console.error("Error fetching categories:", err);
        setError("Failed to load categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [culture]);

  const isFormValid = () => {
    return (
      data.title.trim() !== "" &&
      data.start_year !== "" &&
      data.end_year !== "" &&
      !isNaN(Number(data.start_year)) &&
      !isNaN(Number(data.end_year)) &&
      Number(data.start_year) <= Number(data.end_year) &&
      data.category_id !== undefined
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        ...data,
        start_year: data.start_year ? Number(data.start_year) : undefined,
        end_year: data.end_year ? Number(data.end_year) : undefined,
        short_intro: data.short_intro || undefined,
        desc: data.desc || undefined,
        culture_code: culture,
      };

      if (period) {
        await api.put(`/periods/${period.id}/`, payload);
      } else {
        await api.post(`/periods/`, payload);
      }
      router.push(`/${culture}`);
    } catch (err: unknown) {
      console.error("Error saving period:", err);
      const errorMessage =
        err instanceof Error && "response" in err
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? (err as any).response?.data?.message || "There was an error saving your period."
          : "There was an error saving your period.";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (loading) return <p>Loading...</p>;

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md mx-auto mt-8">
      <h2 className="text-xl font-semibold">
        {period ? "Edit Period" : "Create New Period"}
      </h2>
      {error && <p className="text-red-500">{error}</p>}

      <div>
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          placeholder="Title"
          value={data.title}
          onChange={(e) => setData({ ...data, title: e.target.value })}
          className="p-2 border rounded w-full"
          required
          aria-invalid={error ? "true" : "false"}
        />
      </div>

      <div className="flex gap-2">
        <div className="w-1/2">
          <label htmlFor="start_year" className="block text-sm font-medium">
            Start Year
          </label>
          <input
            id="start_year"
            type="number"
            placeholder="Start Year"
            value={data.start_year}
            onChange={(e) => setData({ ...data, start_year: e.target.value })}
            className="p-2 border rounded w-full"
            required
            aria-invalid={error ? "true" : "false"}
          />
        </div>
        <div className="w-1/2">
          <label htmlFor="end_year" className="block text-sm font-medium">
            End Year
          </label>
          <input
            id="end_year"
            type="number"
            placeholder="End Year"
            value={data.end_year}
            onChange={(e) => setData({ ...data, end_year: e.target.value })}
            className="p-2 border rounded w-full"
            required
            aria-invalid={error ? "true" : "false"}
          />
        </div>
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium">
          Category
        </label>
        <select
          id="category"
          value={data.category_id ?? ""}
          onChange={(e) =>
            setData({ ...data, category_id: e.target.value ? parseInt(e.target.value) : undefined })
          }
          className="p-2 border rounded w-full"
          required
          aria-invalid={error ? "true" : "false"}
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.display_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="short_intro" className="block text-sm font-medium">
          Short Introduction
        </label>
        <textarea
          id="short_intro"
          placeholder="Short Intro"
          value={data.short_intro}
          onChange={(e) => setData({ ...data, short_intro: e.target.value })}
          className="p-2 border rounded w-full"
          rows={2}
        />
      </div>

      <div>
        <label htmlFor="desc" className="block text-sm font-medium">
          Description
        </label>
        <textarea
          id="desc"
          placeholder="Description"
          value={data.desc}
          onChange={(e) => setData({ ...data, desc: e.target.value })}
          className="p-2 border rounded w-full"
          rows={4}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!isFormValid() || submitting}
          className={`px-4 py-2 rounded text-white ${
            isFormValid() && !submitting ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          {submitting ? "Saving..." : period ? "Save Changes" : "Create Period"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/${culture}`)}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}