# Mixer and player inputs

The renderer accepts JSON. Paths are relative to the config unless absolute. Use checked durations and checksums, and a fresh output directory/prefix when revising an accepted master.

```json
{
  "title": "A story - selected soundtrack v1",
  "author": "Author name",
  "locale": "en",
  "narration": "/absolute/original.wav",
  "narration_sha256": "actual SHA-256",
  "output_prefix": "story-en-score-v1",
  "tracks": [{"id":"journey","file":"/absolute/recording.mp3","title":"Track title","composer":"Composer","page":"https://composer.example/track","license":"Verified license","sha256":"actual SHA-256"}],
  "cues": [{"label":"Adventure begins","track":"journey","start":100,"end":160,"source_start":45,"fade_in":4,"fade_out":6}],
  "protected_silences": [{"label":"Recognition","start":160,"end":180}],
  "chapter_gaps": [{"start":130,"end":134}],
  "closing_start": 400,
  "minimum_average_margin_db": 21.5,
  "mp3_kbps": 160,
  "aac_kbps": 96,
  "max_mp3_bytes": 25000000
}
```

Cue times are seconds in the unchanged narration timeline; `source_start` is seconds in the music file. Crossfade overlap is allowed. Protected silence overrides music including filter tails. A coda can extend the maximum output duration beyond narration length. Per-cue `target_rms_dbfs` overrides the default -22. The optional closing excerpt extends from `closing_start` to the full mix's end.

Validation JSON records narration/config/output hashes, delivered loudness/peak/duration, silences, margins, and gap levels. Keep absolute local paths out of public manifests; publish safe filenames, URLs, credits, hashes, and intended provenance only.

## Player

```sh
python3 scripts/build_player.py /absolute/player.json --output /absolute/site/dist
```

The manifest contains `title`, optional `subtitle` and `comparison_url`, `default_locale`, `credits` (title/composer/url/license/license_url), and `editions` with `locale`, `label`, `title`, `audio` (local source to copy), optional `closing`, `duration`, `chapters` (label/start), and optional `closing_start`. Optional per-edition `intro`, `mix_label`, `closing_title`, and `closing_description` adapt the player copy for another book or a restrained ending. Paths are relative to the manifest. The builder copies only selected media and the generated player; it does not deploy, change sharing, or remove unrelated files. Use the Sites skill when publication is requested.

Keep music credits and edit notices in audio metadata as well as the player. The story and illustrations do not inherit the music's license.
