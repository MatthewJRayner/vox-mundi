// app/culture/[culture]/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import useLeafletIcons from "@/utils/useLeafletIcons";
import { MapPin, MapPreferences } from "@/types/map";
import { Period } from "@/types/culture";
import CultureCalendarWeek from "@/components/mainCulturePage/CultureCalenderWeek";
import MapPinFormModal from "@/components/mainCulturePage/MapPinForm";
import { SVGPath } from "@/utils/path";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { Map as LeafletMap, LeafletMouseEvent } from "leaflet";
import "leaflet/dist/leaflet.css";

export default function CulturePage() {
  const { culture } = useParams();

  useLeafletIcons();

  // Data
  const [mapPins, setMapPins] = useState<MapPin[]>([]);
  const [mapPreferences, setMapPreferences] = useState<MapPreferences | null>(
    null
  );
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);

  // Pin placement
  const [placingPin, setPlacingPin] = useState(false);
  const [newPinLocation, setNewPinLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);

  const mapRef = useRef<LeafletMap | null>(null);

  // Fetch data
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

  // Filters
  const filteredPins = mapPins.filter((pin) => {
    const typeOk = !selectedType || pin.type === selectedType;
    const periodOk = !selectedPeriod || pin.period?.id === selectedPeriod;
    return typeOk && periodOk;
  });

  const handleTypeFilter = (type: string) =>
    setSelectedType((prev) => (prev === type ? null : type));
  const handlePeriodFilter = (id: number) =>
    setSelectedPeriod((prev) => (prev === id ? null : id));

  const handlePinClick = (pin: MapPin) => console.log("Pin:", pin);

  // Save map center
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

  // Add pin success callback
  const handleAddPinSuccess = () => {
    fetchData();
    setNewPinLocation(null);
  };

  // Capture map clicks only when placingPin = true
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
        {/* Sidebar */}
        <aside className="w-full lg:w-1/4 bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-2">Pin Filters</h3>
          <ul className="space-y-2">
            {Array.from(new Set(mapPins.map((p) => p.type))).map((type) => (
              <li key={type}>
                <button
                  onClick={() => handleTypeFilter(type)}
                  className={`w-full text-center rounded-md px-2 py-1 transition cursor-pointer ${
                    selectedType === type ? "bg-blue-200" : "hover:bg-gray-100"
                  }`}
                >
                  {type}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Map */}
        <section className="flex-1 bg-white rounded-xl shadow relative">
          <MapContainer
            center={
              mapPreferences?.center
                ? [mapPreferences.center.lat, mapPreferences.center.lng]
                : [0, 0]
            }
            zoom={mapPreferences?.zoom ?? 5}
            className="h-[600px] rounded-b-xl z-0"
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
      </div>

      {/* Period Filter */}
      <div className="flex justify-center gap-2 flex-wrap">
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePeriodFilter(p.id || 0)}
            className={`px-3 py-2 rounded-md transition text-sm cursor-pointer ${
              selectedPeriod === p.id
                ? "bg-blue-300"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Map Pin Form Modal */}
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
    </main>
  );
}
