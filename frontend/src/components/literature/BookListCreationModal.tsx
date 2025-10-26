"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Book } from "@/types/media/book";
import { List } from "@/types/list";
import { Culture } from "@/types/culture";
import api from "@/lib/api";
import { ParamValue } from "next/dist/server/request/params";
import { SVGPath } from "@/utils/path";
import { formatDateEstimate } from "@/utils/formatters/formatDateEstimate";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  initialList?: List;
  currentCultureCode?: ParamValue;
};

export default function BookListCreationModal({
  isOpen,
  onClose,
  onCreated,
  initialList,
  currentCultureCode,
}: Props) {
  const [name, setName] = useState(initialList?.name || "");
  const [description, setDescription] = useState(
    initialList?.description || ""
  );
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [selected, setSelected] = useState<Book[]>([]);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [selectedCultures, setSelectedCultures] = useState<Culture[]>(
    initialList?.cultures || []
  );
  const [showCultureSelect, setShowCultureSelect] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fetchExistingBooks = useCallback(async () => {
    if (!initialList?.items?.length) return;
    const ids = initialList.items.map((item) => item.id).join(",");
    try {
      const res = await api.get(
        `/books/list_books/?ids=${encodeURIComponent(ids)}`
      );
      setSelected(res.data.results || []);
    } catch (err) {
      console.error("Error fetching existing books:", err);
      alert("Failed to load existing books.");
    }
  }, [initialList]);

  const fetchCultures = useCallback(async () => {
    try {
      const res = await api.get(
        `/cultures/?code=${encodeURIComponent(
          String(currentCultureCode || "")
        )}`
      );
      setCultures(res.data);
      if (currentCultureCode && !initialList?.cultures?.length) {
        const currentCulture = res.data.find(
          (c: Culture) =>
            c.code === currentCultureCode || c.id === Number(currentCultureCode)
        );
        if (currentCulture) {
          setSelectedCultures([currentCulture]);
        }
      }
    } catch (error) {
      console.error("Error fetching cultures:", error);
      alert("Failed to load cultures.");
    }
  }, [currentCultureCode, initialList]);

  useEffect(() => {
    if (!isOpen) return;
    fetchCultures();
    if (initialList?.id) {
      fetchExistingBooks();
      setName(initialList?.name);
      setDescription(initialList?.description || "")
    }
  }, [isOpen, fetchCultures, fetchExistingBooks, initialList]);

  const handleSearch = async () => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(
        `/books/?q=${encodeURIComponent(search)}&limit=5`
      );
      const validResults = res.data.filter(
        (book: Book) => book.id && book.universal_item?.id
      );
      setResults(validResults);
    } catch (error) {
      console.error("Error searching books:", error);
      alert("Error searching books. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (book: Book) => {
    setSelected((prev) =>
      prev.find((b) => b.id === book.id)
        ? prev.filter((b) => b.id !== book.id)
        : [...prev, book]
    );
  };

  const toggleCulture = (culture: Culture) => {
    setSelectedCultures((prev) => {
      const exists = prev.some((c) => c.id === culture.id);
      return exists
        ? prev.filter((c) => c.id !== culture.id)
        : [...prev, culture];
    });
  };

  const handleSubmit = async () => {
    const itemIds = selected
      .map((b) => b.universal_item?.id)
      .filter((id): id is number => !!id);

    if (!itemIds.length) {
      alert("Please select at least one valid book.");
      return;
    }

    if (!selectedCultures.length) {
      alert("Please select at least one culture.");
      return;
    }

    const payload = {
      name,
      description,
      type: "books",
      item_ids: itemIds,
      culture_ids: selectedCultures.map((c) => c.id),
      visibility: initialList?.visibility || "private",
    };

    try {
      if (initialList?.id) {
        await api.patch(`/lists/${initialList.id}/`, payload);
      } else {
        await api.post(`/lists/`, payload);
      }
      onCreated();
      onClose();
    } catch (error) {
      console.error("Error saving list:", error);
      alert(`Failed to ${initialList?.id ? "update" : "create"} list.`);
    }
  };

  const deleteList = async (id: number) => {
    if (!confirm("Are you sure you want to delete this list?")) return;
    try {
      await api.delete(`/lists/${id}/`);
      onCreated();
      router.push(`/${currentCultureCode}/literature`);
    } catch (error) {
      console.error("Error deleting list:", error);
      alert("Failed to delete list.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 p-4 pt-8 sm:pt-16 overflow-y-auto max-h-screen">
      <div className="bg-background rounded-xl shadow-lg p-4 sm:p-6 w-full max-w-lg sm:max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {initialList?.id ? "Edit Book List" : "Create Book List"}
          </h2>
          <button
            onClick={onClose}
            className="text-foreground hover:text-primary transition"
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

        <input
          type="text"
          placeholder="List title"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-neutral/50 focus:border-primary rounded mb-3"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-neutral/50 focus:border-primary rounded mb-4 resize-none h-24"
        />

        <div className="mb-4">
          <div
            className="flex justify-between items-center cursor-pointer p-2 border border-neutral/50 rounded"
            onClick={() => setShowCultureSelect(!showCultureSelect)}
          >
            <span>
              Cultures:{" "}
              {selectedCultures.map((c) => c.name).join(", ") ||
                "None selected"}
            </span>
            <span className="text-xs text-gray-500">
              <svg
                viewBox={SVGPath.chevron.viewBox}
                className={`size-5 fill-current transition hover:scale-105 active:scale-95 ${
                  showCultureSelect ? "transform rotate-180" : ""
                }`}
              >
                <path d={SVGPath.chevron.path} />
              </svg>
            </span>
          </div>
          {showCultureSelect && (
            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border border-neutral/50 rounded p-2">
              {cultures.map((culture) => {
                const isSelected = selectedCultures.some(
                  (c) => c.id === culture.id
                );
                return (
                  <label
                    key={culture.id}
                    className={`flex items-center space-x-2 cursor-pointer p-1 rounded hover:bg-neutral/20 ${
                      isSelected ? "text-main" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCulture(culture)}
                      className="mr-2"
                    />
                    <span>{culture.name}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            placeholder="Search books..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 p-2 border border-neutral/50 focus:border-primary rounded"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-primary text-white px-4 py-2 rounded hover:opacity-80 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? "..." : "Search"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="max-h-32 sm:max-h-40 overflow-y-auto mb-4 border rounded p-2">
            {results.map((book) => (
              <div
                key={book.id}
                onClick={() => toggleSelect(book)}
                className={`flex items-center p-2 cursor-pointer hover:bg-neutral/30 ${
                  selected.find((i) => i.id === book.id) ? "bg-primary/20" : ""
                }`}
              >
                {book.cover && (
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-10 h-14 object-cover rounded mr-3"
                  />
                )}
                <span>{book.title}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <h3 className="font-semibold mb-2">
            Selected Books ({selected.length})
          </h3>
          <div className="flex flex-col items-start">
            {selected.length > 0 ? (
              selected.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between border-b border-foreground/20 py-2 pl-2 w-full"
                >
                  <div className="flex items-center space-x-2">
                    {book.cover && (
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                    )}
                    <div className="text-sm flex flex-col items-start">
                      <p>{book.title}</p>
                      <p className="text-gray-400 text-xs">
                        {formatDateEstimate(book?.date) || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleSelect(book)}
                    className="bg-danger text-white px-2 py-1 rounded hover:bg-danger/80 text-xs"
                  >
                    <svg
                      viewBox={SVGPath.close.viewBox}
                      className="size-5 fill-current transition hover:scale-105 active:scale-95 hover:text-red-400 cursor-pointer"
                    >
                      <path d={SVGPath.close.path} />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-400">No books selected.</p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral/20">
          <button
            onClick={handleSubmit}
            disabled={
              !name.trim() ||
              selected.length === 0 ||
              selectedCultures.length === 0
            }
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/80 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {initialList?.id ? "Update List" : "Create List"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-extra text-foreground hover:bg-extra/80 transition cursor-pointer"
          >
            Cancel
          </button>
          {initialList?.id && (
            <button
              onClick={() => deleteList(initialList.id!)}
              className="bg-red-500 text-white px-4 py-2 rounded hover:opacity-80 transition cursor-pointer"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
