"use client";

import { UserMusicComposer } from "@/types/media/music";
import ExpandableSummary from "../ExpandableSummary";

interface ComposerDisplayProps {
  event: UserMusicComposer | null;
}

export default function ComposerDisplay({ event }: ComposerDisplayProps) {
  if (!event)
    return (
      <div className="w-full p-6 text-foreground/50">
        Click a composer to view details.
      </div>
    );

  const formatLifespan = (birth_year?: number, death_year?: number) => {
    if (!birth_year) return "Unknown dates";
    return death_year ? `${birth_year} - ${death_year}` : `${birth_year} - ?`;
  };

  return (
    <div className="w-full p-4 md:p-6 bg-extra text-foreground shadow-xl rounded flex flex-col max-h-full">
      <div className="w-full h-1/2 flex">
        <div className="w-1/2 flex flex-col justify-start">
          <div>
            <h2 className="font-garamond text-lg md:text-4xl text-main font-bold">
              {event.name}
              {event.alt_name && (
                <span className="text-base md:text-lg font-normal">
                  {" "}
                  ({event.alt_name})
                </span>
              )}
            </h2>
          </div>
          <div>
            <h3 className="text-foreground/50 mt-1 text-xs md:text-sm">{`${formatLifespan(
              event.birth_year,
              event.death_year
            )}`}</h3>
          </div>
          <div>
            {event.occupations && event.occupations.length > 0 && (
              <p className="text-foreground/50 mt-1 text-xs md:text-sm">
                {event.occupations.join(", ")}
              </p>
            )}
          </div>
          {event.famous && event.famous.length > 0 && (
            <div className="text-xs md:text-sm mt-2">
              <h3 className="font-bold mt-2">Famous Works:</h3>
              <p className="italic">{event.famous.join(", ")}</p>
            </div>
          )}
        </div>
        {event.photo && (
          <div className="w-1/2 flex mb-2 md:mb-4 justify-end space-x-2 md:space-x-4 items-center">
            <div className="flex flex-col text-xs md:text-sm text-foreground/50 truncate"></div>
            <img
              src={event.photo}
              className="object-center h-24 w-24 md:h-48 md:w-48 border-foreground border-1 md:border-2 shadow-lg rounded-sm"
            />
          </div>
        )}
        {!event.photo && (
          <div className="flex text-xs md:text-sm text-foreground/50 space-x-2">
            <h3>{event.period?.title || "Unknown period"}</h3>
            <h3>{`(${formatLifespan(event.birth_year, event.death_year)})`}</h3>
          </div>
        )}
      </div>
      <div className="w-full flex flex-col space-y-2 mt-2 md:mt-4">
        {event.summary && (
          <ExpandableSummary
            text={event.summary}
            maxHeight="max-h-36"
            blurBottom="bottom-6"
            extraBackground={true}
          />
        )}
        {event.instruments && event.instruments.length > 0 && (
          <div className="text-sm md:text-base">
            <h3 className="font-bold mb-1 mt-2">Instruments:</h3>
            <p>{event.instruments.join(", ")}</p>
          </div>
        )}
        {event.themes && event.themes.length > 0 && (
          <div className="text-sm md:text-base">
            <h3 className="font-bold mb-1 mt-2">Themes:</h3>
            <p>{event.themes.join(", ")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
