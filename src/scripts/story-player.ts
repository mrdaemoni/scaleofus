const app = document.querySelector<HTMLElement>("[data-story-app]");
const audio = document.querySelector<HTMLAudioElement>("[data-audio]");
const dock = document.querySelector<HTMLElement>("[data-audio-dock]");
const dockChapterNav = document.querySelector<HTMLElement>(".dock-chapters");
const playButtons = document.querySelectorAll<HTMLButtonElement>("[data-play], [data-hero-play], [data-nav-listen]");
const dockPlay = document.querySelector<HTMLButtonElement>("[data-play]");
const playIcon = document.querySelector<HTMLElement>("[data-play-icon]");
const seek = document.querySelector<HTMLInputElement>("[data-seek]");
const currentTime = document.querySelector<HTMLElement>("[data-current-time]");
const currentChapter = document.querySelector<HTMLElement>("[data-current-chapter]");
const follow = document.querySelector<HTMLButtonElement>("[data-follow]");
const collapse = document.querySelector<HTMLButtonElement>("[data-collapse]");
const storyProgress = document.querySelector<HTMLElement>("[data-reading-progress]");
const chapters = JSON.parse(app?.dataset.chapters ?? "[]") as Array<{
  number: number;
  title: string;
  id: string;
  start: number;
}>;
const beats = JSON.parse(app?.dataset.beats ?? "[]") as Array<{
  number: number;
  start: number;
  end: number;
  chapter: number;
}>;
const chapterLinks = [...document.querySelectorAll<HTMLAnchorElement>("[data-chapter-link], [data-dock-chapter-link]")];
const dockChapterLinks = [...document.querySelectorAll<HTMLAnchorElement>("[data-dock-chapter-link]")];
const beatElements = [...document.querySelectorAll<HTMLElement>("[data-beat]")];
const paragraphs = [...document.querySelectorAll<HTMLElement>("[data-narration-paragraph]")];
const cinematicFrames = [...document.querySelectorAll<HTMLElement>("[data-cinematic-art]")];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

let activeChapter = -1;
let activeBeat = -1;
let activeParagraph = -1;
let followNarration = true;
let dockPinnedOpen = false;
let programmaticScrollUntil = 0;
let lastUserScrollIntent = 0;
let lastCenteredParagraph = -1;
let scrollSyncTimer = 0;
let cinematicFrame = 0;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const format = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
};

const paragraphStart = (index: number) => Number(paragraphs[index]?.dataset.start ?? 0);

const paragraphForTime = (seconds: number) => {
  let index = 0;
  paragraphs.forEach((paragraph, paragraphIndex) => {
    if (seconds >= Number(paragraph.dataset.start ?? 0)) index = paragraphIndex;
  });
  return index;
};

const beatForNumber = (number: number) => beats.findIndex((beat) => beat.number === number);

const setChapter = (index: number) => {
  if (index < 0 || !chapters[index]) return;
  const changed = activeChapter !== index;
  activeChapter = index;
  chapterLinks.forEach((link) => {
    const isCurrent = Number(link.dataset.chapterIndex) === index;
    link.toggleAttribute("aria-current", isCurrent);
  });
  if (currentChapter) {
    const numeral = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"][index];
    currentChapter.textContent = `Chapter ${numeral} · ${chapters[index].title}`;
  }
  if (changed && dockChapterNav) {
    const activeLink = dockChapterLinks.find((link) => Number(link.dataset.chapterIndex) === index);
    if (activeLink) {
      const left = activeLink.offsetLeft - dockChapterNav.clientWidth / 2 + activeLink.offsetWidth / 2;
      dockChapterNav.scrollTo({ left: Math.max(0, left), behavior: reducedMotion.matches ? "auto" : "smooth" });
    }
  }
};

const updateChapterProgress = (seconds: number) => {
  chapterLinks.forEach((link) => {
    const index = Number(link.dataset.chapterIndex);
    const start = Number(chapters[index]?.start ?? 0);
    const end = Number(chapters[index + 1]?.start ?? seek?.max ?? start + 1);
    const progress = clamp((seconds - start) / Math.max(1, end - start));
    link.style.setProperty("--chapter-progress", `${progress * 100}%`);
    link.classList.toggle("is-complete", progress >= 0.999);
  });
};

const updateStoryProgress = (seconds: number) => {
  if (!seek || !currentTime) return;
  const duration = Number(seek.max) || audio?.duration || 1;
  const ratio = clamp(seconds / duration);
  seek.value = String(seconds);
  seek.style.setProperty("--played", `${ratio * 100}%`);
  currentTime.textContent = format(seconds);
  storyProgress?.style.setProperty("transform", `scaleX(${ratio})`);
  document.documentElement.style.setProperty("--nav-cloud-lift", `${ratio * -62}px`);
  document.documentElement.style.setProperty("--nav-cloud-drift", `${Math.sin(ratio * Math.PI * 5) * 11}px`);
  updateChapterProgress(seconds);
};

