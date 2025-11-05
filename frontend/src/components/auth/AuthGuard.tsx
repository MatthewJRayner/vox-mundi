"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client-side route guard that protects pages from unauthenticated access.
 *
 * Checks for `access` token in `localStorage`. Redirects to `/login` if missing.
 * Renders `children` only when authenticated.
 *
 * @param children - Content to render if user is authenticated
 *
 * @example
 * <AuthGuard>
 *   <Dashboard />
 * </AuthGuard>
 */

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("access");
        if (!token) {
            router.push("/login");
        } else {
            setChecked(true);
        }
    }, [router]);

    if (!checked) return null;

    return <>{children}</>
}