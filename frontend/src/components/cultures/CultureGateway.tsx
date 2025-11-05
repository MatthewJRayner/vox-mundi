/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import api from "@/lib/api";
import { SVGPath } from "@/utils/path";
import { Culture } from "@/types/culture";

export default function CultureGateway() {
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCulture, setSelectedCulture] = useState<Culture | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    colour: "",
    picture: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCultures = async () => {
      try {
        setLoading(true);
        const res = await api.get("/cultures/");
        setCultures(res.data);
      } catch (err) {
        console.error("Failed to fetch cultures", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCultures();
  }, []);

  const openEditModal = (culture: Culture) => {
    setSelectedCulture(culture);
    setForm({
      name: culture.name || "",
      code: culture.code || "",
      colour: culture.colour || "",
      picture: culture.picture || "",
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!selectedCulture?.id) return;
    setSaving(true);
    try {
      const res = await api.patch(`/cultures/${selectedCulture.id}/`, form);
      setCultures((prev) =>
        prev.map((c) => (c.id === selectedCulture.id ? res.data : c))
      );
      setShowEditModal(false);
    } catch (err) {
      console.error("Failed to update culture:", err);
      alert("Error saving changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCulture?.id) return;
    if (!confirm(`Are you sure you want to delete ${selectedCulture.name}?`))
      return;

    setSaving(true);
    try {
      await api.delete(`/cultures/${selectedCulture.id}/`);
      setCultures((prev) => prev.filter((c) => c.id !== selectedCulture.id));
      setShowEditModal(false);
    } catch (err) {
      console.error("Failed to delete culture:", err);
      alert("Error deleting culture. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br">
      <div className="z-10 text-center mb-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold font-serif mb-2">
          Choose Your World
        </h1>
        <p className="text-foreground/50 font-light">
          Enter a culture to explore its language, art, and stories.
        </p>
        {cultures.length === 0 && (
          <p className="font-bold mt-4">
            No cultures found. Click the + button below to add a new culture and
            get started.
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-neutral-400 text-lg animate-pulse z-10">
          Loading cultures...
        </p>
      ) : (
        <div className="z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-6">
          {cultures.map((culture) => (
            <motion.div
              key={culture.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="relative flex flex-col items-center justify-center cursor-pointer group"
            >
              <Link
                href={`/${culture.code}`}
                className="flex flex-col items-center"
              >
                <motion.div
                  className="relative w-32 h-32 md:w-40 md:h-40 rounded-full shadow-lg overflow-hidden border-2 border-white/20"
                  style={{
                    boxShadow: `0 0 20px 4px ${culture.colour || "#888"}40`,
                  }}
                >
                  <img
                    src={
                      culture.picture ||
                      "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg"
                    }
                    alt={culture.name}
                    className="object-cover w-full h-full rounded-full group-hover:opacity-70 transition"
                  />
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/50"
                  >
                    <span className="text-sm md:text-base font-semibold text-white bg-primary/60 px-3 py-1 rounded-full backdrop-blur">
                      Enter
                    </span>
                  </motion.div>
                </motion.div>
                <p className="mt-3 font-medium text-lg text-center drop-shadow-sm">
                  {culture.name}
                </p>
                <p
                  className="text-xs text-neutral-400 uppercase tracking-widest"
                  style={{ color: culture.colour || "#aaa" }}
                >
                  {culture.code}
                </p>
              </Link>

              {/* ✏️ Edit Button */}
              <button
                onClick={() => openEditModal(culture)}
                className="absolute top-2 right-2 bg-primary/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                title="Edit Culture"
              >
                <svg
                  viewBox={SVGPath.edit.viewBox}
                  className="size-5 fill-white cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
                >
                  <path d={SVGPath.edit.path} />
                </svg>
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <Link
        href="/home/new"
        className="fixed bottom-8 right-8 z-20 bg-primary text-background p-4 rounded-full shadow-lg hover:scale-110 hover:shadow-primary/40 active:scale-95 transition-all duration-300 cursor-pointer flex items-center justify-center"
        title="Add New Culture"
      >
        <svg
          viewBox={SVGPath.add.viewBox}
          className="size-5 fill-white cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
        >
          <path d={SVGPath.add.path} />
        </svg>
      </Link>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background text-foreground rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3"
              onClick={() => setShowEditModal(false)}
            >
              <svg
                viewBox={SVGPath.close.viewBox}
                className="size-5 fill-current text-foreground cursor-pointer hover:scale-110 hover:fill-red-400 active:scale-95 transition"
              >
                <path d={SVGPath.close.path} />
              </svg>
            </button>
            <h2 className="text-xl font-semibold mb-4">Edit Culture</h2>

            <label className="block text-sm mb-2">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-2 border border-neutral/50 rounded mb-3 bg-extra"
            />

            <label className="block text-sm mb-2">Code</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full p-2 border border-neutral/50 rounded mb-3 bg-extra"
            />

            <label className="block text-sm mb-2">Colour</label>
            <input
              type="color"
              value={form.colour}
              onChange={(e) => setForm({ ...form, colour: e.target.value })}
              className="w-full h-10 p-1 rounded mb-3"
            />

            <label className="block text-sm mb-2">Image URL</label>
            <input
              type="text"
              value={form.picture}
              onChange={(e) => setForm({ ...form, picture: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full p-2 border border-neutral/50 rounded mb-3 bg-extra"
            />

            <div className="flex justify-between items-center mt-6 border-t border-neutral/30 pt-4">
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-foreground text-background fill-background px-3 py-2 rounded hover:bg-red-400 hover:text-white transition cursor-pointer"
              >
                <svg
                  viewBox={SVGPath.delete.viewBox}
                  className="size-5 fill-current hover:scale-110 hover:opacity-80 active:scale-95 transition"
                >
                  <path d={SVGPath.delete.path} />
                </svg>
                Delete
              </button>

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
