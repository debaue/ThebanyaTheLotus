document.getElementById("year").textContent = new Date().getFullYear();

const header = document.querySelector(".site-header");
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");

burger.addEventListener("click", () => {
  const isOpen = header.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(isOpen));
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  });
});

// Generic slider: arrows, dots, and free drag-swipe in both directions with the mouse
// (touch already scrolls both ways natively).
function wireSlider(trackId, dotsId, prevId, nextId) {
  const track = document.getElementById(trackId);
  const dotsWrap = document.getElementById(dotsId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  if (!track || !dotsWrap) return null;

  let slides = [];
  let dots = [];

  function currentIndex() {
    const trackLeft = track.scrollLeft;
    let closest = 0;
    let closestDist = Infinity;
    slides.forEach((slide, i) => {
      const dist = Math.abs(slide.offsetLeft - trackLeft);
      if (dist < closestDist) { closestDist = dist; closest = i; }
    });
    return closest;
  }

  function updateDots() {
    const idx = currentIndex();
    dots.forEach((d, i) => d.classList.toggle("active", i === idx));
  }

  function goToSlide(i) {
    const clamped = Math.max(0, Math.min(slides.length - 1, i));
    track.scrollTo({ left: slides[clamped].offsetLeft, behavior: "smooth" });
  }

  // Wraps around like a carousel: prev on the first slide jumps to the
  // last, next on the last slide jumps back to the first.
  function goToSlideLooped(i) {
    if (!slides.length) return;
    const wrapped = ((i % slides.length) + slides.length) % slides.length;
    goToSlide(wrapped);
  }

  function rebuild() {
    slides = Array.from(track.children);
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "slider-dot";
      dot.setAttribute("aria-label", `Слайд ${i + 1}`);
      dot.addEventListener("click", () => goToSlide(i));
      dotsWrap.appendChild(dot);
    });
    dots = Array.from(dotsWrap.children);
    updateDots();
  }

  if (prevBtn) prevBtn.addEventListener("click", () => goToSlideLooped(currentIndex() - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => goToSlideLooped(currentIndex() + 1));
  track.addEventListener("scroll", () => {
    window.clearTimeout(track._scrollTimer);
    track._scrollTimer = window.setTimeout(updateDots, 80);
  });

  // Mouse drag-to-swipe (left-to-right and right-to-left)
  let isDown = false;
  let dragged = false;
  let startX = 0;
  let startScroll = 0;

  track.addEventListener("dragstart", (e) => e.preventDefault());

  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    isDown = true;
    dragged = false;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.classList.add("dragging");
    e.preventDefault();
  });
  window.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 3) dragged = true;
    track.scrollLeft = startScroll - dx;
  });
  window.addEventListener("pointerup", () => {
    if (!isDown) return;
    isDown = false;
    track.classList.remove("dragging");
    goToSlide(currentIndex());
  });
  track.addEventListener("click", (e) => {
    if (dragged) { e.preventDefault(); e.stopPropagation(); }
  }, true);

  rebuild();
  return { rebuild };
}

wireSlider("sliderTrack", "sliderDots", "sliderPrev", "sliderNext");

// Banya slider: auto-discovers files named banya-1, banya-2, ... dropped into
// images/banya/ and videos/banya/ — no manual list to maintain.
(function initBanyaSlider() {
  const track = document.getElementById("banyaTrack");
  const emptyNote = document.getElementById("banyaEmpty");
  if (!track) return;

  const imageExts = ["jpg", "jpeg", "png", "webp"];
  const videoExts = ["mp4"];

  // Probe by actually loading the file as an <img>/<video> instead of
  // fetch(): fetch() is blocked by browsers when the page is opened
  // directly from disk (file://), e.g. by double-clicking index.html.
  function checkImage(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  function checkVideo(url) {
    return new Promise((resolve) => {
      const vid = document.createElement("video");
      vid.onloadedmetadata = () => resolve(url);
      vid.onerror = () => {
        // Some browsers (or ones without the video's codec installed) fail
        // to decode even a file that exists. Chrome's error message still
        // tells the two cases apart: a real 404 says "Format error", a
        // found-but-undecodable file mentions the demuxer/codec instead.
        const msg = (vid.error && vid.error.message) || "";
        resolve(/demux|codec|stream/i.test(msg) ? url : null);
      };
      vid.src = url;
    });
  }

  function checkUrl(url, isVideo) {
    return isVideo ? checkVideo(url) : checkImage(url);
  }

  async function findFile(prefix, index, exts, isVideo) {
    for (const ext of exts) {
      const url = `${prefix}-${index}.${ext}`;
      const hit = await checkUrl(url, isVideo);
      if (hit) return hit;
    }
    return null;
  }

  async function collect(prefix, exts, isVideo) {
    const urls = [];
    let i = 1;
    while (true) {
      const url = await findFile(prefix, i, exts, isVideo);
      if (!url) break;
      urls.push(url);
      i++;
    }
    return urls;
  }

  // Requested order: video first, then photo 6, then photo 4, then the
  // rest of the photos in their normal order.
  function pullFront(images, indexes) {
    const picked = indexes
      .map((n) => images.find((url) => new RegExp(`banya-${n}\\.[a-z]+$`).test(url)))
      .filter(Boolean);
    const rest = images.filter((url) => !picked.includes(url));
    return [...picked, ...rest];
  }

  Promise.all([
    collect("images/banya/banya", imageExts, false),
    collect("videos/banya/banya", videoExts, true),
  ]).then(([images, videos]) => {
    const orderedImages = pullFront(images, [6, 4]);
    const files = [...videos, ...orderedImages];
    if (!files.length) {
      if (emptyNote) emptyNote.classList.add("visible");
      const slider = document.getElementById("banyaSlider");
      if (slider) slider.style.display = "none";
      return;
    }
    track.innerHTML = files
      .map((url) => {
        if (url.endsWith(".mp4")) {
          return `<figure class="slide slide-video"><video src="${url}" controls preload="metadata" playsinline></video></figure>`;
        }
        return `<figure class="slide"><img src="${url}" alt="Баня «Лисья поляна»" loading="lazy"></figure>`;
      })
      .join("");
    wireSlider("banyaTrack", "banyaDots", "banyaPrev", "banyaNext");
  });
})();
