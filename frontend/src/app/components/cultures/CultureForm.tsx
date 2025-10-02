"use client";
import { useState } from "react";
import api from "../../lib/api";

export default function CultureForm() {
  const [formData, setFormData] = useState({ name: "", code: "", colour: "#ffffff", picture: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access");
      await api.post("/cultures/", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Culture created!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-100 p-4 rounded shadow w-96">
      <h2 className="text-lg mb-2">Create a Culture</h2>
      <input
        type="text"
        placeholder="Name"
        className="border p-2 w-full mb-2"
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <input
        type="text"
        placeholder="3-letter Code"
        className="border p-2 w-full mb-2"
        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
      />
      <input
        type="color"
        className="w-12 h-10 mb-2"
        onChange={(e) => setFormData({ ...formData, colour: e.target.value })}
      />
      <input
        type="url"
        placeholder="Picture URL"
        className="border p-2 w-full mb-2"
        onChange={(e) => setFormData({ ...formData, picture: e.target.value })}
      />
      <button type="submit" className="bg-blue-600 text-white p-2 w-full rounded">Create</button>
    </form>
  );
}
