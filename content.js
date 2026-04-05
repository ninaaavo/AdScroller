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

  // -------------------------------------

  // -------------------------------------
  // Setting up vars
  // -------------------------------------

  if (!(elem instanceof Element)) return false;

  const idClass = `${elem.id} ${elem.className}`.toLowerCase(); // pair up id + class
  const text = (elem.textContent || "").toLowerCase();
  const aria = (elem.getAttribute("aria-label") || "").toLowerCase();
  const dataTest = (elem.getAttribute("data-testid") || "").toLowerCase();

  let score = 0;

  // check if the elem contains a word in lst
  let checkContains = (el, lst) => lst.some((e) => el.includes(e));

  // -------------------------------------
  // 1. iframe with known ad sources
  // -------------------------------------
  const adDomains = [
    "doubleclick",
    "googlesyndication",
    "adservice",
    "taboola",
    "outbrain",
    "celtra",
  ];

  if (elem.tagName === "IFRAME") {
    const src = (elem.src || "").toLowerCase();
    if (checkContains(src, adDomains)) {
      score += 3;
    }
  }

  // -------------------------------------
  // 2. text has ads keywords
  // -------------------------------------
  const adKeywords = [
    "sponsored",
    "advertisement",
    "ad feedback",
    "promoted",
    "adchoices",
  ];

  if (checkContains(text, adKeywords) && text.length < 40) {
    score += 3;
  }

  // class/id hints (safer)
  const adHints = [
    "ad-",
    "-ad",
    "ads",
    "adsbygoogle",
    "sponsor",
    "sponsored",
    "promo",
    "banner",
    "advert",
  ];

  if (checkContains(idClass, adHints)) {
    score += 1;
  }

  // aria / test id
  const ariaHints = [
    "advertisement",
    "sponsored",
    "promoted",
    "adchoices",
    "promotion",
  ];

  if (checkContains(aria, ariaHints)) {
    score += 2;
  }

  return score >= 2;
}

function highlightAds() {
  const elements = document.querySelectorAll(
    "div, aside, section, iframe, ins, a[aria-label], a[href]"
  );

  elements.forEach((el) => {
    if (looksLikeAd(el) && isVisible(el)) {
      const box =
        el.closest("article, div, section, aside") || el;

      box.style.outline = "3px solid red";
    }
  });
}

// run once + keep updating
highlightAds();
setInterval(highlightAds, 3000);
