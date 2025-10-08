"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useUser } from "@/context/UserProvider";

interface Category {
  key: string;
  display_name: string;
}

interface Culture {
  code?: string;
  name?: string;
}

interface NavbarProps {
  culture?: Culture | null;
  categories?: Category[];
}

export default function Navbar({ culture, categories = [] }: NavbarProps) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useUser();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleMobile = () => setMobileOpen((prev) => !prev);
  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  return (
    <nav className="flex justify-between items-center px-4 py-2 bg-background w-full relative">
      <Link
        href={`/${culture?.code || ""}`}
        className="text-4xl font-bold font-garamond text-main hover:opacity-80 transition duration-300"
      >
        {culture?.name || "Vox Mundi"}
      </Link>

      <div className="hidden md:flex gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.key}
            href={`/${culture?.code || ""}/${cat.key}`}
            className="text-lg font-medium font-lora hover:text-foreground/80 transition"
          >
            {cat.display_name}
          </Link>
        ))}
      </div>

      <div className="flex gap-4 items-center">
        <Link href="/" className="text-sm">
          <svg
            viewBox="0 0 576 512"
            className="size-5 fill-current transition hover:scale-105 active:scale-95"
          >
            <path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1v16.2c0 22.1-17.9 40-40 40h-16c-1.1 0-2.2 0-3.3-.1-1.4.1-2.8.1-4.2.1L416 512h-24c-22.1 0-40-17.9-40-40v-88c0-17.7-14.3-32-32-32h-64c-17.7 0-32 14.3-32 32v88c0 22.1-17.9 40-40 40h-55.9c-1.5 0-3-.1-4.5-.2-1.2.1-2.4.2-3.6.2h-16c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9.1-2.8v-69.7h-32c-18 0-32-14-32-32.1 0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7l255.4 224.5c8 7 12 15 11 24" />
          </svg>
        </Link>

        <ThemeToggle />

        {isAuthenticated ? (
          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center gap-1 text-sm hover:text-main font-medium transition cursor-pointer"
            >
              Welcome, {user?.username}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-extra rounded shadow-md z-50">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm hover:bg-background/80 cursor-pointer"
                >
                  <span className="text-foreground">Profile</span>
                </Link>
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-sm text-main hover:bg-background/80 cursor-pointer"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="text-sm hover:text-main transition">
            Login
          </Link>
        )}

        <button onClick={toggleMobile} className="md:hidden focus:outline-none">
          {mobileOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="absolute top-full left-0 w-full bg-background border-t border-border flex flex-col items-center gap-4 py-4 md:hidden z-40">
          {categories.map((cat) => (
            <Link
              key={cat.key}
              href={`/${culture?.code || ""}/${cat.key}`}
              className="text-lg font-medium font-lora hover:text-foreground/80 transition"
              onClick={() => setMobileOpen(false)}
            >
              {cat.display_name}
            </Link>
          ))}

          {isAuthenticated && (
            <>
              <Link
                href="/profile"
                className="text-sm hover:text-main transition"
                onClick={() => setMobileOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileOpen(false);
                }}
                className="text-sm text-red-500 hover:text-red-600 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
