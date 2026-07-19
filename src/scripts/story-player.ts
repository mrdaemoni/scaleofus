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
  transitionStart: number;
  headingEnd: number;
  firstWordStart: number;
}>;
const beats = JSON.parse(app?.dataset.beats ?? "[]") as Array<{
  number: number;
  start: number;
  end: number;
  chapter: number;
}>;
const chapterLinks = [...document.querySelectorAll<HTMLAnchorElement>("[data-chapter-link], [data-dock-chapter-link]")];
const dockChapterLinks = [...document.querySelectorAll<HTMLAnchorElement>("[data-dock-chapter-link]")];
const railChapterLinks = [...document.querySelectorAll<HTMLAnchorElement>(".chapter-rail [data-chapter-link]")];
const beatElements = [...document.querySelectorAll<HTMLElement>("[data-beat]")];
const paragraphs = [...document.querySelectorAll<HTMLElement>("[data-narration-paragraph]")];
const coverHeading = document.querySelector<HTMLElement>("[data-cover-heading]");
const chapterHeadings = [...document.querySelectorAll<HTMLElement>("[data-chapter-heading]")];
const narrationWords = [...document.querySelectorAll<HTMLElement>("[data-narration-word]")];
const narrationWordStarts = narrationWords.map((word) => Number(word.dataset.start ?? 0));
const cinematicFrames = [...document.querySelectorAll<HTMLElement>("[data-cinematic-art]")];
const storyArtImages = [...document.querySelectorAll<HTMLImageElement>("[data-story-art]")];
const readerHome = document.querySelector<HTMLAnchorElement>("[data-reader-home]");
const mountainArt = document.querySelector<HTMLElement>("[data-mountain-art]");
const mountainClimber = document.querySelector<HTMLElement>("[data-mountain-climber]");
const mountainPaths = [...document.querySelectorAll<HTMLElement>("[data-mountain-path]")];
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const desktopReader = matchMedia("(min-width: 761px)");

let activeChapter = -1;
let activeBeat = -1;
let activeParagraph = -1;
let activeHeading = -1;
let coverIsActive = false;
let activeWord = -1;
let followNarration = true;
let dockPinnedOpen = false;
let autoScrollActive = false;
let manualScrollActive = false;
let touchActive = false;
let lastCenteredParagraph = -1;
let lastCenteredHeading = -1;
let manualScrollTimer = 0;
let autoScrollTimer = 0;
let autoScrollTarget = -1;
let cinematicFrame = 0;
let narrationFrame = 0;
let fitTimer = 0;
let mountainAnchors: Array<{ x: number; y: number }> = [];
const windTrailTimers = new Map<HTMLElement, number>();

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const randomBetween = (minimum: number, maximum: number) => minimum + Math.random() * (maximum - minimum);

const shapeWindWake = (word: HTMLElement) => {
  const arrivalDuration = Math.round(randomBetween(760, 1180));
  const releaseDuration = Math.round(randomBetween(1520, 2480));
  const lift = randomBetween(-0.32, 0.24);
  const rotation = randomBetween(-6.5, 6.5);
  const skew = randomBetween(-17, 8);

  word.dataset.windRelease = String(releaseDuration);
  word.style.setProperty("--wind-arrival-duration", `${arrivalDuration}ms`);
  word.style.setProperty("--wind-release-duration", `${releaseDuration}ms`);
  word.style.setProperty("--wind-before-top", `${randomBetween(-24, 14).toFixed(1)}%`);
  word.style.setProperty("--wind-before-right", `${-randomBetween(2.4, 6.8).toFixed(2)}em`);
  word.style.setProperty("--wind-before-bottom", `${-randomBetween(22, 68).toFixed(1)}%`);
  word.style.setProperty("--wind-before-left", `${-randomBetween(1.2, 3.6).toFixed(2)}em`);
  word.style.setProperty("--wind-tail-top", `${randomBetween(34, 74).toFixed(1)}%`);
  word.style.setProperty("--wind-tail-right", `${-randomBetween(3.8, 10).toFixed(2)}em`);
  word.style.setProperty("--wind-tail-left", `${-randomBetween(1.4, 4.2).toFixed(2)}em`);
  word.style.setProperty("--wind-tail-height", `${randomBetween(0.28, 0.9).toFixed(2)}em`);
  word.style.setProperty("--wind-entry-y", `${randomBetween(-0.2, 0.24).toFixed(2)}em`);
  word.style.setProperty("--wind-lift", `${lift.toFixed(2)}em`);
  word.style.setProperty("--wind-skew", `${skew.toFixed(1)}deg`);
  word.style.setProperty("--wind-rotate", `${rotation.toFixed(1)}deg`);
  word.style.setProperty("--wind-release-skew", `${(-skew * 0.5).toFixed(1)}deg`);
  word.style.setProperty("--wind-release-rotate", `${(rotation * 1.6).toFixed(1)}deg`);
  word.style.setProperty("--wind-settle-x", `${randomBetween(0.16, 0.78).toFixed(2)}em`);
  word.style.setProperty("--wind-release-x", `${randomBetween(2.4, 7.2).toFixed(2)}em`);
  word.style.setProperty("--wind-release-y", `${(lift + randomBetween(-0.18, 0.22)).toFixed(2)}em`);
  word.style.setProperty("--wind-tail-scale", randomBetween(1.4, 3.4).toFixed(2));
  word.style.setProperty("--wind-bloom-opacity", randomBetween(0.28, 0.54).toFixed(2));
  const windBlur = randomBetween(3.2, 7.8);
  word.style.setProperty("--wind-blur", `${windBlur.toFixed(1)}px`);
  word.style.setProperty("--wind-tail-blur", `${(windBlur * 0.72).toFixed(1)}px`);
  word.style.setProperty("--wind-feather-y", `${randomBetween(16, 76).toFixed(1)}%`);
  word.style.setProperty("--wind-feather-rotate", `${randomBetween(-8, 8).toFixed(1)}deg`);

  return releaseDuration;
};

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

