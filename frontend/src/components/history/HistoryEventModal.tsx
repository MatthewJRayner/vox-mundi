"use client";

import { UserHistoryEvent } from "@/types/history";
import ReactMarkdown from "react-markdown";
import { formatDateEstimate } from "@/utils/formatters/formatDateEstimate";

interface EventModalProps {
  event: UserHistoryEvent | null;
  onClose: () => void;
}

export default function HistoryEventModal({ event, onClose }: EventModalProps) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 backdrop-blur-md">
      <div className="bg-background text-foreground p-6 shadow-xl max-w-lg w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-2xl font-bold cursor-pointer hover:text-main"
        >
          ×
        </button>
        {event.photo && (
          <div className="flex mb-2 justify-start space-x-4 items-center">
            <img
              src={event?.photo}
              className="object-cover h-36 w-36 border-foreground border-2 shadow-lg rounded-sm"
            />
            <div className="flex flex-col text-foreground/50">
              <h3>{event.type}</h3>
              <h3>{formatDateEstimate(event.date)}</h3>
            </div>
          </div>
        )}
        <h2 className="font-garamond text-3xl text-main font-bold">
          {event.title}
        </h2>
        {!event.photo && (
          <div className="flex text-foreground/50 space-x-2">
            <h3>{event.type}</h3>
            <h3>{`(${formatDateEstimate(event.date)})`}</h3>
          </div>
        )}
        {event.summary && (
          <>
            <h3 className="text-xl font-bold mb-1 mt-2">Summary:</h3>
            <ReactMarkdown>{event.summary}</ReactMarkdown>
          </>
        )}
        {event.notes && (
          <div className="mt-3 text-sm text-muted-foreground">
            <h3 className="text-xl font-bold mb-1">Notes:</h3>
            <ReactMarkdown>{event.summary}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
