var UAVIDPP_SCENES = [
   {
    name:  'Seq 21',
    rgb:   './static/images/compare/seq21_rgb_000300.jpg',
    uavid: './static/images/compare/seq21_uavid_000300.png',
    pp:    './static/images/compare/seq21_uavid++_000300.png'
  },
  {
    name:  'Seq 22',
    rgb:   './static/images/compare/seq22_rgb_000400.jpg',
    uavid: './static/images/compare/seq22_uavid_000400.png',
    pp:    './static/images/compare/seq22_uavid++_000400.png'
  },
  {
    name:  'Seq 27',
    rgb:   './static/images/compare/seq27_rgb_000000.jpg',
    uavid: './static/images/compare/seq27_uavid_000000.png',
    pp:    './static/images/compare/seq27_uavid++_000000.png'
  }
];

document.addEventListener('DOMContentLoaded', function () {
  var root = document.getElementById('label-compare');
  if (!root || typeof UAVIDPP_SCENES === 'undefined') { return; }

  var scene = 0, x = 50, dragging = false, nudged = false, cache = {};
  var sceneBtns = [], frames = [];
  var rgb, imgA, imgB, wipe, handle;

  function el(t, c) { var n = document.createElement(t); if (c) { n.className = c; } return n; }

  /* --- scene pills --- */
  var pills = el('div', 'cmp-scenes');
  UAVIDPP_SCENES.forEach(function (s, i) {
    var b = el('button', 'cmp-scene');
    b.type = 'button';
    b.textContent = s.name;
    b.addEventListener('click', function () { setScene(i); });
    b.addEventListener('mouseenter', function () { preload(i); });
    sceneBtns.push(b);
    pills.appendChild(b);
  });
  root.appendChild(pills);

  var grid = el('div', 'cmp-grid');

  /* --- left: the source frame --- */
  var pL = el('figure', 'cmp-panel');
  var fL = el('div', 'cmp-frame');
  rgb = new Image();
  rgb.alt = 'Source UAV frame';
  rgb.draggable = false;
  fL.appendChild(rgb);
  var cL = el('figcaption', 'cmp-cap');
  cL.innerHTML = '<b>RGB</b> &middot; the source frame, unannotated';
  pL.appendChild(fL);
  pL.appendChild(cL);
  grid.appendChild(pL);

  /* --- right: the wipe --- */
  var pR = el('figure', 'cmp-panel');
  wipe = el('div', 'cmp-frame cmp-wipe');
  imgB = new Image();                      /* UAVid++ fills the frame */
  imgB.className = 'cmp-b';
  imgB.alt = 'UAVid++ annotation';
  imgB.draggable = false;
  imgA = new Image();                      /* UAVid clipped in from the left */
  imgA.className = 'cmp-a';
  imgA.alt = 'Original UAVid annotation';
  imgA.draggable = false;
  var tagL = el('div', 'cmp-tag cmp-tag-l');
  tagL.innerHTML = '<b>UAVid</b> <i>&middot; 8 classes</i>';
  var tagR = el('div', 'cmp-tag cmp-tag-r');
  tagR.innerHTML = '<b>UAVid++</b> <i>&middot; 11 classes</i>';
  handle = el('div', 'cmp-handle');
  handle.tabIndex = 0;
  handle.setAttribute('role', 'slider');
  handle.setAttribute('aria-label', 'Reveal UAVid on the left, UAVid++ on the right');
  handle.setAttribute('aria-valuemin', '0');
  handle.setAttribute('aria-valuemax', '100');
  handle.appendChild(el('div', 'cmp-grip')).innerHTML = '\u25C0\u25B6';
  wipe.appendChild(imgB); wipe.appendChild(imgA);
  wipe.appendChild(tagL); wipe.appendChild(tagR); wipe.appendChild(handle);
  var cR = el('figcaption', 'cmp-cap');
  cR.innerHTML = '<b>UAVid &rlarr; UAVid++</b> &middot; drag the handle to wipe between the two annotations';
  pR.appendChild(wipe);
  pR.appendChild(cR);
  grid.appendChild(pR);

  root.appendChild(grid);

  frames = [fL, wipe];

  /* --- wipe interaction --- */
  function setX(v, quiet) {
    x = Math.max(0, Math.min(100, v));
    imgA.style.clipPath = 'inset(0 ' + (100 - x) + '% 0 0)';
    handle.style.left = x + '%';
    handle.setAttribute('aria-valuenow', Math.round(x));
    if (!quiet) { tagL.style.opacity = x < 12 ? 0 : 1; tagR.style.opacity = x > 88 ? 0 : 1; }
  }
  function fromEvent(e) {
    var r = wipe.getBoundingClientRect();
    setX((e.clientX - r.left) / r.width * 100);
  }
  wipe.addEventListener('pointerdown', function (e) {
    dragging = true; nudged = true;
    if (wipe.setPointerCapture) { wipe.setPointerCapture(e.pointerId); }
    fromEvent(e); e.preventDefault();
  });
  wipe.addEventListener('pointermove', function (e) { if (dragging) { fromEvent(e); } });
  wipe.addEventListener('pointerup', function () { dragging = false; });
  wipe.addEventListener('pointercancel', function () { dragging = false; });
  handle.addEventListener('keydown', function (e) {
    var d = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') { setX(x - d); }
    else if (e.key === 'ArrowRight') { setX(x + d); }
    else if (e.key === 'Home') { setX(0); }
    else if (e.key === 'End') { setX(100); }
    else { return; }
    nudged = true; e.preventDefault();
  });

  /* --- images --- */
  function preload(i) {
    if (cache[i]) { return cache[i]; }
    var s = UAVIDPP_SCENES[i];
    cache[i] = ['rgb', 'uavid', 'pp'].map(function (k) { var im = new Image(); im.src = s[k]; return im; });
    return cache[i];
  }
  function fit(im) {
    if (!im.naturalWidth) { return; }
    var r = im.naturalWidth + ' / ' + im.naturalHeight;
    frames.forEach(function (f) { f.style.aspectRatio = r; });
  }
  function setScene(i) {
    scene = i;
    var pre = preload(i), s = UAVIDPP_SCENES[i];
    if (rgb.getAttribute('src') !== s.rgb) { rgb.src = s.rgb; }
    if (imgA.getAttribute('src') !== s.uavid) { imgA.src = s.uavid; }
    if (imgB.getAttribute('src') !== s.pp) { imgB.src = s.pp; }
    if (pre[0].complete) { fit(pre[0]); }
    else { pre[0].addEventListener('load', function () { fit(pre[0]); }, { once: true }); }
    sceneBtns.forEach(function (b, k) { b.classList.toggle('is-active', k === i); });
  }

  setX(50);
  setScene(0);

  /* one-time nudge, so the handle reads as draggable */
  function nudge() {
    if (nudged || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }
    var t0 = 0, dur = 1100;
    (function tick(t) {
      if (nudged) { setX(50); return; }
      if (!t0) { t0 = t; }
      var p = (t - t0) / dur;
      if (p >= 1) { setX(50); return; }
      setX(50 + 18 * Math.sin(p * Math.PI * 2) * (1 - p), true);
      requestAnimationFrame(tick);
    })(0);
  }
  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); setTimeout(nudge, 350); }
    }, { threshold: 0.5 });
    io.observe(wipe);
  }

  window.addEventListener('load', function () {
    var warm = function () { UAVIDPP_SCENES.forEach(function (_, i) { preload(i); }); };
    if (window.requestIdleCallback) { requestIdleCallback(warm); } else { setTimeout(warm, 1200); }
  });
});