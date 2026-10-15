(function () {
  "use strict";

  const OBJECTIONS = window.OBJECTIONS;
  const GROUPS = window.OBJECTION_GROUPS;
  const TRANSITIONS = window.TRANSITIONS;
  const byId = Object.fromEntries(OBJECTIONS.map((o) => [o.id, o]));

  // Shown as numbered quick picks until the rep changes them with the pin button.
  const DEFAULT_PINS = [
    "not-interested", "too-expensive", "spouse", "busy", "already-working",
    "think-about-it", "stop-calling", "bad-reviews", "not-right-time",
  ];
  const MAX_PINS = 9;

  const searchEl = document.getElementById("search");
  const listEl = document.getElementById("list");
  const detailEl = document.getElementById("detail");
  const modeButtons = document.querySelectorAll(".mode button");
  const narrow = window.matchMedia("(max-width: 800px)");

  const state = {
    mode: load("mode") || "inside",
    query: "",
    openId: null,   // objection shown in the detail panel
    cursor: 0,      // highlighted search result
    matches: [],
    pins: (load("pins") || DEFAULT_PINS).filter((id) => byId[id]),
    recent: (load("recent") || []).filter((id) => byId[id]),
  };

  // ------------------------------------------------------------ storage
  function load(key) {
    try { return JSON.parse(localStorage.getItem("oh:" + key)); } catch (e) { return null; }
  }
  function save(key, value) {
    try { localStorage.setItem("oh:" + key, JSON.stringify(value)); } catch (e) { /* private window */ }
  }

  // ------------------------------------------------------------- search
  function normalize(s) {
    return s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  }

  const index = OBJECTIONS.map((o) => ({
    o,
    title: normalize(o.title),
    keywords: o.keywords.map(normalize),
    body: normalize(o.rebuttals.map((r) => r.text).join(" ")),
  }));

  function score(entry, q, words) {
    let s = 0;
    if (entry.title.includes(q)) s += 12;
    for (const kw of entry.keywords) if (kw === q) s += 10;
    for (const w of words) {
      if (w.length < 2) continue;
      if (entry.keywords.some((kw) => kw.split(" ").some((part) => part.startsWith(w)))) s += 4;
      if (entry.title.split(" ").some((part) => part.startsWith(w))) s += 3;
      if (w.length >= 4 && entry.body.includes(w)) s += 1;
    }
    return s;
  }

  function search(query) {
    const q = normalize(query);
    if (!q) return [];
    const words = q.split(" ");
    return index
      .map((e) => ({ o: e.o, s: score(e, q, words) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.o);
  }

  // ------------------------------------------------------------ helpers
  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  // Highlight fill-in-the-blank spots like [next available day].
  function script(s) {
    return escapeHtml(s).replace(/\[([^\]]+)\]/g, '<mark class="blank">$1</mark>');
  }

  // ------------------------------------------------------------- list
  function row(o, opts) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "row";
    b.dataset.id = o.id;
    if (o.id === state.openId) b.classList.add("open");
    if (opts && opts.cursor) b.classList.add("cursor");
    let html = "";
    if (opts && opts.key) html += `<kbd class="num">${opts.key}</kbd>`;
    html += `<span class="row-title">${escapeHtml(o.title)}</span>`;
    if (o.custom) html += `<span class="tag">New</span>`;
    b.innerHTML = html;
    b.addEventListener("click", () => open(o.id, true));
    return b;
  }

  function section(title, items, opts) {
    if (!items.length) return;
    const wrap = document.createElement("div");
    wrap.className = "section";
    const h = document.createElement("h2");
    h.textContent = title;
    wrap.appendChild(h);
    items.forEach((o, i) => wrap.appendChild(row(o, opts && opts(o, i))));
    listEl.appendChild(wrap);
  }

  function renderList() {
    listEl.innerHTML = "";

    if (state.query) {
      if (!state.matches.length) {
        listEl.innerHTML = '<p class="none">No match. Try another word, or press Esc to clear.</p>';
        return;
      }
      section("Matches", state.matches, (o, i) => ({ cursor: i === state.cursor }));
      return;
    }

    section("Quick picks", state.pins.map((id) => byId[id]), (o, i) => ({ key: i + 1 }));
    const recent = state.recent.filter((id) => !state.pins.includes(id)).map((id) => byId[id]);
    section("Recent", recent);
    for (const g of GROUPS) section(g, OBJECTIONS.filter((o) => o.group === g));
  }

  // ------------------------------------------------------------- detail
  function rebuttalsFor(o, mode) {
    const fits = o.rebuttals.filter((r) => !r.mode || r.mode === mode);
    return fits.length ? { list: fits, fallback: false } : { list: o.rebuttals, fallback: true };
  }

  function renderEmpty() {
    const t = TRANSITIONS[state.mode];
    detailEl.innerHTML = `
      <div class="empty">
        <p class="empty-lead">Type what the homeowner said, or press a quick-pick number.</p>
        <p class="muted">You're on ${state.mode === "inside" ? "an <strong>Inside (Rehash)</strong>" : "a <strong>Field</strong>"} call. Every card ends with this close:</p>
        <div class="transition ${state.mode}">
          <p class="label">${escapeHtml(t.label)}</p>
          <p class="line">${script(t.close)}</p>
        </div>
      </div>`;
  }

  function renderDetail() {
    const o = byId[state.openId];
    if (!o) return renderEmpty();
    const mode = o.forceMode || state.mode;
    const t = TRANSITIONS[mode];
    const { list, fallback } = rebuttalsFor(o, state.mode);
    const pinned = state.pins.includes(o.id);
    const otherMode = state.mode === "inside" ? "Field" : "Inside";

    let html = `<button type="button" class="back ghost">← All objections</button>`;
    html += `<div class="detail-head"><h2 class="title">${escapeHtml(o.title)}</h2>`;
    html += `<button type="button" class="pin ghost" aria-pressed="${pinned}">${pinned ? "★ Pinned" : "☆ Pin"}</button></div>`;
    if (o.custom) html += `<p class="sub">Written for this tool, not from the company page.</p>`;
    if (o.note) html += `<p class="callout">${escapeHtml(o.note)}</p>`;
    if (fallback) html += `<p class="callout">Written for ${otherMode} calls. Adapt the wording, or switch the call type.</p>`;

    if (o.probe) {
      html += `<div class="probe"><p class="label">Ask first</p><p class="ask">${escapeHtml(o.probe.ask)}</p><div class="answers">`;
      o.probe.answers.forEach((a, i) => {
        html += `<button type="button" class="answer" data-i="${i}">${escapeHtml(a.label)}</button>`;
      });
      html += `</div><div class="probe-out"></div></div>`;
    }

    list.forEach((r, i) => {
      html += `<blockquote class="${i === 0 ? "primary" : "alt"}">`;
      html += `<p class="label">${i === 0 ? "Say this" : "Or try"}</p>`;
      html += `<p class="line">${script(r.text)}</p>`;
      if (r.note) html += `<p class="coach">${escapeHtml(r.note)}</p>`;
      html += `</blockquote>`;
    });

    html += `<div class="transition ${mode}">`;
    html += `<p class="label">Then · ${escapeHtml(t.label)}</p>`;
    if (o.forceMode && o.forceMode !== state.mode) html += `<p class="coach">Warm transfer this one even on a Field call.</p>`;
    html += `<p class="line">${script(t.close)}</p>`;
    if (t.confirm) html += `<p class="sub">When they pick a time:</p><p class="line small">${script(t.confirm)}</p>`;
    html += `<details><summary>Assumptive transitions</summary><ul>`;
    for (const a of t.assumptive) html += `<li>${script(a)}</li>`;
    html += `</ul></details></div>`;

    detailEl.innerHTML = html;
    detailEl.scrollTop = 0;

    detailEl.querySelector(".back").addEventListener("click", showList);
    detailEl.querySelector(".pin").addEventListener("click", () => togglePin(o.id));
    detailEl.querySelectorAll(".answer").forEach((b) => {
      b.addEventListener("click", () => {
        const a = o.probe.answers[Number(b.dataset.i)];
        detailEl.querySelectorAll(".answer").forEach((x) => x.classList.toggle("on", x === b));
        detailEl.querySelector(".probe-out").innerHTML =
          `<p class="line">${script(a.text)}</p>` + (a.coach ? `<p class="coach">${escapeHtml(a.coach)}</p>` : "");
      });
    });
  }

  function renderMode() {
    modeButtons.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.mode === state.mode)));
    document.body.dataset.mode = state.mode;
  }

  // ------------------------------------------------------------ actions
  // keep: true when the rep committed to this objection (click, Enter, number key).
  function open(id, keep) {
    state.openId = id;
    if (keep) {
      state.recent = [id, ...state.recent.filter((x) => x !== id)].slice(0, 5);
      save("recent", state.recent);
      if (narrow.matches) {
        document.body.dataset.view = "detail";
        window.scrollTo(0, 0);
      }
    }
    renderList();
    renderDetail();
  }

  function showList() {
    document.body.dataset.view = "list";
    searchEl.focus();
  }

  function togglePin(id) {
    if (state.pins.includes(id)) state.pins = state.pins.filter((x) => x !== id);
    else if (state.pins.length < MAX_PINS) state.pins = [...state.pins, id];
    else state.pins = [...state.pins.slice(0, MAX_PINS - 1), id];
    save("pins", state.pins);
    renderList();
    renderDetail();
  }

  function setQuery(q) {
    state.query = q;
    state.matches = search(q);
    state.cursor = 0;
    // Preview the best match right away on wide screens, so Enter is optional.
    if (state.matches.length && !narrow.matches) state.openId = state.matches[0].id;
    renderList();
    renderDetail();
  }

  function newCall() {
    searchEl.value = "";
    state.query = "";
    state.matches = [];
    state.openId = null;
    document.body.dataset.view = "list";
    renderList();
    renderDetail();
    searchEl.focus();
  }

  function setMode(mode) {
    state.mode = mode;
    save("mode", mode);
    renderMode();
    renderDetail();
  }

  modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  document.getElementById("new-call").addEventListener("click", newCall);

  searchEl.addEventListener("input", () => {
    if (narrow.matches) document.body.dataset.view = "list";
    setQuery(searchEl.value);
  });

  function quickPick(key) {
    const id = state.pins[Number(key) - 1];
    if (id) open(id, true);
    return Boolean(id);
  }
  const isDigitKey = (e) => /^[1-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey;

  searchEl.addEventListener("keydown", (e) => {
    // A digit typed into an empty search box opens that quick pick.
    if (!searchEl.value && isDigitKey(e)) {
      if (quickPick(e.key)) e.preventDefault();
      return;
    }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && state.query) {
      e.preventDefault();
      const n = state.matches.length;
      if (!n) return;
      state.cursor = (state.cursor + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
      state.openId = state.matches[state.cursor].id;
      renderList();
      renderDetail();
    } else if (e.key === "Enter") {
      const o = state.query ? state.matches[state.cursor] : null;
      if (o) {
        open(o.id, true);
        searchEl.select(); // next keystroke starts a fresh search
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (searchEl.value) {
        searchEl.value = "";
        setQuery("");
      } else {
        newCall();
      }
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.target === searchEl) return;
    if (e.key === "/") {
      e.preventDefault();
      searchEl.focus();
      searchEl.select();
    } else if (e.key === "Escape") {
      showList();
    } else if (isDigitKey(e)) {
      quickPick(e.key);
    }
  });

  renderMode();
  renderList();
  renderDetail();
})();
