"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Culture, Category } from "@/types/culture";
import { CalendarDate } from "@/types/calendar";
import CategoryHeader from "@/components/CategoryHeader";
import CalendarDateModal from "@/components/calendar/CalendarDateModal";
import SearchBar from "@/components/SearchBar";
import dayjs from "dayjs";

export default function CalendarEditPage() {
  const { culture } = useParams();
  const [cultureCurrent, setCultureCurrent] = useState<Culture | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [calendarEvents, setCalendarEvents] = useState<CalendarDate[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarDate[]>([]);
  const [editingEvent, setEditingEvent] = useState<CalendarDate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      const [catRes, eventsRes, cultureRes] = await Promise.all([
        api.get(`/categories/?key=calendar&code=${culture}`),
        api.get(`/calendar-dates/?code=${culture}`),
        api.get(`/cultures/?code=${culture}`),
      ]);

      const categoryData = catRes.data[0];
      setCategory(categoryData);
      setDisplayName(categoryData.display_name || "");
      setCultureCurrent(cultureRes.data);
      setCalendarEvents(eventsRes.data);
      setFilteredEvents(eventsRes.data); // Initialize filtered events
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
  };

  const handleSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setFilteredEvents(calendarEvents);
        return;
      }
      const lowerQuery = query.toLowerCase();
      const filtered = calendarEvents.filter((event) =>
        event.holiday_name.toLowerCase().includes(lowerQuery) ||
        event?.type?.toLowerCase().includes(lowerQuery)
      );
      setFilteredEvents(filtered);
    },
    [calendarEvents]
  );

  const handleEditEvent = (event: CalendarDate) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setEditingEvent(null);
    setShowModal(false);
    fetchData(); // Refresh events after modal close
  };

  if (loading) return <main className="p-4">Loading...</main>;

  return (
    <main className="flex flex-col max-w-3xl mx-auto p-6 space-y-8">
      <CategoryHeader
        displayName={displayName}
        setDisplayName={setDisplayName}
        onSave={handleSaveDisplayName}
      />
      <SearchBar onSearch={handleSearch} />
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Calendar Events</h2>
        {filteredEvents.length === 0 ? (
          <p className="text-gray-500">No events found.</p>
        ) : (
          <ul className="space-y-2">
            {filteredEvents.map((event) => (
              <li
                key={event.id}
                className="flex justify-between items-center p-2 border-b"
              >
                <div>
                  <span className="font-medium">{event.holiday_name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {dayjs(event.calendar_date).format("MMMM D, YYYY")} {event.isAnnual ? "(Annual)" : ""}
                  </span>
                </div>
                <button
                  onClick={() => handleEditEvent(event)}
                  className="text-blue-500 hover:underline"
                >
                  See More
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {showModal && (
        <CalendarDateModal
          selectedDate={dayjs(editingEvent?.calendar_date)}
          events={editingEvent ? [editingEvent] : []}
          culture={culture as string}
          onClose={handleModalClose}
        />
      )}
    </main>
  );
}