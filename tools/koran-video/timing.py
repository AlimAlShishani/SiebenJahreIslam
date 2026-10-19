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


# Einzelbuchstaben am Sure-Anfang (Huruf al-Muqatta'at) werden mit ihrem Namen gesprochen:
# الم → „Alif Lām Mīm“. Für den Abgleich mit der Transkription wird der Text entsprechend ausgeschrieben.
LETTER_NAMES = {"ا": "الف", "ل": "لام", "م": "ميم", "ر": "را", "ص": "صاد", "ك": "كاف", "ه": "ها", "ي": "يا",
                "ع": "عين", "ط": "طا", "س": "سين", "ح": "حا", "ق": "قاف", "ن": "نون"}
MUQATTAAT = {"الم", "المص", "الر", "المر", "كهيعص", "طه", "طسم", "طس", "يس", "ص", "حم", "عسق", "ق", "ن"}


def spoken(word_text: str, key: str = "") -> str:
    """Normalisierter Text eines Wortes, wie er gesprochen wird (Muqatta'at ausgeschrieben)."""
    n = normalize(word_text)
    verse = key.split(":")[-1] if key else ""
    if n in MUQATTAAT and verse in ("1", "2"):
        return "".join(LETTER_NAMES[c] for c in n)
    return n


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


def _content_words(seg: Segment):
    return [w for w in seg.words if not w.is_end]


def align_with_transcript(segs: list[Segment], words: list[tuple[str, float, float]]):
    """Schätzt (start, ende) je Segment und die Startzeit jedes Wortes aus dem Buchstaben-Abgleich.

    Rückgabe: (schätzungen je Segment, rohe Wort-Startzeiten je Segment [None = nicht erkannt])
    """
    exp_chars: list[str] = []
    seg_ranges = []
    word_ranges: list[list[tuple[int, int]]] = []
    for seg in segs:
        a = len(exp_chars)
        wr = []
        cws = _content_words(seg)
        if cws:
            for w in cws:
                wa = len(exp_chars)
                exp_chars.extend(spoken(w.text, seg.key))
                wr.append((wa, len(exp_chars)))
        else:
            exp_chars.extend(normalize(seg.text))
        seg_ranges.append((a, len(exp_chars)))
        word_ranges.append(wr)

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
    for seg, (a, b) in zip(segs, seg_ranges):
        idx = [i for i in range(a, b) if i in mapped]
        if seg.meta.get("optional"):
            # Basmala/Isti'adha nur behalten, wenn sie wirklich gesprochen wurden:
            # mindestens die Hälfte der Buchstaben erkannt, davon ein zusammenhängendes Stück ≥ 5
            longest = run = 0
            for i in range(a, b):
                run = run + 1 if i in mapped else 0
                longest = max(longest, run)
            if len(idx) < 0.5 * (b - a) or longest < 5:
                seg.meta["nicht_gehoert"] = True
                estimates.append((None, None))
                continue
        # wenige Treffer in einem langen Vers sind unzuverlässig
        if not idx or len(idx) < max(2, 0.15 * (b - a)):
            estimates.append((None, None))
            continue
        start = mapped[idx[0]] - (idx[0] - a) / rate
        end = mapped[idx[-1]] + (b - 1 - idx[-1]) / rate
        estimates.append((start, end))

    word_raw: list[list[float | None]] = []
    for wr in word_ranges:
        times: list[float | None] = []
        for a, b in wr:
            hit = next((i for i in range(a, b) if i in mapped), None)
            # nur wenn der Treffer am Wortanfang liegt, ist er als Startzeit brauchbar
            times.append(mapped[hit] - (hit - a) / rate if hit is not None and hit - a <= 2 else None)
        word_raw.append(times)
    return estimates, word_raw


# Wörter, auf denen man beim Rezitieren nicht anhält (Bindewörter, Präpositionen, Partikeln, die zum
# Folgenden gehören). Landet eine Atempause direkt dahinter, hat der Abgleich das kurze Wort fast immer in
# die Dehnung des vorigen Wortes gelegt (al-A'raf 50: „ٱلْمَآءِ ‖ أَوْ“) – die Pause gehört davor.
VERBINDER = {normalize(w) for w in ("أَوْ", "أَمْ", "ثُمَّ", "بَلْ", "فِى", "عَلَىٰ", "إِلَىٰ", "عَنْ", "أَنْ", "إِنْ", "مِنْ",
                                    "لَٰكِنْ", "حَتَّىٰ", "إِذَا", "إِذْ", "لَنْ", "لَمْ", "قَدْ", "كَىْ")}


