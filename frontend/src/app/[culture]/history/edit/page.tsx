"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Culture, Period, Category } from "@/types/culture";
import { UserHistoryEvent } from "@/types/history";
import CategoryHeader from "@/components/CategoryHeader";
import PeriodList from "@/components/PeriodList";
import PeriodForm from "@/components/PeriodForm";
import HistoryEventsSection from "@/components/history/HistoryEventsSection";

export default function HistoryEditPage() {
  const { culture } = useParams();
  const [cultureCurrent, setCultureCurrent] = useState<Culture | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [periods, setPeriods] = useState<Period[]>([]);
  const [userHistoryEvents, setUserHistoryEvents] = useState<UserHistoryEvent[]>([]);
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
      const [catRes, periodRes, userHistoryRes, cultureRes] = await Promise.all([
        api.get(`/categories/?key=history&code=${culture}`),
        api.get(`/periods/?code=${culture}`),
        api.get(`/user-history-events/?code=${culture}`),
        api.get(`/cultures/?code=${culture}`),
      ]);

      const categoryData = catRes.data[0];
      setCategory(categoryData);
      setDisplayName(categoryData.display_name || "");
      setCultureCurrent(cultureRes.data);
      setPeriods(periodRes.data);
      setUserHistoryEvents(userHistoryRes.data);
      if (periodRes.data.length > 0) setActivePeriod(periodRes.data[0]);
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
      await api.patch(`/categories/${category.id}/`, { display_name: displayName });
      setCategory((prev) => prev && { ...prev, display_name: displayName });
    } catch (error) {
      console.error("Error updating display name:", error);
    }

    window.location.reload();
  };

  const handleAddNewPeriod = () => {
    setPeriodForm({ id: null, title: "", start_year: "", end_year: "", desc: "" });
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
        start_year: periodForm.start_year ? Number(periodForm.start_year) : null,
        end_year: periodForm.end_year ? Number(periodForm.end_year) : null,
        culture_id: cultureCurrent?.id,
        category_id: category?.id,
      };

      if (periodForm.id) {
        const res = await api.patch(`/periods/${periodForm.id}/`, payload);
        setPeriods((prev) => prev.map((p) => (p.id === res.data.id ? res.data : p)));
      } else {
        const res = await api.post(`/periods/`, { ...payload, culture_code: culture });
        setPeriods((prev) => [...prev, res.data]);
      }

      setPeriodForm({ id: null, title: "", start_year: "", end_year: "", desc: "" });
    } catch (error) {
      console.error("Error saving period:", error);
    }
  };

  const groupedEvents = userHistoryEvents.reduce((acc, event) => {
    const periodName = event.period?.title || "No Period";
    if (!acc[periodName]) acc[periodName] = [];
    acc[periodName].push(event);
    return acc;
  }, {} as Record<string, UserHistoryEvent[]>);

  if (loading) return <main className="p-4">Loading...</main>;

  return (
    <main className="flex flex-col max-w-3xl mx-auto p-6 space-y-8">
      <CategoryHeader
        displayName={displayName}
        setDisplayName={setDisplayName}
        onSave={handleSaveDisplayName}
      />
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
      <HistoryEventsSection groupedEvents={groupedEvents} culture={culture as string} />
    </main>
  );
}
