const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const compactReader = matchMedia("(max-width: 760px), (pointer: coarse)");
const drawings = [...document.querySelectorAll<HTMLElement>("[data-live-drawing]")];

const svgCache = new Map<string, Promise<string>>();
const drawingLoads = new WeakMap<HTMLElement, Promise<void>>();
const drawingUnloadTimers = new WeakMap<HTMLElement, number>();
const visibleDrawings = new Set<HTMLElement>();
let phase = 0;
let boilTimer = 0;

const fetchSvg = (source: string) => {
  const cached = svgCache.get(source);
  if (cached) return cached;
  const request = fetch(source, { credentials: "same-origin" }).then(async (response) => {
    if (!response.ok) throw new Error(`Unable to load drawing ${source}: ${response.status}`);
    return response.text();
  });
  svgCache.set(source, request);
  return request;
};

const mobileSourceFor = (source: string) => source
  .replace("/wind-story/live/", "/wind-story/mobile/")
  .replace(/\.svg$/, ".webp");

const stopBoilIfIdle = () => {
  if (visibleDrawings.size || !boilTimer) return;
  window.clearInterval(boilTimer);
  boilTimer = 0;
};

const startBoil = () => {
  if (compactReader.matches || reducedMotion.matches || boilTimer || !visibleDrawings.size || document.hidden) return;
  boilTimer = window.setInterval(() => {
    phase = (phase + 1) % 3;
    visibleDrawings.forEach((drawing) => {
      if (!drawing.classList.contains("is-drawn") || drawing.classList.contains("is-jolt-frame")) return;
      drawing.classList.remove("is-boil-0", "is-boil-1", "is-boil-2");
      drawing.classList.add(`is-boil-${phase}`);
    });
  }, 140);
};

const jolt = (drawing: HTMLElement) => {
  if (compactReader.matches || reducedMotion.matches || !drawing.classList.contains("is-drawn")) return;
  drawing.classList.add("is-jolt-frame");
  drawing.classList.remove("is-drawing-jolt");
  void drawing.offsetWidth;
  drawing.classList.add("is-drawing-jolt");
  let flips = 0;
  const timer = window.setInterval(() => {
    drawing.classList.toggle("is-jolt-frame");
    flips += 1;
    if (flips < 5) return;
    window.clearInterval(timer);
    drawing.classList.remove("is-jolt-frame");
  }, 70);
};

const showStaticDrawing = (drawing: HTMLElement) => {
  drawing.classList.add("is-boil-0", "is-drawn", "is-grained");
  drawing.querySelectorAll<HTMLElement>("[data-r] .chunk").forEach((chunk) => {
    chunk.style.opacity = "1";
  });
};

const showLightweightDrawing = (drawing: HTMLElement) => {
  drawing.classList.remove("is-grained", "is-jolt-frame", "is-drawing-jolt");
  drawing.classList.add("is-boil-0", "is-drawn");
  drawing.querySelectorAll<HTMLElement>("[data-r] .chunk").forEach((chunk) => {
    chunk.style.opacity = "1";
  });
};

const releaseLightweightDrawing = (drawing: HTMLElement) => {
  if (drawing.dataset.liveRenderMode !== "raster" || visibleDrawings.has(drawing)) return;
  drawing.replaceChildren();
  drawing.classList.remove("is-boil-0", "is-boil-1", "is-boil-2", "is-drawn");
  delete drawing.dataset.liveLoaded;
  delete drawing.dataset.liveRevealed;
  delete drawing.dataset.liveRenderMode;
};

const cancelDrawingRelease = (drawing: HTMLElement) => {
  const timer = drawingUnloadTimers.get(drawing);
  if (!timer) return;
  window.clearTimeout(timer);
  drawingUnloadTimers.delete(drawing);
};

const scheduleDrawingRelease = (drawing: HTMLElement) => {
  if (
    !compactReader.matches
    || drawingUnloadTimers.has(drawing)
    || (drawing.dataset.liveRenderMode !== "raster" && !drawingLoads.has(drawing))
  ) return;
  const timer = window.setTimeout(() => {
    drawingUnloadTimers.delete(drawing);
    releaseLightweightDrawing(drawing);
  }, 2500);
  drawingUnloadTimers.set(drawing, timer);
};

const mountLightweightDrawing = (drawing: HTMLElement, source: string) => new Promise<void>((resolve, reject) => {
  const mobileSource = mobileSourceFor(source);
  const image = document.createElement("img");
  image.className = "live-drawing-image";
  image.alt = "";
  image.decoding = "async";
  image.loading = "eager";
  image.setAttribute("aria-hidden", "true");
  image.addEventListener("load", () => {
    drawing.replaceChildren(image);
    drawing.classList.add("is-boil-0", "is-drawn");
    drawing.dataset.liveLoaded = "true";
    drawing.dataset.liveRevealed = "true";
    drawing.dataset.liveRenderMode = "raster";
    if (!visibleDrawings.has(drawing)) scheduleDrawingRelease(drawing);
    resolve();
  }, { once: true });
  image.addEventListener("error", () => reject(new Error(`Unable to load drawing ${mobileSource}.`)), { once: true });
  image.src = mobileSource;
});

