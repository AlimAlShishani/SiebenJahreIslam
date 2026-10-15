"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PhotoMap } from "@/lib/photos";

const PhotoContext = createContext<PhotoMap>({});

export function PhotoProvider({ photos, children }: { photos: PhotoMap; children: ReactNode }) {
  return <PhotoContext.Provider value={photos}>{children}</PhotoContext.Provider>;
}

/** Alle hinterlegten Produktfotos */
export function usePhotoMap(): PhotoMap {
  return useContext(PhotoContext);
}

/** Foto-URL für Duft + Größe, falls vorhanden (sonst wird die Illustration gezeigt). */
export function usePhoto(slug: string, ml: number): string | undefined {
  const set = useContext(PhotoContext)[slug];
  return set?.[String(ml) as "15" | "50" | "100"] ?? set?.all;
}
