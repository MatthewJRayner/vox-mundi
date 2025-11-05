"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import dayjs from "dayjs";

import { CalendarDate } from "@/types/calendar";
import { SVGPath } from "@/utils/path";

import CalendarDateForm from "./CalendarDateForm";

interface CalendarDateModalProps {
  selectedDate?: dayjs.Dayjs;
  events: CalendarDate[];
  culture: string;
  onClose: () => void;
}

/** 
 * Modal to display calendar date details and edit/add events buttons.
 * 
 * @param selectedDate - The date selected in the calendar
 * @param events - List of calendar events for the selected date
 * @param culture - Culture code for the calendar
 * @param onClose - Callback to close the modal
 * @example
 * <CalendarDateModal
 *  selectedDate={selectedDate}
 *  events={calendarDates.filter((e) =>
 *    dayjs(e.calendar_date).isSame(selectedDate, "day")
 *  )}
 *  onClose={handleModalClose}
 *  culture={culture?.toString() || ""}
 * />
*/

export default function CalendarDateModal({
  selectedDate,
  events,
  culture,
  onClose,
}: CalendarDateModalProps) {
  const [showForm, setShowForm] = useState(events.length === 0);
  const [editingEvent, setEditingEvent] = useState<CalendarDate | undefined>(
    events.length > 0 ? events[0] : undefined
  );
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  const handleAddNew = () => {
    setEditingEvent(undefined);
    setShowForm(true);
  };

  const handleEdit = (event: CalendarDate) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  const handleFormSaved = () => {
    setShowForm(false);
    onClose();
  };

  const nextEvent = () => {
    setCurrentEventIndex((prev) => (prev + 1) % events.length);
  };

  const prevEvent = () => {
    setCurrentEventIndex((prev) => (prev - 1 + events.length) % events.length);
  };

  if (!selectedDate) {
    console.warn("CalendarDateModal: no selectedDate provided, closing modal.");
    return null;
  }

  const currentEvent = events[currentEventIndex];

  return (
    <div
      className="fixed inset-0 bg-black/60 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-background p-6 rounded-lg shadow-xl w-[90%] max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl font-bold text-foreground "
        >
          <svg
            viewBox={SVGPath.close.viewBox}
            className="size-5 fill-foreground/50 hover:fill-main transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <path d={SVGPath.close.path} />
          </svg>
        </button>

        {showForm ? (
          <CalendarDateForm
            cultureCode={culture}
            initialDate={selectedDate.toDate()}
            initialData={editingEvent}
            onClose={handleFormClose}
            onSaved={handleFormSaved}
          />
        ) : (
          <>
            <h2 className="text-xl font-lora font-semibold">
              {events && events[0]?.isAnnual
                ? selectedDate.format("MMMM D")
                : selectedDate.format("MMMM D, YYYY")}
            </h2>

            {events.length === 0 ? (
              <p className="text-gray-500 mt-2">No events for this day.</p>
            ) : (
              <div className="mt-3">
                {/* Event navigation header */}
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={prevEvent}
                    disabled={events.length <= 1}
                    className={`p-2 rounded-full transition-all duration-300 ${
                      events.length <= 1
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-extra cursor-pointer hover:scale-105 active:scale-95"
                    }`}
                    aria-label="Previous event"
                  >
                    <svg
                      viewBox={SVGPath.chevron.viewBox}
                      className="size-5 fill-gray-400 rotate-90"
                    >
                      <path d={SVGPath.chevron.path} />
                    </svg>
                  </button>

                  <div className="text-center flex flex-col mx-4">
                    <div className="text-main font-garamond text-2xl font-bold">
                      {currentEvent.holiday_name}
                    </div>
                    {events.length > 1 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Event {currentEventIndex + 1} of {events.length}
                      </div>
                    )}
                    {currentEvent.type && (
                      <div className="flex flex-col">
                        <div className="text-xs md:text-sm text-foreground/80">
                          {currentEvent.type}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={nextEvent}
                    disabled={events.length <= 1}
                    className={`p-2 rounded-full transition-all duration-300 ${
                      events.length <= 1
                        ? "opacity-30 cursor-not-allowed"
                        : "hover:bg-extra cursor-pointer hover:scale-105 active:scale-95"
                    }`}
                    aria-label="Next event"
                  >
                    <svg
                      viewBox={SVGPath.chevron.viewBox}
                      className="size-5 fill-gray-400 rotate-270"
                    >
                      <path d={SVGPath.chevron.path} />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {currentEvent.meaning && (
                    <div className="flex flex-col">
                      <span className="font-lora text-xl">Meaning:</span>
                      <div className="text-xs md:text-sm text-foreground/80">
                        <ReactMarkdown>{currentEvent.meaning}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {currentEvent.traditions && (
                    <div className="flex flex-col">
                      <span className="font-lora text-xl">Traditions:</span>
                      <div className="text-xs md:text-sm text-foreground/80">
                        <ReactMarkdown>{currentEvent.traditions}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => handleEdit(currentEvent)}
                    className="flex items-center space-x-2 text-sm text-foreground/50 cursor-pointer hover:scale-105 active:scale-95 transition-colors duration-300"
                    title="Edit event"
                  >
                    <svg
                      viewBox={SVGPath.edit.viewBox}
                      className="size-4 fill-current"
                    >
                      <path d={SVGPath.edit.path} />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAddNew}
              className="mt-6 w-full bg-foreground text-background py-2 px-4 rounded hover:bg-primary hover:text-white active:scale-90 transition duration-300 cursor-pointer"
            >
              Add New Event
            </button>
          </>
        )}
      </div>
    </div>
  );
}
