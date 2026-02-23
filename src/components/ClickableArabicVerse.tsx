import { useLayoutEffect, useRef, useState } from 'react';
import { getRunsWithOffsets } from '../utils/arabicLetters';

export type Rect = { letterIndex: number; left: number; top: number; width: number; height: number };

type Props = {
  content: string;
  selectedIndices: Set<number>;
  onToggle: (letterIndex: number) => void;
  disabled?: boolean;
  className?: string;
  /** Für Markierung: CSS-Klasse wenn ausgewählt */
  selectedClassName?: string;
  /** Nach falscher Antwort: richtige Indizes anzeigen (grün), falsch markierte (rot) */
  correctIndices?: Set<number> | number[];
  showFeedback?: boolean;
};

/**
 * Zeigt arabischen Text als verbundenen Satz (ein Block), darüber klickbare
 * Overlays pro Buchstabe (per Range-API gemessen). So bleibt die Schrift verbunden.
 */
export function ClickableArabicVerse({
  content,
  selectedIndices,
  onToggle,
  disabled = false,
  className = '',
  selectedClassName = 'bg-amber-400/35 dark:bg-amber-500/40',
  correctIndices,
  showFeedback = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const correctSet = correctIndices instanceof Set ? correctIndices : new Set(correctIndices ?? []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl || !content) {
      setRects([]);
      return;
    }
    const textNode = textEl.firstChild;
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
      setRects([]);
      return;
    }

    const runs = getRunsWithOffsets(content).filter((r): r is typeof r & { letterIndex: number } => r.letterIndex !== undefined);
    const measure: Rect[] = [];
    const containerRect = container.getBoundingClientRect();

    for (const run of runs) {
      try {
        const range = document.createRange();
        range.setStart(textNode, run.start);
        range.setEnd(textNode, run.end);
        const r = range.getBoundingClientRect();
        measure.push({
          letterIndex: run.letterIndex,
          left: r.left - containerRect.left,
          top: r.top - containerRect.top,
          width: r.width,
          height: r.height,
        });
      } catch {
        // Ignore if range fails (e.g. offset out of bounds)
      }
    }
    setRects(measure);
  }, [content]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        ref={textRef}
        className="font-quran text-3xl md:text-4xl leading-loose text-center text-emerald-900 dark:text-emerald-200 select-none pointer-events-none"
        dir="rtl"
      >
        {content}
      </div>
      {rects.map(({ letterIndex, left, top, width, height }) => {
        const isSelected = selectedIndices.has(letterIndex);
        const isCorrect = correctSet.has(letterIndex);
        const showAsCorrectMarked = showFeedback && isCorrect && isSelected;   // richtig markiert → grün
        const showAsCorrectMissed = showFeedback && isCorrect && !isSelected;  // richtig, aber nicht markiert → gelb-grün
        const showAsWrong = showFeedback && isSelected && !isCorrect;           // falsch markiert → rot
        let btnClass = 'absolute rounded-sm transition-colors pointer-events-auto ';
        if (showAsCorrectMarked) {
          btnClass += 'bg-emerald-400/50 dark:bg-emerald-500/55 ';
        } else if (showAsCorrectMissed) {
          btnClass += 'bg-lime-400/50 dark:bg-lime-500/55 ';
        } else if (showAsWrong) {
          btnClass += 'bg-red-400/50 dark:bg-red-500/55 ';
        } else if (isSelected) {
          btnClass += selectedClassName + ' ';
        } else {
          btnClass += 'hover:bg-emerald-200/40 dark:hover:bg-emerald-800/30 ';
        }
        if (disabled) btnClass += 'pointer-events-none ';
        return (
          <button
            key={letterIndex}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(letterIndex)}
            className={btnClass.trim()}
            style={{ left, top, width, height, minWidth: 4, minHeight: 4 }}
            aria-label={`Buchstabe ${letterIndex + 1}`}
          />
        );
      })}
    </div>
  );
}
