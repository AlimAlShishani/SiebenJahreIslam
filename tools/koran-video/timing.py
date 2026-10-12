"""Zeitstempel: wann beginnt welcher Vers in der Aufnahme?

Zwei Verfahren, die kombiniert werden:
1. Whisper (Spracherkennung) transkribiert die Aufnahme mit Wort-Zeitstempeln.
   Der erkannte Text wird Buchstabe für Buchstabe mit dem Korantext abgeglichen,
   so weiß man ungefähr, wo jeder Vers anfängt.
2. Pausenerkennung: Zwischen zwei Versen macht man fast immer eine Atempause.
   Die grobe Whisper-Schätzung wird auf die passende Pause „eingerastet“.

Ohne Whisper (--methode stille) werden nur die Pausen benutzt: es werden die
Pausen gewählt, die am besten zur erwarteten Verslänge passen.
"""

from __future__ import annotations

import math
import re
import subprocess
from difflib import SequenceMatcher

import numpy as np

from quran_data import Segment

SR = 16000
FRAME = 0.02  # 20 ms

_DIACRITICS = re.compile("[ؐ-ًؚ-ٰٟۖ-ۭـ]")
_MAP = str.maketrans({"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا", "ى": "ي", "ة": "ه", "ؤ": "و", "ئ": "ي", "ء": None})
_NON_LETTER = re.compile("[^ء-ي]")


def normalize(text: str) -> str:
    return _NON_LETTER.sub("", _DIACRITICS.sub("", text).translate(_MAP))


def plain(text: str) -> str:
    """Text ohne Vokalzeichen, aber mit Leerzeichen (für den Whisper-Prompt)."""
    words = (_NON_LETTER.sub("", _DIACRITICS.sub("", w).replace("ٱ", "ا")) for w in text.split())
    return " ".join(w for w in words if w)


