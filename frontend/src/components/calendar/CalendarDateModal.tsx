"use client";

import { useState } from "react";
import CalendarDateForm from "./CalendarDateForm";
import { CalendarDate } from "@/types/calendar";
import dayjs from "dayjs";
import ReactMarkdown from "react-markdown";
import { SVGPath } from "@/utils/path";

interface CalendarDateModalProps {
  selectedDate: dayjs.Dayjs;
  events: CalendarDate[]; // Filtered events for this date
  culture: string;
  onClose: () => void;
}

export default function CalendarDateModal({
  selectedDate,
  events,
  culture,
  onClose,
}: CalendarDateModalProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarDate | undefined>(
    undefined
  );

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
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-background p-6 rounded-lg shadow-xl w-[90%] max-w-lg relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl font-bold text-foreground hover:text-main"
        >
          <svg
            viewBox={SVGPath.close.viewBox}
            className="size-5 fill-gray-400 transition hover:scale-105 active:scale-95 cursor-pointer"
          >
            <path d={SVGPath.close.path} />
          </svg>
        </button>
        <h2 className="text-xl font-lora font-semibold">
          {events[0].isAnnual ? selectedDate.format("MMMM D") : selectedDate.format("MMMM D, YYYY")}
        </h2>

        {showForm ? ( // Form view
          <CalendarDateForm
            cultureCode={culture}
            selectedDate={selectedDate.toDate()} // Convert to native Date
            initialData={editingEvent}
            onClose={handleFormClose} // Back to list
            onSaved={handleFormSaved} // Back to list after save
          />
        ) : (
          // List view
          <>
            {events.length === 0 ? (
              <p className="text-gray-500">No events for this day.</p>
            ) : (
              <ul className="">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="py-2 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-main font-garamond text-2xl font-bold flex space-x-2">
                        <span>{event.holiday_name}</span>
                        <button
                          onClick={() => handleEdit(event)}
                          className="text-sm "
                        >
                          <svg
                            viewBox={SVGPath.edit.viewBox}
                            className="size-4 fill-gray-400 transition hover:scale-105 active:scale-95 cursor-pointer"
                          >
                            <path d={SVGPath.edit.path} />
                          </svg>
                        </button>
                      </div>
                      {event.meaning && (
                        <div className="flex flex-col mt-2">
                          <span className="font-lora text-xl">Meaning:</span>
                          <div className="text-xs md:text-sm text-foreground/80">
                            <ReactMarkdown>{event.meaning}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                      {event.traditions && (
                        <div className="flex flex-col mt-2">
                          <span className="font-lora text-xl">Traditions:</span>
                          <div className="text-xs md:text-sm text-foreground/80">
                            <ReactMarkdown>{event.traditions}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={handleAddNew}
              className="mt-4 w-full md:w-1/2 bg-foreground border-2 border-foreground text-background py-2 px-4 rounded hover:bg-background hover:text-foreground hover:border-foreground transition duration-300 cursor-pointer"
            >
              Add New Event
            </button>
          </>
        )}
      </div>
    </div>
  );
}
