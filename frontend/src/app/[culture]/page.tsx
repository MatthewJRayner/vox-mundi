"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { Map as LeafletMap, LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useParams } from "next/navigation";

import api from "@/lib/api";
import { SVGPath } from "@/utils/path";
import useLeafletIcons from "@/utils/useLeafletIcons";
import { MapPin, MapPreferences } from "@/types/map";
import { Period } from "@/types/culture";

import CultureCalendarWeek from "@/components/cultures/CultureCalenderWeek";
import MapPinFormModal from "@/components/cultures/MapPinForm";
import MapPinDetailModal from "@/components/cultures/MapPinDetailModal";

export default function CulturePage() {
  const { culture } = useParams();

  useLeafletIcons();

  const [mapPins, setMapPins] = useState<MapPin[]>([]);
  const [mapPreferences, setMapPreferences] = useState<MapPreferences | null>(
    null
  );
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

  // Pin placement
  const [placingPin, setPlacingPin] = useState(false);
  const [newPinLocation, setNewPinLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [showPinDetailModal, setShowPinDetailModal] = useState(false);

  const mapRef = useRef<LeafletMap | null>(null);

  const fetchData = useCallback(async () => {
    if (!culture) return;
    try {
      setLoading(true);
      const [pinsRes, prefsRes, periodRes] = await Promise.all([
        api.get(`/map-pins/?code=${culture}`),
        api.get(`/map-preferences/?code=${culture}`),
        api.get(`/periods/?code=${culture}&key=history`),
      ]);
      setMapPins(pinsRes.data);
      setMapPreferences(prefsRes.data[0] ?? null);
      setPeriods(periodRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [culture]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPins = mapPins.filter((pin) => {
    const filterOk = !selectedFilter || pin.filter === selectedFilter;
    const periodOk = !selectedPeriod || pin.period?.id === selectedPeriod;
    return filterOk && periodOk;
  });

  const handleFilterFilter = (filter: string) =>
    setSelectedFilter((prev) => (prev === filter ? null : filter));
  const handlePeriodFilter = (id: number) =>
    setSelectedPeriod((prev) => (prev === id ? null : id));

  const handlePinClick = (pin: MapPin) => {
    setSelectedPin(pin);
    setShowPinDetailModal(true);
  };

  const handleSetCenter = async () => {
    const map = mapRef.current;
    if (!map || !mapPreferences) return;
    const { lat, lng } = map.getCenter();
    const zoom = map.getZoom();
    try {
      await api.put(`/map-preferences/${mapPreferences.id}/`, {
        center: { lat, lng },
        zoom,
      });
    } catch {
      console.error("Failed to save center.");
    }
  };

  const handleAddPinSuccess = () => {
    fetchData();
    setNewPinLocation(null);
  };

  const MapClickHandler = () => {
    useMapEvents({
      click(e: LeafletMouseEvent) {
        if (placingPin) {
          setNewPinLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
          setShowPinModal(true);
          setPlacingPin(false);
        }
      },
    });
    return null;
  };

  if (loading) return <div className="p-4">Loading…</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <main className="min-h-screen p-4 w-full space-y-6">
      <CultureCalendarWeek cultureCode={culture?.toString() || "eng"} />

      <div className="flex flex-col lg:flex-row gap-4">
        <section className="flex-1 bg-white rounded-xl shadow relative">
          <MapContainer
            center={
              mapPreferences?.center
                ? [mapPreferences.center.lat, mapPreferences.center.lng]
                : [0, 0]
            }
            zoom={mapPreferences?.zoom ?? 5}
            className="h-[600px] rounded-xl z-0"
            ref={mapRef as React.MutableRefObject<LeafletMap>}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filteredPins.map((pin) => (
              <Marker
                key={pin.id}
                position={[pin.loc.lat, pin.loc.lng]}
                eventHandlers={{ click: () => handlePinClick(pin) }}
              />
            ))}
            {newPinLocation && (
              <Marker position={[newPinLocation.lat, newPinLocation.lng]} />
            )}
            <MapClickHandler />
          </MapContainer>

          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={handleSetCenter}
              className="bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary/90 cursor-pointer"
            >
              Save Center
            </button>
            <button
              onClick={() => setPlacingPin(!placingPin)}
              className={`px-3 py-2 rounded-lg shadow text-white cursor-pointer active:scale-90 ${
                placingPin
                  ? "bg-green-600 hover:bg-green-600/90"
                  : "bg-extra hover:bg-extra/90"
              }`}
            >
              {placingPin ? (
                "Click Map"
              ) : (
                <svg
                  viewBox={SVGPath.add.viewBox}
                  className="size-4 fill-current text-foreground cursor-pointer hover:scale-110 hover:opacity-80 active:scale-95 transition"
                >
                  <path d={SVGPath.add.path} />
                </svg>
              )}
            </button>
          </div>
        </section>
        <aside className="w-full lg:w-1/4 bg-extra rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">Filters</h3>
          <ul className="space-y-2 flex flex-col items-center lg:items-start w-full">
            {[
              { value: "landmark", label: "Landmark" },
              { value: "event", label: "Event" },
              { value: "travel", label: "Travel" },
              { value: "figure", label: "Figure" },
              { value: "artwork", label: "Artwork" },
              { value: "other", label: "Other" },
            ].map(({ value, label }) => {
              const count = mapPins.filter((p) => p.filter === value).length;
              const isSelected = selectedFilter === value;
              const hasNoPins = count === 0;

              return (
                <li key={value} className="w-full">
                  <button
                    onClick={() => handleFilterFilter(value)}
                    className={`w-full text-left rounded-md px-3 py-1.5 transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? hasNoPins
                          ? "bg-red-200/20 text-red-400"
                          : "bg-primary/20 text-primary"
                        : "hover:bg-extra/80"
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected && hasNoPins && (
                      <svg
                        viewBox={SVGPath.close.viewBox}
                        className={`size-4 fill-current transition hover:scale-105 active:scale-95`}
                      >
                        <path d={SVGPath.close.path} />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      <div className="flex justify-center gap-2 flex-wrap">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePeriodFilter(p.id || 0)}
            className={`px-3 py-2 rounded-md transition text-sm cursor-pointer ${
              selectedPeriod === p.id
                ? "bg-primary text-white"
                : "bg-extra hover:bg-extra/80"
            }`}
          >
            {p.title}
          </button>
        ))}
        {!periods && (
          <p className="text-foreground/50">No periods available.</p>
        )}
      </div>

      {showPinModal && newPinLocation && (
        <MapPinFormModal
          latPin={newPinLocation.lat}
          lngPin={newPinLocation.lng}
          cultureCode={culture?.toString() || "eng"}
          onClose={() => {
            setShowPinModal(false);
            setNewPinLocation(null);
          }}
          onSuccess={handleAddPinSuccess}
        />
      )}

      {showPinDetailModal && selectedPin && (
        <MapPinDetailModal
          pin={selectedPin}
          cultureCode={culture?.toString() || "eng"}
          onClose={() => {
            setSelectedPin(null);
            setShowPinDetailModal(false);
          }}
          onSuccess={() => {
            setShowPinDetailModal(false);
            fetchData();
          }}
        />
      )}
    </main>
  );
}
