"use client";

import { UserHistoryEvent } from "@/types/history";
import ExpandableSummary from "../ExpandableSummary";
import { formatDateEstimate } from "@/utils/formatters/formatDateEstimate";

interface EventDisplayProps {
  event: UserHistoryEvent | null;
}

export default function HistoryEventDisplay({ event }: EventDisplayProps) {
  if (!event)
    return (
      <div className="w-full p-6 text-foreground/50">
        Click an event to view details.
      </div>
    );

  return (
    <div className="w-full p-4 md:p-6 bg-extra text-foreground shadow-xl rounded">
      {event.photo && (
        <div className="flex mb-2 md:mb-4 justify-start space-x-2 md:space-x-4 items-center">
          <img
            src={event.photo}
            className="object-cover h-24 w-24 md:h-36 md:w-36 border-foreground border-1 md:border-2 shadow-lg rounded-sm"
          />
          <div className="flex flex-col text-xs md:text-sm text-foreground/50 trun">
            <h3>{event.type}</h3>
            <h3>{formatDateEstimate(event.date)}</h3>
          </div>
        </div>
      )}
      <h2 className="font-garamond text-lg md:text-2xl text-main font-bold">
        {event.title}
      </h2>
      {!event.photo && (
        <div className="flex text-xs md:text-sm text-foreground/50 space-x-2">
          <h3>{event.type}</h3>
          <h3>{`(${formatDateEstimate(event.date)})`}</h3>
        </div>
      )}
      {event.summary && (
        <ExpandableSummary
          text={event.summary}
          maxHeight="max-h-36"
          blurBottom="bottom-6"
          extraBackground={true}
        />
      )}
      {event.notes && (
        <ExpandableSummary
          text={event.notes}
          maxHeight="max-h-36"
          blurBottom="bottom-6"
          extraBackground={true}
        />
      )}
    </div>
  );
}
