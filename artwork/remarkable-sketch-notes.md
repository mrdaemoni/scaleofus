# reMarkable sketch direction

Source: `incoming/Scale 1 - page 1.svg`, downloaded from the Gmail message “Document from my reMarkable: Scale 1” on July 17, 2026.

Chapter 1 V2 addition: `incoming/chapter-01-v2-page-09.svg`, downloaded from the Gmail message “Document from my reMarkable: Remarkable-The Boy Who Tried to Catch the Wind (reMarkable sketchbook)” on July 18, 2026. The email contains one SVG attachment and the page contains one complete drawing: the boy leaving with his bag beneath curling wind. The site treats that single drawing as a Chapter 1 motif, moving through details of the wind, face, hand, card, bread, feet, and finally the full scene. A separate wide composition keeps the same boy small on the opening cover.

Scale 22 replacement: `incoming/scale-22-page-01.svg`, downloaded from the Gmail message “Document from my reMarkable: Scale 22” on July 18, 2026. The attachment is one long SVG containing sixteen landscape source pages. Page 1 supplies the cover wind, page 2 supplies the small cover boy and drawing 1, pages 3–10 map to drawings 2–9, page 11 is divided into drawings 10 and 11, and pages 12–16 map to drawings 12–16. All are rendered on transparent 1200×800 canvases in the pale plum-gray ink treatment.

## What already works

- The line is immediate and alive. It fits the story better than polished realism would.
- The boy, the three wind strokes, the round-eyed machine, the spiral mountain, and the KEEP GOING stone form a memorable visual vocabulary.
- The scale changes are strong: a small boy against a wide hill reads differently from the close boy-and-machine scenes without needing more detail.
- The rough black fill gives the boy a recurring visual weight that can carry across the whole book.

## Keep consistent in the remaining drawings

1. Pick one canonical boy from this sheet and repeat his proportions, hair shape, four-stroke body, and dark side of the tunic. The current sheet includes a few alternate faces and hairstyles; choose one before the next batch.
2. Keep the wind at exactly three long strokes. Let their spacing and bend change, but not their number.
3. Draw the machine with the same silhouette and one warm dot-eye every time. Avoid adding controls or details later.
4. Reuse the same simple symbol for every recurring object: card, pebble, bowl, seed, candle, and spiral.
5. Give each drawing one readable event. This source sheet is useful as a storyboard, but the final exports should contain one scene per file so adjacent sketches never enter the crop.

## Page and line recipe

- Work landscape at a 3:2 ratio. Leave roughly half the frame as open paper.
- Keep the most important figure inside the middle 70% so desktop and mobile crops both survive.
- Use the heavy line for the recurring character and one or two anchor shapes; let landscape, weather, and memory marks stay lighter.
- For final color, aim for pale plum-gray ink rather than pure black: approximately `#5f5358` at 70–80% strength on shell-pink paper around `#f1dadd`.
- Remove the reMarkable dot grid from final exports. The site supplies its own paper and atmosphere.

## Make animation easier

Keep the still drawing and the moving element separate whenever possible. A useful export pair would be:

- `NN-base.svg`: boy, ground, buildings, and other still marks.
- `NN-motion.svg`: only wind, smoke, flame, stream, leaf, flower, or breath marks on the same canvas.

That lets the site move the real hand-drawn strokes instead of approximating them with a second digital line. If separate exports are inconvenient, leave generous open space around the moving object; the site can continue adding a subtle animated layer above the drawing, as it does in this prototype.
