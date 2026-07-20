import "./watercolor-weather";

const app = document.querySelector<HTMLElement>("[data-story-app]");
const audio = document.querySelector<HTMLAudioElement>("[data-audio]");
const dock = document.querySelector<HTMLElement>("[data-audio-dock]");
const dockChapterNav = document.querySelector<HTMLElement>(".dock-chapters");
const playButtons = document.querySelectorAll<HTMLButtonElement>("[data-play], [data-hero-play]");
const readModeTriggers = document.querySelectorAll<HTMLAnchorElement>("[data-reader-read]");
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
const paragraphStarts = paragraphs.map((paragraph) => Number(paragraph.dataset.start ?? 0));
const storyChapters = [...document.querySelectorAll<HTMLElement>(".story-chapter")];
const storyCover = document.querySelector<HTMLElement>(".story-cover");
const coverHeading = document.querySelector<HTMLElement>("[data-cover-heading]");
const chapterHeadings = [...document.querySelectorAll<HTMLElement>("[data-chapter-heading]")];
const narrationWords = [...document.querySelectorAll<HTMLElement>("[data-narration-word]")];
const narrationWordStarts = narrationWords.map((word) => Number(word.dataset.start ?? 0));
const cinematicFrames = [...document.querySelectorAll<HTMLElement>("[data-cinematic-art]")];
const storyArtImages = [...document.querySelectorAll<HTMLImageElement>("[data-story-art]")];
const readerHomes = [...document.querySelectorAll<HTMLAnchorElement>("[data-reader-home]")];
const mountainArt = document.querySelector<HTMLElement>("[data-mountain-art]");
const mountainClimber = document.querySelector<HTMLElement>("[data-mountain-climber]");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const desktopReader = matchMedia("(min-width: 761px)");
const scale22LoopTest = new URLSearchParams(location.search).get("scale22loops") === "1";

type Scale22Animation = {
  picture: HTMLPictureElement;
  image: HTMLImageElement;
  source: HTMLSourceElement | null;
  kind: "cover" | "beat";
  storyBeat: number;
  loopSrc: string;
  stillSrc: string;
  defaultImageSrc: string;
  defaultSourceMedia: string | null;
  defaultSourceSrcset: string | null;
};

const scale22Animations = [...document.querySelectorAll<HTMLPictureElement>("[data-scale22-animation]")]
  .flatMap<Scale22Animation>((picture) => {
    const image = picture.querySelector<HTMLImageElement>("img");
    const loopSrc = picture.dataset.scale22LoopSrc;
    const stillSrc = picture.dataset.scale22StillSrc;
    if (!image || !loopSrc || !stillSrc) return [];
    const source = picture.querySelector<HTMLSourceElement>("source");
    return [{
      picture,
      image,
      source,
      kind: picture.dataset.scale22Animation === "cover" ? "cover" : "beat",
      storyBeat: Number(picture.dataset.scale22StoryBeat ?? -1),
      loopSrc,
      stillSrc,
      defaultImageSrc: image.getAttribute("src") ?? image.src,
      defaultSourceMedia: source?.getAttribute("media") ?? null,
      defaultSourceSrcset: source?.getAttribute("srcset") ?? null,
    }];
  });

type Scale22ReadingStage = { kind: "cover" | "beat" | "none"; storyBeat: number };
let scale22ReadingStage: Scale22ReadingStage = { kind: "none", storyBeat: -1 };

const setScale22Asset = (
  animation: Scale22Animation,
  src: string,
  state: "animation" | "still" | "idle",
) => {
  if (
    animation.picture.dataset.scale22ActiveSrc === src
    && animation.picture.dataset.scale22State === state
  ) return;
  if (state === "idle") {
    if (animation.source) {
      if (animation.defaultSourceMedia === null) animation.source.removeAttribute("media");
      else animation.source.setAttribute("media", animation.defaultSourceMedia);
      if (animation.defaultSourceSrcset === null) animation.source.removeAttribute("srcset");
      else animation.source.setAttribute("srcset", animation.defaultSourceSrcset);
    }
  } else if (animation.source) {
    // Prevent the mobile <source> from overriding the test WebP or its
    // reduced-motion still. The URL remains inert until this active swap.
    animation.source.setAttribute("media", "not all");
  }
  animation.image.src = src;
  animation.picture.dataset.scale22ActiveSrc = src;
  animation.picture.dataset.scale22State = state;
};

