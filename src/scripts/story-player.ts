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
const narrationWords = [...document.querySelectorAll<HTMLElement>("[data-narration-word]")];
const narrationWordStarts = narrationWords.map((word) => Number(word.dataset.start ?? 0));
const cinematicFrames = [...document.querySelectorAll<HTMLElement>("[data-cinematic-art]")];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const desktopReader = matchMedia("(min-width: 761px)");

let activeChapter = -1;
let activeBeat = -1;
let activeParagraph = -1;
let activeWord = -1;
let followNarration = true;
let dockPinnedOpen = false;
let autoScrollActive = false;
let manualScrollActive = false;
let touchActive = false;
let lastCenteredParagraph = -1;
let manualScrollTimer = 0;
let autoScrollTimer = 0;
let cinematicFrame = 0;
let narrationFrame = 0;
let fitTimer = 0;

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

const wordForTime = (seconds: number) => {
  let low = 0;
  let high = narrationWordStarts.length - 1;
  let match = -1;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (narrationWordStarts[middle] <= seconds) {
      match = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  if (match < 0) return -1;
  const wordEnd = Number(narrationWords[match]?.dataset.end ?? narrationWordStarts[match]);
  return seconds <= wordEnd + 0.09 ? match : -1;
};

const setWord = (index: number) => {
  if (activeWord === index) return;
  narrationWords[activeWord]?.classList.remove("is-current-word");
  if (index < 0 || !narrationWords[index]) {
    activeWord = -1;
    return;
  }
  narrationWords[index].classList.add("is-current-word");
  document.body.dataset.activeSpeaker = narrationWords[index].dataset.speaker ?? "narrator";
  activeWord = index;
};

const syncNarrationWord = () => {
  if (!audio || !narrationWords.length) return;
  setWord(wordForTime(audio.currentTime));
};

const runNarrationLoop = () => {
  narrationFrame = 0;
  if (!audio || audio.paused) return;
  syncNarrationWord();
  narrationFrame = requestAnimationFrame(runNarrationLoop);
};

const startNarrationLoop = () => {
  if (!narrationFrame) narrationFrame = requestAnimationFrame(runNarrationLoop);
};

const stopNarrationLoop = () => {
  if (narrationFrame) cancelAnimationFrame(narrationFrame);
  narrationFrame = 0;
  syncNarrationWord();
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
    currentChapter.textContent = `Chapter ${index + 1} · ${chapters[index].title}`;
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
  if (activeBeat !== index && beatElements[activeBeat]) {
    beatElements[activeBeat].style.removeProperty("--reader-beat-gap");
    beatElements[activeBeat].querySelector<HTMLElement>("[data-cinematic-art]")
      ?.style.removeProperty("--fitted-art-height");
  }
  activeBeat = index;
  beatElements.forEach((element, elementIndex) => {
    const isCurrent = elementIndex === index;
    element.classList.toggle("is-current-beat", isCurrent);
    element.toggleAttribute("aria-current", isCurrent);
  });
  setChapter(Number(beats[index].chapter) - 1);
};

const readingBounds = () => {
  const top = clamp(innerHeight * 0.025, 14, 30);
  const dockTop = dock?.getBoundingClientRect().top ?? innerHeight;
  const bottom = Math.max(top + 320, Math.min(innerHeight - 12, dockTop - 16));
  return { top, bottom, height: bottom - top };
};

const readingFocus = () => {
  const bounds = readingBounds();
  return bounds.top + bounds.height * (desktopReader.matches ? 0.76 : 0.5);
};

const fitBeatToViewport = (index: number) => {
  const paragraph = paragraphs[index];
  const beat = paragraph?.closest<HTMLElement>("[data-beat]");
  const frame = beat?.querySelector<HTMLElement>("[data-cinematic-art]");
  if (!paragraph || !beat || !frame) return null;

  frame.style.removeProperty("--fitted-art-height");
  beat.style.removeProperty("--reader-beat-gap");
  if (!desktopReader.matches) return frame;

  const bounds = readingBounds();
  const frameRect = frame.getBoundingClientRect();
  const paragraphRect = paragraph.getBoundingClientRect();
  const fixedHeight = Math.max(0, paragraphRect.bottom - frameRect.top - frameRect.height);
  const naturalHeight = frame.clientWidth * 2 / 3;
  const minHeight = Math.min(300, bounds.height * 0.36);
  const maxHeight = Math.min(naturalHeight, bounds.height * 0.72);
  const fittedHeight = clamp(bounds.height - fixedHeight, minHeight, maxHeight);
  frame.style.setProperty("--fitted-art-height", `${Math.round(fittedHeight)}px`);

  const fittedFrame = frame.getBoundingClientRect();
  const fittedParagraph = paragraph.getBoundingClientRect();
  const slack = bounds.height - (fittedParagraph.bottom - fittedFrame.top);
  if (slack > 7) {
    const currentGap = Number.parseFloat(getComputedStyle(beat).rowGap) || 34;
    beat.style.setProperty("--reader-beat-gap", `${Math.round(clamp(currentGap + slack, 30, 82))}px`);
  }
  return frame;
};

const centerParagraph = (index: number, behavior: ScrollBehavior = "smooth") => {
  const paragraph = paragraphs[index];
  if (!paragraph || !followNarration || manualScrollActive) return;
  const frame = fitBeatToViewport(index);
  const bounds = readingBounds();
  const rect = paragraph.getBoundingClientRect();
  const desiredTop = desktopReader.matches && frame
    ? scrollY + frame.getBoundingClientRect().top - bounds.top
    : scrollY + rect.top + rect.height / 2 - readingFocus();
  const distance = Math.abs(desiredTop - scrollY);
  if (distance < 12) return;
  autoScrollActive = true;
  lastCenteredParagraph = index;
  if (autoScrollTimer) window.clearTimeout(autoScrollTimer);
  autoScrollTimer = window.setTimeout(() => {
    autoScrollActive = false;
  }, reducedMotion.matches ? 50 : 1400);
  scrollTo({ top: Math.max(0, desiredTop), behavior: reducedMotion.matches ? "auto" : behavior });
};

const queueViewportFit = (delay = 380) => {
  if (fitTimer) window.clearTimeout(fitTimer);
  fitTimer = window.setTimeout(() => {
    fitTimer = 0;
    if (activeParagraph >= 0 && followNarration && audio && !audio.paused && !manualScrollActive) {
      centerParagraph(activeParagraph, "auto");
    }
  }, delay);
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
  if (source === "audio" && followNarration && !manualScrollActive && changed && lastCenteredParagraph !== index) {
    centerParagraph(index);
  }
};

const updatePlayState = () => {
  if (!audio) return;
  const playing = !audio.paused;
  document.body.classList.toggle("is-listening", playing);
  if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
  dockPlay?.setAttribute("aria-label", playing ? "Pause narration" : "Play narration");
};

const togglePlayback = async () => {
  if (!audio) return;
  if (manualScrollActive && !touchActive) syncAudioFromViewport();
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
  if ((dock?.classList.contains("is-compact") ?? false) === compact) return;
  dock?.classList.toggle("is-compact", compact);
  collapse?.setAttribute("aria-expanded", String(!compact));
  collapse?.setAttribute("aria-label", compact ? "Expand story controls" : "Minimize story controls");
  if (collapse) collapse.textContent = compact ? "⌃" : "⌄";
  queueViewportFit();
};

const syncDockFootprint = () => {
  if (dockPinnedOpen) return;
  setDockCompact(scrollY > Math.min(innerHeight * 0.28, 280));
};

const closestParagraphToReadingCenter = () => {
  const center = readingFocus();
  let closest = -1;
  let distance = Number.POSITIVE_INFINITY;
  paragraphs.forEach((paragraph, index) => {
    const rect = paragraph.getBoundingClientRect();
    const paragraphCenter = rect.top + rect.height / 2;
    const candidate = Math.abs(paragraphCenter - center);
    if (candidate < distance) {
      distance = candidate;
      closest = index;
    }
  });
  return closest;
};

const syncAudioFromViewport = () => {
  manualScrollTimer = 0;
  if (!audio || !manualScrollActive || touchActive || autoScrollActive) return;
  const closest = closestParagraphToReadingCenter();
  if (closest < 0) return;
  manualScrollActive = false;
  const nextTime = paragraphStart(closest) + 0.02;
  if (Math.abs(audio.currentTime - nextTime) > 0.45) audio.currentTime = nextTime;
  updateStoryProgress(audio.currentTime);
  setParagraph(closest, "scroll");
};

const queueViewportSync = (delay = 220) => {
  if (manualScrollTimer) window.clearTimeout(manualScrollTimer);
  manualScrollTimer = window.setTimeout(syncAudioFromViewport, delay);
};

const beginManualScroll = (event: Event) => {
  const target = event.target as Element | null;
  if (target?.closest("[data-audio-dock]")) return;
  manualScrollActive = true;
  autoScrollActive = false;
  if (autoScrollTimer) window.clearTimeout(autoScrollTimer);
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
audio?.addEventListener("play", () => {
  updatePlayState();
  startNarrationLoop();
});
audio?.addEventListener("pause", () => {
  updatePlayState();
  stopNarrationLoop();
});
audio?.addEventListener("ended", () => {
  updatePlayState();
  stopNarrationLoop();
});
audio?.addEventListener("timeupdate", () => {
  updateStoryProgress(audio.currentTime);
  setParagraph(paragraphForTime(audio.currentTime), "audio");
  syncNarrationWord();
  try {
    localStorage.setItem("scaleofus-wind-progress", String(audio.currentTime));
  } catch {}
});

seek?.addEventListener("input", () => {
  if (!audio) return;
  audio.currentTime = Number(seek.value);
  updateStoryProgress(audio.currentTime);
  setParagraph(paragraphForTime(audio.currentTime), "scroll");
  syncNarrationWord();
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
    manualScrollActive = false;
    autoScrollActive = false;
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

addEventListener("wheel", beginManualScroll, { passive: true });
addEventListener("touchstart", (event) => {
  touchActive = true;
  beginManualScroll(event);
}, { passive: true });
addEventListener("touchend", () => {
  touchActive = false;
  if (manualScrollActive) queueViewportSync(240);
}, { passive: true });
addEventListener("touchcancel", () => {
  touchActive = false;
  if (manualScrollActive) queueViewportSync(240);
}, { passive: true });
addEventListener("keydown", (event) => {
  if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
    beginManualScroll(event);
  }
});
addEventListener("scroll", () => {
  syncDockFootprint();
  if (manualScrollActive && !autoScrollActive) queueViewportSync();
  requestCinematicMotion();
}, { passive: true });
addEventListener("scrollend", () => {
  if (autoScrollActive) {
    autoScrollActive = false;
    return;
  }
  if (manualScrollActive && !touchActive) queueViewportSync(80);
}, { passive: true });
addEventListener("resize", () => {
  syncDockFootprint();
  requestCinematicMotion();
  if (!desktopReader.matches) {
    beatElements.forEach((beat) => {
      beat.style.removeProperty("--reader-beat-gap");
      beat.querySelector<HTMLElement>("[data-cinematic-art]")?.style.removeProperty("--fitted-art-height");
    });
  }
  queueViewportFit(160);
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
  syncNarrationWord();
};

restorePosition();
syncDockFootprint();
updateCinematicMotion();
updatePlayState();
