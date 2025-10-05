"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Culture } from "@/types/culture";
import Link from "next/link";

export default function CulturesList() {
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [newCulture, setNewCulture] = useState({
    name: "",
    code: "",
    colour: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCultures = async () => {
      try {
        const res = await api.get("/cultures/");
        setCultures(res.data);
      } catch (err) {
        console.error("Failed to fetch cultures", err);
      }
    };
    fetchCultures();
  }, []);

  const deleteCulture = async (id: number) => {
    if (!confirm("Are you sure you want to delete this culture?")) return;
    try {
      await api.delete(`/cultures/${id}/`);
      setCultures(cultures.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete culture", err);
      alert("Error deleting culture.");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">My Cultures</h2>

      <ul className="space-y-2 mb-6 w-full">
        {cultures.map((c) => (
          <li
            key={c.id}
            className="flex space-x-10 justify-between items-center border p-2 rounded"
            style={{ color: c.colour }}
          >
            <Link href={`/${c.code}`}>
              {c.name} <span className="text-gray-500">({c.code})</span>
            </Link>
            <img src={c.picture} className="w-48 h-48 object-cover" />
            <button
              onClick={() => deleteCulture(c.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <Link href="/home/new">Add New Culture</Link>
    </div>
  );
}
