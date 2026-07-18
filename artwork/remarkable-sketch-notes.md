# reMarkable sketch direction

Source: `incoming/Scale 1 - page 1.svg`, downloaded from the Gmail message “Document from my reMarkable: Scale 1” on July 17, 2026.

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
