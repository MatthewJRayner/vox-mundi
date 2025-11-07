"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import api from "@/lib/api";
import { UserHistoryEvent } from "@/types/history";

import HistoryEventForm from "@/components/history/HistoryEventForm";

export default function EditHistoryEventPage() {
  const { culture, id } = useParams();
  const router = useRouter();
  const [historyEvent, setHistoryEvent] = useState<
    UserHistoryEvent | undefined
  >(undefined);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const historyRes = await api.get(`/user-history-events/${id}`);
      setHistoryEvent(historyRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="">
      <h1 className=""></h1>
      {historyEvent && (
        <HistoryEventForm
          currentCultureCode={culture}
          onSuccess={() => router.push(`/${culture}/history`)}
          initialData={historyEvent}
        />
      )}
    </div>
  );
}
