(function () {
  // Live Malaysia time in the header strip.
  var clock = document.getElementById("clock");
  var fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", minute: "2-digit" });
  function tick() { clock.textContent = fmt.format(new Date()); }
  tick(); setInterval(tick, 15000);

  // Light / dark switch, remembered in this browser.
  var root = document.documentElement;
  document.getElementById("theme-btn").addEventListener("click", function () {
    var current = root.getAttribute("data-theme") || "light";
    var next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("kf-theme", next); } catch (e) {}
  });

  // Copy email (contact panel on the home page only).
  var copyBtn = document.getElementById("copy-btn");
  if (copyBtn) {
  var mailAddr = document.getElementById("mail-addr");
  function selectMail() {
    var r = document.createRange(); r.selectNodeContents(mailAddr);
    var s = getSelection(); s.removeAllRanges(); s.addRange(r);
  }
  copyBtn.addEventListener("click", function () {
    var label = copyBtn.querySelector("span");
    function done(ok) {
      copyBtn.dataset.state = ok ? "done" : "";
      label.textContent = ok ? "Copied" : "Selected, press copy";
      setTimeout(function () { copyBtn.dataset.state = ""; label.textContent = "Copy"; }, 2400);
    }
    try {
      navigator.clipboard.writeText(mailAddr.textContent).then(function () { done(true); }, function () { selectMail(); done(false); });
    } catch (e) { selectMail(); done(false); }
  });
  }

  // Split-flap: give each cell hinged halves, then flip it through a few letters to its final one.
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  function half(cls, ch) {
    var h = document.createElement("span"); h.className = cls;
    var i = document.createElement("i"); i.textContent = ch; h.appendChild(i); return h;
  }
  function setup(cell) {
    var ch = cell.textContent; cell.textContent = "";
    cell.appendChild(half("half t", ch)); cell.appendChild(half("half b", ch));
    cell._ch = ch; return ch;
  }
  function show(cell, ch) { cell.children[0].firstChild.textContent = ch; cell.children[1].firstChild.textContent = ch; cell._ch = ch; }
  function step(cell, next, ms) {
    var prev = cell._ch, top = cell.children[0], bot = cell.children[1];
    var leafT = half("leaf t", prev), leafB = half("leaf b", next);
    leafB.style.transform = "rotateX(90deg)";
    cell.appendChild(leafT); cell.appendChild(leafB);
    top.firstChild.textContent = next;
    return leafT.animate([{ transform: "rotateX(0deg)" }, { transform: "rotateX(-90deg)" }], { duration: ms, easing: "ease-in" }).finished
      .then(function () {
        leafT.remove();
        return leafB.animate([{ transform: "rotateX(90deg)" }, { transform: "rotateX(0deg)" }], { duration: ms, easing: "cubic-bezier(.2,1.5,.4,1)", fill: "forwards" }).finished;
      })
      .then(function () { bot.firstChild.textContent = next; leafB.remove(); cell._ch = next; });
  }
  function run(cell, delay) {
    var target = setup(cell);
    if (reduce || !cell.animate) return;
    var n = 4 + Math.floor(Math.random() * 6), seq = [];
    for (var k = 0; k < n; k++) seq.push(CHARS[Math.floor(Math.random() * 26)]);
    seq.push(target);
    show(cell, " ");
    var p = new Promise(function (r) { setTimeout(r, delay); });
    seq.forEach(function (c) { p = p.then(function () { return step(cell, c, 55); }); });
    p.catch(function () { show(cell, target); });
  }
  document.querySelectorAll(".name .flap").forEach(function (cell, i) { run(cell, 120 + i * 70); });
  document.querySelectorAll(".f-code .flap").forEach(setup);

  // Status tags flip in down the board once the name has landed; BOARDING then starts blinking.
  document.querySelectorAll("[data-flip]").forEach(function (tag, i) {
    function settle() { tag.classList.remove("flipping"); if (tag.hasAttribute("data-blink")) tag.classList.add("blink"); }
    if (reduce) { settle(); return; }
    tag.style.visibility = "hidden";
    setTimeout(function () {
      tag.style.visibility = "";
      tag.classList.add("flipping");
      tag.addEventListener("animationend", settle, { once: true });
    }, 250 + i * 25);
  });

  // Keep the current page's link visible in the scrollable mobile nav.
  var navEl = document.querySelector(".strip nav"), cur = navEl && navEl.querySelector('a[aria-current="page"]');
  if (navEl && cur && navEl.scrollWidth > navEl.clientWidth) navEl.scrollLeft += cur.getBoundingClientRect().left - navEl.getBoundingClientRect().left - 12;

  // Deep links for project rows: #project-<code> opens that row; opening a row updates the URL.
  var rows = document.querySelectorAll("details.flight[id]");
  if (rows.length) {
    var ready = false;
    var openFromHash = function () {
      var target = location.hash.length > 1 && document.getElementById(location.hash.slice(1));
      if (!target || target.tagName !== "DETAILS") return;
      var parent = target.parentElement.closest("details");
      if (parent) parent.open = true;
      target.open = true;
      target.scrollIntoView();
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    rows.forEach(function (d) {
      d.addEventListener("toggle", function () {
        if (!ready) return;
        if (d.open) history.replaceState(null, "", "#" + d.id);
        else if (location.hash === "#" + d.id) history.replaceState(null, "", location.pathname + location.search);
      });
    });
    setTimeout(function () { ready = true; }, 400);
  }
})();
