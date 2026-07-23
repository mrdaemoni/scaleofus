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
import subprocess
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_AUDIO = ROOT / "public/audio/the-boy-who-tried-to-catch-the-wind.mp3"
DEFAULT_BOOK = ROOT / "src/books/the-boy-who-tried-to-catch-the-wind"

# Keep draft-specific spot corrections out of the reusable alignment pass. If a
# future recording needs one, add it only for that recording's model label.
WORD_CUE_OVERRIDES: dict[str, dict[int, dict[int, dict[str, float]]]] = {}


def manuscript_beats(markdown: str) -> list[dict]:
    beats: list[dict] = []
    current: dict | None = None
    chapter_number = 0
    chapter_title = ""
    for raw_line in markdown.splitlines():
        line = raw_line.strip()
        chapter = re.match(r"^## Chapter ([A-Za-z]+)\s*(?:—|:)\s*(.+)$", line)
        if chapter:
            chapter_number += 1
            chapter_title = chapter.group(2)
            current = None
            continue
        drawing = (
            re.match(r"^\*\*Drawing (\d+) — \*\((.+)\)\*\*\*$", line)
            or re.match(r"^\*\(drawing (\d+):\s*(.+)\)\*$", line, re.IGNORECASE)
        )
        if drawing:
            current = {
                "number": int(drawing.group(1)),
                "chapter": chapter_number,
                "chapterTitle": chapter_title,
                "paragraphs": [],
            }
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


def align_manuscript(target: list[str], heard: list[dict]) -> list[int | None]:
    """Align a full manuscript while keeping dynamic-programming gaps small."""

    heard_tokens = [word["normalized"] for word in heard]
    matcher = SequenceMatcher(None, target, heard_tokens, autojunk=False)
    mapping: list[int | None] = [None] * len(target)
    target_cursor = 0
    heard_cursor = 0

    for block in matcher.get_matching_blocks():
        if block.a > target_cursor:
            local = align_tokens(
                target[target_cursor:block.a],
                heard[heard_cursor:block.b],
            )
            for index, heard_index in enumerate(local, start=target_cursor):
                if heard_index is not None:
                    mapping[index] = heard_cursor + heard_index

        for offset in range(block.size):
            mapping[block.a + offset] = block.b + offset

        target_cursor = block.a + block.size
        heard_cursor = block.b + block.size

    return mapping


