"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Period, Category } from "@/types/culture";
import { UserHistoryEvent } from "@/types/history";
import { SVGPath } from "@/utils/path";
import HistoryTimeline from "@/components/history/HistoryTimeline";
import HistoryEventModal from "@/components/history/HistoryEventModal";
import PeriodSelector from "@/components/PeriodSelector";
import SearchBar from "@/components/SearchBar";
import { formatYears } from "@/utils/formatters/formatYears";
import ReactMarkdown from "react-markdown";
import { formatDateEstimate } from "@/utils/formatters/formatDateEstimate";

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
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
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
    } finally {
    }
  }, [culture, activeEvents]);

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      const [periodRes, userHistoryRes] = await Promise.all([
        api.get(`/periods/?code=${culture}`),
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
  if (!activePeriod)
    return <main className="p-4">No periods yet for this culture.</main>;

  return (
    <main className="min-h-screen flex flex-col mt-4 w-full">
      <div className="flex w-full items-center relative">
        <SearchBar
          onSearch={(query) => handleSearch(query)}
          className="w-1/4"
        />

        <Link href={`/${culture}/history/new`}>
          <svg
            viewBox={SVGPath.add.viewBox}
            className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
          >
            <path d={SVGPath.add.path} />
          </svg>
        </Link>

        <Link href={`/${culture}/history/edit`}>
          <svg
            viewBox={SVGPath.edit.viewBox}
            className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
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
          <div className="mb-8 relative">
            <div
              className={`text-md/[1.75] sm:text-base/[1.75] leading-relaxed font-serif font-medium transition-all duration-300 ${
                showFullDesc
                  ? "max-h-none"
                  : "max-h-42 overflow-hidden"
              }`}
            >
              <ReactMarkdown>{activePeriod.desc}</ReactMarkdown>
            </div>
            {!showFullDesc && activePeriod.desc.length > 300 && (
              <div className="absolute bottom-6 left-0 w-full h-10 sm:h-12 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />
            )}
            {activePeriod.desc.length > 300 && (
              <button
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="mt-1 cursor-pointer z-10 flex items-center font-lora sm:text-base"
              >
                <span className="mr-1 font-bold transition hover:text-main">
                  {showFullDesc ? "Show Less" : "Show More"}
                </span>
                <span
                  className={`transition-transform duration-300 ${
                    showFullDesc ? "rotate-180" : "rotate-0"
                  }`}
                >
                  <svg
                    viewBox={SVGPath.chevron.viewBox}
                    className="size-5 fill-current cursor-pointer transition-transform"
                  >
                    <path d={SVGPath.chevron.path} />
                  </svg>
                </span>
              </button>
            )}
          </div>
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

        <div className="flex md:flex-col w-full items-center">
          <HistoryTimeline
            events={results.length > 0 ? results.filter((r) => r.period?.title == activePeriod?.title) : activeEvents}
            onEventClick={(e) => {
              setActiveEvent(e);
              setShowModal(true);
            }}
            onEventHover={(e) => setHoveredEvent(e)}
          />

          <div className="w-full text-center font-garamond text-lg md:text-[24px] mt-4 ">
            {activeEvents.length ? "" : "No events added for this period."}
            {`${hoveredEvent?.title || activeEvent?.title || ``} ${
              hoveredEvent || activeEvent
                ? `(${formatDateEstimate(
                    hoveredEvent?.date || activeEvent?.date
                  )})`
                : ""
            }`}
          </div>

          {showModal && (
            <HistoryEventModal
              event={activeEvent}
              onClose={() => setShowModal(false)}
            />
          )}
        </div>
      </div>
    </main>
  );
}
