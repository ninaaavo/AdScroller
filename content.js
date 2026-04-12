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

const textBoxDuration = 3* 1000;

// ------------------------------
// Message banks
// ------------------------------

const newAdMessages = [
  "Oh, I found something that might suit you. Try this.",
  "Wait, this one feels more like you. Take a look.",
  "I prepared this with your preferences in mind.",
  "Here, this should be more relevant to your taste.",
  "I think this ad understands you a little better.",
  "I noticed this and thought you might want it.",
  "This one seems promising. Please don't miss it.",
  "I picked something new for you. Give it a moment.",
];

const giveUpMessages = [
  "Alright. I must have misread your preference. I'll learn from this.",
  "I understand. This one wasn't for you. I'll adjust.",
  "Okay. I'll revisit your profile and try to do better next time.",
  "You can go. I'll update what I think you want.",
  "I see. My prediction was off. I'll refine it.",
  "That's alright. I'll study your behavior and improve.",
  "You win this time. I'll come back with something better suited to you.",
  "Understood. I need to relearn what appeals to you.",
];


// --------------------------
// Detect ad functions
// --------------------------

function isVisible(elem) {
  const rect = elem.getBoundingClientRect();
  const style = window.getComputedStyle(elem);

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 60 &&
    rect.height > 60
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

  
  if (!(elem instanceof Element)) return false;
  if (!isVisible(elem)) return false;

  // excluding our textbox
  if (elem.id === "ad-system-dialogue") return false;
  if (elem.closest("#ad-system-dialogue")) return false;

  // -------------------------------------
  // SETTING UP VARS
  // -------------------------------------

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

function addStyle() {
  if (document.getElementById("ad-effect-styles")) return;

  const style = document.createElement("style");
  style.id = "ad-effect-styles";

  style.textContent = `
    .ad-highlight {
      border: 3px solid red;
      box-shadow: 0 0 15px red, 0 0 30px red;
      animation: 
        adShake 0.4s infinite,
        adFlicker 1.5s infinite;
    }

    @keyframes adShake {
      0% { transform: translate(0px, 0px); }
      25% { transform: translate(2px, -2px); }
      50% { transform: translate(-2px, 2px); }
      75% { transform: translate(2px, 2px); }
      100% { transform: translate(0px, 0px); }
    }

    @keyframes adFlicker {
      0%, 100% { opacity: 1; }

      92% { opacity: 1; }
      93% { opacity: 0.1; }
      94% { opacity: 1; }

      96% { opacity: 0.3; }
      97% { opacity: 1; }

      98% { opacity: 0; }
    }
  `;

  document.head.appendChild(style);
}
function highlightAds() {
  addStyle();

  const elements = document.querySelectorAll(elemSelectors);

  elements.forEach((elem) => {
    if (looksLikeAd(elem)) {
      const box = elem.closest(boxSelectors) || elem;
      box.classList.add("ad-highlight");
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
  // console.log("check active")
  if (!chosenAd) return false;
  // if (!document.body.contains(chosenAd)) return false;

  // const rect = chosenAd.getBoundingClientRect();

  if (!isVisible(chosenAd)) return false;

  // if (rect.top >= window.innerHeight) return false;
  // console.log('its is')
  return true;
}

function isFightActive() {
  // check if the fighting duration is still good

  if (!isChosenAdActive()) return false;
  if (Date.now() - chosenAdStartTime <= FIGHT_DURATION) {
    return true;
  }
  speakAdLockEnded();
  return false;
}

function forceScrollTowardChosenAd() {
  if (!isFightActive()) {
    autoScrollFrame = null;
    return;
  }

  // calculating distance

  const rect = chosenAd.getBoundingClientRect();
  const currentY = window.scrollY; // current position of window from top of page

  const adTopOnPage = currentY + rect.top; // position of ad from top of page
  const offset = window.innerHeight * 0.2; // leave a little space from top of ad to top of page
  const targetY = adTopOnPage - offset;

  const distance = Math.max(currentY - targetY, 0); // clamp to never scroll downwards

  // scrolling logic

  if (distance > 2) {
    let baseStep = Math.min(18, Math.max(4, distance * 0.08));

    let randomBoost = 0.7 + Math.random() * 0.8;
    let step = baseStep * randomBoost;

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
    if (looksLikeAd(elem)) {
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
    console.log(chosenAd);
    speakNewAdFound();
    startForceScroll();
  }

  if (!isFightActive()) {
    console.log("time over");
    chosenAd = null;
    stopForceScroll();
  }
}

// ------------------------------
// Corner text UI
// ------------------------------

let systemTextBox = null; // the actual textbox itself
let systemTextTimeout = null; // count down to hide the box
let lastMessage = "";

function createSystemTextBox() {
  // Create the text box once
  if (systemTextBox) return;

  systemTextBox = document.createElement("div");
  systemTextBox.id = "ad-system-dialogue";

  Object.assign(systemTextBox.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    maxWidth: "300px",
    padding: "12px 16px",
    background: "rgba(0, 0, 0, 0.8)",
    color: "white",
    fontSize: "0.8rem",
    borderRadius: "10px",
    zIndex: "999999",
    boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
    transform: "translateY(10px)",
    transition: "opacity 0.25s ease, transform 0.25s ease",
  });

  document.body.appendChild(systemTextBox);
}

function showSystemText(message) {
  // Show a message in the box
  createSystemTextBox();

  systemTextBox.textContent = message;
  systemTextBox.style.opacity = "1";
  systemTextBox.style.transform = "translateY(0)";

  clearTimeout(systemTextTimeout); // gotta clear out the last count down if any

  systemTextTimeout = setTimeout(() => {
    if (!systemTextBox) return;
    systemTextBox.style.opacity = "0";
    systemTextBox.style.transform = "translateY(10px)";
  }, textBoxDuration);
}

function getRandomMessage(bank) {
  // Pick a random message, avoid repeat
  while (true){
    // bad practice, plz don't do it 
    const choice = bank[Math.floor(Math.random() * bank.length)];
    if (choice !== lastMessage){
      lastMessage = choice;
      return choice;
    }
  }
}

function speakNewAdFound() {
  showSystemText(getRandomMessage(newAdMessages));
}

function speakAdLockEnded() {
  showSystemText(getRandomMessage(giveUpMessages));
}

// run once + keep updating
setInterval(() => {
  highlightAds();
  scrollUpAds();
}, 3000);
