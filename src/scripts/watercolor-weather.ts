type PigmentPoint = {
  x: number;
  y: number;
  variance: number;
};

type RGB = {
  r: number;
  g: number;
  b: number;
};

type PigmentLayer = {
  points: PigmentPoint[];
  color: RGB;
  alpha: number;
  offsetX: number;
  offsetY: number;
  scaleX: number;
  scaleY: number;
};

type PaperLift = {
  points: PigmentPoint[];
  alpha: number;
};

type WatercolorState = {
  canvas: HTMLCanvasElement;
  layers: PigmentLayer[];
  lifts: PaperLift[];
  textureSeed: number;
  renderedWidth: number;
  renderedHeight: number;
};

const watercolorCanvases = [
  ...document.querySelectorAll<HTMLCanvasElement>("[data-watercolor-wash]"),
];

const reducedWatercolorMotion = matchMedia("(prefers-reduced-motion: reduce)");
const stateByCanvas = new WeakMap<HTMLCanvasElement, WatercolorState>();

const hashSeed = (value: number) => {
  let seed = value + 0x6d2b79f5;
  seed = Math.imul(seed ^ (seed >>> 15), seed | 1);
  seed ^= seed + Math.imul(seed ^ (seed >>> 7), seed | 61);
  return (seed ^ (seed >>> 14)) >>> 0;
};

const makeRandom = (initialSeed: number) => {
  let seed = hashSeed(initialSeed);
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const gaussian = (random: () => number) => {
  const first = Math.max(Number.EPSILON, random());
  const second = Math.max(Number.EPSILON, random());
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(Math.PI * 2 * second);
};

const parseHex = (value: string): RGB => {
  const compact = value.trim().replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(compact)) {
    return {
      r: Number.parseInt(compact[0] + compact[0], 16),
      g: Number.parseInt(compact[1] + compact[1], 16),
      b: Number.parseInt(compact[2] + compact[2], 16),
    };
  }
  if (/^[0-9a-f]{6}$/i.test(compact)) {
    return {
      r: Number.parseInt(compact.slice(0, 2), 16),
      g: Number.parseInt(compact.slice(2, 4), 16),
      b: Number.parseInt(compact.slice(4, 6), 16),
    };
  }
  return { r: 203, g: 136, b: 160 };
};

const mixColor = (first: RGB, second: RGB, amount: number): RGB => ({
  r: Math.round(first.r + (second.r - first.r) * amount),
  g: Math.round(first.g + (second.g - first.g) * amount),
  b: Math.round(first.b + (second.b - first.b) * amount),
});

const makePolygon = (
  random: () => number,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  pointCount = 7,
  rotation = 0,
) => Array.from({ length: pointCount }, (_, index): PigmentPoint => {
  const angle = Math.PI * 2 * index / pointCount;
  const irregularity = 0.88 + random() * 0.24;
  const localX = Math.cos(angle) * radiusX * irregularity;
  const localY = Math.sin(angle) * radiusY * irregularity;
  return {
    x: centerX + localX * Math.cos(rotation) - localY * Math.sin(rotation),
    y: centerY + localX * Math.sin(rotation) + localY * Math.cos(rotation),
    variance: 0.08 + random() * 0.12,
  };
});

const deformPolygon = (
  points: PigmentPoint[],
  random: () => number,
  roughness = 1,
) => {
  const deformed: PigmentPoint[] = [];
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    const deltaX = next.x - point.x;
    const deltaY = next.y - point.y;
    const length = Math.max(0.0001, Math.hypot(deltaX, deltaY));
    const normalX = -deltaY / length;
    const normalY = deltaX / length;
    const tangentX = deltaX / length;
    const tangentY = deltaY / length;
    const inheritedVariance = (point.variance + next.variance) / 2;
    const normalDrift = gaussian(random) * length * inheritedVariance * roughness;
    const tangentDrift = gaussian(random) * length * inheritedVariance * roughness * 0.24;
    const childVariance = Math.max(
      0.012,
      inheritedVariance * (0.65 + random() * 0.24),
    );

    deformed.push(point, {
      x: (point.x + next.x) / 2 + normalX * normalDrift + tangentX * tangentDrift,
      y: (point.y + next.y) / 2 + normalY * normalDrift + tangentY * tangentDrift,
      variance: childVariance,
    });
  });
  return deformed;
};

const deformRepeatedly = (
  polygon: PigmentPoint[],
  random: () => number,
  rounds: number,
  roughness: number,
) => {
  let result = polygon;
  for (let round = 0; round < rounds; round += 1) {
    result = deformPolygon(result, random, roughness * (0.88 ** round));
  }
  return result;
};