const syncScale22Animations = (kind: Scale22ReadingStage["kind"], storyBeat = -1) => {
  scale22ReadingStage = { kind, storyBeat };
  if (!scale22LoopTest) return;
  document.documentElement.dataset.scale22Loops = "opt-in-test";
  scale22Animations.forEach((animation) => {
    const isActive = animation.kind === kind
      && (kind === "cover" || animation.storyBeat === storyBeat);
    if (!isActive) {
      setScale22Asset(animation, animation.defaultImageSrc, "idle");
      return;
    }
    setScale22Asset(
      animation,
      reducedMotion.matches ? animation.stillSrc : animation.loopSrc,
      reducedMotion.matches ? "still" : "animation",
    );
  });
};

let activeChapter = -1;
let activeBeat = -1;
let activeParagraph = -1;
let activeHeading = -1;
let coverIsActive = false;
let activeWord = -1;
type ReaderMode = "cover" | "read" | "listen";
let readerMode: ReaderMode = location.hash && location.hash !== "#top" ? "read" : "cover";
document.body.dataset.readerMode = readerMode;
let followNarration = true;
let dockPinnedOpen = false;
let playbackRequested = false;
let mediaIsBuffering = false;
let autoScrollActive = false;
let manualScrollActive = false;
let touchActive = false;
let touchMoved = false;
let touchStartY = 0;
let lastCenteredParagraph = -1;
let lastCenteredHeading = -1;
let manualScrollTimer = 0;
let autoScrollTimer = 0;
let autoScrollTarget = -1;
let playbackRecoveryTimer = 0;
let bufferingRecoveryTimer = 0;
let playbackFollowTimer = 0;
let pendingMediaSeekTimer = 0;
let lastFollowAuditSecond = Number.NEGATIVE_INFINITY;
let cinematicFrame = 0;
let narrationFrame = 0;
let pointerFrame = 0;
let fitTimer = 0;
let lastNarrationStageFrame = Number.NEGATIVE_INFINITY;
let lastSavedProgressSecond = -1;
let mountainAnchors: Array<{ x: number; y: number }> = [];
const windTrailTimers = new Map<HTMLElement, number>();

type PendingMediaSeek = {
  target: number;
  attempts: number;
  token: number;
};

let pendingMediaSeek: PendingMediaSeek | null = null;
let mediaSeekToken = 0;

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

const mediaDuration = () => {
  if (audio && Number.isFinite(audio.duration) && audio.duration > 0) return audio.duration;
  const configuredDuration = Number(seek?.max ?? 0);
  return Number.isFinite(configuredDuration) && configuredDuration > 0 ? configuredDuration : Number.POSITIVE_INFINITY;
};

const clearPendingMediaSeek = () => {
  if (pendingMediaSeekTimer) window.clearTimeout(pendingMediaSeekTimer);
  pendingMediaSeekTimer = 0;
  pendingMediaSeek = null;
};

const applyPendingMediaSeek = () => {
  if (!audio || !pendingMediaSeek) return;
  const request = pendingMediaSeek;
  if (pendingMediaSeekTimer) window.clearTimeout(pendingMediaSeekTimer);
  pendingMediaSeekTimer = 0;

  try {
    audio.currentTime = request.target;
  } catch {}
  request.attempts += 1;

  const tolerance = audio.paused ? 0.28 : 0.9;
  const accepted = audio.readyState > HTMLMediaElement.HAVE_NOTHING
    && Math.abs(audio.currentTime - request.target) <= tolerance;
  if (accepted || request.attempts >= 14) {
    clearPendingMediaSeek();
    return;
  }

  const token = request.token;
  pendingMediaSeekTimer = window.setTimeout(() => {
    pendingMediaSeekTimer = 0;
    if (pendingMediaSeek?.token === token) applyPendingMediaSeek();
  }, audio.readyState === HTMLMediaElement.HAVE_NOTHING ? 220 : 140);
};

