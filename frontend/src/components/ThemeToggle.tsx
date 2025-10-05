"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  const iconPath =
    "M512 320c0-106-86-192-192-192v384c106 0 192-86 192-192m-448 0C64 178.6 178.6 64 320 64s256 114.6 256 256-114.6 256-256 256S64 461.4 64 320";

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
        viewBox="0 0 640 640"
        className="fill-current size-5 hover:scale-105 transition cursor-pointer active:scale-90"
      >
        <path d={iconPath} />
      </svg>
    </button>
  );
}
