/**
 * Die Duftliste von Mr. Elixier.
 *
 * Namen, Duftnoten und Beschreibungen sind ein erster Stand und können hier
 * jederzeit geändert werden – die Seite übernimmt alles automatisch.
 *
 * - `line`: welches Etikett auf dem Flakon steht ("mr" = MR. ELIXIER, "mrs" = MRS. ELIXIER)
 * - `tint`: Farbe des Duftes im Flakon (Platzhalter-Illustration)
 * - `soldOut`: als „Ausverkauft“ markieren
 */

export type Line = "mr" | "mrs";
export type Audience = "herren" | "damen" | "unisex";
export type Family = "frisch" | "fruchtig" | "blumig" | "suess" | "orientalisch" | "holzig";

export interface Scent {
  slug: string;
  name: string;
  inspiredBy: string;
  line: Line;
  audience: Audience;
  families: Family[];
  notes: { top: string[]; heart: string[]; base: string[] };
  mood: string;
  tint: string;
  soldOut?: boolean;
}

export const FAMILIES: Record<Family, string> = {
  frisch: "Frisch & Zitrisch",
  fruchtig: "Fruchtig",
  blumig: "Blumig",
  suess: "Süß & Gourmand",
  orientalisch: "Orientalisch & Oud",
  holzig: "Holzig & Würzig",
};

export const AUDIENCES: Record<Audience, string> = {
  herren: "Herren",
  damen: "Damen",
  unisex: "Unisex",
};

const s = (scent: Scent) => scent;

