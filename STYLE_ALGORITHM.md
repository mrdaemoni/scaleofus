# Scale of Us Image Treatment

The site now uses supplied cinematic storybook images from
`public/images/storybook/` instead of procedurally generated page art.

## Treatment

- Use the supplied images as the real artwork.
- Crop with `object-fit: cover` and page-specific `object-position` values.
- Keep the book/page UI simple so the images carry the scene.
- Add only lightweight motion overlays:
  - drifting glowing particles;
  - subtle breathing/zoom on the image;
  - small blinking eye overlays where they can plausibly align;
  - soft page glow over the image.
- Reuse the same image world across books instead of trying to redraw it.

## Assets

- `public/images/storybook/tree-robot-blocks.png`
- `public/images/storybook/open-book-machine-boy.png`
- `public/images/storybook/giant-machine-companion.png`
- `public/images/storybook/box-child.png`
- `public/images/storybook/closed-book-star-child.png`
- `public/images/storybook/open-book-tree-robot.png`
- `public/images/storybook/open-book-star-child.png`

## Implementation

`src/pages/index.astro` maps each essay page to one of the supplied images, a
crop position, a tone, and optional eye coordinates. `src/styles/global.css`
handles the crop, particle drift, blinking overlays, soft glow, and the floating
caption wave below the book.

`npm run build` does not generate drawings. The site pipeline is image-based:
supplied PNGs plus lightweight browser overlays.
