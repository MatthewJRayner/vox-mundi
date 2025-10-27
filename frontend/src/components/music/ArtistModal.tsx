"use client";

import React from "react";
import { UserMusicArtist } from "@/types/media/music";
import ExpandableSummary from "../ExpandableSummary";
import { SVGPath } from "@/utils/path";

interface ArtistModalProps {
  artist: UserMusicArtist;
  onClose: () => void;
  onEdit: () => void;
}

const ArtistModal: React.FC<ArtistModalProps> = ({
  artist,
  onClose,
  onEdit,
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-2 md:p-4">
      <div className="relative bg-extra text-foreground rounded-xl shadow-2xl border border-border p-4 md:p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto flex flex-col gap-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-foreground/70 hover:text-main active:scale-95 transition"
        >
          <svg
            viewBox={SVGPath.close.viewBox}
            className="size-5 fill-current text-foreground cursor-pointer hover:scale-110 hover:opacity-80 hover:fill-red-400 active:scale-95 transition"
          >
            <path d={SVGPath.close.path} />
          </svg>
        </button>

        {/* Left Info Section */}
        <div className="w-full flex flex-col justify-start">
          <div className="flex justify-between items-center mt-6 mb-4">
            <div>
              <h2 className="font-garamond font-bold text-2xl md:text-4xl text-main mb-1">
                {artist.name}
              </h2>
              {(artist.year_active_start || artist.year_active_end) && (
                <h3 className="text-foreground/50 text-xs md:text-sm mb-2">
                  {artist.year_active_start} –{" "}
                  {artist.year_active_end || "Present"}
                </h3>
              )}
              {artist.genres && (
                <p className="text-foreground/50 text-xs md:text-sm mb-2">
                  {artist.genres.join(", ")}
                </p>
              )}
              {artist.notable_works && (
                <>
                  <h3 className="font-bold text-foreground/50 text-xs md:text-sm">Famous Works:</h3>
                  <p className="text-foreground/50 text-xs md:text-sm mb-2">
                    {artist.notable_works.join(", ")}
                  </p>
                </>
              )}
            </div>
            <div className="flex justify-center items-start">
              {artist.photo ? (
                <img
                  src={artist.photo}
                  alt={artist.name}
                  className="object-cover h-48 w-48 md:h-48 md:w-48 border border-foreground shadow-lg rounded-sm"
                />
              ) : (
                <div className="text-foreground/40 italic text-sm">
                  No image available
                </div>
              )}
            </div>
          </div>

          {artist.bio && (
            <ExpandableSummary
              text={artist.bio}
              maxHeight="max-h-36"
              blurBottom="bottom-6"
              extraBackground={true}
            />
          )}

          <div className="w-full flex flex-col md:flex-row space-x-2 mt-3">
            {artist.best_songs && artist.best_songs.length > 0 && (
              <div className="text-sm md:text-base w-full md:w-1/2">
                <h3 className="font-bold mb-1">Best Songs:</h3>
                <ul className="list-disc font-inter list-inside italic">
                  {artist.best_songs.map((song, idx) => (
                    <li key={idx}>
                      {song.title}{" "}
                      {song.release_year && `(${song.release_year})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {artist.best_albums && artist.best_albums.length > 0 && (
              <div className="text-sm md:text-base w-full md:w-1/2 mt-3 md:mt-0">
                <h3 className="font-bold mb-1">Best Albums:</h3>
                <ul className="list-disc list-inside font-inter italic">
                  {artist.best_albums.map((album, idx) => (
                    <li key={idx}>
                      {album.title}{" "}
                      {album.release_year && `(${album.release_year})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex w-full justify-end gap-3">
          <button
            onClick={onEdit}
            className="bg-foreground text-background px-4 py-2 rounded hover:bg-extra-mid hover:scale-105 transition cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={onClose}
            className="bg-red-500 text-foreground px-4 py-2 rounded hover:bg-red-400 cursor-pointer transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtistModal;
