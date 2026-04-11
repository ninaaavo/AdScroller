// --------------------------
// Define vars
// --------------------------

const adDomains = [
  "doubleclick",
  "googlesyndication",
  "adservice",
  "taboola",
  "outbrain",
  "celtra",
];

const adKeywords = [
  "sponsored",
  "advertisement",
  "ad feedback",
  "promoted",
  "adchoices",
  "ad content",
  "promotion",
  "ad",
  "ad-slot",
  "adcontainer",
  "banner-ad",
];

const domainRegex = makeRegex(adDomains);
const keywordRegex = makeRegex(adKeywords);

const elemSelectors =
  "div, aside, section, iframe, ins, a[aria-label], a[href], span"; // to get any elem that can be ad

const boxSelectors = "article, div, section, aside"; // to wrap a box of ad
// --------------------------
// Detect ad functions
// --------------------------

function isVisible(elem) {
  const rect = elem.getBoundingClientRect();
  const style = window.getComputedStyle(elem);

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 50 &&
    rect.height > 30 
  );
}

function makeRegex(lst) {
  // make regular expression for lst, help identify word on its own
  return new RegExp(`\\b(${lst.join("|")})\\b`, "i");
}

function looksLikeAd(elem) {
  // -------------------------------------

  // Criteria for something to looks like ads:
  // 1. Iframe + check adDomains (from famous ad domains) -> very likely ad (+ 3pts)
  // 2. Inner text saying ad related keywords -> very likely ads
  // HOWEVER! there could be cases when the text contain those words but not is actually an ad => length bound?
  // 3. aria-label for accessibility, usually - USUALLY - would tell straight up if it is advertisement.

  // -------------------------------------

  // -------------------------------------
  // SETTING UP VARS
  // -------------------------------------

  if (!(elem instanceof Element)) return false;
  if (!isVisible(elem)) return false;

  const text = (elem.textContent || "").toLowerCase();
  const aria = (elem.getAttribute("aria-label") || "").toLowerCase();
  const title = (elem.getAttribute("title") || "").toLowerCase();
  const name = (elem.getAttribute("name") || "").toLowerCase();
  const idClass = `${elem.id} ${elem.className}`.toLowerCase();

  // let score = 0;

  // check if the elem contains a word in lst
  // let checkContains = (el, lst) => lst.some((e) => el.includes(e));

  // -------------------------------------
  // Checking vars against list
  // -------------------------------------

  if (elem.tagName === "IFRAME") {
    const src = (elem.src || "").toLowerCase();
    if (domainRegex.test(src)) return true;
  }

  if (keywordRegex.test(title)) return true;
  if (keywordRegex.test(name)) return true;
  if (keywordRegex.test(idClass)) return true;
  if (keywordRegex.test(text) && text.length < 40) return true;
  if (keywordRegex.test(aria)) return true;

  return false;
}

// --------------------------
// Highlighting Ad Functions
// --------------------------

function highlightAds() {
  console.log("reloading :>");
  const elements = document.querySelectorAll(elemSelectors);

  elements.forEach((elem) => {
    if (looksLikeAd(elem) && isVisible(elem)) {
      const box = elem.closest(boxSelectors) || elem;

      box.style.outline = "3px solid red";
    }
  });
}

// --------------------------
// Scrolling Functions
// --------------------------

let chosenAd = null;
let chosenAdStartTime = 0;
const FIGHT_DURATION = 10 * 1000; // will fight the user for 10 sec and then release them

let autoScrollFrame = null;

function isChosenAdActive() {
  // check if the chosen ad is still active (in case the website swap ads)
  // cnn: ad got push to the end of page when swapped out

  if (!chosenAd) return false;
  if (!document.body.contains(chosenAd)) return false;

  const rect = chosenAd.getBoundingClientRect();

  if (!isVisible(chosenAd)) return false;

  if (rect.top >= window.innerHeight) return false;

  return true;
}

function isFightActive() {
  // check if the fighting duration is still good
  
  if (!isChosenAdActive()) return false;
  return (Date.now() - chosenAdStartTime <= FIGHT_DURATION);
}

function forceScrollTowardChosenAd() {
  if (!isFightActive()) {
    autoScrollFrame = null;
    return;
  }

  const rect = chosenAd.getBoundingClientRect();
  const currentY = window.scrollY;

  // If chosen ad becomes detached or invalid, release it
  if (!document.body.contains(chosenAd) || rect.height <= 0) {
    chosenAd = null;
    stopForceScroll();
    return;
  }

  // If the chosen ad somehow ends up far below us, do NOT chase it downward
  if (rect.top > window.innerHeight) {
    chosenAd = null;
    stopForceScroll();
    return;
  }

  const adTopOnPage = currentY + rect.top;
  const targetY = adTopOnPage - window.innerHeight * 0.2;

  let remaining = targetY - currentY;

  // Critical fix: never scroll downward
  if (remaining > 0) {
    remaining = 0;
  }

  const distance = Math.abs(remaining);

  if (distance > 2) {
    const adHeightFactor = Math.min(rect.height / window.innerHeight, 2);
    const tallAdPenalty = 1 / adHeightFactor;

    let baseStep = Math.min(18, Math.max(4, distance * 0.08));

    let randomBoost = 0.7 + Math.random() * 0.8;
    let step = baseStep * randomBoost * tallAdPenalty;

    if (Math.random() < 0.18) step *= 0.2;
    if (Math.random() < 0.08) step *= 1.6;

    step = Math.min(step, 20);

    // Always move upward only
    step = -Math.min(distance, step);

    window.scrollTo(0, currentY + step);
  }

  autoScrollFrame = requestAnimationFrame(forceScrollTowardChosenAd);
}

function startForceScroll() {
  if (autoScrollFrame !== null) return;
  autoScrollFrame = requestAnimationFrame(forceScrollTowardChosenAd);
}

function stopForceScroll() {
  if (autoScrollFrame !== null) {
    cancelAnimationFrame(autoScrollFrame);
    autoScrollFrame = null;
  }
}

function scrollUpAds() {
  const elements = document.querySelectorAll(elemSelectors);

  if (!isChosenAdActive()) {
    chosenAd = null;
    stopForceScroll();
  }

  let newVisibleAd = null;

  // looking for ad on screen

  for (const elem of elements) {
    if (looksLikeAd(elem) && isVisible(elem)) {
      const box = elem.closest(boxSelectors) || elem;
      const rect = box.getBoundingClientRect();

      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        newVisibleAd = box;
      }
    }
  }

  // see a new visible ad different from the chosen ad

  if (newVisibleAd && newVisibleAd !== chosenAd) {
    chosenAd = newVisibleAd;
    chosenAdStartTime = Date.now();
    console.log("found new visible ad");
    startForceScroll();
  }

  if (!isFightActive()) {
    console.log("time over");
    chosenAd = null;
    stopForceScroll();
  }
}

// run once + keep updating
setInterval(() => {
  highlightAds();
  scrollUpAds();
}, 3000);
