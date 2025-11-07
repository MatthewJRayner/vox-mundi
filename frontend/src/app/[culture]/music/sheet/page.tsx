"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

import api from "@/lib/api";
import { SVGPath } from "@/utils/path";
import { UserMusicPiece } from "@/types/media/music";

import SearchBar from "@/components/SearchBar";
import MusicPieceModal from "@/components/music/SheetMusicFormModal";

export default function SheetMusicPage() {
  const { culture } = useParams();
  const [pieces, setPieces] = useState<UserMusicPiece[]>([]);
  const [filteredPieces, setFilteredPieces] = useState<UserMusicPiece[]>([]);
  const [openInstrument, setOpenInstrument] = useState<string | null>(null);
  const [openPieceId, setOpenPieceId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPiece, setEditingPiece] = useState<UserMusicPiece | null>(null);

  const fetchPieces = useCallback(async () => {
    try {
      const piecesRes = await api.get(`/user-music-pieces/?code=${culture}`);
      setPieces(piecesRes.data);
      setFilteredPieces(piecesRes.data);
    } catch (error) {
      console.error("Error fetching pieces:", error);
    }
  }, [culture]);

  useEffect(() => {
    fetchPieces();
  }, [fetchPieces]);

  const handleSearch = useCallback(
    (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setFilteredPieces(pieces);
        return;
      }
      const lowerQuery = searchQuery.toLowerCase().trim();
      const filtered = pieces.filter(
        (piece) =>
          piece.title?.toLowerCase().includes(lowerQuery) ||
          piece.artist?.toLowerCase().includes(lowerQuery) ||
          piece.instrument?.toLowerCase().includes(lowerQuery) ||
          piece.cultures?.some((culture) =>
            culture.name.toLowerCase().includes(lowerQuery)
          )
      );
      setFilteredPieces(filtered);
    },
    [pieces]
  );

  const grouped = filteredPieces.reduce<Record<string, UserMusicPiece[]>>(
    (acc, piece) => {
      const key = piece.instrument || "Unknown Instrument";
      if (!acc[key]) acc[key] = [];
      acc[key].push(piece);
      return acc;
    },
    {}
  );

  const toggleInstrument = (instrument: string) => {
    setOpenInstrument((prev) => (prev === instrument ? null : instrument));
    setOpenPieceId(null);
  };

  const togglePiece = (id: number) => {
    setOpenPieceId((prev) => (prev === id ? null : id));
  };

  const handleAddNew = () => {
    setEditingPiece(null);
    setIsModalOpen(true);
  };

  const handleEditPiece = (piece: UserMusicPiece) => {
    setEditingPiece(piece);
    setIsModalOpen(true);
  };

  const handleSavePiece = (savedPiece: UserMusicPiece) => {
    setPieces((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === savedPiece.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = savedPiece;
        return updated;
      }
      return [...prev, savedPiece];
    });
  };

  return (
    <main className="flex flex-col w-full mx-auto space-y-8 mt-4">
      <SearchBar onSearch={handleSearch} />
      <div className="w-full mx-auto p2 md:p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-garamond font-bold">
            Music Library
          </h1>
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-main text-white rounded shadow hover:bg-main/80 transition cursor-pointer"
          >
            + Add New
          </button>
        </div>

        {Object.entries(grouped).map(([instrument, list]) => (
          <div key={instrument} className="mb-4 overflow-hidden">
            <button
              onClick={() => toggleInstrument(instrument)}
              className="flex w-full md:w-fit justify-between items-center px-4 py-3 bg-extra rounded-lg shadow-lg hover:bg-muted/70 transition cursor-pointer"
            >
              <span className="font-bold text-lg mr-4">{instrument}</span>
              <span
                className={`transform transition-transform ${
                  openInstrument === instrument ? "rotate-180" : ""
                }`}
              >
                <svg
                  viewBox={SVGPath.chevron.viewBox}
                  className="size-6 fill-current text-foreground"
                >
                  <path d={SVGPath.chevron.path} />
                </svg>
              </span>
            </button>

            {openInstrument === instrument && (
              <div className="bg-background transition-all duration-300 flex flex-col mt-4 md:mt-8">
                {list.map((piece, idx) => (
                  <div
                    key={idx}
                    className="p-4 w-full bg-extra shadow-md rounded mb-2 md:w-8/10 mx-auto"
                  >
                    <div className="flex justify-between">
                      <button
                        onClick={() => togglePiece(idx)}
                        className="flex justify-between w-full text-left cursor-pointer items-center"
                      >
                        <div className="flex items-center md:items-center space-x-2">
                          <span className="text-lg md:text-3xl font-lora font-bold">
                            {piece.title || "Untitled"}
                          </span>
                          <span className="text-xs font-inter md:text-base text-foreground/50">
                            {piece.artist || "Unknown Artist"}
                          </span>
                          {piece.release_year && (
                            <span className="text-xs font-inter md:text-base text-foreground/50">
                              ({piece.release_year})
                            </span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPiece(piece);
                          }}
                          className="text-sm text-main hover:underline"
                        >
                          <svg
                            viewBox={SVGPath.edit.viewBox}
                            className={`size-5 fill-current text-foreground transform transition-transform hover:scale-105 cursor-pointer hover:fill-primary/80`}
                          >
                            <path d={SVGPath.edit.path} />
                          </svg>
                        </button>
                        <svg
                          viewBox={SVGPath.chevron.viewBox}
                          className={`size-5 fill-current text-foreground transform transition-transform ${
                            openPieceId === idx ? "rotate-180" : ""
                          }`}
                        >
                          <path d={SVGPath.chevron.path} />
                        </svg>
                      </div>
                    </div>

                    {openPieceId === idx && (
                      <div className="mt-4 px-2 md:px-4 text-muted-foreground space-y-2 flex flex-col">
                        <div className="flex space-x-2 text-sm md:text-lg justify-between">
                          {piece.recording && (
                            <a
                              href={piece.recording}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-main font-inter"
                            >
                              Recording
                            </a>
                          )}
                          <p className="font-inter">
                            <strong>Learned:</strong>{" "}
                            {piece.learned ? "Yes" : "No"}
                          </p>
                        </div>

                        {piece.sheet_music &&
                          piece.sheet_music.length === 2 && (
                            <iframe
                              width="100%"
                              height="400"
                              src={`https://musescore.com/user/${piece.sheet_music[0]}/scores/${piece.sheet_music[1]}/embed`}
                              allow="autoplay; fullscreen"
                              className="rounded shadow"
                            ></iframe>
                          )}

                        {piece.culture_ids?.length ? (
                          <p>
                            🌍 <strong>Cultures:</strong>{" "}
                            {piece.culture_ids.join(", ")}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        <MusicPieceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          piece={editingPiece}
          onSave={handleSavePiece}
          currentCultureCode={culture}
        />
      </div>
    </main>
  );
}
