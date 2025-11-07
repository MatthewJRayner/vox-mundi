/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";

import { SVGPath } from "@/utils/path";
import { formatDateEstimate } from "@/utils/formatters/formatDateEstimate";
import { MapPin } from "@/types/map";

import MapPinFormModal from "@/components/cultures/MapPinForm";
import ExpandableSummary from "../ExpandableSummary";

type MapPinDetailModalProps = {
  pin: MapPin;
  cultureCode: string;
  onClose: () => void;
  onSuccess: () => void;
};

export default function MapPinDetailModal({
  pin,
  cultureCode,
  onClose,
  onSuccess,
}: MapPinDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <MapPinFormModal
        initialData={pin}
        cultureCode={cultureCode}
        onClose={() => setIsEditing(false)}
        onSuccess={() => {
          onSuccess();
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-extra w-full max-w-lg rounded-lg shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-black text-xl font-bold cursor-pointer"
        >
          <svg
            viewBox={SVGPath.close.viewBox}
            className="size-4 fill-current text-foreground cursor-pointer hover:scale-110 hover:fill-red-400 active:scale-95 transition"
          >
            <path d={SVGPath.close.path} />
          </svg>
        </button>

        <div className="w-full flex items-center gap-4 mb-1">
          {pin.photo && (
            <div className="">
              <img
                src={pin.photo}
                alt={pin.title || "Pin Photo"}
                className="object-center h-24 w-24 md:h-48 md:w-48 border-foreground border-1 md:border-2 shadow-lg rounded-sm"
              />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-2xl font-garamond">
              {pin.title || "Untitled Pin"}
            </h1>
            {pin.date && (
              <div className="text-sm text-foreground/50">
                {formatDateEstimate(pin.date)}
              </div>
            )}
            {pin.location && (
              <div className="text-sm text-foreground/50">{pin.location}</div>
            )}
          </div>
        </div>

        <div className="w-full mb-4">
          <span className="text-foreground/50 text-xs">
            {pin.filter?.toUpperCase()}
          </span>
          {pin.type && (
            <span className="text-foreground/50 text-xs ml-1">
              • {pin.type}
            </span>
          )}
          {pin.period && (
            <span className="text-main text-xs ml-4">{pin.period.title}</span>
          )}
        </div>

        <div className="space-y-3 text-sm">
          {pin.happened && (
            <>
              <h3 className="font-semibold text-xs md:text-sm">
                Description:{" "}
              </h3>
              <ExpandableSummary
                text={pin.happened}
                maxHeight="max-h-28"
                blurBottom="bottom-6"
                extraBackground={true}
              />
            </>
          )}

          {pin.significance && (
            <>
              <h3>Significance: </h3>
              <ExpandableSummary
                text={pin.significance}
                maxHeight="max-h-28"
                blurBottom="bottom-6"
                extraBackground={true}
              />
            </>
          )}
        </div>

        <div className="flex justify-end mt-6 gap-3 items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-foreground text-background rounded hover:bg-red-400 hover:text-white cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 cursor-pointer"
          >
            Edit
          </button>
          {pin.external_link && (
            <a
              href={pin.external_link}
              title="External Link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                viewBox={SVGPath.link.viewBox}
                className="size-5 fill-current text-foreground cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
              >
                <path d={SVGPath.link.path} />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
