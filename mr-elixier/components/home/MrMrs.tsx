"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Wordmark } from "@/components/brand/Logo";
import { ProductVisual } from "@/components/bottle/ProductVisual";
import { requestAudience } from "@/lib/events";
import type { Scent } from "@/lib/products";
import styles from "./MrMrs.module.css";

type Pick2 = Pick<Scent, "slug" | "name" | "line" | "tint">;

interface Props {
  mr: { count: number; scents: [Pick2, Pick2] };
  mrs: { count: number; scents: [Pick2, Pick2] };
}

/** Die beiden Linien: MR. ELIXIER für Ihn, MRS. ELIXIER für Sie. */
export function MrMrs({ mr, mrs }: Props) {
  return (
    <section className={styles.section} aria-label="Mr. und Mrs. Elixier">
      <article className={`${styles.panel} ${styles.mr}`}>
        <div className="grain" aria-hidden="true" />
        <div className={styles.copy} data-reveal>
          <p className="eyebrow">Für Ihn</p>
          <Wordmark line="mr" sub={false} className={styles.word} title="Mr. Elixier" />
          <p className={styles.text}>
            Markant, warm und souverän – {mr.count} Herrendüfte von frisch-zitrisch bis tief orientalisch.
          </p>
          <Link href="/#herren" className="btn btn--ghost-light" onClick={() => requestAudience("herren")}>
            Herrendüfte entdecken <span className="arrow">→</span>
          </Link>
        </div>
        <div className={styles.bottles} aria-hidden="true">
          <div className={`${styles.b} ${styles.back}`} style={{ "--d": "0.15s" } as CSSProperties} data-reveal="fade">
            <ProductVisual scent={mr.scents[1]} ml={50} shadow={false} />
          </div>
          <div className={`${styles.b} ${styles.front}`} data-reveal="fade">
            <ProductVisual scent={mr.scents[0]} ml={100} shadow={false} sweep />
          </div>
        </div>
      </article>

      <article className={`${styles.panel} ${styles.mrs}`}>
        <div className={styles.copy} data-reveal>
          <p className="eyebrow">Für Sie</p>
          <Wordmark line="mrs" sub={false} className={styles.word} title="Mrs. Elixier" />
          <p className={styles.text}>
            Elegant, sinnlich und strahlend – {mrs.count} Damendüfte mit eigenem Etikett: MRS.&nbsp;ELIXIER.
          </p>
          <Link href="/#damen" className="btn btn--dark" onClick={() => requestAudience("damen")}>
            Damendüfte entdecken <span className="arrow">→</span>
          </Link>
        </div>
        <div className={styles.bottles} aria-hidden="true">
          <div className={`${styles.b} ${styles.back}`} style={{ "--d": "0.15s" } as CSSProperties} data-reveal="fade">
            <ProductVisual scent={mrs.scents[1]} ml={15} shadow={false} />
          </div>
          <div className={`${styles.b} ${styles.front}`} data-reveal="fade">
            <ProductVisual scent={mrs.scents[0]} ml={50} shadow={false} sweep />
          </div>
        </div>
      </article>
    </section>
  );
}
