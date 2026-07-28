const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const compactReader = matchMedia("(max-width: 760px), (pointer: coarse)");
const drawings = [...document.querySelectorAll<HTMLElement>("[data-live-drawing]")];

const svgCache = new Map<string, Promise<string>>();
const drawingLoads = new WeakMap<HTMLElement, Promise<void>>();
const drawingUnloadTimers = new WeakMap<HTMLElement, number>();
const drawingRevealTimers = new WeakMap<HTMLElement, number[]>();
const visibleDrawings = new Set<HTMLElement>();
let phase = 0;
let boilTimer = 0;

const fetchSvg = (source: string) => {
  const cached = svgCache.get(source);
  if (cached) return cached;
  const request = fetch(source, { credentials: "same-origin" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Unable to load drawing ${source}: ${response.status}`);
      return response.text();
    })
    .catch((error) => {
      svgCache.delete(source);
      throw error;
    });
  svgCache.set(source, request);
  return request;
};

const mobileSourceFor = (drawing: HTMLElement, source: string) =>
  drawing.dataset.rasterSrc
  || source.replace("/live/", "/mobile/").replace(/\.svg$/, ".webp");

const fitSvgToDrawnBounds = (
  svg: SVGSVGElement,
  viewBox: [number, number, number, number],
) => {
  const [sourceX, sourceY, sourceWidth, sourceHeight] = viewBox;
  const sourceRight = sourceX + sourceWidth;
  const sourceBottom = sourceY + sourceHeight;
  const graphics = [...svg.querySelectorAll<SVGGraphicsElement>(":scope > .s, :scope > .f")];
  const boxes = graphics.flatMap((graphic) => {
    try {
      const box = graphic.getBBox();
      return box.width > 0 && box.height > 0 ? [box] : [];
    } catch {
      return [];
    }
  });
  if (!boxes.length) return viewBox;

  const contentLeft = Math.min(...boxes.map((box) => box.x));
  const contentTop = Math.min(...boxes.map((box) => box.y));
  const contentRight = Math.max(...boxes.map((box) => box.x + box.width));
  const contentBottom = Math.max(...boxes.map((box) => box.y + box.height));
  const overflows = (
    contentLeft < sourceX
    || contentTop < sourceY
    || contentRight > sourceRight
    || contentBottom > sourceBottom
  );
  if (!overflows) return viewBox;

  const paddingX = sourceWidth * 0.035;
  const paddingY = sourceHeight * 0.035;
  const fittedX = Math.min(sourceX, contentLeft - paddingX);
  const fittedY = Math.min(sourceY, contentTop - paddingY);
  const fittedRight = Math.max(sourceRight, contentRight + paddingX);
  const fittedBottom = Math.max(sourceBottom, contentBottom + paddingY);
  return [fittedX, fittedY, fittedRight - fittedX, fittedBottom - fittedY] as [
    number,
    number,
    number,
    number,
  ];
};

const desiredRenderMode = (drawing: HTMLElement) => {
  if (!compactReader.matches) return "inline";
  if (reducedMotion.matches || !drawing.hasAttribute("data-mobile-animate")) return "raster";
  return "inline";
};

const hasBoilingDrawing = () => [...visibleDrawings].some((drawing) =>
  drawing.dataset.liveRenderMode === "inline"
  && drawing.classList.contains("is-drawn"),
);

const stopBoilIfIdle = () => {
  if (hasBoilingDrawing() || !boilTimer) return;
  window.clearInterval(boilTimer);
  boilTimer = 0;
};

const startBoil = () => {
  if (
    reducedMotion.matches
    || boilTimer
    || !hasBoilingDrawing()
    || document.hidden
  ) return;
  boilTimer = window.setInterval(() => {
    phase = (phase + 1) % 3;
    visibleDrawings.forEach((drawing) => {
      if (
        drawing.dataset.liveRenderMode !== "inline"
        || !drawing.classList.contains("is-drawn")
        || drawing.classList.contains("is-jolt-frame")
      ) return;
      drawing.classList.remove("is-boil-0", "is-boil-1", "is-boil-2");
      drawing.classList.add(`is-boil-${phase}`);
    });
  }, 140);
};

const jolt = (drawing: HTMLElement) => {
  if (
    reducedMotion.matches
    || drawing.dataset.liveRenderMode !== "inline"
    || !drawing.classList.contains("is-drawn")
  ) return;
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

const clearRevealTimers = (drawing: HTMLElement) => {
  drawingRevealTimers.get(drawing)?.forEach((timer) => window.clearTimeout(timer));
  drawingRevealTimers.delete(drawing);
};

const resetDrawing = (drawing: HTMLElement) => {
  clearRevealTimers(drawing);
  drawing.replaceChildren();
  drawing.classList.remove(
    "is-boil-0",
    "is-boil-1",
    "is-boil-2",
    "is-drawn",
    "is-grained",
    "is-jolt-frame",
    "is-drawing-jolt",
  );
  delete drawing.dataset.liveLoaded;
  delete drawing.dataset.liveRevealed;
  delete drawing.dataset.liveRenderMode;
  delete drawing.dataset.liveError;
  delete drawing.dataset.liveRetryCount;
  delete drawing.dataset.liveViewBoxFitted;
};

const releaseCompactDrawing = (drawing: HTMLElement) => {
  if (!compactReader.matches || visibleDrawings.has(drawing)) return;
  const source = drawing.dataset.svgSrc;
  resetDrawing(drawing);
  if (source) svgCache.delete(source);
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
  ) return;
  const timer = window.setTimeout(() => {
    drawingUnloadTimers.delete(drawing);
    releaseCompactDrawing(drawing);
  }, 620);
  drawingUnloadTimers.set(drawing, timer);
};

const mountLightweightDrawing = (drawing: HTMLElement, source: string) => new Promise<void>((resolve, reject) => {
  const mobileSource = mobileSourceFor(drawing, source);
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
    delete drawing.dataset.liveRetryCount;
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
      if (desiredRenderMode(drawing) === "raster") {
        await mountLightweightDrawing(drawing, source);
        return;
      }
      const markup = await fetchSvg(source);
      drawing.innerHTML = markup;
      // Every story figure has its own source. Once desktop has parsed the SVG
      // into DOM, retaining a second full markup string only wastes memory.
      if (!compactReader.matches) svgCache.delete(source);
      const svg = drawing.querySelector<SVGSVGElement>("svg");
      const viewBox = svg?.getAttribute("viewBox")?.trim().split(/\s+/).map(Number);
      if (!svg || !viewBox || viewBox.length !== 4 || viewBox.some((value) => !Number.isFinite(value))) {
        throw new Error(`Drawing ${source} has no valid viewBox.`);
      }
      const fittedViewBox = fitSvgToDrawnBounds(svg, viewBox as [number, number, number, number]);
      svg.setAttribute("viewBox", fittedViewBox.join(" "));
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
      svg.style.aspectRatio = `${fittedViewBox[2]} / ${fittedViewBox[3]}`;
      if (fittedViewBox.some((value, index) => Math.abs(value - viewBox[index]) > 0.01)) {
        drawing.dataset.liveViewBoxFitted = "true";
      }
      drawing.classList.add("is-boil-0");
      drawing.dataset.liveLoaded = "true";
      drawing.dataset.liveRenderMode = "inline";
      delete drawing.dataset.liveRetryCount;
      if (drawing.dataset.livePointerBound !== "true") {
        drawing.dataset.livePointerBound = "true";
        drawing.addEventListener("pointerdown", () => jolt(drawing), { passive: true });
      }
      if (reducedMotion.matches) showStaticDrawing(drawing);
    } catch (error) {
      const retryCount = Number(drawing.dataset.liveRetryCount ?? 0);
      if (retryCount < 2) {
        drawing.dataset.liveRetryCount = String(retryCount + 1);
        window.setTimeout(() => {
          if (visibleDrawings.has(drawing)) void revealDrawing(drawing);
        }, 260 * (retryCount + 1));
        return;
      }
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
  if (drawing.dataset.liveLoaded !== "true") return;
  if (drawing.dataset.liveRevealed === "true" || drawing.dataset.liveError === "true") return;
  drawing.dataset.liveRevealed = "true";
  if (drawing.dataset.liveRenderMode === "raster") {
    showLightweightDrawing(drawing);
    return;
  }
  if (reducedMotion.matches) {
    showStaticDrawing(drawing);
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
  drawingRevealTimers.set(drawing, timers);
};

const refreshDrawingMode = async (drawing: HTMLElement) => {
  const pending = drawingLoads.get(drawing);
  if (pending) await pending;
  const desired = desiredRenderMode(drawing);
  if (drawing.dataset.liveLoaded === "true" && drawing.dataset.liveRenderMode !== desired) {
    resetDrawing(drawing);
  }
  if (visibleDrawings.has(drawing)) await revealDrawing(drawing);
  else scheduleDrawingRelease(drawing);
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
}, {
  rootMargin: compactReader.matches ? "0px" : "20% 0px",
  threshold: compactReader.matches ? 0.18 : 0.04,
});

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

document.addEventListener("story:reader-mode", () => {
  visibleDrawings.forEach((drawing) => {
    void refreshDrawingMode(drawing).then(startBoil);
  });
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
    if (visibleDrawings.has(drawing)) void refreshDrawingMode(drawing).then(startBoil);
    else scheduleDrawingRelease(drawing);
  });
});
