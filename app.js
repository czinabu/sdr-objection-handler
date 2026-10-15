(function () {
  "use strict";

  const OBJECTIONS = window.OBJECTIONS;
  const GROUPS = window.OBJECTION_GROUPS;
  const TRANSITIONS = window.TRANSITIONS;

  const searchEl = document.getElementById("search");
  const resultsEl = document.getElementById("results");
  const recentEl = document.getElementById("recent");
  const detailEl = document.getElementById("detail");
  const modeButtons = document.querySelectorAll(".mode button");

  const state = {
    mode: load("mode") || "inside",
    query: "",
    selectedId: null,
    cursor: 0, // index into the visible list, for arrow keys
    visible: [],
    recent: load("recent") || [],
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

  // Precompute searchable text once.
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
    if (!q) return null;
    const words = q.split(" ");
    return index
      .map((e) => ({ o: e.o, s: score(e, q, words) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.o);
  }

  // ------------------------------------------------------------- render
  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  // Highlight fill-in-the-blank spots like [next available day].
  function script(s) {
    return escapeHtml(s).replace(/\[([^\]]+)\]/g, '<mark class="blank">$1</mark>');
  }

  function renderList() {
    const hits = search(state.query);
    resultsEl.innerHTML = "";

    if (hits) {
      state.visible = hits;
      if (!hits.length) {
        resultsEl.innerHTML = '<p class="muted none">No match. Try another word, or clear with Esc.</p>';
        return;
      }
      resultsEl.appendChild(buttonsFor(hits, 0));
    } else {
      state.visible = [];
      for (const g of GROUPS) {
        const items = OBJECTIONS.filter((o) => o.group === g);
        const h = document.createElement("h2");
        h.textContent = g;
        resultsEl.appendChild(h);
        resultsEl.appendChild(buttonsFor(items, state.visible.length));
        state.visible.push(...items);
      }
    }
    state.cursor = Math.min(state.cursor, state.visible.length - 1);
    markCursor();
  }

  function buttonsFor(items, offset) {
    const wrap = document.createElement("div");
    wrap.className = "chips";
    items.forEach((o, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip";
      b.dataset.id = o.id;
      b.dataset.pos = offset + i;
      b.textContent = o.title;
      if (o.id === state.selectedId) b.classList.add("selected");
      b.addEventListener("click", () => select(o.id));
      wrap.appendChild(b);
    });
    return wrap;
  }

  function markCursor() {
    resultsEl.querySelectorAll(".chip").forEach((b) => {
      b.classList.toggle("cursor", state.query !== "" && Number(b.dataset.pos) === state.cursor);
    });
  }

  function renderRecent() {
    const items = state.recent.map((id) => OBJECTIONS.find((o) => o.id === id)).filter(Boolean);
    recentEl.hidden = items.length === 0;
    recentEl.innerHTML = "";
    if (!items.length) return;
    const h = document.createElement("h2");
    h.textContent = "Recent";
    recentEl.appendChild(h);
    const wrap = buttonsFor(items, -1000);
    wrap.classList.add("small");
    recentEl.appendChild(wrap);
  }

  function rebuttalsFor(o, mode) {
    const fits = o.rebuttals.filter((r) => !r.mode || r.mode === mode);
    if (fits.length) return { list: fits, fallback: false };
    return { list: o.rebuttals, fallback: true };
  }

  function renderDetail() {
    const o = OBJECTIONS.find((x) => x.id === state.selectedId);
    if (!o) return;
    const mode = o.forceMode || state.mode;
    const t = TRANSITIONS[mode];
    const { list, fallback } = rebuttalsFor(o, state.mode);
    const otherMode = state.mode === "inside" ? "Field" : "Inside";

    let html = `<h2 class="title">${escapeHtml(o.title)}</h2>`;

    if (o.note) html += `<p class="callout">${escapeHtml(o.note)}</p>`;
    if (fallback) {
      html += `<p class="callout">This one is written for ${otherMode} calls. Adapt the wording, or switch the call type.</p>`;
    }

    if (o.probe) {
      html += `<div class="probe"><p class="label">Ask first</p><p class="ask">${escapeHtml(o.probe.ask)}</p><div class="answers">`;
      o.probe.answers.forEach((a, i) => {
        html += `<button type="button" class="answer" data-i="${i}">${escapeHtml(a.label)}</button>`;
      });
      html += `</div><div class="probe-out"></div></div>`;
    }

    html += `<div class="rebuttals">`;
    list.forEach((r, i) => {
      html += `<blockquote class="${i === 0 ? "primary" : "alt"}">`;
      html += `<p class="label">${i === 0 ? "Say this" : "Or try"}</p>`;
      html += `<p class="line">${script(r.text)}</p>`;
      if (r.note) html += `<p class="coach">${escapeHtml(r.note)}</p>`;
      html += `</blockquote>`;
    });
    html += `</div>`;

    html += `<div class="transition ${mode}">`;
    html += `<p class="label">Then transition · ${escapeHtml(t.label)}</p>`;
    if (o.forceMode && o.forceMode !== state.mode) {
      html += `<p class="coach">Warm transfer this one even on a Field call.</p>`;
    }
    html += `<p class="line">${script(t.close)}</p>`;
    if (t.confirm) html += `<p class="sub">When they pick a time:</p><p class="line small">${script(t.confirm)}</p>`;
    html += `<details><summary>Assumptive transitions</summary><ul>`;
    for (const a of t.assumptive) html += `<li>${script(a)}</li>`;
    html += `</ul></details></div>`;

    detailEl.innerHTML = html;

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
  function select(id) {
    state.selectedId = id;
    state.recent = [id, ...state.recent.filter((x) => x !== id)].slice(0, 5);
    save("recent", state.recent);
    renderList();
    renderRecent();
    renderDetail();
    // On narrow screens the detail sits under the list; bring it into view.
    if (window.matchMedia("(max-width: 800px)").matches) {
      detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function setMode(mode) {
    state.mode = mode;
    save("mode", mode);
    renderMode();
    renderDetail();
  }

  modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

  searchEl.addEventListener("input", () => {
    state.query = searchEl.value;
    state.cursor = 0;
    renderList();
  });

  searchEl.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!state.query) return;
      const n = state.visible.length;
      if (!n) return;
      state.cursor = (state.cursor + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
      markCursor();
    } else if (e.key === "Enter") {
      const o = state.visible[state.query ? state.cursor : -1];
      if (o) select(o.id);
    } else if (e.key === "Escape") {
      searchEl.value = "";
      state.query = "";
      renderList();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== searchEl) {
      e.preventDefault();
      searchEl.focus();
      searchEl.select();
    }
  });

  renderMode();
  renderRecent();
  renderList();
})();
