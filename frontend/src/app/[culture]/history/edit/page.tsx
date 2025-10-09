"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Period, Category } from "@/types/culture";
import { UserHistoryEvent } from "@/types/history";
import { SVGPath } from "@/utils/path";

export default function HistoryPage() {
  const { culture } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [userHistoryEvents, setUserHistoryEvents] = useState<
    UserHistoryEvent[]
  >([]);
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      const [CatRes, periodRes, userHistoryRes] = await Promise.all([
        api.get(`/categories/?key=history&code=${culture}`),
        api.get(`/periods/?code=${culture}`),
        api.get(`/user-history-events/?code=${culture}`),
      ]);

      setCategory(CatRes.data[0]);
      setPeriods(periodRes.data);
      setUserHistoryEvents(userHistoryRes.data);

      if (periodRes.data.length > 0) {
        setActivePeriod(periodRes.data[0]);
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

  if (loading) return <main className="p-4">Loading...</main>;

  return (
    <div className="p-4 text-red-400">
      <span>{category?.display_name}</span>
    </div>
  );
}