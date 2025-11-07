"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

import api from "@/lib/api";
import { SVGPath } from "@/utils/path";
import { UserMusicArtist } from "@/types/media/music";

import ArtistModal from "@/components/music/ArtistModal";
import ArtistForm from "@/components/music/ArtistForm";

export default function FavouriteArtistsPage() {
  const { culture } = useParams();
  const [artists, setArtists] = useState<UserMusicArtist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<
    UserMusicArtist | undefined
  >(undefined);
  const [showFormModal, setShowFormModal] = useState(false);

  const fetchData = useCallback(async () => {
    if (!culture) return;

    try {
      const artistRes = await api.get(`/user-artists/?code=${culture}`);
      setArtists(artistRes.data);
    } catch (err) {
      console.error("Error fetching artists", err);
    }
  }, [culture]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedByTier = artists.reduce<Record<number, UserMusicArtist[]>>(
    (acc, artist) => {
      const tier = artist.ranking_tier || 5;
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(artist);
      return acc;
    },
    {}
  );

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6 w-full font-serif">
      <div className="md:w-1/2 rounded-xl overflow-y-auto max-h-[80vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-garamond font-bold">
            Your Favourite Artists
          </h2>
          <button
            onClick={() => setShowFormModal(true)}
            className="px-4 py-2 bg-main rounded-lg shadow-md cursor-pointer hover:bg-main/80 hover:shadow-lg flex items-center"
          >
            <svg
              viewBox={SVGPath.add.viewBox}
              className="size-4 md:size-5 fill-current text-foreground cursor-pointer hover:scale-110 hover:opacity-80 hover:fill-red-400 active:scale-95 transition"
            >
              <path d={SVGPath.add.path} />
            </svg>{" "}
            <span className="ml-1 text-xs md:text-sm font-inter">
              Add Artist
            </span>
          </button>
        </div>

        <ul className="space-y-2">
          {artists.map((artist, idx) => (
            <li
              key={idx}
              onClick={() => setSelectedArtist(artist)}
              className="cursor-pointer px-3 py-2 rounded-lg hover:text-main hover:text-shadow-xl transition duration-300"
            >
              <span className="text-lg font-medium">{artist.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="md:w-1/2 rounded-xl overflow-y-auto max-h-[80vh]">
        <h2 className="text-xl font-garamond font-bold mb-4">
          Artist Rankings
        </h2>

        {[1, 2, 3, 4, 5].map((tier) => (
          <div key={tier} className="mb-6">
            <h3 className="font-semibold text-lg mb-2">Tier {tier}</h3>
            <div className="flex flex-wrap gap-2">
              {groupedByTier[tier]?.length ? (
                groupedByTier[tier].map((artist) => (
                  <button
                    key={artist.id}
                    onClick={() => setSelectedArtist(artist)}
                    className="bg-extra hover:bg-extra/80 px-3 py-1 rounded-full text-sm transition cursor-pointer"
                  >
                    {artist.name}
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No artists ranked here.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedArtist && (
        <ArtistModal
          artist={selectedArtist}
          onClose={() => setSelectedArtist(undefined)}
          onEdit={() => {
            setShowFormModal(true);
          }}
        />
      )}

      {showFormModal && (
        <ArtistForm
          initialData={selectedArtist}
          onSuccess={() => {
            setShowFormModal(false);
            setSelectedArtist(undefined);
            fetchData();
          }}
          onClose={() => setShowFormModal(false)}
          currentCultureCode={culture}
        />
      )}
    </div>
  );
}