export const SCENTS: Scent[] = [
  s({
    slug: "accento",
    name: "Accento",
    inspiredBy: "Xerjoff",
    line: "mr",
    audience: "herren",
    families: ["fruchtig", "blumig"],
    notes: {
      top: ["Ananas", "Hyazinthe", "Aldehyde"],
      heart: ["Iris", "Jasmin", "Rosa Pfeffer"],
      base: ["Vanille", "Moschus", "Amber", "Patchouli"],
    },
    mood: "Strahlende Ananas trifft cremige Iris – frisch, elegant und mühelos verführerisch.",
    tint: "#ecd9a0",
  }),
  s({
    slug: "afternoon-swim",
    name: "Afternoon Swim",
    inspiredBy: "Louis Vuitton",
    line: "mr",
    audience: "herren",
    families: ["frisch", "fruchtig"],
    notes: {
      top: ["Mandarine", "Bergamotte", "Orange"],
      heart: ["Ingwer"],
      base: ["Ambra"],
    },
    mood: "Ein Sprung ins Meer an einem Sommernachmittag – sonnige Zitrusfrüchte, Ingwer und salzige Ambra.",
    tint: "#f2d886",
  }),
  s({
    slug: "alexandra-ii",
    name: "Alexandra II",
    inspiredBy: "Xerjoff",
    line: "mr",
    audience: "herren",
    families: ["orientalisch", "holzig"],
    notes: {
      top: ["Rosenholz", "Lavendel", "Zimt", "Apfel"],
      heart: ["Rose", "Maiglöckchen", "Zedernholz"],
      base: ["Oud", "Sandelholz", "Amber", "Vanille", "Moschus"],
    },
    mood: "Opulent und majestätisch: Rose und Oud auf einem Bett aus Sandelholz und warmem Amber.",
    tint: "#c98a4b",
  }),
  s({
    slug: "althair",
    name: "Althair",
    inspiredBy: "Parfums de Marly",
    line: "mr",
    audience: "herren",
    families: ["suess", "orientalisch"],
    notes: {
      top: ["Zimt", "Orangenblüte", "Kardamom", "Bergamotte"],
      heart: ["Bourbon-Vanille", "Elemi"],
      base: ["Praline", "Moschus", "Ambroxan", "Guajakholz", "Tonkabohne"],
    },
    mood: "Bourbon-Vanille und Praline, gewürzt mit Zimt und Kardamom – warm, edel und unwiderstehlich.",
    tint: "#dba45a",
  }),
  s({
    slug: "angels-share",
    name: "Angels' Share",
    inspiredBy: "Kilian",
    line: "mr",
    audience: "herren",
    families: ["suess"],
    notes: {
      top: ["Cognac"],
      heart: ["Zimt", "Tonkabohne", "Eichenholz"],
      base: ["Praline", "Vanille", "Sandelholz"],
    },
    mood: "Der Anteil der Engel: Cognac, Zimt und Praline – wie ein warmer Abend am Kaminfeuer.",
    tint: "#c27935",
  }),
  s({
    slug: "arabians-tonka",
    name: "Arabians Tonka",
    inspiredBy: "Montale",
    line: "mr",
    audience: "herren",
    families: ["suess", "orientalisch"],
    notes: {
      top: ["Safran", "Bergamotte"],
      heart: ["Rose", "Oud", "Zucker"],
      base: ["Tonkabohne", "Amber", "Weißer Moschus"],
    },
    mood: "Süße Tonkabohne, Safran und Oud – orientalisch, sinnlich und ausgesprochen langanhaltend.",
    tint: "#b76a33",
  }),
  s({
    slug: "armani",
    name: "Armani",
    inspiredBy: "Acqua di Parma",
    line: "mr",
    audience: "herren",
    families: ["frisch"],
    notes: {
      top: ["Bergamotte", "Zitrone", "Meeresakkord"],
      heart: ["Rosmarin", "Jasmin", "Neroli"],
      base: ["Zedernholz", "Patchouli", "Weißer Moschus"],
    },
    mood: "Mediterrane Frische: Bergamotte, Meeresbrise und helle Hölzer – zeitlos und klar.",
    tint: "#d9e6e1",
  }),
  s({
    slug: "bianco-latte",
    name: "Bianco Latte",
    inspiredBy: "Giardini di Toscana",
    line: "mr",
    audience: "herren",
    families: ["suess"],
    notes: {
      top: ["Karamell", "Kumarin"],
      heart: ["Honig", "Heliotrop"],
      base: ["Vanille", "Weißer Moschus"],
    },
    mood: "Cremig wie warme Milch mit Honig und Karamell – ein samtiger Gourmand zum Hineinkuscheln.",
    tint: "#efdfbf",
  }),
  s({
    slug: "bitter-peach",
    name: "Bitter Peach",
    inspiredBy: "Tom Ford",
    line: "mr",
    audience: "herren",
    families: ["fruchtig", "suess"],
    notes: {
      top: ["Pfirsich", "Blutorange", "Kardamom", "Heliotrop"],
      heart: ["Rum", "Cognac", "Davana", "Jasmin"],
      base: ["Patchouli", "Vanille", "Tonkabohne", "Sandelholz", "Benzoe"],
    },
    mood: "Saftiger Pfirsich, getränkt in Rum und Cognac – fruchtig, berauschend und sinnlich.",
    tint: "#e3995c",
  }),
  s({
    slug: "bleu-de-chanel",
    name: "Bleu de Chanel",
    inspiredBy: "Chanel",
    line: "mr",
    audience: "herren",
    families: ["frisch", "holzig"],
    notes: {
      top: ["Grapefruit", "Zitrone", "Minze", "Rosa Pfeffer"],
      heart: ["Ingwer", "Muskatnuss", "Jasmin"],
      base: ["Weihrauch", "Vetiver", "Zedernholz", "Sandelholz"],
    },
    mood: "Der Klassiker für jeden Tag: frische Zitrusnoten, Weihrauch und edle Hölzer – souverän und vielseitig.",
    tint: "#cddbe2",
  }),
  s({
    slug: "blonde-amber",
    name: "Blonde Amber",
    inspiredBy: "Clive Christian",
    line: "mr",
    audience: "herren",
    families: ["orientalisch", "suess"],
    notes: {
      top: ["Bergamotte", "Ingwer"],
      heart: ["Amber", "Safran"],
      base: ["Vanille", "Benzoe", "Sandelholz"],
    },
    mood: "Goldener Amber, umhüllt von Vanille und Sandelholz – leuchtend, warm und edel.",
    tint: "#e1b46a",
  }),
  s({
    slug: "city-of-stars",
    name: "City of Stars",
    inspiredBy: "Louis Vuitton",
    line: "mr",
    audience: "herren",
    families: ["frisch", "fruchtig"],
    notes: {
      top: ["Blutorange", "Zitrone", "Limette", "Bergamotte"],
      heart: ["Tiaré-Blüte"],
      base: ["Rotes Sandelholz", "Moschus"],
    },
    mood: "Funkelnde Zitrusnoten unter dem Nachthimmel – lebendig, hell und strahlend.",
    tint: "#f2c38a",
  }),
  s({
    slug: "creed-aventus",
    name: "Creed Aventus",
    inspiredBy: "Louis Vuitton",
    line: "mr",
    audience: "herren",
    families: ["fruchtig", "holzig"],
    notes: {
      top: ["Ananas", "Bergamotte", "Schwarze Johannisbeere", "Apfel"],
      heart: ["Birke", "Patchouli", "Jasmin"],
      base: ["Moschus", "Eichenmoos", "Ambra", "Vanille"],
    },
    mood: "Ananas, Birke und Moschus – die Duftlegende für Erfolg und Ausstrahlung.",
    tint: "#e8deb7",
    soldOut: true,
  }),
  s({
    slug: "dark-vanilla",
    name: "Dark Vanilla",
    inspiredBy: "Montale",
    line: "mr",
    audience: "herren",
    families: ["suess"],
    notes: {
      top: ["Orange", "Gewürze"],
      heart: ["Bourbon-Vanille", "Karamell"],
      base: ["Tonkabohne", "Benzoe", "Moschus"],
    },
    mood: "Dunkle, tiefe Vanille mit Karamell und Tonka – süß, dicht und hypnotisch.",
    tint: "#a8652e",
  }),
  s({
    slug: "double-vanilla-spirit",
    name: "Double Vanilla Spirit",
    inspiredBy: "Guerlain Paris",
    line: "mr",
    audience: "herren",
    families: ["suess", "orientalisch"],
    notes: {
      top: ["Rosa Pfeffer", "Bergamotte", "Weihrauch"],
      heart: ["Zedernholz", "Ylang-Ylang", "Rose"],
      base: ["Vanille", "Benzoe", "Tonkabohne"],
    },
    mood: "Rauchiger Weihrauch trifft doppelte Vanille – ein spiritueller, warmer Klassiker.",
    tint: "#c8833f",
  }),
  s({
    slug: "erba-pura",
    name: "Erba Pura",
    inspiredBy: "Xerjoff",
    line: "mr",
    audience: "herren",
    families: ["fruchtig", "frisch"],
    notes: {
      top: ["Sizilianische Orange", "Zitrone", "Bergamotte"],
      heart: ["Fruchtakkord"],
      base: ["Weißer Moschus", "Vanille", "Amber"],
    },
    mood: "Ein Korb voller sonnengereifter Früchte auf weißem Moschus – saftig, strahlend, unverwechselbar.",
    tint: "#f1d67a",
    soldOut: true,
  }),
  s({
    slug: "god-of-fire",
    name: "God of Fire",
    inspiredBy: "SHL",
    line: "mr",
    audience: "herren",
    families: ["fruchtig", "holzig"],
    notes: {
      top: ["Mango", "Ingwer", "Rote Beeren"],
      heart: ["Leder", "Amber"],
      base: ["Sandelholz", "Moschus"],
    },
    mood: "Feurige Mango und Ingwer auf Leder und Moschus – exotisch, kraftvoll, unvergesslich.",
    tint: "#e6a24e",
  }),
  s({
    slug: "grand-soir",
    name: "Grand Soir",
    inspiredBy: "Maison Francis Kurkdjian",
    line: "mr",
    audience: "herren",
    families: ["orientalisch", "suess"],
    notes: {
      top: ["Zistrose", "Benzoe"],
      heart: ["Amber"],
      base: ["Tonkabohne", "Vanille"],
    },
    mood: "Ein großer Abend in Paris: leuchtender Amber, Benzoe und Tonka – warm, elegant, glamourös.",
    tint: "#c97e3b",
  }),
  s({
    slug: "hibiscus-mahajad",
    name: "Hibiscus Mahajad",
    inspiredBy: "Maison Crivelli",
    line: "mr",
    audience: "herren",
    families: ["blumig", "orientalisch"],
    notes: {
      top: ["Rosa Pfeffer", "Hibiskus"],
      heart: ["Rose", "Dattel"],
      base: ["Leder", "Amber", "Patchouli"],
    },
    mood: "Tiefroter Hibiskus und Rose, umhüllt von Leder und Datteln – ein sinnlicher Orient.",
    tint: "#b4554d",
  }),
  s({
    slug: "imagination",
    name: "Imagination",
    inspiredBy: "Louis Vuitton",
    line: "mr",
    audience: "herren",
    families: ["frisch", "holzig"],
    notes: {
      top: ["Zitronat", "Bergamotte", "Orange"],
      heart: ["Ingwer", "Zimt", "Neroli"],
      base: ["Schwarzer Tee", "Ambroxan", "Guajakholz", "Weihrauch"],
    },
    mood: "Strahlende Zitrusfrüchte, schwarzer Tee und ein Hauch Zimt – frisch, edel und modern.",
    tint: "#ede0b1",
  }),
  s({
    slug: "intense-cafe",
    name: "Intense Cafe",
    inspiredBy: "Montale",
    line: "mr",
    audience: "herren",
    families: ["suess", "orientalisch"],
    notes: {
      top: ["Rose"],
      heart: ["Kaffee"],
      base: ["Vanille", "Amber", "Weißer Moschus"],
    },
    mood: "Frisch gerösteter Kaffee, Rose und Vanille – cremig, aromatisch und betörend.",
    tint: "#8b5128",
  }),
  s({
    slug: "layton",
    name: "Layton",
    inspiredBy: "Parfums de Marly",
    line: "mr",
    audience: "herren",
    families: ["holzig", "suess"],
    notes: {
      top: ["Apfel", "Lavendel", "Bergamotte", "Mandarine"],
      heart: ["Geranie", "Veilchen", "Jasmin"],
      base: ["Vanille", "Kardamom", "Sandelholz", "Guajakholz", "Patchouli"],
    },
    mood: "Knackiger Apfel, Lavendel und Vanille – der elegante Allrounder mit königlicher Ausstrahlung.",
    tint: "#e8c67e",
  }),
  s({
    slug: "les-sables-roses",
    name: "Les Sables Roses",
    inspiredBy: "Louis Vuitton",
    line: "mr",
    audience: "unisex",
    families: ["orientalisch", "blumig"],
    notes: {
      top: ["Safran"],
      heart: ["Rose"],
      base: ["Oud", "Ambra", "Weißer Moschus"],
    },
    mood: "Rosafarbene Dünen im Abendlicht: Rose, Oud und Ambra – zart und doch voller Tiefe.",
    tint: "#e2a898",
  }),
  s({
    slug: "lost-cherry",
    name: "Lost Cherry",
    inspiredBy: "Tom Ford",
    line: "mr",
    audience: "herren",
    families: ["fruchtig", "suess"],
    notes: {
      top: ["Schwarzkirsche", "Kirschlikör", "Bittermandel"],
      heart: ["Türkische Rose", "Jasmin"],
      base: ["Perubalsam", "Tonkabohne", "Sandelholz", "Vetiver", "Zedernholz"],
    },
    mood: "Verführerische Schwarzkirsche mit Bittermandel und Likör – süß, verboten, unvergesslich.",
    tint: "#a6323a",
  }),
  s({
    slug: "narcotic-delight",
    name: "Narcotic Delight",
    inspiredBy: "Initio",
    line: "mr",
    audience: "herren",
    families: ["fruchtig", "suess"],
    notes: {
      top: ["Kirsche", "Cognac"],
      heart: ["Zimt", "Schwarzer Pfeffer"],
      base: ["Vanille", "Tonkabohne", "Benzoe"],
    },
    mood: "Kirsche und Cognac auf warmer Vanille – ein berauschend süßer Duft für die Nacht.",
    tint: "#9c3e2f",
  }),
  s({
    slug: "naxos",
    name: "Naxos",
    inspiredBy: "Xerjoff",
    line: "mr",
    audience: "herren",
    families: ["suess", "holzig"],
    notes: {
      top: ["Lavendel", "Bergamotte", "Zitrone"],
      heart: ["Honig", "Zimt", "Kaschmirholz", "Jasmin"],
      base: ["Tabakblätter", "Tonkabohne", "Vanille"],
    },
    mood: "Honig, Tabak und Lavendel unter sizilianischer Sonne – ein warmer, eleganter Meisterduft.",
    tint: "#d69a45",
  }),
  s({
    slug: "oajan",
    name: "Oajan",
    inspiredBy: "Parfums de Marly",
    line: "mr",
    audience: "herren",
    families: ["suess", "orientalisch"],
    notes: {
      top: ["Zimt"],
      heart: ["Honig", "Osmanthus"],
      base: ["Labdanum", "Benzoe", "Vanille", "Tonkabohne"],
    },
    mood: "Zimt, Honig und Benzoe – opulent, wärmend und wie gemacht für kalte Tage.",
    tint: "#c6782f",
  }),
  s({
    slug: "ombre-nomade",
    name: "Ombre Nomade",
    inspiredBy: "Louis Vuitton",
    line: "mr",
    audience: "herren",
    families: ["orientalisch", "holzig"],
    notes: {
      top: ["Himbeere", "Safran"],
      heart: ["Rose", "Geranie"],
      base: ["Oud", "Weihrauch", "Benzoe", "Birke"],
    },
    mood: "Rauchiges Oud, Weihrauch und Rose wie ein Schatten in der Wüste – mystisch und intensiv.",
    tint: "#7e4829",
  }),
  s({
    slug: "orange-flamingo",
    name: "Orange Flamingo",
    inspiredBy: "Marc Gebauer",
    line: "mr",
    audience: "herren",
    families: ["fruchtig", "suess"],
    notes: {
      top: ["Blutorange", "Mandarine"],
      heart: ["Pfirsich", "Orangenblüte"],
      base: ["Vanille", "Moschus"],
    },
    mood: "Sonnige Orange, saftiger Pfirsich und Vanille – verspielt, fröhlich und voller Energie.",
    tint: "#efa05a",
  }),
  s({
    slug: "oud-maracuja",
    name: "Oud Maracuja",
    inspiredBy: "Maison Crivelli",
    line: "mr",
    audience: "herren",
    families: ["fruchtig", "orientalisch"],
    notes: {
      top: ["Maracuja", "Safran"],
      heart: ["Türkische Rose"],
      base: ["Oud", "Leder", "Patchouli"],
    },
    mood: "Exotische Maracuja trifft dunkles Oud und Leder – ein kühner, tropischer Kontrast.",
    tint: "#c8893a",
  }),
  s({
    slug: "oud-satin-mood",
    name: "Oud Satin Mood",
    inspiredBy: "MFK",
    line: "mr",
    audience: "herren",
    families: ["orientalisch", "blumig"],
    notes: {
      top: ["Veilchen"],
      heart: ["Rose", "Oud"],
      base: ["Vanille", "Benzoe", "Amber"],
    },
    mood: "Samtige Rose und Veilchen auf Oud und Vanille – weich wie Satin, tief wie die Nacht.",
    tint: "#b4673f",
  }),
  s({
    slug: "pacific-chill",
    name: "Pacific Chill",
    inspiredBy: "Louis Vuitton",
    line: "mr",
    audience: "herren",
    families: ["frisch", "fruchtig"],
    notes: {
      top: ["Zitrone", "Minze", "Schwarze Johannisbeere"],
      heart: ["Basilikum", "Aprikose", "Feige"],
      base: ["Ambrette", "Moschus"],
    },
    mood: "Ein kühler Morgen am Pazifik: Zitrone, Minze und Johannisbeere – belebend und sauber.",
    tint: "#d8e7d0",
  }),
  s({
    slug: "red-tobacco",
    name: "Red Tobacco",
    inspiredBy: "Mancera",
    line: "mr",
    audience: "herren",
    families: ["orientalisch", "holzig"],
    notes: {
      top: ["Zimt", "Safran", "Muskatnuss", "Apfel"],
      heart: ["Tabak", "Patchouli", "Jasmin"],
      base: ["Vanille", "Oud", "Amber", "Sandelholz", "Weißer Moschus"],
    },
    mood: "Würziger Tabak, Oud und Zimt mit einem Hauch Apfel – kraftvoll, intensiv und markant.",
    tint: "#92402b",
  }),
  s({
    slug: "side-effect",
    name: "Side Effect",
    inspiredBy: "Initio",
    line: "mr",
    audience: "herren",
    families: ["suess", "orientalisch"],
    notes: {
      top: ["Rum"],
      heart: ["Tabak", "Zimt"],
      base: ["Vanille", "Tonkabohne"],
    },
    mood: "Rum, Tabak und Vanille – süchtig machend, rauchig-süß und mit enormer Ausstrahlung.",
    tint: "#a0592c",
  }),
  s({
    slug: "starry-nights",
    name: "Starry Nights",
    inspiredBy: "Montale",
    line: "mr",
    audience: "herren",
    families: ["fruchtig", "holzig"],
    notes: {
      top: ["Zitrone", "Ananas", "Schwarze Johannisbeere"],
      heart: ["Rose", "Jasmin", "Patchouli"],
      base: ["Birke", "Moschus", "Vanille"],
    },
    mood: "Ein funkelnder Nachthimmel aus Zitrusfrüchten, Ananas und Moschus – frisch und geheimnisvoll.",
    tint: "#e5d69e",
  }),
  s({
    slug: "tobacco-vanille",
    name: "Tobacco Vanille",
    inspiredBy: "Tom Ford",
    line: "mr",
    audience: "herren",
    families: ["suess", "orientalisch"],
    notes: {
      top: ["Tabakblätter", "Gewürze"],
      heart: ["Vanille", "Kakao", "Tonkabohne", "Tabakblüte"],
      base: ["Trockenfrüchte", "Hölzer"],
    },
    mood: "Tabakblätter, Vanille und Kakao – ein luxuriöser Klassiker wie aus einem Gentlemen's Club.",
    tint: "#995427",
  }),
  s({
    slug: "torino-21",
    name: "Torino 21",
    inspiredBy: "Xerjoff",
    line: "mr",
    audience: "herren",
    families: ["frisch"],
    notes: {
      top: ["Zitrone", "Minze", "Basilikum"],
      heart: ["Lavendel", "Kamille"],
      base: ["Moschus", "Hölzer"],
    },
    mood: "Zitrone, Minze und Basilikum – spritzig, grün und unglaublich erfrischend.",
    tint: "#e1eac3",
  }),
  s({
    slug: "vibrato",
    name: "Vibrato",
    inspiredBy: "Sospiro",
    line: "mr",
    audience: "herren",
    families: ["frisch", "fruchtig"],
    notes: {
      top: ["Bergamotte", "Mandarine", "Grapefruit"],
      heart: ["Jasmin", "Rose"],
      base: ["Moschus", "Amber", "Vetiver"],
    },
    mood: "Lebendige Zitrusnoten, die auf der Haut vibrieren – elegant, sauber und strahlend.",
    tint: "#eee1a4",
  }),

  // ------------------------------------------------------------ Damendüfte
  s({
    slug: "valaya",
    name: "Valaya",
    inspiredBy: "Parfums de Marly",
    line: "mrs",
    audience: "damen",
    families: ["blumig", "fruchtig"],
    notes: {
      top: ["Aldehyde", "Weißer Pfirsich", "Bergamotte"],
      heart: ["Orangenblüte", "Iris"],
      base: ["Weißer Moschus", "Vanille", "Hölzer"],
    },
    mood: "Weißer Pfirsich, Orangenblüte und Moschus – zart, sauber und von stiller Eleganz.",
    tint: "#f1dac9",
  }),
  s({
    slug: "delina",
    name: "Delina",
    inspiredBy: "Parfums de Marly",
    line: "mrs",
    audience: "damen",
    families: ["blumig", "fruchtig"],
    notes: {
      top: ["Litschi", "Rhabarber", "Bergamotte", "Muskatnuss"],
      heart: ["Türkische Rose", "Pfingstrose", "Vanille"],
      base: ["Kaschmirholz", "Weihrauch", "Vetiver"],
    },
    mood: "Türkische Rose, Litschi und Rhabarber – romantisch, frisch und unverwechselbar feminin.",
    tint: "#efb6bb",
  }),
  s({
    slug: "prada-paradoxe",
    name: "Prada Paradoxe",
    inspiredBy: "Prada",
    line: "mrs",
    audience: "damen",
    families: ["blumig", "suess"],
    notes: {
      top: ["Birne", "Bergamotte", "Mandarine"],
      heart: ["Neroli", "Jasmin", "Orangenblüte"],
      base: ["Amber", "Bourbon-Vanille", "Weißer Moschus"],
    },
    mood: "Neroli und Jasmin auf Amber und Vanille – modern, vielschichtig und voller Selbstbewusstsein.",
    tint: "#f0c2a6",
  }),
  s({
    slug: "vanilla-sex",
    name: "Vanilla Sex",
    inspiredBy: "Tom Ford",
    line: "mrs",
    audience: "damen",
    families: ["suess"],
    notes: {
      top: ["Bittermandel", "Ambrette"],
      heart: ["Vanille-Absolue"],
      base: ["Tonkabohne", "Sandelholz", "Moschus"],
    },
    mood: "Pure, cremige Vanille mit Mandel und Sandelholz – sinnlich, weich und hautnah.",
    tint: "#ebcd99",
  }),
  s({
    slug: "good-girl-blush",
    name: "Good Girl Blush",
    inspiredBy: "Carolina Herrera",
    line: "mrs",
    audience: "damen",
    families: ["blumig", "suess"],
    notes: {
      top: ["Bergamotte"],
      heart: ["Pfingstrose", "Ylang-Ylang"],
      base: ["Vanille", "Tonkabohne"],
    },
    mood: "Pudrige Pfingstrose und Vanille mit einem Hauch Bergamotte – feminin, zart und verspielt.",
    tint: "#efc0c3",
  }),
  s({
    slug: "scandal",
    name: "Scandal",
    inspiredBy: "Jean Paul Gaultier",
    line: "mrs",
    audience: "damen",
    families: ["blumig", "suess"],
    notes: {
      top: ["Blutorange", "Mandarine"],
      heart: ["Honig", "Gardenie", "Orangenblüte", "Jasmin"],
      base: ["Bienenwachs", "Karamell", "Patchouli"],
    },
    mood: "Honig, Gardenie und Blutorange – frech, verführerisch und ein kleiner Skandal.",
    tint: "#efb578",
  }),
];

