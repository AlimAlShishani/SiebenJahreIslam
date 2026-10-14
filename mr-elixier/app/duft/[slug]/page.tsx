import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductDetail } from "@/components/product/ProductDetail";
import { Pyramid } from "@/components/product/Pyramid";
import { SHOP } from "@/lib/config";
import { SCENTS, getScent, relatedScents } from "@/lib/products";
import styles from "./page.module.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return SCENTS.map((scent) => ({ slug: scent.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const scent = getScent(slug);
  if (!scent) return {};
  const line = scent.line === "mrs" ? "Mrs. Elixier" : "Mr. Elixier";
  return {
    title: `${scent.name} – Extrait de Parfum`,
    description: `${line} ${scent.name}: ${scent.mood} ${SHOP.oilContent} % Duftöl, erhältlich in 15, 50 und 100 ml.`,
    alternates: { canonical: `/duft/${scent.slug}` },
  };
}

export default async function ScentPage({ params }: Props) {
  const { slug } = await params;
  const scent = getScent(slug);
  if (!scent) notFound();
  const related = relatedScents(scent, 4);

  return (
    <>
      <ProductDetail scent={scent} />
      <Pyramid scent={scent} />
      <section className={`section ${styles.related}`} aria-labelledby="related-title">
        <div className="container">
          <div className={styles.head}>
            <p className="eyebrow eyebrow--line" data-reveal>
              Passend dazu
            </p>
            <h2 id="related-title" className="h2" data-reveal>
              Das könnte dir <em>auch gefallen.</em>
            </h2>
          </div>
          <div className={styles.grid}>
            {related.map((item, i) => (
              <ProductCard key={item.slug} scent={item} index={i} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