const headingForTime = (seconds: number) => {
  let index = -1;
  chapters.forEach((chapter, candidateIndex) => {
    if (seconds >= chapter.transitionStart && seconds < chapter.firstWordStart) index = candidateIndex;
  });
  return index;
};

const isCoverTime = (seconds: number) => seconds < Number(chapters[0]?.transitionStart ?? 0);

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
  const previousWord = narrationWords[activeWord];
  if (previousWord) {
    previousWord.classList.remove("is-current-word");
    previousWord.classList.add("is-wind-trail");
    const existingTimer = windTrailTimers.get(previousWord);
    if (existingTimer) window.clearTimeout(existingTimer);
    const releaseDuration = Number(previousWord.dataset.windRelease) || 1920;
    const timer = window.setTimeout(() => {
      previousWord.classList.remove("is-wind-trail");
      windTrailTimers.delete(previousWord);
    }, releaseDuration);
    windTrailTimers.set(previousWord, timer);
  }
  if (index < 0 || !narrationWords[index]) {
    activeWord = -1;
    return;
  }
  const nextWord = narrationWords[index];
  const existingTimer = windTrailTimers.get(nextWord);
  if (existingTimer) window.clearTimeout(existingTimer);
  windTrailTimers.delete(nextWord);
  nextWord.classList.remove("is-wind-trail");
  shapeWindWake(nextWord);
  nextWord.classList.add("is-current-word");
  document.body.dataset.activeSpeaker = nextWord.dataset.speaker ?? "narrator";
  activeWord = index;
};

const syncNarrationWord = (preserveCurrentOnGap = false) => {
  if (!audio || !narrationWords.length) return;
  const nextWord = wordForTime(audio.currentTime);
  if (nextWord < 0 && preserveCurrentOnGap && activeWord >= 0) return;
  setWord(nextWord);
};

const runNarrationLoop = () => {
  narrationFrame = 0;
  if (!audio || audio.paused) return;
  syncReadingStage(audio.currentTime, "audio");
  syncNarrationWord();
  updateMountainJourney(audio.currentTime);
  narrationFrame = requestAnimationFrame(runNarrationLoop);
};

const startNarrationLoop = () => {
  if (!narrationFrame) narrationFrame = requestAnimationFrame(runNarrationLoop);
};

