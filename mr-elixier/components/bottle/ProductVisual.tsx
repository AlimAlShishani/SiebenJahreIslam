"use client";

import Image from "next/image";
import type { SizeMl } from "@/lib/config";
import type { Scent } from "@/lib/products";
import { Bottle, BOTTLE_ASPECT } from "./Bottle";
import { usePhoto } from "./PhotoContext";
import styles from "./ProductVisual.module.css";

interface Props {
  scent: Pick<Scent, "slug" | "name" | "line" | "tint">;
  ml: SizeMl;
  sweep?: boolean;
  shadow?: boolean;
  /** `sizes`-Attribut für Fotos */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/** Zeigt das Produktfoto, sobald eines hinterlegt ist – sonst die Flakon-Illustration. */
export function ProductVisual({ scent, ml, sweep, shadow, sizes = "(min-width: 900px) 25vw, 50vw", priority, className }: Props) {
  const photo = usePhoto(scent.slug, ml);
  if (photo) {
    return (
      <div className={[styles.photo, className].filter(Boolean).join(" ")} style={{ aspectRatio: BOTTLE_ASPECT[ml] }}>
        <Image
          src={photo}
          alt={`${scent.line === "mrs" ? "Mrs." : "Mr."} Elixier ${scent.name}, ${ml} ml`}
          fill
          sizes={sizes}
          priority={priority}
          className={styles.img}
        />
      </div>
    );
  }
  return <Bottle ml={ml} name={scent.name} line={scent.line} tint={scent.tint} sweep={sweep} shadow={shadow} className={className} />;
}