const requestMediaSeek = (seconds: number) => {
  if (!audio) return 0;
  const target = clamp(Number.isFinite(seconds) ? seconds : 0, 0, mediaDuration());
  pendingMediaSeek = {
    target,
    attempts: 0,
    token: ++mediaSeekToken,
  };
  applyPendingMediaSeek();
  return target;
};

const retryPendingMediaSeek = () => {
  if (!pendingMediaSeek) return;
  applyPendingMediaSeek();
};

const saveProgress = (force = false, seconds = audio?.currentTime ?? 0) => {
  if (!audio) return;
  const progressSecond = Math.floor(seconds);
  if (!force && progressSecond === lastSavedProgressSecond) return;
  lastSavedProgressSecond = progressSecond;
  try {
    localStorage.setItem("scaleofus-wind-progress", String(seconds));
  } catch {}
};

const paragraphStart = (index: number) => Number(paragraphs[index]?.dataset.start ?? 0);

const paragraphForTime = (seconds: number) => {
  let low = 0;
  let high = paragraphStarts.length - 1;
  let match = 0;
  while (low <= high) {
    const middle = (low + high) >> 1;
    if (paragraphStarts[middle] <= seconds) {
      match = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return match;
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
    if (narrationWordStarts[middle] <= seconds + 0.015) {
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

const runNarrationLoop = (timestamp: number) => {
  narrationFrame = 0;
  if (!audio || !playbackRequested || audio.ended) return;
  narrationFrame = requestAnimationFrame(runNarrationLoop);
  if (audio.paused || timestamp - lastNarrationStageFrame < 90) return;
  const seconds = audio.currentTime;
  updateStoryProgress(seconds);
  syncNarrationWord();
  syncReadingStage(seconds, "audio");
  auditPlaybackFollow();
  lastNarrationStageFrame = timestamp;
};

const startNarrationLoop = () => {
  lastNarrationStageFrame = Number.NEGATIVE_INFINITY;
  if (!narrationFrame) narrationFrame = requestAnimationFrame(runNarrationLoop);
};

const stopNarrationLoop = () => {
  if (narrationFrame) cancelAnimationFrame(narrationFrame);
  narrationFrame = 0;
  lastNarrationStageFrame = Number.NEGATIVE_INFINITY;
  syncNarrationWord(true);
};

const setReaderMode = (mode: ReaderMode) => {
  readerMode = mode;
  document.body.dataset.readerMode = mode;
  dockPinnedOpen = false;

  if (mode === "listen") {
    followNarration = true;
    follow?.setAttribute("aria-pressed", "true");
  } else {
    playbackRequested = false;
    mediaIsBuffering = false;
    audio?.pause();
    stopNarrationLoop();
    setWord(-1);
  }

  updatePlayState();
  syncDockFootprint();
  queueViewportFit();
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
  storyChapters.forEach((chapter, chapterIndex) => {
    chapter.classList.toggle("is-current-chapter", chapterIndex === index);
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
  mountainClimber.classList.toggle("is-celebrating", journeyProgress >= 0.995);
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
  syncScale22Animations("beat", beats[index].number);
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
  syncScale22Animations("none");
};

const readingBounds = () => {
  const top = clamp(innerHeight * 0.025, 14, 30);
  const dockTop = readerMode === "listen" && dock
    ? dock.getBoundingClientRect().top
    : innerHeight;
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
  const longMobileJump = !desktopReader.matches && distance > innerHeight * 1.4;
  const resolvedBehavior = reducedMotion.matches || longMobileJump ? "auto" : behavior;
  const settleDelay = resolvedBehavior === "auto"
    ? 80
    : desktopReader.matches
      ? clamp(620 + distance * 0.16, 720, 1200)
      : 720;
  if (autoScrollTimer) window.clearTimeout(autoScrollTimer);
  autoScrollTimer = window.setTimeout(() => {
    if (!manualScrollActive && autoScrollTarget >= 0 && Math.abs(scrollY - autoScrollTarget) > 5) {
      const forcedTop = autoScrollTarget;
      window.scrollTo(0, forcedTop);
      if (Math.abs(scrollY - forcedTop) > 5) {
        document.documentElement.scrollTop = forcedTop;
        document.body.scrollTop = forcedTop;
      }
    }
    autoScrollActive = false;
    autoScrollTarget = -1;
  }, settleDelay);
  try {
    window.scrollTo({ top: targetTop, behavior: resolvedBehavior });
  } catch {
    window.scrollTo(0, targetTop);
  }
};

const fitBeatToViewport = (index: number) => {
  const paragraph = paragraphs[index];
  const beat = paragraph?.closest<HTMLElement>("[data-beat]");
  const frame = beat?.querySelector<HTMLElement>("[data-cinematic-art]");
  if (!paragraph || !beat || !frame) return null;

  frame.style.removeProperty("--fitted-art-height");
  beat.style.removeProperty("--reader-beat-gap");
  beat.style.removeProperty("--mobile-page-height");
  beat.style.removeProperty("--mobile-art-height");
  paragraph.style.removeProperty("font-size");
  paragraph.style.removeProperty("line-height");

  if (!desktopReader.matches) {
    const bounds = readingBounds();
    const pageHeight = Math.max(430, Math.floor(bounds.height));
    const beatStyle = getComputedStyle(beat);
    const padding = Number.parseFloat(beatStyle.paddingTop) + Number.parseFloat(beatStyle.paddingBottom);
    const gap = Number.parseFloat(beatStyle.rowGap) || 12;
    const beatNumber = beat.querySelector<HTMLElement>(".beat-number");
    const numberHeight = beatNumber
      ? beatNumber.getBoundingClientRect().height + Number.parseFloat(getComputedStyle(beatNumber).marginBottom)
      : 0;
    const wordCount = paragraph.querySelectorAll("[data-narration-word]").length;
    const density = clamp((wordCount - 32) / 105);
    const naturalArtHeight = frame.clientWidth * 2 / 3;
    const minimumArtHeight = Math.min(154, pageHeight * 0.24);
    let artHeight = clamp(
      Math.min(naturalArtHeight, pageHeight * (0.43 - density * 0.13)),
      minimumArtHeight,
      pageHeight * 0.43,
    );

    beat.style.setProperty("--mobile-page-height", `${pageHeight}px`);

    const fitCopy = () => {
      beat.style.setProperty("--mobile-art-height", `${Math.round(artHeight)}px`);
      const availableCopyHeight = Math.max(150, pageHeight - padding - gap - artHeight - numberHeight);
      let low = 13.5;
      let high = 28;
      for (let attempt = 0; attempt < 8; attempt += 1) {
        const candidate = (low + high) / 2;
        paragraph.style.fontSize = `${candidate.toFixed(2)}px`;
        paragraph.style.lineHeight = candidate < 17 ? "1.24" : "1.3";
        if (paragraph.scrollHeight <= availableCopyHeight + 1) low = candidate;
        else high = candidate;
      }
      paragraph.style.fontSize = `${low.toFixed(2)}px`;
      paragraph.style.lineHeight = low < 17 ? "1.24" : "1.3";
      return paragraph.scrollHeight <= availableCopyHeight + 2;
    };

    if (!fitCopy()) {
      artHeight = minimumArtHeight;
      fitCopy();
    }
    return beat;
  }

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
  const fittedElement = fitBeatToViewport(index);
  const bounds = readingBounds();
  const rect = paragraph.getBoundingClientRect();
  const desiredTop = fittedElement
    ? scrollY + fittedElement.getBoundingClientRect().top - bounds.top
    : scrollY + rect.top + rect.height / 2 - readingFocus();
  lastCenteredParagraph = index;
  scrollForNarration(desiredTop, behavior);
};

const centerHeading = (index: number, behavior: ScrollBehavior = "smooth", force = false) => {
  const heading = chapterHeadings[index];
  if (!heading || (!followNarration && !force) || manualScrollActive) return;
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
  syncScale22Animations("cover");
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
  if (!desktopReader.matches && changed) fitBeatToViewport(index);
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

const playbackStageIsAligned = (seconds: number) => {
  if (isCoverTime(seconds)) return scrollY < 48;
  const bounds = readingBounds();
  const headingIndex = headingForTime(seconds);
  if (headingIndex >= 0) {
    const rect = chapterHeadings[headingIndex]?.getBoundingClientRect();
    if (!rect) return false;
    const center = rect.top + rect.height / 2;
    const readingCenter = bounds.top + bounds.height / 2;
    return Math.abs(center - readingCenter) < Math.max(84, bounds.height * 0.16);
  }
  const paragraph = paragraphs[paragraphForTime(seconds)];
  const beat = paragraph?.closest<HTMLElement>("[data-beat]");
  if (!desktopReader.matches && beat) {
    const rect = beat.getBoundingClientRect();
    return Math.abs(rect.top - bounds.top) < 72 && rect.bottom <= bounds.bottom + 72;
  }
  const frame = paragraph?.closest<HTMLElement>("[data-beat]")
    ?.querySelector<HTMLElement>("[data-cinematic-art]");
  if (!frame) return false;
  const frameTop = frame.getBoundingClientRect().top;
  return Math.abs(frameTop - bounds.top) < Math.max(120, bounds.height * 0.22);
};

const auditPlaybackFollow = () => {
  if (
    !audio
    || audio.paused
    || !followNarration
    || manualScrollActive
    || autoScrollActive
    || Math.abs(audio.currentTime - lastFollowAuditSecond) < 0.55
  ) return;
  lastFollowAuditSecond = audio.currentTime;
  if (!playbackStageIsAligned(audio.currentTime)) centerReadingStage(audio.currentTime);
};

const releaseScrollToNarration = () => {
  if (manualScrollTimer) window.clearTimeout(manualScrollTimer);
  if (autoScrollTimer) window.clearTimeout(autoScrollTimer);
  if (playbackFollowTimer) window.clearTimeout(playbackFollowTimer);
  manualScrollTimer = 0;
  autoScrollTimer = 0;
  playbackFollowTimer = 0;
  manualScrollActive = false;
  autoScrollActive = false;
  autoScrollTarget = -1;
  touchActive = false;
  touchMoved = false;
  lastCenteredParagraph = -1;
  lastCenteredHeading = -1;
  lastFollowAuditSecond = Number.NEGATIVE_INFINITY;
};

const followPlaybackPosition = (behavior: ScrollBehavior = "smooth") => {
  if (!audio || audio.paused || !followNarration || manualScrollActive) return;
  syncReadingStage(audio.currentTime, "audio");
  centerReadingStage(audio.currentTime, behavior);
};

const queuePlaybackFollow = () => {
  if (playbackFollowTimer) window.clearTimeout(playbackFollowTimer);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => followPlaybackPosition());
  });
  playbackFollowTimer = window.setTimeout(() => {
    playbackFollowTimer = 0;
    followPlaybackPosition();
  }, 260);
};

const updatePlayState = () => {
  if (!audio) return;
  const playing = playbackRequested && !audio.ended;
  document.body.classList.toggle("is-listening", playing);
  document.body.classList.toggle("is-buffering", mediaIsBuffering);
  if (playIcon) playIcon.textContent = mediaIsBuffering ? "↻" : playing ? "❚❚" : "▶";
  dockPlay?.setAttribute(
    "aria-label",
    mediaIsBuffering ? "Resume narration" : playing ? "Pause narration" : "Play narration",
  );
};

const togglePlayback = async (event?: Event) => {
  if (!audio) return;
  const trigger = event?.currentTarget as HTMLElement | null;
  setReaderMode("listen");
  if (!audio.paused && mediaIsBuffering) {
    releaseScrollToNarration();
    playbackRequested = true;
    requestMediaSeek(Math.min(audio.currentTime + 0.02, Math.max(0, mediaDuration() - 0.1)));
    try {
      await audio.play();
      handlePlaybackStarted();
      queuePlaybackFollow();
    } catch {}
    return;
  }
  if (audio.paused) {
    const startsFromCover = Boolean(
      trigger?.hasAttribute("data-hero-play")
      || scrollY <= Math.min(innerHeight * 0.3, 240),
    );
    if (manualScrollActive && !startsFromCover) {
      autoScrollActive = false;
      autoScrollTarget = -1;
      touchActive = false;
      syncAudioFromViewport();
    }
    releaseScrollToNarration();
    if (startsFromCover) requestMediaSeek(0);
    playbackRequested = true;
    const playAttempt = audio.play();
    // Start the visual clock from the tap itself. Mobile Safari can begin
    // audible playback before its play/playing events or play promise settle.
    updatePlayState();
    startNarrationLoop();
    queuePlaybackFollow();
    if (startsFromCover) {
      updateStoryProgress(0);
      setCover("restore");
      setWord(-1);
      history.replaceState(null, "", "#top");
    } else {
      syncReadingStage(audio.currentTime, "restore");
    }
    try {
      await playAttempt;
      handlePlaybackStarted();
      updateStoryProgress(audio.currentTime);
    } catch {
      playbackRequested = false;
      stopNarrationLoop();
      updatePlayState();
      return;
    }
  } else {
    playbackRequested = false;
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
  if (readerMode !== "listen") return;
  if (dockPinnedOpen) return;
  setDockCompact(!desktopReader.matches || scrollY > Math.min(innerHeight * 0.28, 280));
};

type ViewportReadingStage =
  | { kind: "cover"; index: -1; time: number; distance: number }
  | { kind: "heading"; index: number; time: number; distance: number }
  | { kind: "paragraph"; index: number; time: number; distance: number };

const distanceFromReadingCenter = (element: HTMLElement, center: number) => {
  const rect = element.getBoundingClientRect();
  if (center < rect.top) return rect.top - center;
  if (center > rect.bottom) return center - rect.bottom;
  return 0;
};

const closestStageToReadingCenter = (): ViewportReadingStage | null => {
  const center = readingFocus();
  const candidates: ViewportReadingStage[] = [];

  if (storyCover) {
    candidates.push({
      kind: "cover",
      index: -1,
      time: 0,
      distance: distanceFromReadingCenter(storyCover, center),
    });
  }

  chapterHeadings.forEach((heading, index) => {
    candidates.push({
      kind: "heading",
      index,
      time: Number(heading.dataset.headingStart ?? chapters[index]?.start ?? 0) + 0.02,
      distance: distanceFromReadingCenter(heading, center),
    });
  });

  paragraphs.forEach((paragraph, index) => {
    const beat = paragraph.closest<HTMLElement>("[data-beat]") ?? paragraph;
    candidates.push({
      kind: "paragraph",
      index,
      time: paragraphStart(index) + 0.02,
      distance: distanceFromReadingCenter(beat, center),
    });
  });

  return candidates.reduce<ViewportReadingStage | null>(
    (closest, candidate) => !closest || candidate.distance < closest.distance ? candidate : closest,
    null,
  );
};

const syncAudioFromViewport = () => {
  manualScrollTimer = 0;
  if (!audio || !manualScrollActive || autoScrollActive) return;
  if (touchActive) {
    queueViewportSync(120);
    return;
  }
  const stage = closestStageToReadingCenter();
  if (!stage) return;
  manualScrollActive = false;
  const nextTime = stage.time;
  const syncedTime = Math.abs(audio.currentTime - nextTime) > 0.45
    ? requestMediaSeek(nextTime)
    : audio.currentTime;
  updateStoryProgress(syncedTime);
  if (stage.kind === "cover") setCover("scroll");
  else if (stage.kind === "heading") setHeading(stage.index, "scroll");
  else setParagraph(stage.index, "scroll");
  setWord(readerMode === "listen" ? wordForTime(syncedTime) : -1);
};

const queueViewportSync = (delay = 140) => {
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
  lastCenteredHeading = -1;
  queueViewportSync(240);
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
  if (!desktopReader.matches) return;
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

readModeTriggers.forEach((trigger) => {
  trigger.addEventListener("click", () => {
    setReaderMode("read");
  });
});

playButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    void togglePlayback(event);
  });
});

const handlePlaybackStarted = () => {
  if (!audio || audio.paused) return;
  playbackRequested = true;
  updatePlayState();
  followPlaybackPosition();
  queuePlaybackFollow();
  startNarrationLoop();
};

audio?.addEventListener("play", handlePlaybackStarted);
audio?.addEventListener("pause", () => {
  saveProgress(true);
  updatePlayState();
  stopNarrationLoop();
  if (playbackRecoveryTimer) window.clearTimeout(playbackRecoveryTimer);
  if (playbackRequested && !audio.ended && document.visibilityState === "visible") {
    playbackRecoveryTimer = window.setTimeout(() => {
      playbackRecoveryTimer = 0;
      if (playbackRequested && audio.paused && !audio.ended) audio.play().catch(() => {});
    }, 280);
  }
});
audio?.addEventListener("ended", () => {
  playbackRequested = false;
  mediaIsBuffering = false;
  clearPendingMediaSeek();
  updatePlayState();
  stopNarrationLoop();
});
const setMediaBuffering = (buffering: boolean) => {
  mediaIsBuffering = buffering && playbackRequested && Boolean(audio && !audio.ended);
  if (bufferingRecoveryTimer) {
    window.clearTimeout(bufferingRecoveryTimer);
    bufferingRecoveryTimer = 0;
  }
  if (mediaIsBuffering && audio) {
    bufferingRecoveryTimer = window.setTimeout(() => {
      bufferingRecoveryTimer = 0;
      if (
        !audio
        || !playbackRequested
        || audio.ended
        || document.visibilityState !== "visible"
        || audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA
      ) return;
      requestMediaSeek(Math.min(audio.currentTime + 0.02, Math.max(0, mediaDuration() - 0.1)));
      audio.play().catch(() => {});
    }, 4500);
  }
  updatePlayState();
};
audio?.addEventListener("waiting", () => setMediaBuffering(true));
audio?.addEventListener("stalled", () => setMediaBuffering(true));
audio?.addEventListener("playing", () => {
  setMediaBuffering(false);
  handlePlaybackStarted();
});
audio?.addEventListener("loadedmetadata", retryPendingMediaSeek);
audio?.addEventListener("durationchange", retryPendingMediaSeek);
audio?.addEventListener("progress", retryPendingMediaSeek);
audio?.addEventListener("seeked", retryPendingMediaSeek);
audio?.addEventListener("canplay", () => {
  retryPendingMediaSeek();
  setMediaBuffering(false);
});
audio?.addEventListener("timeupdate", () => {
  if (mediaIsBuffering) setMediaBuffering(false);
  updateStoryProgress(audio.currentTime);
  syncNarrationWord();
  syncReadingStage(audio.currentTime, "audio");
  auditPlaybackFollow();
  saveProgress();
});

seek?.addEventListener("input", () => {
  if (!audio) return;
  const target = requestMediaSeek(Number(seek.value));
  updateStoryProgress(target);
  syncReadingStage(target, "scroll");
  setWord(wordForTime(target));
});
seek?.addEventListener("change", () => {
  if (!audio) return;
  const target = Number(seek.value);
  saveProgress(true, target);
  centerReadingStage(target);
});

chapterLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (!audio) return;
    const index = Number(link.dataset.chapterIndex);
    const target = requestMediaSeek(Number(link.dataset.start ?? 0));
    updateStoryProgress(target);
    history.replaceState(null, "", link.hash);
    manualScrollActive = false;
    autoScrollActive = false;
    lastCenteredParagraph = -1;
    lastCenteredHeading = -1;
    setHeading(index, "scroll");
    centerHeading(index, "smooth", true);
    setWord(readerMode === "listen" ? wordForTime(target) : -1);
    saveProgress(true, target);
    if (playbackRequested && audio.paused) audio.play().catch(() => {});
  });
});