const buildWatercolorState = (canvas: HTMLCanvasElement): WatercolorState => {
  const seed = Number(canvas.dataset.watercolorSeed ?? 1);
  const random = makeRandom(seed * 7919 + 47);
  const chapter = canvas.closest<HTMLElement>(".story-chapter");
  const chapterStyle = getComputedStyle(chapter ?? canvas);
  const primary = parseHex(chapterStyle.getPropertyValue("--chapter-wash"));
  const secondary = parseHex(chapterStyle.getPropertyValue("--chapter-wash-secondary"));
  const ink = { r: 85, g: 73, b: 78 };
  const deepPrimary = mixColor(primary, ink, 0.2);
  const deepSecondary = mixColor(secondary, ink, 0.16);
  const direction = seed % 2 === 0 ? 1 : -1;

  const primaryBase = deformRepeatedly(
    makePolygon(random, 0.44 + direction * 0.025, 0.52, 0.47, 0.4),
    random,
    3,
    0.95,
  );
  const secondaryBase = deformRepeatedly(
    makePolygon(random, 0.62 - direction * 0.02, 0.46, 0.38, 0.34),
    random,
    3,
    0.88,
  );

  const layers: PigmentLayer[] = [];
  for (let index = 0; index < 50; index += 1) {
    const colorRun = Math.floor(index / 5) % 2;
    const usePrimary = colorRun === 0;
    const base = usePrimary ? primaryBase : secondaryBase;
    const pigment = usePrimary ? primary : secondary;
    const layerColor = index % 11 === 0
      ? (usePrimary ? deepPrimary : deepSecondary)
      : pigment;
    layers.push({
      points: deformRepeatedly(base, random, index % 3 === 0 ? 2 : 1, 0.8),
      color: layerColor,
      alpha: (index % 11 === 0 ? 0.016 : 0.021) + random() * 0.012,
      offsetX: gaussian(random) * 0.0045,
      offsetY: gaussian(random) * 0.0045,
      scaleX: 0.975 + random() * 0.05,
      scaleY: 0.975 + random() * 0.05,
    });
  }

  const lifts: PaperLift[] = Array.from({ length: 5 }, (_, index) => {
    const centerX = 0.18 + random() * 0.64;
    const centerY = 0.2 + random() * 0.6;
    const radiusX = 0.02 + random() * (index < 1 ? 0.105 : 0.05);
    const radiusY = 0.01 + random() * (index < 1 ? 0.045 : 0.026);
    return {
      points: deformRepeatedly(
        makePolygon(
          random,
          centerX,
          centerY,
          radiusX,
          radiusY,
          5 + Math.floor(random() * 3),
          -0.75 + random() * 1.5,
        ),
        random,
        2,
        1.15,
      ),
      alpha: index < 2 ? 0.2 + random() * 0.16 : 0.08 + random() * 0.12,
    };
  });

  return {
    canvas,
    layers,
    lifts,
    textureSeed: seed * 1543 + 83,
    renderedWidth: 0,
    renderedHeight: 0,
  };
};

const tracePolygon = (
  context: CanvasRenderingContext2D,
  points: PigmentPoint[],
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
  scaleX = 1,
  scaleY = 1,
) => {
  context.beginPath();
  points.forEach((point, index) => {
    const x = ((point.x - 0.5) * scaleX + 0.5 + offsetX) * width;
    const y = ((point.y - 0.5) * scaleY + 0.5 + offsetY) * height;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  });
  context.closePath();
};

const renderWatercolor = (state: WatercolorState, force = false) => {
  const { canvas } = state;
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width < 2 || bounds.height < 2) return;
  const density = Math.min(devicePixelRatio || 1, 1.35, 920 / bounds.width, 620 / bounds.height);
  const width = Math.max(2, Math.round(bounds.width * density));
  const height = Math.max(2, Math.round(bounds.height * density));
  if (!force && width === state.renderedWidth && height === state.renderedHeight) return;
  state.renderedWidth = width;
  state.renderedHeight = height;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, width, height);
  context.globalCompositeOperation = "source-over";

  state.layers.forEach((layer) => {
    tracePolygon(
      context,
      layer.points,
      width,
      height,
      layer.offsetX,
      layer.offsetY,
      layer.scaleX,
      layer.scaleY,
    );
    context.fillStyle = `rgba(${layer.color.r}, ${layer.color.g}, ${layer.color.b}, ${layer.alpha})`;
    context.fill();
  });

  context.globalCompositeOperation = "destination-out";
  state.lifts.forEach((lift) => {
    tracePolygon(context, lift.points, width, height);
    context.fillStyle = `rgba(0, 0, 0, ${lift.alpha})`;
    context.fill();
  });

  const textureRandom = makeRandom(state.textureSeed);
  const poreCount = Math.round(150 + width * height / 10000);
  for (let index = 0; index < poreCount; index += 1) {
    const x = textureRandom() * width;
    const y = textureRandom() * height;
    const radius = (0.45 + Math.abs(gaussian(textureRandom)) * 1.45) * density;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = `rgba(0, 0, 0, ${0.018 + textureRandom() * 0.05})`;
    context.fill();
  }

  context.globalCompositeOperation = "source-over";
};

const watercolorObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const canvas = entry.target as HTMLCanvasElement;
    if (!entry.isIntersecting) {
      const state = stateByCanvas.get(canvas);
      if (state && (state.renderedWidth > 0 || state.renderedHeight > 0)) {
        canvas.width = 1;
        canvas.height = 1;
        state.renderedWidth = 0;
        state.renderedHeight = 0;
      }
      return;
    }
    const state = stateByCanvas.get(canvas) ?? buildWatercolorState(canvas);
    stateByCanvas.set(canvas, state);
    renderWatercolor(state);
  });
}, { rootMargin: "40% 0px 40%", threshold: 0.01 });

watercolorCanvases.forEach((canvas) => watercolorObserver.observe(canvas));

let resizeTimer = 0;
addEventListener("resize", () => {
  if (resizeTimer) window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    resizeTimer = 0;
    watercolorCanvases.forEach((canvas) => {
      const state = stateByCanvas.get(canvas);
      if (state && canvas.getBoundingClientRect().width > 0) renderWatercolor(state, true);
    });
  }, reducedWatercolorMotion.matches ? 0 : 180);
}, { passive: true });