const stopNarrationLoop = () => {
  if (narrationFrame) cancelAnimationFrame(narrationFrame);
  narrationFrame = 0;
  syncNarrationWord(true);
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

const measureMountainJourney = () => {
  if (!mountainArt || !railChapterLinks.length) return;
  const artRect = mountainArt.getBoundingClientRect();
  if (artRect.width < 1 || artRect.height < 1) {
    mountainAnchors = [];
    return;
  }
  mountainAnchors = railChapterLinks.map((link) => {
    const anchorRect = (link.parentElement ?? link).getBoundingClientRect();
    return {
      x: anchorRect.left + anchorRect.width / 2 - artRect.left,
      y: anchorRect.top - artRect.top - 2,
    };
  });
};

const updateMountainJourney = (seconds: number) => {
  if (!mountainArt || !mountainClimber || chapters.length < 2) return;
  if (mountainAnchors.length !== chapters.length) measureMountainJourney();
  if (mountainAnchors.length !== chapters.length) return;

  const journeyTimes = chapters.map((chapter, index) => index === 0 ? 0 : chapter.transitionStart);
  let segment = 0;
  while (segment < journeyTimes.length - 1 && seconds >= journeyTimes[segment + 1]) segment += 1;
  const nextSegment = Math.min(segment + 1, mountainAnchors.length - 1);
  const segmentStart = journeyTimes[segment] ?? 0;
  const segmentEnd = journeyTimes[nextSegment] ?? segmentStart + 1;
  const localProgress = segment === nextSegment
    ? 0
    : clamp((seconds - segmentStart) / Math.max(0.01, segmentEnd - segmentStart));
  const easedProgress = localProgress * localProgress * (3 - 2 * localProgress);
  const from = mountainAnchors[segment];
  const to = mountainAnchors[nextSegment];
  const arcDirection = segment % 2 === 0 ? 1 : -1;
  const arc = Math.sin(easedProgress * Math.PI) * 17 * arcDirection;
  const breeze = Math.sin(easedProgress * Math.PI * 2 + segment * 0.7) * 1.8;
  const x = from.x + (to.x - from.x) * easedProgress + arc;
  const y = from.y + (to.y - from.y) * easedProgress + breeze;
  const journeyProgress = clamp((segment + easedProgress) / Math.max(1, chapters.length - 1));

  mountainArt.style.setProperty("--climber-x", `${x.toFixed(2)}px`);
  mountainArt.style.setProperty("--climber-y", `${y.toFixed(2)}px`);
  mountainArt.style.setProperty("--climber-turn", `${(arcDirection * Math.sin(easedProgress * Math.PI) * 4).toFixed(2)}deg`);
  mountainArt.style.setProperty("--mountain-progress", journeyProgress.toFixed(4));

  mountainPaths.forEach((path, pathIndex) => {
    const overlap = 0.045;
    const pathStart = Math.max(0, pathIndex / mountainPaths.length - overlap);
    const pathEnd = Math.min(1, (pathIndex + 1) / mountainPaths.length + overlap);
    const reveal = clamp((journeyProgress - pathStart) / Math.max(0.01, pathEnd - pathStart));
    path.style.setProperty("--path-clip", `${((1 - reveal) * 100).toFixed(2)}%`);
    path.style.setProperty("--path-wake", reveal.toFixed(3));
    path.classList.toggle("is-being-travelled", reveal > 0.02 && reveal < 0.98);
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
  updateMountainJourney(seconds);
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

const clearBeat = () => {
  if (beatElements[activeBeat]) {
    beatElements[activeBeat].style.removeProperty("--reader-beat-gap");
    beatElements[activeBeat].querySelector<HTMLElement>("[data-cinematic-art]")
      ?.style.removeProperty("--fitted-art-height");
  }
  activeBeat = -1;
  beatElements.forEach((element) => {
    element.classList.remove("is-current-beat");
    element.removeAttribute("aria-current");
  });
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

const scrollForNarration = (desiredTop: number, behavior: ScrollBehavior = "smooth") => {
  const maximumTop = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  const targetTop = clamp(desiredTop, 0, maximumTop);
  const distance = Math.abs(targetTop - scrollY);
  if (distance < 12) {
    autoScrollActive = false;
    autoScrollTarget = -1;
    return;
  }
  autoScrollActive = true;
  autoScrollTarget = targetTop;
  if (autoScrollTimer) window.clearTimeout(autoScrollTimer);
  autoScrollTimer = window.setTimeout(() => {
    if (!manualScrollActive && autoScrollTarget >= 0 && Math.abs(scrollY - autoScrollTarget) > 5) {
      scrollTo({ top: autoScrollTarget, behavior: "auto" });
    }
    autoScrollActive = false;
    autoScrollTarget = -1;
  }, reducedMotion.matches ? 50 : clamp(760 + distance * 0.28, 980, 2200));
  scrollTo({ top: targetTop, behavior: reducedMotion.matches ? "auto" : behavior });
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
  lastCenteredParagraph = index;
  scrollForNarration(desiredTop, behavior);
};

const centerHeading = (index: number, behavior: ScrollBehavior = "smooth") => {
  const heading = chapterHeadings[index];
  if (!heading || !followNarration || manualScrollActive) return;
  const bounds = readingBounds();
  const rect = heading.getBoundingClientRect();
  const viewportCenter = bounds.top + bounds.height / 2;
  lastCenteredHeading = index;
  scrollForNarration(scrollY + rect.top + rect.height / 2 - viewportCenter, behavior);
};

const centerCover = (behavior: ScrollBehavior = "smooth") => {
  if (!followNarration || manualScrollActive) return;
  lastCenteredHeading = -2;
  scrollForNarration(0, behavior);
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

const clearParagraphState = () => {
  activeParagraph = -1;
  paragraphs.forEach((paragraph) => {
    paragraph.classList.remove("is-current-paragraph");
    paragraph.removeAttribute("aria-current");
  });
};

const setHeading = (index: number, source: "audio" | "scroll" | "restore" = "audio") => {
  if (index < 0 || !chapterHeadings[index]) return;
  if (activeHeading === index && !coverIsActive) return;
  const changed = activeHeading !== index || coverIsActive;
  activeHeading = index;
  coverIsActive = false;
  clearParagraphState();
  clearBeat();
  coverHeading?.classList.remove("is-current-heading");
  chapterHeadings.forEach((heading, headingIndex) => {
    const isCurrent = headingIndex === index;
    heading.classList.toggle("is-current-heading", isCurrent);
    heading.toggleAttribute("aria-current", isCurrent);
  });
  document.body.dataset.readingStage = "heading";
  setChapter(index);
  if (
    source === "audio"
    && audio
    && !audio.paused
    && followNarration
    && !manualScrollActive
    && changed
    && lastCenteredHeading !== index
  ) {
    centerHeading(index);
  }
};

const setCover = (source: "audio" | "scroll" | "restore" = "audio") => {
  if (coverIsActive) return;
  const changed = !coverIsActive;
  coverIsActive = true;
  activeHeading = -1;
  clearParagraphState();
  clearBeat();
  chapterHeadings.forEach((heading) => {
    heading.classList.remove("is-current-heading");
    heading.removeAttribute("aria-current");
  });
  coverHeading?.classList.add("is-current-heading");
  document.body.dataset.readingStage = "cover";
  setChapter(0);
  if (
    source === "audio"
    && audio
    && !audio.paused
    && followNarration
    && !manualScrollActive
    && changed
  ) {
    centerCover();
  }
};

const setParagraph = (index: number, source: "audio" | "scroll" | "restore" = "audio") => {
  if (index < 0 || !paragraphs[index]) return;
  if (activeParagraph === index && activeHeading < 0 && !coverIsActive) return;
  const changed = activeParagraph !== index || activeHeading >= 0 || coverIsActive;
  activeHeading = -1;
  coverIsActive = false;
  activeParagraph = index;
  chapterHeadings.forEach((heading) => {
    heading.classList.remove("is-current-heading");
    heading.removeAttribute("aria-current");
  });
  coverHeading?.classList.remove("is-current-heading");
  document.body.dataset.readingStage = "paragraph";
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const isCurrent = paragraphIndex === index;
    paragraph.classList.toggle("is-current-paragraph", isCurrent);
    paragraph.toggleAttribute("aria-current", isCurrent);
  });
  const beatNumber = Number(paragraphs[index].dataset.beatNumber);
  setBeat(beatForNumber(beatNumber));
  if (
    source === "audio"
    && audio
    && !audio.paused
    && followNarration
    && !manualScrollActive
    && changed
    && lastCenteredParagraph !== index
  ) {
    centerParagraph(index);
  }
};

const syncReadingStage = (
  seconds: number,
  source: "audio" | "scroll" | "restore" = "audio",
) => {
  if (isCoverTime(seconds)) {
    setCover(source);
    return;
  }
  const headingIndex = headingForTime(seconds);
  if (headingIndex >= 0) {
    setHeading(headingIndex, source);
    return;
  }
  setParagraph(paragraphForTime(seconds), source);
};

const centerReadingStage = (seconds: number, behavior: ScrollBehavior = "smooth") => {
  if (isCoverTime(seconds)) {
    centerCover(behavior);
    return;
  }
  const headingIndex = headingForTime(seconds);
  if (headingIndex >= 0) {
    centerHeading(headingIndex, behavior);
    return;
  }
  centerParagraph(paragraphForTime(seconds), behavior);
};

const updatePlayState = () => {
  if (!audio) return;
  const playing = !audio.paused;
  document.body.classList.toggle("is-listening", playing);
  if (playIcon) playIcon.textContent = playing ? "❚❚" : "▶";
  dockPlay?.setAttribute("aria-label", playing ? "Pause narration" : "Play narration");
};

const togglePlayback = async (event?: Event) => {
  if (!audio) return;
  const trigger = event?.currentTarget as HTMLElement | null;
  if (audio.paused && trigger?.hasAttribute("data-hero-play")) {
    audio.currentTime = 0;
    manualScrollActive = false;
    autoScrollActive = false;
    autoScrollTarget = -1;
    lastCenteredParagraph = -1;
    lastCenteredHeading = -1;
    updateStoryProgress(0);
    setCover("restore");
    setWord(-1);
  }
  if (manualScrollActive && !touchActive) syncAudioFromViewport();
  if (audio.paused) {
    syncReadingStage(audio.currentTime, "restore");
    centerReadingStage(audio.currentTime);
    try {
      await audio.play();
      updateStoryProgress(audio.currentTime);
      syncReadingStage(audio.currentTime, "audio");
      centerReadingStage(audio.currentTime);
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
  autoScrollTarget = -1;
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

storyArtImages.forEach((image) => {
  const frame = image.closest<HTMLElement>("[data-cinematic-art]");
  const showPlaceholder = () => {
    frame?.classList.add("is-missing-art");
    image.setAttribute("aria-hidden", "true");
  };
  const showArtwork = () => {
    frame?.classList.remove("is-missing-art");
    image.removeAttribute("aria-hidden");
  };
  image.addEventListener("error", showPlaceholder);
  image.addEventListener("load", showArtwork);
  if (image.complete && image.naturalWidth === 0) showPlaceholder();
});

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
  syncReadingStage(audio.currentTime, "audio");
  syncNarrationWord();
  try {
    localStorage.setItem("scaleofus-wind-progress", String(audio.currentTime));
  } catch {}
});

seek?.addEventListener("input", () => {
  if (!audio) return;
  audio.currentTime = Number(seek.value);
  updateStoryProgress(audio.currentTime);
  syncReadingStage(audio.currentTime, "scroll");
  syncNarrationWord();
});
seek?.addEventListener("change", () => {
  if (audio) centerReadingStage(audio.currentTime);
});

chapterLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (!audio) return;
    const index = Number(link.dataset.chapterIndex);
    audio.currentTime = Number(link.dataset.start ?? 0);
    updateStoryProgress(audio.currentTime);
    history.replaceState(null, "", link.hash);
    manualScrollActive = false;
    autoScrollActive = false;
    lastCenteredParagraph = -1;
    lastCenteredHeading = -1;
    setHeading(index, "scroll");
    centerHeading(index);
    syncNarrationWord();
  });
});

readerHome?.addEventListener("click", (event) => {
  event.preventDefault();
  audio?.pause();
  if (audio) audio.currentTime = 0;
  manualScrollActive = false;
  autoScrollActive = false;
  autoScrollTarget = -1;
  lastCenteredParagraph = -1;
  lastCenteredHeading = -1;
  updateStoryProgress(0);
  setCover("restore");
  setWord(-1);
  history.replaceState(null, "", "#top");
  try {
    localStorage.setItem("scaleofus-wind-progress", "0");
  } catch {}
  scrollForNarration(0);
});

follow?.addEventListener("click", () => {
  followNarration = !followNarration;
  follow.setAttribute("aria-pressed", String(followNarration));
  lastCenteredParagraph = -1;
  lastCenteredHeading = -1;
  if (followNarration && audio) centerReadingStage(audio.currentTime);
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
    if (autoScrollTarget >= 0 && Math.abs(scrollY - autoScrollTarget) > 5 && !manualScrollActive) {
      scrollTo({ top: autoScrollTarget, behavior: "auto" });
    }
    autoScrollActive = false;
    autoScrollTarget = -1;
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
  requestAnimationFrame(() => {
    measureMountainJourney();
    if (audio) updateMountainJourney(audio.currentTime);
  });
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
  syncReadingStage(restored, "restore");
  syncNarrationWord();
};

restorePosition();
syncDockFootprint();
updateCinematicMotion();
updatePlayState();