readerHomes.forEach((readerHome) => {
  readerHome.addEventListener("click", (event) => {
    event.preventDefault();
    setReaderMode("cover");
    if (audio) requestMediaSeek(0);
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
  const target = event.target as Element | null;
  if (target?.closest("[data-audio-dock]")) return;
  touchActive = true;
  touchMoved = false;
  touchStartY = event.touches[0]?.clientY ?? 0;
}, { passive: true });
addEventListener("touchmove", (event) => {
  if (!touchActive || touchMoved) return;
  const currentY = event.touches[0]?.clientY ?? touchStartY;
  if (Math.abs(currentY - touchStartY) < 8) return;
  touchMoved = true;
  beginManualScroll(event);
}, { passive: true });
addEventListener("touchend", () => {
  touchActive = false;
  if (touchMoved && manualScrollActive) queueViewportSync(120);
  touchMoved = false;
}, { passive: true });
addEventListener("touchcancel", () => {
  touchActive = false;
  if (touchMoved && manualScrollActive) queueViewportSync(120);
  touchMoved = false;
}, { passive: true });
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible" || !playbackRequested || !audio || audio.ended) return;
  if (audio.paused) audio.play().catch(() => {});
  else handlePlaybackStarted();
});
addEventListener("pageshow", () => {
  if (playbackRequested && audio && !audio.paused && !audio.ended) handlePlaybackStarted();
});
addEventListener("keydown", (event) => {
  const target = event.target as Element | null;
  if (target?.closest("button, a, input, select, textarea, [contenteditable='true']")) return;
  if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
    beginManualScroll(event);
  }
});
addEventListener("scroll", () => {
  syncDockFootprint();
  if (manualScrollActive && !autoScrollActive) queueViewportSync();
  requestCinematicMotion();
}, { passive: true });
addEventListener("resize", () => {
  syncDockFootprint();
  requestCinematicMotion();
  if (!desktopReader.matches) {
    beatElements.forEach((beat) => {
      beat.style.removeProperty("--reader-beat-gap");
      beat.style.removeProperty("--mobile-page-height");
      beat.style.removeProperty("--mobile-art-height");
      beat.querySelector<HTMLElement>("[data-cinematic-art]")?.style.removeProperty("--fitted-art-height");
      beat.querySelector<HTMLElement>("[data-narration-paragraph]")?.style.removeProperty("font-size");
      beat.querySelector<HTMLElement>("[data-narration-paragraph]")?.style.removeProperty("line-height");
    });
  }
  requestAnimationFrame(() => {
    measureMountainJourney();
    if (audio) updateMountainJourney(audio.currentTime);
  });
  queueViewportFit(160);
}, { passive: true });

reducedMotion.addEventListener("change", () => {
  syncScale22Animations(scale22ReadingStage.kind, scale22ReadingStage.storyBeat);
});

if (matchMedia("(pointer: fine)").matches) {
  addEventListener("pointermove", (event) => {
    if (pointerFrame) return;
    const x = event.clientX;
    const y = event.clientY;
    pointerFrame = requestAnimationFrame(() => {
      pointerFrame = 0;
      document.documentElement.style.setProperty("--pointer-x", `${x / innerWidth - 0.5}`);
      document.documentElement.style.setProperty("--pointer-y", `${y / innerHeight - 0.5}`);
    });
  }, { passive: true });
}

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
  setReaderMode(location.hash && location.hash !== "#top" ? "read" : "cover");
  requestMediaSeek(restored);
  updateStoryProgress(restored);
  syncReadingStage(restored, "restore");
  setWord(-1);
};

restorePosition();
syncDockFootprint();
updateCinematicMotion();
updatePlayState();
