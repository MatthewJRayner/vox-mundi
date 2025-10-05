"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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