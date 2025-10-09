"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useUser } from "@/context/UserProvider";
import { SVGPath } from "@/utils/path";

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
            viewBox={SVGPath.home.viewBox}
            className="size-5 fill-current transition hover:scale-105 active:scale-95"
          >
            <path d={SVGPath.home.path} />
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
                viewBox={SVGPath.chevron.viewBox}
                fill="currentColor"
                className={`w-4 h-4 transition-transform ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  fillRule="evenodd"
                  d={SVGPath.chevron.path}
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
