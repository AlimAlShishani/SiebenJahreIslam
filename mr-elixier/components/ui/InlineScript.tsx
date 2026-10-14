"use client";

/**
 * Inline-Script, das vor dem ersten Paint läuft. Auf dem Client wird es als
 * `text/plain` gerendert, damit React nicht vor einem Script-Tag warnt
 * (Muster aus der Next.js-Doku „Preventing flash before hydration“).
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
