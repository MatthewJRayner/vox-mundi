"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserMusicComposer } from "@/types/media/music";
import ComposerForm from "@/components/music/ComposerForm";
import api from "@/lib/api";

export default function EditComposerPage() {
  const { culture, id } = useParams();
  const router = useRouter();
  const [userMusicCompoer, setUserMusicComposer] = useState<
    UserMusicComposer | undefined
  >(undefined);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const historyRes = await api.get(`/user-composers/${id}`);
      setUserMusicComposer(historyRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="">
      <h1 className=""></h1>
      {userMusicCompoer && (
        <ComposerForm
          currentCultureCode={culture}
          onSuccess={() => router.push(`/${culture}/music`)}
          initialData={userMusicCompoer}
        />
      )}
    </div>
  );
}