def word_pauses(seg: Segment, silences: list[tuple[float, float]], min_len: float = 0.38) -> list[int]:
    """Nach welchen Wörtern (1-basiert) macht der Rezitator innerhalb des Verses eine Atempause?

    Kurze Aussetzer (< min_len, z. B. vom Handymikrofon) zählen nicht. Das Wort nach einer
    Pause beginnt am Ende der Pause – die Wortzeit wird darauf korrigiert.
    """
    t = seg.meta.get("wort_zeiten") or []
    words = [w for w in seg.words if not w.is_end]
    out: list[int] = []
    for i in range(len(t) - 1):
        lo = t[i] + 0.15
        hi = t[i + 2] if i + 2 < len(t) else seg.end
        cands = [(s, e) for s, e in silences if e - s >= min_len and s >= lo and e <= min(hi, t[i + 1] + 1.2)]
        if cands:
            s_, e_ = max(cands, key=lambda c: c[1] - c[0])
            k = i + 1  # Pause nach Wort k (1-basiert)
            # Rezitatoren halten fast immer an Waqf-Zeichen: liegt eines direkt daneben, gilt es
            waqf = [j for j in (k, k - 1, k + 1) if 1 <= j < len(t) and _has_waqf(words[j - 1].text)]
            if waqf and waqf[0] != k and not _has_waqf(words[k - 1].text):
                k = waqf[0]
            elif k > 1 and normalize(words[k - 1].text) in VERBINDER and (k - 1) not in out:
                k -= 1                       # Pause vor dem Bindewort; es beginnt erst nach der Pause
            if k not in out:
                out.append(k)
                t[k] = round(e_, 2)
                for j in range(k + 1, len(t)):          # nachfolgende Wörter nicht vor dem verschobenen beginnen
                    if t[j] <= t[j - 1] + 0.1:
                        t[j] = round(t[j - 1] + 0.3, 2)
    seg.meta["wort_zeiten"] = t
    return sorted(out)


def _has_waqf(text: str) -> bool:
    return any(0x06D6 <= ord(c) <= 0x06DC for c in text)


def finalize_word_times(seg: Segment, raw: list[float | None] | None = None) -> None:
    """Setzt seg.meta["wort_zeiten"]: Startzeit jedes Wortes (ohne Versende-Zeichen), monoton im Vers.

    Nicht erkannte Wörter werden nach Buchstabenzahl zwischen den Nachbarn verteilt.
    """
    cws = _content_words(seg)
    if not cws:
        seg.meta["wort_zeiten"] = []
        return
    lengths = [max(1, len(normalize(w.text))) for w in cws]
    n = len(cws)
    t = [None] * n if raw is None else list(raw)
    # Ausreißer verwerfen: muss im Vers liegen und monoton steigen
    last = seg.start
    for i in range(n):
        if t[i] is not None and not (last - 0.05 <= t[i] <= seg.end - 0.1):
            t[i] = None
        if t[i] is not None:
            last = t[i]
    t[0] = seg.start if t[0] is None else max(seg.start, min(t[0], seg.start + 0.6))
    i = 1
    while i < n:
        if t[i] is not None:
            i += 1
            continue
        j = i
        while j < n and t[j] is None:
            j += 1
        left = t[i - 1]
        right = t[j] if j < n else seg.end
        span_chars = sum(lengths[i - 1 : j])
        acc = lengths[i - 1]
        for k in range(i, j):
            t[k] = left + (right - left) * acc / span_chars
            acc += lengths[k]
        i = j
    seg.meta["wort_zeiten"] = [round(float(x), 2) for x in t]


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
        if best is None:
            # Keine Pause in der Nähe der Schätzung – zwischen zwei Versen atmet man aber fast immer.
            # Häufigster Grund: Whisper schneidet das lang gezogene Versende (Madd, z. B. „…īn“) ab, die
            # Schätzung liegt also zu früh. Dann ist die nächste deutliche Pause kurz danach die Versgrenze
            # (Nutzeraufnahme an-Nur 49/50: Schätzung 64,4 s, Pause 65,2–65,7 s).
            for s, e in silences:
                if (e - s >= 0.35 and prev_end - 0.3 <= s <= next_start + 2.0 and s > onset + 0.05
                        and e < offset - 0.05 and not (bounds and e <= bounds[-1] + 0.5)):
                    best = (s, e)
                    break
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
        est, word_raw = align_with_transcript(segs, words)
        keep = [i for i, sg in enumerate(segs) if not sg.meta.get("nicht_gehoert")]
        for sg in segs:
            if sg.meta.get("optional"):
                log(f"  {sg.label}: {'nicht gehört → weggelassen' if sg.meta.get('nicht_gehoert') else 'erkannt'}")
        segs[:] = [segs[i] for i in keep]
        est = [est[i] for i in keep]
        word_raw = [word_raw[i] for i in keep]
        missing = sum(1 for e in est if e[0] is None)
        if missing:
            log(f"  Hinweis: {missing} Segment(e) nicht sicher erkannt – geschätzt nach Textlänge")
        est = _fill_missing(est, segs, onset, offset)
        bounds = snap_boundaries(est, silences, onset, offset)
    else:
        # ohne Spracherkennung lässt sich nicht prüfen, ob die Isti'adha gesprochen wurde
        segs[:] = [sg for sg in segs if not (sg.meta.get("optional") and sg.kind == "istiadha")]
        bounds = silence_only_boundaries(segs, silences, onset, offset)
        word_raw = [None] * len(segs)

    starts = [0.0] + bounds
    ends = bounds + [duration]
    for i, (seg, s, e) in enumerate(zip(segs, starts, ends)):
        seg.start, seg.end = round(s, 2), round(e, 2)
        finalize_word_times(seg, word_raw[i])
        seg.meta["pausen_nach_wort"] = word_pauses(seg, silences)
    return {"methode": used, "dauer": duration, "stimme_start": onset, "stimme_ende": offset, "schwelle_db": threshold}