const BY_SLUG = new Map(SCENTS.map((scent) => [scent.slug, scent]));

export function getScent(slug: string): Scent | undefined {
  return BY_SLUG.get(slug);
}

/** Herren- bzw. Damen-Filter: Unisex-Düfte erscheinen in beiden. */
export function matchesAudience(scent: Scent, audience: "herren" | "damen"): boolean {
  return scent.audience === audience || scent.audience === "unisex";
}

/** Ähnliche Düfte: gleiche Duftfamilie, bevorzugt gleiche Linie. */
export function relatedScents(scent: Scent, count = 4): Scent[] {
  const score = (other: Scent) =>
    other.families.filter((f) => scent.families.includes(f)).length * 2 +
    (other.line === scent.line ? 1 : 0) +
    (other.families[0] === scent.families[0] ? 1 : 0) -
    (other.soldOut ? 3 : 0);
  return SCENTS.filter((other) => other.slug !== scent.slug)
    .map((other) => ({ other, score: score(other) }))
    .sort((a, b) => b.score - a.score || a.other.name.localeCompare(b.other.name, "de"))
    .slice(0, count)
    .map(({ other }) => other);
}

/** Düfte, die im Hero-Bereich der Startseite rotieren. */
export const HERO_SCENTS = ["layton", "lost-cherry", "delina", "tobacco-vanille", "bleu-de-chanel", "oud-satin-mood"];
