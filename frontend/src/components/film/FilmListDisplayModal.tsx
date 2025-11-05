"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ParamValue } from "next/dist/server/request/params";

import api from "@/lib/api";
import { SVGPath } from "@/utils/path";
import { List } from "@/types/list";

/**
 * Modal displaying a user's existing film lists for a given culture.
 *
 * Fetches lists on open, supports viewing, editing, and creating new lists.
 * Shows loading, empty, and error states.
 *
 * @param isOpen - Controls modal visibility
 * @param onClose - Callback to close the modal
 * @param onEditList - Called when user wants to edit/create a list (passes List or empty object)
 * @param currentCultureCode - Culture code from URL (used for filtering lists)
 *
 * @example
 * <FilmListDisplayModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onEditList={openEditor}
 *   currentCultureCode="us"
 * />
 */

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onEditList: (list: List) => void;
  currentCultureCode?: ParamValue;
};

export default function FilmListDisplayModal({
  isOpen,
  onClose,
  onEditList,
  currentCultureCode,
}: Props) {
  const [lists, setLists] = useState<List[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !currentCultureCode) return;

    const fetchLists = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(
          `/lists/?type=films&code=${encodeURIComponent(
            String(currentCultureCode)
          )}`
        );
        setLists(res.data);
      } catch (err) {
        console.error("Error fetching lists:", err);
        setError("Failed to load lists. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, [isOpen, currentCultureCode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-neutral/20">
          <h2 className="md:text-lg font-bold text-main">Your Film Lists</h2>
          <button
            onClick={onClose}
            className="text-foreground hover:text-red-400 transition"
            aria-label="Close modal"
          >
            <svg
              viewBox={SVGPath.close.viewBox}
              className="size-5 fill-current transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              <path d={SVGPath.close.path} />
            </svg>
          </button>
        </div>

        <div className="p-4">
          {loading && (
            <p className="text-neutral-400 text-center py-4">
              Loading lists...
            </p>
          )}
          {error && <p className="text-red-500 text-center py-4">{error}</p>}

          {!loading && !error && lists.length === 0 && (
            <div className="text-center py-8">
              <p className="text-foreground/50 mb-4">
                No film lists found for this culture.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onEditList({} as List);
                }}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition cursor-pointer"
              >
                Create First List
              </button>
            </div>
          )}

          {!loading && lists.length > 0 && (
            <div className="space-y-3">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className="border border-neutral/20 rounded-lg p-3 hover:bg-extra transition"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2 max-w-[1/2] truncate">
                      <h3 className="font-semibold text-foreground">
                        {list.name}
                      </h3>
                      <p className="text-xs text-foreground/50 mt-1">
                        {list.items.length} film
                        {list.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-2">
                      <button
                        onClick={() => onEditList(list)}
                        className="p-1 rounded transition"
                        title="Edit list"
                      >
                        <svg
                          viewBox={SVGPath.edit.viewBox}
                          className="size-5 fill-current transition hover:scale-105 hover:text-primary active:scale-95 cursor-pointer"
                        >
                          <path d={SVGPath.edit.path} />
                        </svg>
                      </button>
                      <Link
                        href={`/${currentCultureCode}/film/lists/${list.id}`}
                        className="p-1 text-foreground hover:bg-neutral/20 hover:text-primary rounded transition"
                        title="View list details"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && lists.length > 0 && (
          <div className="p-4 border-t border-neutral/20">
            <button
              onClick={() => {
                onClose();
                onEditList({} as List);
              }}
              className="w-full px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition cursor-pointer"
            >
              Create New List
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
