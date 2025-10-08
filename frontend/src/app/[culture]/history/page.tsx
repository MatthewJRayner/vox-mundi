"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";


export default function HistoryPage() {
    const { culture } = useParams();

    useEffect(() => {
        
    }
    return (
        <main className="min-h-screen p-4 w-full">
            History Page
        </main>
    );
};