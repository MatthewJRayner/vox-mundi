"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

import api from "@/lib/api";
import { Culture, Category, PageContent, Period } from "@/types/culture";

import CategoryHeader from "@/components/CategoryHeader";
import PeriodList from "@/components/PeriodList";
import PeriodForm from "@/components/PeriodForm";

export default function LiteratureEditPage() {
  const { culture } = useParams();
  const [cultureCurrent, setCultureCurrent] = useState<Culture | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [pageContent, setPageContent] = useState<PageContent | null>(null);
  const [overviewText, setOverviewText] = useState("");
  const [periods, setPeriods] = useState<Period[]>([]);
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);

  const [periodForm, setPeriodForm] = useState({
    id: null as number | null,
    title: "",
    start_year: "",
    end_year: "",
    desc: "",
  });

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      const [catRes, contentRes, cultureRes, periodRes] =
        await Promise.all([
          api.get(`/categories/?key=literature&code=${culture}`),
          api.get(`/page-contents/?code=${culture}&key=literature`),
          api.get(`/cultures/?code=${culture}`),
          api.get(`/periods/?code=${culture}&key=literature`),
        ]);

      const categoryData = catRes.data[0];
      setCategory(categoryData);
      setDisplayName(categoryData?.display_name || "");
      setCultureCurrent(cultureRes.data[0]);
      setPeriods(periodRes.data);

      if (contentRes.data[0]) {
        setPageContent(contentRes.data[0]);
        setOverviewText(contentRes.data[0].overview_text || "");
      } else {
        setPageContent(null);
        setOverviewText("");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [culture]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveDisplayName = async () => {
    if (!category) return;
    try {
      await api.patch(`/categories/${category.id}/`, {
        display_name: displayName,
      });
      setCategory((prev) => prev && { ...prev, display_name: displayName });
    } catch (error) {
      console.error("Error updating display name:", error);
    }
  };

  const handleSaveOverviewText = async () => {
    if (!culture) return;
    try {
      if (pageContent) {
        await api.patch(`/page-contents/${pageContent.id}/`, {
          overview_text: overviewText,
        });
        setPageContent(
          (prev) => prev && { ...prev, overview_text: overviewText }
        );
      } else {
        const response = await api.post(`/page-contents/`, {
          culture_id: cultureCurrent?.id,
          category_id: category?.id,
          overview_text: overviewText,
          user: cultureCurrent?.user,
        });
        setPageContent(response.data);
      }
    } catch (error) {
      console.error("Error updating overview text:", error);
    }
  };

  const handleAddNewPeriod = () => {
    setPeriodForm({
      id: null,
      title: "",
      start_year: "",
      end_year: "",
      desc: "",
    });
    setActivePeriod(null);
  };

  const handleEditPeriod = (period: Period) => {
    setActivePeriod(period);
    setPeriodForm({
      id: period.id || 0,
      title: period.title,
      start_year: period.start_year?.toString() ?? "",
      end_year: period.end_year?.toString() ?? "",
      desc: period.desc || "",
    });
  };

  const handleSubmitPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...periodForm,
        start_year: periodForm.start_year
          ? Number(periodForm.start_year)
          : null,
        end_year: periodForm.end_year ? Number(periodForm.end_year) : null,
        culture_id: cultureCurrent?.id,
        category_id: category?.id,
      };

      if (periodForm.id) {
        const res = await api.patch(`/periods/${periodForm.id}/`, payload);
        setPeriods((prev) =>
          prev.map((p) => (p.id === res.data.id ? res.data : p))
        );
      } else {
        const res = await api.post(`/periods/`, {
          ...payload,
          culture_code: culture,
        });
        setPeriods((prev) => [...prev, res.data]);
      }

      setPeriodForm({
        id: null,
        title: "",
        start_year: "",
        end_year: "",
        desc: "",
      });
    } catch (error) {
      console.error("Error saving period:", error);
    }
  };

  if (loading) return <main className="p-4">Loading...</main>;

  return (
    <main className="flex flex-col max-w-3xl mx-auto p-2 md:p-6 space-y-8">
      <CategoryHeader
        displayName={displayName}
        setDisplayName={setDisplayName}
        onSave={handleSaveDisplayName}
      />
      <section className="flex flex-col space-y-4">
        <h2 className="text-2xl text-main font-garamond">Overview Text</h2>
        <textarea
          value={overviewText}
          onChange={(e) => setOverviewText(e.target.value)}
          className="w-full p-4 rounded-md bg-extra shadow-lg text-foreground text-sm md:text-base"
          rows={6}
          placeholder="Enter the overview for the cinematic history and style..."
        />
        <button
          onClick={handleSaveOverviewText}
          className="px-4 py-2 bg-foreground text-background rounded-md hover:bg-primary/80 hover:text-white active:scale-90 active:bg-primary/80 transition cursor-pointer"
        >
          Save Overview
        </button>
      </section>
      <PeriodList
        periods={periods}
        activePeriod={activePeriod}
        onAddNew={handleAddNewPeriod}
        onEdit={handleEditPeriod}
      />
      <PeriodForm
        periodForm={periodForm}
        setPeriodForm={setPeriodForm}
        onSubmit={handleSubmitPeriod}
      />
    </main>
  );
}
