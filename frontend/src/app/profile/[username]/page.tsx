"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Profile, Culture } from "@/types/culture";
import { User } from "@/types/user";
import Navbar from "@/components/Navbar";
import { SVGPath } from "@/utils/path";

export default function ProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [owner, setOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  const [form, setForm] = useState({
    bio: "",
    location: "",
    website: "",
    avatar: "",
    cultures: [] as Culture[],
  });

  const [ownerCultures, setOwnerCultures] = useState<Culture[]>([]);
  const [showCultureSelect, setShowCultureSelect] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!username) return;

    try {
      setLoading(true);
      setError(null);

      const [ownerRes, profileRes] = await Promise.all([
        api.get(`/profiles/`),
        api.get(`/profiles/?username=${username}`),
      ]);

      const currentProfile = profileRes.data[0];
      setProfile(currentProfile);
      setForm({
        bio: currentProfile.bio || "",
        location: currentProfile.location || "",
        website: currentProfile.website || "",
        avatar: currentProfile.avatar || "",
        cultures: currentProfile.preferred_cultures || [],
      });

      if (ownerRes.data[0].user.username === username) {
        setOwner(true);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [username]);

  const fetchCultures = useCallback(async () => {
    try {
      const res = await api.get(`/cultures/`);
      setOwnerCultures(res.data);
    } catch (err) {
      console.error("Error fetching cultures:", err);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (owner) {
      fetchCultures();
    }
  }, [owner, fetchCultures]);

  const toggleCulture = (culture: Culture) => {
    setForm((prev) => {
      const exists = prev.cultures.some((c) => c.id === culture.id);
      const updated = exists
        ? prev.cultures.filter((c) => c.id !== culture.id)
        : [...prev.cultures.filter((c) => c.id !== culture.id), culture]; // remove duplicates
      return { ...prev, cultures: updated };
    });
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    setLoading(true);

    try {
      setSaving(true);
      const payload = {
        ...form,
        preferred_culture_ids: form.cultures.map((c) => c.id),
      };
      const res = await api.put(`/profiles/${profile.id}/`, payload);
      setProfile(res.data[0]);
      setEditMode(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center mt-10 text-gray-400">Loading profile...</div>
    );
  if (error)
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  if (!profile)
    return (
      <div className="text-center mt-10 text-gray-400">Profile not found.</div>
    );

  return (
    <div className="min-h-screen text-foreground p-4 sm:p-6">
      <Navbar />
      <div className="max-w-7xl mx-auto mt-8 p-4 sm:p-6 rounded-2xl bg-foreground/5 shadow-lg">
        {/* Header */}
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 pb-6 border-b border-foreground/10">
          <div className="relative flex flex-col items-center">
            <img
              src={
                form.avatar?.trim()
                  ? form.avatar
                  : "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
              }
              alt="Avatar"
              className="w-32 h-32 rounded-full object-cover shadow-lg border-2 border-primary/50"
            />

            {owner && editMode && (
              <div className="mt-3 flex flex-col items-center w-full">
                <label
                  htmlFor="avatar-input"
                  className="bg-primary text-white text-xs px-3 py-1 rounded cursor-pointer hover:opacity-80 transition"
                >
                  Change Avatar
                </label>

                {/* text input visible while editing */}
                <input
                  id="avatar-input"
                  type="text"
                  placeholder="Paste image URL..."
                  value={form.avatar}
                  onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                  className="mt-2 w-full text-sm p-2 border border-neutral-400 rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold">{profile.user?.username}</h1>
            {editMode ? (
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Add location..."
                className="mt-2 text-sm text-gray-400 bg-transparent border-b border-gray-500 focus:outline-none focus:border-primary"
              />
            ) : (
              profile.location && (
                <p className="text-gray-400 mt-1">{profile.location}</p>
              )
            )}
            {profile.website && !editMode && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline mt-2 block"
              >
                {profile.website}
              </a>
            )}
            {editMode && (
              <input
                type="text"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="Website URL"
                className="mt-2 text-sm text-gray-400 bg-transparent border-b border-gray-500 focus:outline-none focus:border-primary"
              />
            )}
          </div>

          {owner && (
            <button
              onClick={() => (editMode ? handleSave() : setEditMode(true))}
              disabled={saving}
              className={`absolute right-0 top-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer ${
                editMode
                  ? "bg-primary text-white hover:bg-primary/80"
                  : "bg-extra hover:bg-primary/20 text-foreground"
              }`}
            >
              {editMode ? (saving ? "Saving..." : "Save") : "Edit Profile"}
            </button>
          )}
        </div>

        {/* Bio Section */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">About</h2>
          {editMode ? (
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full bg-transparent border border-foreground/20 p-2 rounded-lg focus:outline-none focus:border-primary resize-none h-32"
              placeholder="Tell us about yourself..."
            />
          ) : (
            <p className="text-gray-300 leading-relaxed">
              {profile.bio || "No bio yet."}
            </p>
          )}
        </div>

        {/* Preferred Cultures */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">Preferred Cultures</h2>
          {profile.preferred_cultures?.length ? (
            <div className="flex flex-wrap gap-2">
              {profile.preferred_cultures.map((culture) => (
                <span
                  key={culture.id}
                  className={`px-3 py-1 bg-primary/20 text-primary rounded-full text-sm`}
                >
                  {culture.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No preferred cultures yet.</p>
          )}
          {owner && editMode && (
            <div className="mt-2 p-2 rounded text-sm sm:text-base">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setShowCultureSelect(!showCultureSelect)}
              >
                <span>
                  Cultures:{" "}
                  {form.cultures.map((c) => c.name).join(", ") ||
                    "None selected"}
                </span>
                <span className="text-xs text-foreground/50">
                  <svg
                    viewBox={SVGPath.chevron.viewBox}
                    className={`size-5 fill-current transition hover:scale-105 active:scale-95 ${
                      showCultureSelect ? "transform rotate-180" : ""
                    }`}
                  >
                    <path d={SVGPath.chevron.path} />
                  </svg>
                </span>
              </div>
              {showCultureSelect && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto border-t border-gray-300 pt-2">
                  {ownerCultures.map((culture) => {
                    const selected = form.cultures.some(
                      (c) => c.id === culture.id
                    );
                    return (
                      <label
                        key={culture.id}
                        className={`flex items-center space-x-2 cursor-pointer ${
                          selected ? "text-main rounded px-1" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleCulture(culture)}
                        />
                        <span>{culture.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reviews Setting */}
        {owner && editMode ? (
          <div className="mt-8 flex items-center space-x-3">
            <input
              type="checkbox"
              checked={profile.display_reviews_publicly}
              onChange={async (e) => {
                const newValue = e.target.checked;
                await api.patch(`/profiles/${profile.id}/`, {
                  display_reviews_publicly: newValue,
                });
                setProfile({ ...profile, display_reviews_publicly: newValue });
              }}
            />
            <label className="text-sm text-gray-300">
              Display my reviews publicly
            </label>
          </div>
        ) : (
          <div className="mt-8 text-sm text-foreground/50">{`Reviews are currently ${
            profile.display_reviews_publicly ? "public" : "private"
          }`}</div>
        )}
      </div>
    </div>
  );
}
