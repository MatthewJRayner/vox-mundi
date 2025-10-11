"use client";

import HistoryEventForm from "@/components/history/HistoryEventForm";
import { useRouter, useParams } from "next/navigation";

export default function NewHistoryPage() {
    const router = useRouter();
    const { culture } = useParams();

    return (
        <div className="">
            <h1 className=""></h1>
            <HistoryEventForm currentCultureCode={culture} onSuccess={() => router.push(`/${culture}/history`)} />
        </div>
    );
}