const setBeat = (index: number) => {
  if (index < 0 || !beats[index]) return;
  activeBeat = index;
  beatElements.forEach((element, elementIndex) => {
    const isCurrent = elementIndex === index;
    element.classList.toggle("is-current-beat", isCurrent);
    element.toggleAttribute("aria-current", isCurrent);
  });
  setChapter(Number(beats[index].chapter) - 1);
};

const readingCenter = () => {
  const dockTop = dock?.getBoundingClientRect().top ?? innerHeight;
  const visibleBottom = Math.min(innerHeight, dockTop - 14);
  return Math.max(90, visibleBottom / 2);
};

const centerParagraph = (index: number, behavior: ScrollBehavior = "smooth") => {
  const paragraph = paragraphs[index];
  if (!paragraph || !followNarration) return;
  if (performance.now() - lastUserScrollIntent < 420) return;
  const rect = paragraph.getBoundingClientRect();
  const desiredTop = scrollY + rect.top + rect.height / 2 - readingCenter();
  const distance = Math.abs(desiredTop - scrollY);
  if (distance < 12) return;
  programmaticScrollUntil = performance.now() + Math.min(1400, Math.max(700, distance * 0.85));
  lastCenteredParagraph = index;
  scrollTo({ top: Math.max(0, desiredTop), behavior: reducedMotion.matches ? "auto" : behavior });
};

const setParagraph = (index: number, source: "audio" | "scroll" | "restore" = "audio") => {
  if (index < 0 || !paragraphs[index]) return;
  const changed = activeParagraph !== index;
  activeParagraph = index;
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const isCurrent = paragraphIndex === index;
    paragraph.classList.toggle("is-current-paragraph", isCurrent);
    paragraph.toggleAttribute("aria-current", isCurrent);
  });
  const beatNumber = Number(paragraphs[index].dataset.beatNumber);
  setBeat(beatForNumber(beatNumber));
  if (source === "audio" && followNarration && changed && lastCenteredParagraph !== index) {
    centerParagraph(index);
  }
};

const updatePlayState = () => {
  if (!audio) return;
  const playing = !audio.paused;
  document.body.classList.toggle("is-listening", playing);
  if (playIcon) playIcon.textContent = playing ? "Ⅱ" : "▶";
  dockPlay?.setAttribute("aria-label", playing ? "Pause narration" : "Play narration");
};

const togglePlayback = async () => {
  if (!audio) return;
  if (audio.paused) {
    try {
      await audio.play();
      updateStoryProgress(audio.currentTime);
      setParagraph(paragraphForTime(audio.currentTime), "audio");
      centerParagraph(paragraphForTime(audio.currentTime));
    } catch {
      return;
    }
  } else {
    audio.pause();
  }
  updatePlayState();
};

const setDockCompact = (compact: boolean) => {
  dock?.classList.toggle("is-compact", compact);
  collapse?.setAttribute("aria-expanded", String(!compact));
  collapse?.setAttribute("aria-label", compact ? "Expand story controls" : "Minimize story controls");
  if (collapse) collapse.textContent = compact ? "⌃" : "⌄";
};

const syncDockFootprint = () => {
  if (dockPinnedOpen) return;
  setDockCompact(scrollY > Math.min(innerHeight * 0.28, 280));
};

const syncAudioFromViewport = () => {
  scrollSyncTimer = 0;
  if (!audio || performance.now() < programmaticScrollUntil) return;
  if (performance.now() - lastUserScrollIntent > 1700) return;
  const center = readingCenter();
  let closest = -1;
  let distance = Number.POSITIVE_INFINITY;
  paragraphs.forEach((paragraph, index) => {
    const rect = paragraph.getBoundingClientRect();
    const paragraphCenter = rect.top + Math.min(rect.height / 2, center * 0.6);
    const candidate = Math.abs(paragraphCenter - center);
    if (candidate < distance) {
      distance = candidate;
      closest = index;
    }
  });
  if (closest < 0) return;
  const nextTime = paragraphStart(closest) + 0.02;
  if (Math.abs(audio.currentTime - nextTime) > 0.45) audio.currentTime = nextTime;
  updateStoryProgress(audio.currentTime);
  setParagraph(closest, "scroll");
  if (followNarration) {
    setTimeout(() => {
      if (activeParagraph === closest) centerParagraph(closest);
    }, 460);
  }
};

const queueViewportSync = () => {
  if (scrollSyncTimer) window.clearTimeout(scrollSyncTimer);
  scrollSyncTimer = window.setTimeout(syncAudioFromViewport, 180);
};

const markUserScrollIntent = (event: Event) => {
  const target = event.target as Element | null;
  if (target?.closest("[data-audio-dock]")) return;
  lastUserScrollIntent = performance.now();
  programmaticScrollUntil = 0;
  lastCenteredParagraph = -1;
};

