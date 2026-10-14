import { Collection } from "@/components/home/Collection";
import { Essence } from "@/components/home/Essence";
import { Faq } from "@/components/home/Faq";
import { Formats } from "@/components/home/Formats";
import { Hero } from "@/components/home/Hero";
import { Intro } from "@/components/home/Intro";
import { Marquee } from "@/components/home/Marquee";
import { MrMrs } from "@/components/home/MrMrs";
import { Ritual } from "@/components/home/Ritual";
import { SHOP } from "@/lib/config";
import { HERO_SCENTS, SCENTS, getScent, matchesAudience, type Scent } from "@/lib/products";

function pick(slug: string): Scent {
  const scent = getScent(slug);
  if (!scent) throw new Error(`Unbekannter Duft: ${slug}`);
  return scent;
}

export default function HomePage() {
  const heroScents = HERO_SCENTS.map(pick).map(({ slug, name, line, tint, inspiredBy }) => ({ slug, name, line, tint, inspiredBy }));
  const lite = (s: Scent) => ({ slug: s.slug, name: s.name, line: s.line, tint: s.tint });

  return (
    <>
      <Intro />
      <Hero scents={heroScents} total={SCENTS.length} />
      <Marquee
        items={[
          "Extrait de Parfum",
          `${SHOP.oilContent} % Duftöl`,
          "Von Hand verpackt",
          "15 · 50 · 100 ml",
          "Für Sie & Ihn",
          "Persönlich versendet",
        ]}
      />
      <Essence />
      <MrMrs
        mr={{
          count: SCENTS.filter((s) => matchesAudience(s, "herren")).length,
          scents: [lite(pick("tobacco-vanille")), lite(pick("bleu-de-chanel"))],
        }}
        mrs={{
          count: SCENTS.filter((s) => matchesAudience(s, "damen")).length,
          scents: [lite(pick("delina")), lite(pick("scandal"))],
        }}
      />
      <Collection scents={SCENTS} />
      <Formats small={lite(pick("lost-cherry"))} medium={lite(pick("layton"))} large={lite(pick("tobacco-vanille"))} />
      <Ritual />
      <Faq />
    </>
  );
}
