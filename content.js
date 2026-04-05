function isVisible(el) {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 50 &&
    rect.height > 30
  );
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

  const text = (elem.textContent || "").toLowerCase();
  const aria = (elem.getAttribute("aria-label") || "").toLowerCase();

  // let score = 0;

  // check if the elem contains a word in lst
  let checkContains = (el, lst) => lst.some((e) => el.includes(e));

  // -------------------------------------
  // SETTING UP WORD LISTS
  // -------------------------------------
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
  ];

  const ariaHints = [
    "advertisement",
    "sponsored",
    "promoted",
    "adchoices",
    "promotion",
  ];

  // -------------------------------------
  // Checking vars against list
  // -------------------------------------

  if (elem.tagName === "IFRAME") {
    const src = (elem.src || "").toLowerCase();
    if (checkContains(src, adDomains)) {
      return true;
    }
  }

  if (checkContains(text, adKeywords) && text.length < 40) {
    return true;
  }

  if (checkContains(aria, ariaHints)) {
    return true;
  }

  return false
}

function highlightAds() {
  console.log("reloading :>")
  const elements = document.querySelectorAll(
    "div, aside, section, iframe, ins, a[aria-label], a[href]",
  );

  elements.forEach((el) => {
    if (looksLikeAd(el) && isVisible(el)) {
      const box = el.closest("article, div, section, aside") || el;

      box.style.outline = "3px solid red";
    }
  });
}

// run once + keep updating
highlightAds();
setInterval(highlightAds, 3000);

