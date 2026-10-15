/** Filter der Kollektion von außen setzen (z. B. aus dem Menü „Damen“). */
export type AudienceFilter = "alle" | "herren" | "damen";

export const FILTER_EVENT = "mr-elixier:filter";

export function requestAudience(audience: AudienceFilter) {
  window.dispatchEvent(new CustomEvent<AudienceFilter>(FILTER_EVENT, { detail: audience }));
}
