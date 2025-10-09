"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Period } from "@/types/culture";
import { HistoryEvent, UserHistoryEvent } from "@/types/history";

export default function HistoryPage() {
  const { culture } = useParams();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [historyEvents, setHistoryEvents] = useState<HistoryEvent[]>([]);
  const [userHistoryEvents, setUserHistoryEvents] = useState<
    UserHistoryEvent[]
  >([]);
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      const [periodRes, historyRes, userHistoryRes] = await Promise.all([
        api.get(`/periods/?code=${culture}`),
        api.get(`/history-events/?code=${culture}`),
        api.get(`/user-history-events/?code=${culture}`),
      ]);

      setPeriods(periodRes.data);
      setHistoryEvents(historyRes.data);
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

  if (!activePeriod)
    return <main className="p-4">No periods yet for this culture.</main>;

  return (
    <main className="min-h-screen p-4 w-full">
      <h1 className="font-garamond text-3xl mb-4">History Page {activePeriod?.title}</h1>
      <ul className="flex space-x-2 mb-4">
        {periods.map((period) => (
          <li key={period.id}>{period?.title}</li>
        ))}
      </ul>
      {activePeriod ? (
        <div>
          <h2 className="font-lora text-xl">{activePeriod.title}</h2>
          <p>{activePeriod.desc}</p>
        </div>
      ) : (
        <p>No periods yet for this culture.</p>
      )}
    </main>
  );
}
