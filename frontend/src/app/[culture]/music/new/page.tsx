"use client";

import ComposerForm from "@/components/music/ComposerForm";
import { useRouter, useParams } from "next/navigation";

export default function NewHistoryPage() {
    const router = useRouter();
    const { culture } = useParams();

    return (
        <div className="">
            <h1 className=""></h1>
            <ComposerForm currentCultureCode={culture} onSuccess={() => router.push(`/${culture}/music`)} />
        </div>
    );
}