"use client";

import { useEffect } from "react";
import L, { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Hook to patch Leaflet’s default marker icons in Next.js (avoids broken images)
 * Runs once on mount, fully typed, no 'any'.
 */
export default function useLeafletIcons() {
  useEffect(() => {
    const DefaultIcon = L.icon({
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    // Apply globally
    (Icon.Default as typeof Icon.Default).prototype.options =
      DefaultIcon.options;
  }, []);
}
