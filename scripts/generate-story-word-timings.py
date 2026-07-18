#!/usr/bin/env python3
"""Build manuscript-accurate word cues from the finished narration.

The transcription is used only as a timing guide. Its words are aligned back to
the canonical Markdown, so the site always renders the author's exact text.

Run with a Python environment containing ``faster-whisper``:

    python scripts/generate-story-word-timings.py --model small.en
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_AUDIO = Path(
    "/Users/alicia/Documents/mrhector-alicia/Podcasts/"
    "The Boy Who Tried to Catch the Wind/wavs/"
    "Story01_v5_the-boy-who-tried-to-catch-the-wind.wav"
)

# Exact spot checks for boundary words that the full-recording Whisper pass
# merges into a neighboring segment. Indices are zero-based manuscript words.
WORD_CUE_OVERRIDES: dict[int, dict[int, dict[str, float]]] = {}


def manuscript_beats(markdown: str) -> list[dict]:
    beats: list[dict] = []
    current: dict | None = None
    for raw_line in markdown.splitlines():
        line = raw_line.strip()
        drawing = (
            re.match(r"^\*\*Drawing (\d+) — \*\((.+)\)\*\*\*$", line)
            or re.match(r"^\*\(drawing (\d+):\s*(.+)\)\*$", line, re.IGNORECASE)
        )
        if drawing:
            current = {"number": int(drawing.group(1)), "paragraphs": []}
            beats.append(current)
            continue
        if (
            current
            and line
            and line != "---"
            and not line.startswith("## Chapter")
            and not line.startswith("*Cover —")
        ):
            current["paragraphs"].append(line)
    return beats


def normalize(token: str) -> str:
    token = unicodedata.normalize("NFKD", token).lower()
    token = token.replace("’", "'").replace("‘", "'")
    return "".join(character for character in token if character.isalnum() or character == "'").strip("'")


def token_cost(left: str, right: str) -> float:
    if left == right:
        return 0.0
    ratio = SequenceMatcher(None, left, right).ratio()
    if ratio >= 0.86:
        return 0.24
    if ratio >= 0.68:
        return 0.62
    return 1.32


def align_tokens(target: list[str], heard: list[dict]) -> list[int | None]:
    """Needleman-Wunsch alignment, returning a heard-word index per target."""

    rows, columns = len(target) + 1, len(heard) + 1
    costs = [[0.0] * columns for _ in range(rows)]
    moves = [[""] * columns for _ in range(rows)]
    for row in range(1, rows):
        costs[row][0] = row * 0.92
        moves[row][0] = "target"
    for column in range(1, columns):
        costs[0][column] = column * 0.78
        moves[0][column] = "heard"

    for row in range(1, rows):
        for column in range(1, columns):
            candidates = (
                (costs[row - 1][column - 1] + token_cost(target[row - 1], heard[column - 1]["normalized"]), "match"),
                (costs[row - 1][column] + 0.92, "target"),
                (costs[row][column - 1] + 0.78, "heard"),
            )
            costs[row][column], moves[row][column] = min(candidates, key=lambda item: item[0])

    mapping: list[int | None] = [None] * len(target)
    row, column = len(target), len(heard)
    while row or column:
        move = moves[row][column]
        if move == "match":
            similarity = SequenceMatcher(None, target[row - 1], heard[column - 1]["normalized"]).ratio()
            if similarity >= 0.62:
                mapping[row - 1] = column - 1
            row -= 1
            column -= 1
        elif move == "target":
            row -= 1
        else:
            column -= 1
    return mapping


def interpolate_missing(
    display_words: list[str],
    mapping: list[int | None],
    heard: list[dict],
    beat_start: float,
    beat_end: float,
) -> list[dict]:
    cues: list[dict | None] = [None] * len(display_words)
    for index, heard_index in enumerate(mapping):
        if heard_index is None:
            continue
        source = heard[heard_index]
        cues[index] = {
            # Beat boundaries are useful alignment anchors, but a long final
            # word can legitimately cross one. Keep Whisper's matched cue in
            # full and let the manuscript alignment decide the true boundary.
            "start": max(0.0, source["start"]),
            "end": max(0.0, source["end"]),
        }

    index = 0
    while index < len(cues):
        if cues[index] is not None:
            index += 1
            continue
        gap_start = index
        while index < len(cues) and cues[index] is None:
            index += 1
        gap_end = index
        left = cues[gap_start - 1]["end"] if gap_start else beat_start
        right = cues[gap_end]["start"] if gap_end < len(cues) else beat_end
        right = max(left + 0.05 * (gap_end - gap_start), right)
        weights = [max(1.0, len(normalize(word)) ** 0.55) for word in display_words[gap_start:gap_end]]
        weight_total = sum(weights)
        elapsed = 0.0
        for offset, weight in enumerate(weights):
            word_start = left + (right - left) * elapsed / weight_total
            elapsed += weight
            word_end = left + (right - left) * elapsed / weight_total
            cues[gap_start + offset] = {"start": word_start, "end": word_end}

    result: list[dict] = []
    previous_start = beat_start
    for index, cue in enumerate(cues):
        assert cue is not None
        start = max(0.0, previous_start, cue["start"])
        next_start = cues[index + 1]["start"] if index + 1 < len(cues) and cues[index + 1] else beat_end
        end = max(start + 0.035, min(cue["end"], max(start + 0.035, next_start)))
        if index == len(cues) - 1:
            end = max(end, start + 0.08)
        result.append({"start": round(start, 3), "end": round(end, 3)})
        previous_start = start + 0.001
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", type=Path, default=DEFAULT_AUDIO)
    parser.add_argument("--story", type=Path, default=ROOT / "src/content/the-boy-who-tried-to-catch-the-wind.md")
    parser.add_argument("--beats", type=Path, default=ROOT / "src/content/story-timings.json")
    parser.add_argument("--output", type=Path, default=ROOT / "src/content/story-word-timings.json")
    parser.add_argument("--model", default="small.en")
    args = parser.parse_args()

    preserved_speakers: dict[tuple[int, int], list[str]] = {}
    if args.output.exists():
        try:
            existing = json.loads(args.output.read_text())
            for beat in existing.get("beats", []):
                for paragraph in beat.get("paragraphs", []):
                    speakers = [word.get("speaker", "narrator") for word in paragraph.get("words", [])]
                    preserved_speakers[(beat["number"], paragraph["paragraph"])] = speakers
        except (json.JSONDecodeError, KeyError, TypeError):
            preserved_speakers = {}

    try:
        from faster_whisper import WhisperModel
    except ImportError as error:
        raise SystemExit("Install faster-whisper in the active Python environment first.") from error

    manuscript = manuscript_beats(args.story.read_text())
    timing_rows = json.loads(args.beats.read_text())
    timing_by_number = {row["number"]: row for row in timing_rows}

    model = WhisperModel(args.model, device="cpu", compute_type="int8")
    segments, info = model.transcribe(
        str(args.audio),
        language="en",
        beam_size=5,
        best_of=5,
        word_timestamps=True,
        vad_filter=False,
        condition_on_previous_text=True,
    )
    heard_words: list[dict] = []
    for segment in segments:
        for word in segment.words or []:
            normalized = normalize(word.word)
            if normalized:
                heard_words.append(
                    {
                        "word": word.word.strip(),
                        "normalized": normalized,
                        "start": float(word.start),
                        "end": float(word.end),
                        "probability": round(float(word.probability), 4),
                    }
                )

    result = {
        "version": 1,
        "audioDuration": round(float(info.duration), 3),
        "model": args.model,
        "beats": [],
    }
    totals = {"words": 0, "exact": 0, "fuzzy": 0, "interpolated": 0}

    for beat in manuscript:
        timing = timing_by_number[beat["number"]]
        start, end = float(timing["start"]), float(timing["end"])
        heard = [
            word for word in heard_words
            if word["end"] >= start - 0.38 and word["start"] <= end + 1.15
        ]
        paragraph_words = [paragraph.split() for paragraph in beat["paragraphs"]]
        display_words = [word for paragraph in paragraph_words for word in paragraph]
        normalized_target = [normalize(word) for word in display_words]
        mapping = align_tokens(normalized_target, heard)
        cues = interpolate_missing(display_words, mapping, heard, start, end)
        for word_index, cue in WORD_CUE_OVERRIDES.get(beat["number"], {}).items():
            cues[word_index] = cue

        exact = fuzzy = interpolated = 0
        for index, heard_index in enumerate(mapping):
            if heard_index is None:
                interpolated += 1
            elif normalized_target[index] == heard[heard_index]["normalized"]:
                exact += 1
            else:
                fuzzy += 1

        paragraphs = []
        cursor = 0
        for paragraph_index, words in enumerate(paragraph_words):
            paragraph_cues = cues[cursor:cursor + len(words)]
            speakers = preserved_speakers.get((beat["number"], paragraph_index), [])
            if len(speakers) == len(paragraph_cues):
                paragraph_cues = [
                    {**cue, "speaker": speakers[index]}
                    for index, cue in enumerate(paragraph_cues)
                ]
            paragraphs.append({
                "paragraph": paragraph_index,
                "words": paragraph_cues,
            })
            cursor += len(words)

        result["beats"].append({
            "number": beat["number"],
            "start": cues[0]["start"],
            "end": cues[-1]["end"],
            "sourceWindow": {"start": start, "end": end},
            "quality": {
                "words": len(display_words),
                "exact": exact,
                "fuzzy": fuzzy,
                "interpolated": interpolated,
            },
            "paragraphs": paragraphs,
        })
        totals["words"] += len(display_words)
        totals["exact"] += exact
        totals["fuzzy"] += fuzzy
        totals["interpolated"] += interpolated
        print(
            f"beat {beat['number']:02}: {len(display_words):3} words | "
            f"{exact:3} exact | {fuzzy:2} fuzzy | {interpolated:2} interpolated"
        )

    result["quality"] = totals
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(f"wrote {args.output}")
    print(json.dumps(totals, indent=2))


if __name__ == "__main__":
    main()