def load_audio(path: str, start: float | None = None, end: float | None = None) -> np.ndarray:
    cmd = ["ffmpeg", "-nostdin", "-loglevel", "error"]
    if start is not None:
        cmd += ["-ss", f"{start:.3f}"]
    if end is not None:
        cmd += ["-to", f"{end:.3f}"]
    cmd += ["-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).copy()


# --------------------------------------------------------------------------- Pausen


def frame_db(audio: np.ndarray) -> np.ndarray:
    n = int(SR * FRAME)
    frames = len(audio) // n
    if frames == 0:
        return np.array([-100.0])
    rms = np.sqrt(np.mean(audio[: frames * n].reshape(frames, n) ** 2, axis=1) + 1e-12)
    db = 20 * np.log10(rms + 1e-9)
    # leicht glätten (100 ms), damit einzelne Knackser keine Pause unterbrechen
    k = 5
    return np.convolve(db, np.ones(k) / k, mode="same")


def detect_silences(audio: np.ndarray, min_len: float = 0.18) -> tuple[list[tuple[float, float]], float]:
    """Gibt Pausen [(start, ende), ...] und die verwendete dB-Schwelle zurück."""
    db = frame_db(audio)
    floor = np.percentile(db, 5)
    loud = np.percentile(db, 95)
    threshold = floor + 0.38 * (loud - floor)
    quiet = db < threshold
    out = []
    i = 0
    while i < len(quiet):
        if quiet[i]:
            j = i
            while j < len(quiet) and quiet[j]:
                j += 1
            if (j - i) * FRAME >= min_len:
                out.append((i * FRAME, j * FRAME))
            i = j
        else:
            i += 1
    return out, float(threshold)


def voice_span(audio: np.ndarray, silences: list[tuple[float, float]]) -> tuple[float, float]:
    dur = len(audio) / SR
    onset, offset = 0.0, dur
    if silences and silences[0][0] <= 0.05:
        onset = silences[0][1]
    if silences and silences[-1][1] >= dur - 0.05:
        offset = silences[-1][0]
    return onset, offset


# --------------------------------------------------------------------------- Whisper


def transcribe(audio: np.ndarray, model_name: str, prompt: str | None, log=print) -> list[tuple[str, float, float]]:
    from faster_whisper import WhisperModel  # erst hier importieren: optional

    log(f"  Lade Whisper-Modell '{model_name}' (beim ersten Mal wird es heruntergeladen) …")
    model = WhisperModel(model_name, device="auto", compute_type="int8")
    segments, _ = model.transcribe(
        audio,
        language="ar",
        word_timestamps=True,
        beam_size=5,
        condition_on_previous_text=False,
        initial_prompt=prompt,
        vad_filter=False,
    )
    words = []
    for seg in segments:
        for w in seg.words or []:
            words.append((w.word, float(w.start), float(w.end)))
        log(f"    {seg.start:7.2f}s  {seg.text.strip()[:70]}")
    return words


def align_with_transcript(segs: list[Segment], words: list[tuple[str, float, float]]) -> list[tuple[float | None, float | None]]:
    """Schätzt (start, ende) je Segment aus dem Buchstaben-Abgleich."""
    exp_chars: list[str] = []
    exp_seg: list[int] = []
    seg_ranges = []
    for si, seg in enumerate(segs):
        a = len(exp_chars)
        for ch in normalize(seg.text):
            exp_chars.append(ch)
            exp_seg.append(si)
        seg_ranges.append((a, len(exp_chars)))

    rec_chars: list[str] = []
    rec_time: list[float] = []
    for text, start, end in words:
        letters = normalize(text)
        for k, ch in enumerate(letters):
            rec_chars.append(ch)
            rec_time.append(start + (end - start) * (k + 0.5) / len(letters))

    sm = SequenceMatcher(None, "".join(exp_chars), "".join(rec_chars), autojunk=False)
    mapped: dict[int, float] = {}
    for block in sm.get_matching_blocks():
        for k in range(block.size):
            mapped[block.a + k] = rec_time[block.b + k]

    # durchschnittliche Sprechgeschwindigkeit (Buchstaben/Sekunde) fürs Extrapolieren
    keys = sorted(mapped)
    if len(keys) >= 2 and mapped[keys[-1]] > mapped[keys[0]]:
        rate = (keys[-1] - keys[0]) / (mapped[keys[-1]] - mapped[keys[0]])
    else:
        rate = 12.0
    rate = max(rate, 1.0)

    estimates: list[tuple[float | None, float | None]] = []
    for a, b in seg_ranges:
        idx = [i for i in range(a, b) if i in mapped]
        # wenige Treffer in einem langen Vers sind unzuverlässig
        if not idx or len(idx) < max(2, 0.15 * (b - a)):
            estimates.append((None, None))
            continue
        start = mapped[idx[0]] - (idx[0] - a) / rate
        end = mapped[idx[-1]] + (b - 1 - idx[-1]) / rate
        estimates.append((start, end))
    return estimates


# --------------------------------------------------------------------------- Kombination


def _fill_missing(estimates, segs, onset, offset):
    """Fehlende Schätzungen proportional zur Textlänge auffüllen."""
    lengths = [max(1, len(normalize(s.text))) for s in segs]
    est = list(estimates)
    n = len(est)
    i = 0
    while i < n:
        if est[i][0] is not None:
            i += 1
            continue
        j = i
        while j < n and est[j][0] is None:
            j += 1
        left = est[i - 1][1] if i > 0 else onset
        right = est[j][0] if j < n else offset
        total = sum(lengths[i:j])
        t = left
        for k in range(i, j):
            d = (right - left) * lengths[k] / total
            est[k] = (t, t + d)
            t += d
        i = j
    return est


def snap_boundaries(est, silences, onset, offset, lead: float = 0.25) -> list[float]:
    """Grenze zwischen Segment i und i+1 = Ende der passenden Pause (minus kleine Vorlaufzeit)."""
    bounds = []
    for i in range(len(est) - 1):
        prev_end, next_start = est[i][1], est[i + 1][0]
        lo, hi = min(prev_end, next_start) - 1.2, max(prev_end, next_start) + 1.2
        best, best_score = None, -math.inf
        for s, e in silences:
            if e < lo or s > hi or s <= onset + 0.05 or e >= offset - 0.05:
                continue
            if bounds and e <= bounds[-1] + 0.5:
                continue
            # Whisper liegt meist < 1 s daneben; weiter entfernte Pausen sind Pausen im Vers.
            # Lange Pausen sind ein starkes Indiz für eine Versgrenze → etwas mehr Toleranz.
            dist = 0.0 if s <= next_start <= e else abs(e - next_start)
            if dist > 1.0 + 0.5 * min(e - s, 2.0):
                continue
            score = min(e - s, 1.5) - 0.8 * dist
            if score > best_score:
                best, best_score = (s, e), score
        if best:
            s, e = best
            b = max(s, e - lead)
        else:
            b = max(0.0, next_start - 0.1)
        if bounds and b <= bounds[-1] + 0.3:
            b = bounds[-1] + 0.3
        bounds.append(b)
    return bounds


def silence_only_boundaries(segs, silences, onset, offset) -> list[float]:
    """Wählt die N-1 Pausen, die am besten zur erwarteten Verslänge passen (DP)."""
    k_needed = len(segs) - 1
    if k_needed <= 0:
        return []
    lengths = np.array([max(1, len(normalize(s.text))) for s in segs], float)
    span = max(offset - onset, 1e-3)
    expected = onset + span * np.cumsum(lengths)[:-1] / lengths.sum()
    cands = [(s, e) for s, e in silences if s > onset + 0.05 and e < offset - 0.05]
    m = len(cands)
    if m < k_needed:
        return [float(x) for x in expected]
    t = np.array([e for _, e in cands])
    dur = np.array([e - s for s, e in cands])
    sigma = max(2.5, 0.12 * span)
    gain = np.log(np.minimum(dur, 2.0) / 0.18 + 1.0) * 2.0
    inf = 1e18
    dp = np.full((k_needed, m), inf)
    back = np.zeros((k_needed, m), int)
    dp[0] = ((t - expected[0]) / sigma) ** 2 - gain
    for k in range(1, k_needed):
        best = inf
        best_i = -1
        for j in range(m):
            if j > 0 and dp[k - 1][j - 1] < best:
                best, best_i = dp[k - 1][j - 1], j - 1
            if best_i >= 0:
                dp[k][j] = best + ((t[j] - expected[k]) / sigma) ** 2 - gain[j]
                back[k][j] = best_i
    j = int(np.argmin(dp[-1]))
    chosen = []
    for k in range(k_needed - 1, -1, -1):
        chosen.append(j)
        j = back[k][j]
    chosen.reverse()
    return [max(cands[c][0], cands[c][1] - 0.25) for c in chosen]


def compute_timestamps(
    audio: np.ndarray,
    segs: list[Segment],
    methode: str = "auto",
    modell: str = "small",
    log=print,
) -> dict:
    """Setzt seg.start/seg.end (relativ zum übergebenen Audio) und gibt Infos zurück."""
    duration = len(audio) / SR
    silences, threshold = detect_silences(audio)
    onset, offset = voice_span(audio, silences)
    log(f"  Audio: {duration:.1f}s, Stimme von {onset:.2f}s bis {offset:.2f}s, {len(silences)} Pausen erkannt")

    used = methode
    if methode in ("auto", "whisper"):
        try:
            import faster_whisper  # noqa: F401
        except ImportError:
            if methode == "whisper":
                raise SystemExit("faster-whisper ist nicht installiert: pip install -r requirements.txt")
            log("  faster-whisper nicht installiert → nutze nur Pausenerkennung")
            used = "stille"
        else:
            used = "whisper"

    if used == "whisper":
        prompt = " ".join(plain(s.text) for s in segs if s.kind == "vers")[:200].rsplit(" ", 1)[0] or None
        words = transcribe(audio, modell, prompt, log)
        est = align_with_transcript(segs, words)
        missing = sum(1 for e in est if e[0] is None)
        if missing:
            log(f"  Hinweis: {missing} Segment(e) nicht sicher erkannt – geschätzt nach Textlänge")
        est = _fill_missing(est, segs, onset, offset)
        bounds = snap_boundaries(est, silences, onset, offset)
    else:
        bounds = silence_only_boundaries(segs, silences, onset, offset)

    starts = [0.0] + bounds
    ends = bounds + [duration]
    for seg, s, e in zip(segs, starts, ends):
        seg.start, seg.end = round(s, 2), round(e, 2)
    return {"methode": used, "dauer": duration, "stimme_start": onset, "stimme_ende": offset, "schwelle_db": threshold}
