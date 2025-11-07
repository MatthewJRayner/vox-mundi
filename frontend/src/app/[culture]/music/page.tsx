"use client";
import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import api from "@/lib/api";
import { SVGPath } from "@/utils/path";
import { formatYears } from "@/utils/formatters/formatYears";
import { Period } from "@/types/culture";
import { UserMusicComposer } from "@/types/media/music";

import MusicTimeline from "@/components/music/MusicTimeline";
import ComposerDisplay from "@/components/music/ComposerDisplay";
import PeriodSelector from "@/components/PeriodSelector";
import SearchBar from "@/components/SearchBar";
import ExpandableSummary from "@/components/ExpandableSummary";

export default function MusicPage() {
  const { culture } = useParams();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [userMusicComposers, setUserMusicComposers] = useState<
    UserMusicComposer[]
  >([]);
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const [activeEvents, setActiveEvents] = useState<UserMusicComposer[]>([]);
  const [activeEvent, setActiveEvent] = useState<UserMusicComposer | null>(
    null
  );
  const [hoveredEvent, setHoveredEvent] = useState<UserMusicComposer | null>(
    null
  );
  const [results, setResults] = useState<UserMusicComposer[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults(activeEvents);
        return;
      }
      try {
        const userComposersRes = await api.get(
          `/user-composers/?code=${culture}&q=${encodeURIComponent(query)}`
        );
        setResults(userComposersRes.data);
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
      const [periodRes, userComposersRes] = await Promise.all([
        api.get(`/periods/?code=${culture}&key=music`),
        api.get(`/user-composers/?code=${culture}`),
      ]);

      setPeriods(periodRes.data);
      setUserMusicComposers(userComposersRes.data);

      if (periodRes.data.length > 0) {
        const first = periodRes.data[0];
        setActivePeriod(first);
        setActiveEvents(
          userComposersRes.data.filter(
            (e: UserMusicComposer) => e.period?.title === first.title
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

  // Welcome screen when no periods exist
  if (!activePeriod)
    return (
      <main className="min-h-screen flex flex-col mt-4 w-full">
        <div className="flex w-full items-center relative">
          <SearchBar
            onSearch={(query) => handleSearch(query)}
            className="w-1/4"
          />

          <Link href={`/${culture}/music/new`} title="Add Composer">
            <svg
              viewBox={SVGPath.add.viewBox}
              className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
            >
              <path d={SVGPath.add.path} />
            </svg>
          </Link>

          <Link href={`/${culture}/music/edit`} title="Edit Periods">
            <svg
              viewBox={SVGPath.edit.viewBox}
              className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:fill-primary hover:scale-105 hover:opacity-80 active:scale-95 transition"
            >
              <path d={SVGPath.edit.path} />
            </svg>
          </Link>
        </div>
        <div className="w-full gap-2 mt-4 flex flex-col md:flex-row md:max-h-[100px] justify-center mb-8 md:mb-0">
          <Link
            href={`/${culture}/music/composer-search/`}
            aria-label="Composer Search"
            className={`font-bold flex space-x-1 rounded-lg items-center justify-center py-2 w-full border-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95`}
          >
            <svg
              viewBox={SVGPath.search.viewBox}
              className={`size-6 transition hover:scale-105 active:scale-95 fill-foreground`}
            >
              <path d={SVGPath.search.path} />
            </svg>
            <span className={`text-sm ml-1`}>Composer Search</span>
          </Link>
          <Link
            href={`/${culture}/music/sheet/`}
            aria-label="Sheet Music"
            className={`font-bold flex space-x-1 rounded-lg items-center justify-center py-2 w-full border-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95`}
          >
            <svg
              viewBox={SVGPath.guitar.viewBox}
              className={`size-6 transition hover:scale-105 active:scale-95 fill-foreground`}
            >
              <path d={SVGPath.guitar.path} />
            </svg>
            <span className={`text-sm ml-1`}>Sheet Music</span>
          </Link>
          <Link
            href={`/${culture}/music/artists/`}
            aria-label="Favourite Artists"
            className={`font-bold flex space-x-1 rounded-lg items-center justify-center py-2 w-full border-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95`}
          >
            <svg
              viewBox={SVGPath.music.viewBox}
              className={`size-6 transition hover:scale-105 active:scale-95 fill-foreground`}
            >
              <path d={SVGPath.music.path} />
            </svg>
            <span className={`text-sm ml-1`}>Favourite Artists</span>
          </Link>
        </div>
        <div className="mt-20 text-center">
          <h3 className="font-semibold">Welcome to the music section!</h3>
          <p className="text-sm mt-2 text-foreground/50">{`It looks like there aren't any periods created for this section yet, click the + button up top to create any periods to add your favourite composers, or feel free to use the buttons on top for the other features of the music section.`}</p>
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

        <Link href={`/${culture}/music/new`} title="Add Event">
          <svg
            viewBox={SVGPath.add.viewBox}
            className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
          >
            <path d={SVGPath.add.path} />
          </svg>
        </Link>

        <Link href={`/${culture}/music/edit`} title="Edit">
          <svg
            viewBox={SVGPath.edit.viewBox}
            className="size-4 md:size-5 fill-current text-foreground ml-4 cursor-pointer hover:fill-primary hover:scale-105 hover:opacity-80 active:scale-95 transition"
          >
            <path d={SVGPath.edit.path} />
          </svg>
        </Link>
      </div>

      <div className="flex flex-col space-y-2 mt-8">
        <div className="flex flex-col md:flex-row w-full md:space-x-2">
          <div className="flex-col space-y-2 w-full md:w-3/4">
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
                maxHeight="max-h-42"
                blurBottom="bottom-6"
              />
            )}
          </div>
          <div className="w-full md:w-1/4 flex flex-col space-y-2 justify-center mb-8 md:mb-0">
            <Link
              href={`/${culture}/music/composer-search/`}
              aria-label="Composer Search"
              className={`font-bold flex space-x-1 rounded-lg items-center justify-center py-2 w-full border-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95`}
            >
              <svg
                viewBox={SVGPath.search.viewBox}
                className={`size-6 transition hover:scale-105 active:scale-95 fill-foreground`}
              >
                <path d={SVGPath.search.path} />
              </svg>
              <span className={`text-sm ml-1`}>Composer Search</span>
            </Link>
            <Link
              href={`/${culture}/music/sheet/`}
              aria-label="Sheet Music"
              className={`font-bold flex space-x-1 rounded-lg items-center justify-center py-2 w-full border-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95`}
            >
              <svg
                viewBox={SVGPath.guitar.viewBox}
                className={`size-6 transition hover:scale-105 active:scale-95 fill-foreground`}
              >
                <path d={SVGPath.guitar.path} />
              </svg>
              <span className={`text-sm ml-1`}>Sheet Music</span>
            </Link>
            <Link
              href={`/${culture}/music/artists/`}
              aria-label="Toggle Readlist"
              className={`font-bold flex space-x-1 rounded-lg items-center justify-center py-2 w-full border-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95`}
            >
              <svg
                viewBox={SVGPath.music.viewBox}
                className={`size-6 transition hover:scale-105 active:scale-95 fill-foreground`}
              >
                <path d={SVGPath.music.path} />
              </svg>
              <span className={`text-sm ml-1`}>Favourite Artists</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full">
        <PeriodSelector
          periods={periods}
          activePeriod={activePeriod}
          onSelect={(period) => {
            setActivePeriod(period);
            setActiveEvents(
              userMusicComposers.filter((e) => e.period?.title === period.title)
            );
            setActiveEvent(null);
          }}
        />

        <div className="flex flex-col md:flex-row w-full items-start mt-8">
          <div className="w-full md:w-1/3">
            <MusicTimeline
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
          <div className="w-full">
            <ComposerDisplay event={hoveredEvent || activeEvent} />
          </div>
        </div>
      </div>
    </main>
  );
}
