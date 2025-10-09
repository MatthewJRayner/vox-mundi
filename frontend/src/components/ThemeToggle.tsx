"use client";
import { useEffect, useState } from "react";
import { SVGPath } from "@/utils/path";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (
      saved === "dark" ||
      (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (dark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setDark(true);
    }
  };

  return (
    <button 
        onClick={toggleTheme}
        className="text-foreground fill-foreground"
    >
      <svg
        viewBox={SVGPath.theme.viewBox}
        className="fill-current size-5 hover:scale-105 transition cursor-pointer active:scale-90"
      >
        <path d={SVGPath.theme.path} />
      </svg>
    </button>
  );
}