const updateCinematicMotion = () => {
  cinematicFrame = 0;
  cinematicFrames.forEach((frame, index) => {
    const rect = frame.getBoundingClientRect();
    if (rect.bottom < -innerHeight * 0.35 || rect.top > innerHeight * 1.35) return;
    const progress = clamp((innerHeight - rect.top) / (innerHeight + rect.height));
    const centered = progress - 0.5;
    const direction = index % 2 === 0 ? 1 : -1;
    frame.style.setProperty("--motion-x", `${centered * direction * 24}px`);
    frame.style.setProperty("--motion-y", `${centered * -15}px`);
    frame.style.setProperty("--image-shift", `${centered * -9}px`);
  });
};

const requestCinematicMotion = () => {
  if (!cinematicFrame) cinematicFrame = requestAnimationFrame(updateCinematicMotion);
};

playButtons.forEach((button) => button.addEventListener("click", togglePlayback));
audio?.addEventListener("play", updatePlayState);
audio?.addEventListener("pause", updatePlayState);
audio?.addEventListener("ended", updatePlayState);
audio?.addEventListener("timeupdate", () => {
  updateStoryProgress(audio.currentTime);
  setParagraph(paragraphForTime(audio.currentTime), "audio");
  try {
    localStorage.setItem("scaleofus-wind-progress", String(audio.currentTime));
  } catch {}
});

seek?.addEventListener("input", () => {
  if (!audio) return;
  audio.currentTime = Number(seek.value);
  updateStoryProgress(audio.currentTime);
  setParagraph(paragraphForTime(audio.currentTime), "audio");
});
seek?.addEventListener("change", () => {
  if (audio) centerParagraph(paragraphForTime(audio.currentTime));
});

chapterLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (!audio) return;
    const index = Number(link.dataset.chapterIndex);
    audio.currentTime = Number(link.dataset.start ?? 0);
    updateStoryProgress(audio.currentTime);
    const paragraphIndex = paragraphForTime(audio.currentTime);
    setParagraph(paragraphIndex, "scroll");
    history.replaceState(null, "", link.hash);
    lastUserScrollIntent = 0;
    lastCenteredParagraph = -1;
    centerParagraph(paragraphIndex);
    setChapter(index);
  });
});

follow?.addEventListener("click", () => {
  followNarration = !followNarration;
  follow.setAttribute("aria-pressed", String(followNarration));
  lastCenteredParagraph = -1;
  if (followNarration && audio) centerParagraph(paragraphForTime(audio.currentTime));
});

collapse?.addEventListener("click", () => {
  const compact = dock?.classList.contains("is-compact") ?? false;
  if (compact) {
    dockPinnedOpen = true;
    setDockCompact(false);
  } else {
    dockPinnedOpen = false;
    setDockCompact(true);
  }
});

const beatObserver = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.target.classList.toggle("is-seen", entry.isIntersecting)),
  { rootMargin: "-10% 0px -10%", threshold: 0.16 },
);
beatElements.forEach((beat) => beatObserver.observe(beat));

addEventListener("wheel", markUserScrollIntent, { passive: true });
addEventListener("touchstart", markUserScrollIntent, { passive: true });
addEventListener("keydown", (event) => {
  if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
    markUserScrollIntent(event);
  }
});
addEventListener("scroll", () => {
  syncDockFootprint();
  queueViewportSync();
  requestCinematicMotion();
}, { passive: true });
addEventListener("scrollend", syncAudioFromViewport, { passive: true });
addEventListener("resize", () => {
  syncDockFootprint();
  requestCinematicMotion();
}, { passive: true });

addEventListener("pointermove", (event) => {
  document.documentElement.style.setProperty("--pointer-x", `${event.clientX / innerWidth - 0.5}`);
  document.documentElement.style.setProperty("--pointer-y", `${event.clientY / innerHeight - 0.5}`);
}, { passive: true });

const restorePosition = () => {
  if (!audio || !seek) return;
  let restored = 0;
  try {
    const saved = Number(localStorage.getItem("scaleofus-wind-progress"));
    if (Number.isFinite(saved) && saved > 5 && saved < Number(seek.max) - 5) restored = saved;
  } catch {}
  if (location.hash.startsWith("#beat-")) {
    const beatNumber = Number(location.hash.replace("#beat-", ""));
    restored = Number(beats.find((beat) => beat.number === beatNumber)?.start ?? restored);
  } else if (location.hash.startsWith("#chapter-")) {
    restored = Number(chapters.find((chapter) => `#${chapter.id}` === location.hash)?.start ?? restored);
  }
  audio.currentTime = restored;
  updateStoryProgress(restored);
  setParagraph(paragraphForTime(restored), "restore");
};

restorePosition();
syncDockFootprint();
updateCinematicMotion();
updatePlayState();
