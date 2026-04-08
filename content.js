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

function makeRegex(lst){
  // make regular expression for lst, help identify word on its own
  return new RegExp(`\\b(${lst.join("|")})\\b`, "i")
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
  const title = (elem.getAttribute("title") || "").toLowerCase();
  const name = (elem.getAttribute("name") || "").toLowerCase();
  const idClass = `${elem.id} ${elem.className}`.toLowerCase();

  // let score = 0;

  // check if the elem contains a word in lst
  // let checkContains = (el, lst) => lst.some((e) => el.includes(e));

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
    "ad content",
    "promotion",
    "ad",
    "ad-slot",
    "adcontainer",
    "banner-ad",
  ];
  const domainRegex = makeRegex(adDomains)
  const keywordRegex = makeRegex(adKeywords)

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

  return false
}

function highlightAds() {
  console.log("reloading :>")
  const elements = document.querySelectorAll(
    "div, aside, section, iframe, ins, a[aria-label], a[href], span",
  );

  elements.forEach((el) => {
    if (looksLikeAd(el) && isVisible(el)) {
      const box = el.closest("article, div, section, aside") || el;

      box.style.outline = "3px solid red";
    }
  });
}

function scrollUpAds(){
  const elements = document.querySelectorAll(
    "div, aside, section, iframe, ins, a[aria-label], a[href], span",
  );

  elements.forEach((el) => {
    if (looksLikeAd(el) && isVisible(el)) {
      const box = el.closest("article, div, section, aside") || el;

      box.style.outline = "3px solid red";
    }
  });
}

// run once + keep updating
scrollUpAds();
setInterval(scrollUpAds, 3000);