const injectDrawing = async (drawing: HTMLElement) => {
  if (drawing.dataset.liveLoaded === "true") return;
  const pending = drawingLoads.get(drawing);
  if (pending) return pending;
  const source = drawing.dataset.svgSrc;
  if (!source) return;
  const request = (async () => {
    try {
      if (compactReader.matches) {
        await mountLightweightDrawing(drawing, source);
        return;
      }
      const markup = await fetchSvg(source);
      drawing.innerHTML = markup;
      const svg = drawing.querySelector<SVGSVGElement>("svg");
      const viewBox = svg?.getAttribute("viewBox")?.trim().split(/\s+/).map(Number);
      if (!svg || !viewBox || viewBox.length !== 4 || viewBox.some((value) => !Number.isFinite(value))) {
        throw new Error(`Drawing ${source} has no valid viewBox.`);
      }
      svg.style.aspectRatio = `${viewBox[2]} / ${viewBox[3]}`;
      drawing.classList.add("is-boil-0");
      drawing.dataset.liveLoaded = "true";
      drawing.dataset.liveRenderMode = "inline";
      drawing.addEventListener("pointerdown", () => jolt(drawing), { passive: true });
      if (reducedMotion.matches) showStaticDrawing(drawing);
    } catch (error) {
      console.error(error);
      drawing.dataset.liveError = "true";
      const frame = drawing.closest<HTMLElement>(".beat-art-frame");
      frame?.classList.add("is-missing-art");
      frame?.querySelector<HTMLElement>(".art-placeholder")?.setAttribute("aria-hidden", "false");
    } finally {
      drawingLoads.delete(drawing);
    }
  })();
  drawingLoads.set(drawing, request);
  return request;
};

const revealDrawing = async (drawing: HTMLElement) => {
  await injectDrawing(drawing);
  if (drawing.dataset.liveRevealed === "true" || drawing.dataset.liveError === "true") return;
  drawing.dataset.liveRevealed = "true";
  if (reducedMotion.matches) {
    showStaticDrawing(drawing);
    return;
  }
  if (compactReader.matches) {
    showLightweightDrawing(drawing);
    return;
  }

  const chunks = [...drawing.querySelectorAll<HTMLElement>("[data-r] .chunk")];
  const lastChunk = chunks.reduce((maximum, chunk) => Math.max(maximum, Number(chunk.dataset.i ?? 0)), 0);
  const timers = chunks.map((chunk) => window.setTimeout(() => {
    chunk.style.opacity = "1";
  }, 80 + Number(chunk.dataset.i ?? 0) * 100));
  const finish = 80 + (lastChunk + 1) * 100;
  timers.push(window.setTimeout(() => drawing.classList.add("is-grained"), finish));
  timers.push(window.setTimeout(() => {
    drawing.classList.add("is-drawn");
    startBoil();
  }, finish + 300));
};

const visibilityObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const drawing = entry.target as HTMLElement;
    if (entry.isIntersecting) {
      cancelDrawingRelease(drawing);
      visibleDrawings.add(drawing);
      void revealDrawing(drawing).then(startBoil);
    } else {
      visibleDrawings.delete(drawing);
      scheduleDrawingRelease(drawing);
      stopBoilIfIdle();
    }
  });
}, { rootMargin: "20% 0px", threshold: 0.04 });

const preloadObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const drawing = entry.target as HTMLElement;
    void injectDrawing(drawing);
    observer.unobserve(drawing);
  });
}, { rootMargin: "90% 0px" });

drawings.forEach((drawing) => {
  visibilityObserver.observe(drawing);
  if (!compactReader.matches) preloadObserver.observe(drawing);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (boilTimer) window.clearInterval(boilTimer);
    boilTimer = 0;
  } else {
    startBoil();
  }
});

document.addEventListener("story:wind-awake", () => {
  const cover = document.querySelector<HTMLElement>("[data-live-cover]");
  if (!cover) return;
  void revealDrawing(cover).then(() => jolt(cover));
});

reducedMotion.addEventListener("change", () => {
  if (!reducedMotion.matches) {
    startBoil();
    return;
  }
  if (boilTimer) window.clearInterval(boilTimer);
  boilTimer = 0;
  drawings.forEach((drawing) => {
    if (drawing.dataset.liveLoaded === "true") showStaticDrawing(drawing);
  });
});

compactReader.addEventListener("change", () => {
  if (!compactReader.matches) {
    drawings.forEach((drawing) => {
      if (drawing.dataset.liveLoaded !== "true") preloadObserver.observe(drawing);
    });
    startBoil();
    return;
  }
  if (boilTimer) window.clearInterval(boilTimer);
  boilTimer = 0;
  drawings.forEach((drawing) => {
    preloadObserver.unobserve(drawing);
    if (drawing.dataset.liveLoaded === "true") showLightweightDrawing(drawing);
  });
});