def probe_audio_duration(audio: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(audio),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(result.stdout.strip())


def detect_chapter_starts(audio: Path, duration: float, chapter_count: int) -> list[float]:
    """Use the deliberate long silences as chapter-title entry points."""

    result = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-i", str(audio), "-af",
            "silencedetect=noise=-42dB:d=2.8", "-f", "null", "-",
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    candidates: list[float] = []
    for match in re.finditer(
        r"silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)",
        result.stderr,
    ):
        silence_end = float(match.group(1))
        if silence_end < duration - 2.0:
            candidates.append(round(silence_end, 3))

    if len(candidates) != chapter_count:
        print(
            f"warning: found {len(candidates)} chapter-sized silences for "
            f"{chapter_count} chapters; chapter navigation will fall back to first words"
        )
        return []
    return candidates


def words_from_openai_whisper(path: Path) -> list[dict]:
    transcript = json.loads(path.read_text())
    heard_words: list[dict] = []
    for segment in transcript.get("segments", []):
        for word in segment.get("words", []):
            normalized = normalize(word.get("word", ""))
            if normalized:
                heard_words.append(
                    {
                        "word": word["word"].strip(),
                        "normalized": normalized,
                        "start": float(word["start"]),
                        "end": float(word["end"]),
                        "probability": round(float(word.get("probability", 0.0)), 4),
                    }
                )
    return heard_words


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

    starts: list[float] = []
    previous_start = beat_start
    for cue in cues:
        assert cue is not None
        start = max(0.0, previous_start, cue["start"])
        starts.append(start)
        previous_start = start + 0.022

    result: list[dict] = []
    for index, cue in enumerate(cues):
        assert cue is not None
        start = starts[index]
        next_start = starts[index + 1] if index + 1 < len(starts) else beat_end
        end = min(max(start + 0.018, cue["end"]), max(start + 0.018, next_start - 0.001))
        if index == len(cues) - 1:
            end = max(end, start + 0.08)
        result.append({"start": round(start, 3), "end": round(end, 3)})
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--audio", type=Path, default=DEFAULT_AUDIO)
    parser.add_argument("--story", type=Path, default=DEFAULT_BOOK / "the-boy-who-tried-to-catch-the-wind.md")
    parser.add_argument("--output", type=Path, default=DEFAULT_BOOK / "story-word-timings.json")
    parser.add_argument("--timing-output", type=Path, default=DEFAULT_BOOK / "story-timings.json")
    parser.add_argument("--transcript-json", type=Path)
    parser.add_argument("--model", default="small.en")
    parser.add_argument("--model-label")
    parser.add_argument(
        "--preserve-speakers",
        action="store_true",
        help="Copy speaker labels from the existing output when its paragraph word counts still match.",
    )
    args = parser.parse_args()

    preserved_speakers: dict[tuple[int, int], list[str]] = {}
    if args.preserve_speakers and args.output.exists():
        try:
            existing = json.loads(args.output.read_text())
            for beat in existing.get("beats", []):
                for paragraph in beat.get("paragraphs", []):
                    speakers = [word.get("speaker", "narrator") for word in paragraph.get("words", [])]
                    preserved_speakers[(beat["number"], paragraph["paragraph"])] = speakers
        except (json.JSONDecodeError, KeyError, TypeError):
            preserved_speakers = {}

    manuscript = manuscript_beats(args.story.read_text())
    audio_duration = probe_audio_duration(args.audio)
    chapter_count = max(beat["chapter"] for beat in manuscript)
    chapter_starts = detect_chapter_starts(args.audio, audio_duration, chapter_count)

    if args.transcript_json:
        heard_words = words_from_openai_whisper(args.transcript_json)
        model_label = args.model_label or "openai-whisper"
    else:
        try:
            from faster_whisper import WhisperModel
        except ImportError as error:
            raise SystemExit(
                "Install faster-whisper or pass an OpenAI Whisper JSON file with --transcript-json."
            ) from error

        model = WhisperModel(args.model, device="cpu", compute_type="int8")
        segments, _ = model.transcribe(
            str(args.audio),
            language="en",
            beam_size=5,
            best_of=5,
            word_timestamps=True,
            vad_filter=False,
            condition_on_previous_text=True,
        )
        heard_words = []
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
        model_label = args.model_label or args.model

    manuscript_words = [
        word
        for beat in manuscript
        for paragraph in beat["paragraphs"]
        for word in paragraph.split()
    ]
    normalized_target = [normalize(word) for word in manuscript_words]
    mapping = align_manuscript(normalized_target, heard_words)
    cues = interpolate_missing(
        manuscript_words,
        mapping,
        heard_words,
        0.0,
        audio_duration,
    )

    result = {
        "version": 3,
        "audioDuration": round(audio_duration, 3),
        "model": model_label,
        "chapterStarts": chapter_starts,
        "beats": [],
    }
    totals = {"words": 0, "exact": 0, "fuzzy": 0, "interpolated": 0}
    timing_rows: list[dict] = []
    cursor = 0

    for beat in manuscript:
        paragraph_words = [paragraph.split() for paragraph in beat["paragraphs"]]
        display_words = [word for paragraph in paragraph_words for word in paragraph]
        beat_mapping = mapping[cursor:cursor + len(display_words)]
        beat_cues = cues[cursor:cursor + len(display_words)]
        model_overrides = WORD_CUE_OVERRIDES.get(model_label, {})
        for word_index, cue in model_overrides.get(beat["number"], {}).items():
            beat_cues[word_index] = cue

        exact = fuzzy = interpolated = 0
        for index, heard_index in enumerate(beat_mapping):
            if heard_index is None:
                interpolated += 1
            elif normalize(display_words[index]) == heard_words[heard_index]["normalized"]:
                exact += 1
            else:
                fuzzy += 1

        paragraphs = []
        paragraph_cursor = 0
        for paragraph_index, words in enumerate(paragraph_words):
            paragraph_cues = beat_cues[paragraph_cursor:paragraph_cursor + len(words)]
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
            paragraph_cursor += len(words)

        beat_start = beat_cues[0]["start"]
        beat_end = beat_cues[-1]["end"]
        timing_row = {
            "number": beat["number"],
            "start": beat_start,
            "end": beat_end,
            "words": len(display_words),
            "exact": exact,
            "confidence": round(exact / max(1, len(display_words)), 3),
        }
        if beat["number"] == next(
            item["number"] for item in manuscript if item["chapter"] == beat["chapter"]
        ) and chapter_starts:
            timing_row["chapterStart"] = chapter_starts[beat["chapter"] - 1]
        timing_rows.append(timing_row)

        result["beats"].append({
            "number": beat["number"],
            "start": beat_start,
            "end": beat_end,
            "sourceWindow": {"start": beat_start, "end": beat_end},
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
        cursor += len(display_words)
        print(
            f"beat {beat['number']:02}: {len(display_words):3} words | "
            f"{exact:3} exact | {fuzzy:2} fuzzy | {interpolated:2} interpolated"
        )

    result["quality"] = totals
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    args.timing_output.write_text(json.dumps(timing_rows, indent=2) + "\n")
    print(f"wrote {args.output}")
    print(f"wrote {args.timing_output}")
    print(json.dumps(totals, indent=2))


if __name__ == "__main__":
    main()
