"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";

export default function CreateCulturePage() {
  const [form, setForm] = useState({ name: "", code: "", colour: "#ffffff", picture: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreateCulture = async () => {
    if (!form.name || !form.code) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await api.post("/cultures/", form);
      alert("Culture created successfully!");
      router.push("/");
    } catch (err) {
      console.error("Error creating culture:", err);
      alert("Failed to create culture.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Navbar />
      <div className="p-4 w-full text-center flex flex-col items-center gap-3">
        <h2 className="text-2xl font-bold font-garamond mb-4">
          {"Enter your culture name and 3-letter code".toLocaleUpperCase()}
        </h2>
        <input
          type="text"
          placeholder="Culture Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border-b-2 border-b-foreground p-2 rounded-t w-1/2"
        />
        <input
          type="text"
          placeholder="Code"
          value={form.code}
          onChange={(e) =>
            setForm({ ...form, code: e.target.value.toLowerCase() })
          }
          className="border-b-2 p-2 rounded-t w-1/6"
        />
        <h3 className="font-garamond font-medium text-xl mt-12">
          {"Choose a colour to represent your culture".toLocaleUpperCase()}
        </h3>
        <div className="flex space-x-4 items-center">
          <input
            type="color"
            value={form.colour}
            onChange={(e) => setForm({ ...form, colour: e.target.value })}
            className="w-16 h-10 cursor-pointer"
          />
          <h3 className={`font-lora text-xl font-medium`} style={{ color: form.colour }}>{form?.name.toUpperCase()}</h3>
        </div>
        <h3 className="font-garamond font-medium text-xl mt-12">
          {"Save a link as an icon for your culture".toLocaleUpperCase()}
        </h3>
        <input
          type="text"
          placeholder="Icon URL Link"
          value={form.picture ?? ""}
          onChange={(e) =>
            setForm({ ...form, picture: e.target.value.toLowerCase() })
          }
          className="border-b-2 p-2 rounded-t w-1/2"
        />
        <img 
            src={`${form?.picture.length > 1 ? form.picture : null}`}
            className="h-48 w-48 mt-2 object-cover shadow border-2"
            alt="Culture Icon Preview"
        />
        <button
          onClick={handleCreateCulture}
          disabled={loading}
          className="bg-foreground w-1/3 mt-4 text-background py-2 px-1 rounded hover:bg-foreground/80 disabled:opacity-50 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-90"
        >
          {loading ? "Creating..." : "Create Culture"}
        </button>
      </div>
    </div>
  );
}
