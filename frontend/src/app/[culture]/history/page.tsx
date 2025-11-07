"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import api from "@/lib/api";
import { formatYears } from "@/utils/formatters/formatYears";
import { SVGPath } from "@/utils/path";
import { Period } from "@/types/culture";
import { UserHistoryEvent } from "@/types/history";

import HistoryTimeline from "@/components/history/HistoryTimeline";
import HistoryEventDisplay from "@/components/history/HistoryEventDisplay";
import PeriodSelector from "@/components/PeriodSelector";
import SearchBar from "@/components/SearchBar";
import ExpandableSummary from "@/components/ExpandableSummary";

export default function HistoryPage() {
  const { culture } = useParams();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [userHistoryEvents, setUserHistoryEvents] = useState<
    UserHistoryEvent[]
  >([]);
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const [activeEvents, setActiveEvents] = useState<UserHistoryEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<UserHistoryEvent | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<UserHistoryEvent | null>(
    null
  );
  const [results, setResults] = useState<UserHistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults(activeEvents);
        return;
      }
      try {
        const userHistoryRest = await api.get(
          `/user-history-events/?code=${culture}&q=${encodeURIComponent(query)}`
        );
        setResults(userHistoryRest.data);
      } catch (error) {
        console.error("Error fetching search results:", error);
      }
    },
    [culture, activeEvents]
  );

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      const [periodRes, userHistoryRes] = await Promise.all([
        api.get(`/periods/?code=${culture}&key=history`),
        api.get(`/user-history-events/?code=${culture}`),
      ]);

      setPeriods(periodRes.data);
      setUserHistoryEvents(userHistoryRes.data);

      if (periodRes.data.length > 0) {
        const first = periodRes.data[0];
        setActivePeriod(first);
        setActiveEvents(
          userHistoryRes.data.filter(
            (e: UserHistoryEvent) => e.period?.title === first.title
          )
        );
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
  
  // Welcome screen if no periods exist
  if (!activePeriod)
    return (
      <main className="min-h-screen flex flex-col mt-4 w-full">
        <div className="flex w-full items-center relative">
          <SearchBar
            onSearch={(query) => handleSearch(query)}
            className="w-1/4"
          />

          <Link href={`/${culture}/history/new`} title="Add Composer">
            <svg
              viewBox={SVGPath.add.viewBox}
              className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
            >
              <path d={SVGPath.add.path} />
            </svg>
          </Link>

          <Link href={`/${culture}/history/edit`} title="Edit Periods">
            <svg
              viewBox={SVGPath.edit.viewBox}
              className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:fill-primary hover:scale-105 hover:opacity-80 active:scale-95 transition"
            >
              <path d={SVGPath.edit.path} />
            </svg>
          </Link>
        </div>
        <div className="mt-20 text-center">
          <h3 className="font-semibold">Welcome to the history section!</h3>
          <p className="text-sm mt-2 text-foreground/50">{`It looks like there aren't any periods created for this section yet, click the edit button to create periods to add any historical events you'd like to track.`}</p>
        </div>
      </main>
    );

  // Main page
  return (
    <main className="min-h-screen flex flex-col mt-4 w-full">
      <div className="flex w-full items-center relative">
        <SearchBar
          onSearch={(query) => handleSearch(query)}
          className="w-1/4"
        />

        <Link href={`/${culture}/history/new`} title="Add Event">
          <svg
            viewBox={SVGPath.add.viewBox}
            className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
          >
            <path d={SVGPath.add.path} />
          </svg>
        </Link>

        <Link href={`/${culture}/history/edit`} title="Edit">
          <svg
            viewBox={SVGPath.edit.viewBox}
            className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:fill-primary hover:scale-105 hover:opacity-80 active:scale-95 transition"
          >
            <path d={SVGPath.edit.path} />
          </svg>
        </Link>
      </div>

      <div className="flex flex-col space-y-2 mt-8">
        <h1 className="font-garamond text-main text-3xl md:text-5xl text-shadow-md">
          {activePeriod.title}
        </h1>
        <h3 className="font-garamond text-base md:text-xl">
          {activePeriod.start_year && activePeriod.end_year
            ? formatYears(activePeriod.start_year, activePeriod.end_year)
            : ""}
        </h3>
        {activePeriod.desc && (
          <ExpandableSummary
            text={activePeriod.desc}
            maxHeight="max-h-52 md:max-h-42"
            blurBottom="bottom-5"
          />
        )}

        <div className="w-full">
          <PeriodSelector
            periods={periods}
            activePeriod={activePeriod}
            onSelect={(period) => {
              setActivePeriod(period);
              setActiveEvents(
                userHistoryEvents.filter(
                  (e) => e.period?.title === period.title
                )
              );
              setActiveEvent(null);
            }}
          />
        </div>

        <div className="flex flex-col md:flex-row w-full items-start mt-8">
          <div className="w-full md:w-1/3">
            <HistoryTimeline
              events={
                results.length > 0
                  ? results.filter(
                      (r) => r.period?.title == activePeriod?.title
                    )
                  : activeEvents
              }
              onEventClick={(e) => setActiveEvent(e)}
              onEventHover={(e) => setHoveredEvent(e)}
            />
          </div>
          <div className="w-full md:w-2/3 md:ml-4">
            <HistoryEventDisplay event={hoveredEvent || activeEvent} />
          </div>
        </div>
      </div>
    </main>
  );
}
