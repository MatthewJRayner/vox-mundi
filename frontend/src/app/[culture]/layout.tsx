"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import api from "@/lib/api";
import Navbar from "@/components/Navbar";

interface Culture {
  id: number;
  name: string;
  code: string;
  colour?: string;
}

interface Category {
  key: string;
  display_name: string;
}

export default function CultureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [culture, setCulture] = useState<Culture | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const cultureCode = pathname.split("/").filter(Boolean)[0] || null;

  useEffect(() => {
    if (!cultureCode) return;

    api.get(`/cultures/?code=${cultureCode}`)
      .then((res) => {
        const cultureData = res.data[0];
        if (cultureData) {
          setCulture(cultureData);

          if (cultureData.colour) {
            document.documentElement.style.setProperty("--main", cultureData.colour);
          }
        }
      })
      .catch((err) => console.error("Error fetching culture:", err));

    api.get(`/categories/?culture_code=${cultureCode}`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Error fetching categories:", err));
  }, [cultureCode]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar culture={culture} categories={categories} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
