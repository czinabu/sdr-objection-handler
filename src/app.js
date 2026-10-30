(function () {
  "use strict";

  const MAX_PINS = 9;
  const DEMO_PINS = [
    "not-interested", "too-expensive", "partner", "busy", "send-info",
    "think-about-it", "not-right-time", "competitor", "how-did-you-get-my-number",
  ];
  const MODES = ["inside", "field"];
  const DEPTHS = ["full", "cue", "close"];
  const DEPTH_NAMES = { full: "Full", cue: "Cue", close: "Close" };

  const searchEl = document.getElementById("search");
  const listEl = document.getElementById("list");
  const detailEl = document.getElementById("detail");
  const modeButtons = document.querySelectorAll(".mode button");
  const depthButtons = document.querySelectorAll(".depth button");
  const narrow = window.matchMedia("(max-width: 800px)");

  // ------------------------------------------------------------ storage
  let storageOk = true;
  function load(key) {
    try { return JSON.parse(localStorage.getItem("oh:" + key)); } catch (e) { return null; }
  }
  function save(key, value) {
    try { localStorage.setItem("oh:" + key, JSON.stringify(value)); storageOk = true; } catch (e) { storageOk = false; }
  }
  function remove(key) {
    try { localStorage.removeItem("oh:" + key); } catch (e) { /* ignore */ }
  }
  const clone = (x) => JSON.parse(JSON.stringify(x));

  // ------------------------------------------------------------ library
  // Fills in anything missing so an imported or hand-edited file can't break the page.
  function cleanLibrary(raw) {
    if (!raw || !Array.isArray(raw.objections)) throw new Error("The file needs an \"objections\" list.");
    const demo = window.DEMO_LIBRARY;
    const lib = {
      version: 1,
      name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : "My objection set",
      modes: {},
      groups: Array.isArray(raw.groups) ? raw.groups.filter((g) => typeof g === "string" && g.trim()) : [],
      objections: [],
      transitions: {},
      pins: Array.isArray(raw.pins) ? raw.pins.filter((p) => typeof p === "string") : undefined,
    };
    for (const m of MODES) {
      const rm = (raw.modes && raw.modes[m]) || {};
      lib.modes[m] = { name: str(rm.name) || demo.modes[m].name, hint: str(rm.hint) };
      const rt = (raw.transitions && raw.transitions[m]) || {};
      lib.transitions[m] = {
        label: str(rt.label) || demo.transitions[m].label,
        close: str(rt.close),
        confirm: str(rt.confirm),
        assumptive: Array.isArray(rt.assumptive) ? rt.assumptive.map(str).filter(Boolean) : [],
      };
    }
    const seen = new Set();
    for (const o of raw.objections) {
      if (!o || !str(o.title)) continue;
      const rebuttals = (Array.isArray(o.rebuttals) ? o.rebuttals : [])
        .filter((r) => r && str(r.text))
        .map((r) => {
          const out = { text: str(r.text) };
          if (MODES.includes(r.mode)) out.mode = r.mode;
          if (str(r.note)) out.note = str(r.note);
          return out;
        });
      if (!rebuttals.length) continue;
      const item = {
        id: uniqueId(str(o.id) || slug(o.title), seen),
        title: str(o.title),
        group: str(o.group) || "Other",
        keywords: Array.isArray(o.keywords) ? o.keywords.map(str).filter(Boolean) : [],
        rebuttals,
      };
      if (str(o.note)) item.note = str(o.note);
      if (str(o.cue)) item.cue = str(o.cue);
      if (MODES.includes(o.forceMode)) item.forceMode = o.forceMode;
      if (o.custom) item.custom = true;
      if (o.probe && str(o.probe.ask) && Array.isArray(o.probe.answers)) {
        const answers = o.probe.answers
          .filter((a) => a && str(a.label) && str(a.text))
          .map((a) => (str(a.coach) ? { label: str(a.label), text: str(a.text), coach: str(a.coach) } : { label: str(a.label), text: str(a.text) }));
        if (answers.length) item.probe = { ask: str(o.probe.ask), answers };
      }
      lib.objections.push(item);
    }
    for (const o of lib.objections) if (!lib.groups.includes(o.group)) lib.groups.push(o.group);
    if (!lib.pins) delete lib.pins;
    return lib;
  }
  function str(v) { return typeof v === "string" ? v.trim() : ""; }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "objection"; }
  function uniqueId(base, seen) {
    let id = base, n = 2;
    while (seen.has(id)) id = base + "-" + n++;
    seen.add(id);
    return id;
  }

  function loadLibrary() {
    const stored = load("library");
    if (stored) {
      try { return cleanLibrary(stored); } catch (e) { /* fall back to the demo */ }
    }
    return cleanLibrary(clone(window.DEMO_LIBRARY));
  }

  // ------------------------------------------------------------- state
  const state = {
    lib: loadLibrary(),
    mode: load("mode") || "inside",
    depth: DEPTHS.includes(load("depth")) ? load("depth") : "full", // how much of a card to show
    query: "",
    openId: null,   // objection shown in the detail panel
    panel: "card",  // "card", "edit", "manage" or "stats"
    used: 0,        // index of the rebuttal the rep said, among those shown
    cursor: 0,
    matches: [],
    pins: [],
    recent: (load("recent") || []),
    calls: Array.isArray(load("calls")) ? load("calls") : [],
  };
  let byId = {};
  let index = [];

  function rebuild() {
    byId = Object.fromEntries(state.lib.objections.map((o) => [o.id, o]));
    index = state.lib.objections.map((o) => ({
      o,
      title: normalize(o.title),
      keywords: o.keywords.map(normalize),
      body: normalize(o.rebuttals.map((r) => r.text).join(" ")),
    }));
    const stored = load("pins");
    let pins = (stored || state.lib.pins || DEMO_PINS).filter((id) => byId[id]);
    if (!pins.length) pins = state.lib.objections.slice(0, MAX_PINS).map((o) => o.id);
    state.pins = pins.slice(0, MAX_PINS);
    state.recent = state.recent.filter((id) => byId[id]);
    if (state.openId && !byId[state.openId]) state.openId = null;
    state.used = 0;
    if (state.query) state.matches = search(state.query);
  }

  function commitLibrary() {
    save("library", state.lib);
    rebuild();
    renderMode();
    renderList();
    renderDetail();
  }

  // ------------------------------------------------------------- search
  function normalize(s) {
    return s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  }

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
    return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  // Highlight fill-in-the-blank spots like [next available day].
  function script(s) {
    return escapeHtml(s).replace(/\[([^\]]+)\]/g, '<mark class="blank">$1</mark>');
  }
  const modeName = (m) => state.lib.modes[m].name;
  // The one-liner for cue view: the card's own cue, else the opening sentence of the rebuttal.
  function cueFor(o, rebuttal) {
    if (o.cue) return o.cue;
    const text = rebuttal.text.replace(/\s+/g, " ");
    const first = (text.match(/^.*?[.!?](?=\s|$)/) || [text])[0];
    return first.length > 110 ? first.slice(0, 107).replace(/\s+\S*$/, "") + "…" : first;
  }

  // Destructive buttons ask for a second click instead of a dialog.
  function confirmClick(button, label, action) {
    button.addEventListener("click", () => {
      if (button.dataset.armed) return action();
      const original = button.textContent;
      button.dataset.armed = "1";
      button.textContent = label;
      button.classList.add("armed");
      setTimeout(() => {
        delete button.dataset.armed;
        button.textContent = original;
        button.classList.remove("armed");
      }, 4000);
    });
  }

  // ------------------------------------------------------------- list
  function row(o, opts) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "row";
    if (o.id === state.openId && state.panel === "card") b.classList.add("open");
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
        listEl.innerHTML = '<p class="none">No match. Try another word, press Esc to clear, or add it as a new objection.</p>';
        listEl.appendChild(addButton());
        return;
      }
      section("Matches", state.matches, (o, i) => ({ cursor: i === state.cursor, key: i < MAX_PINS ? "⌥" + (i + 1) : null }));
      return;
    }

    if (!state.lib.objections.length) {
      listEl.innerHTML = '<p class="none">No objections yet. Add your first one, or import a set from Manage.</p>';
      listEl.appendChild(addButton());
      return;
    }

    section("Quick picks", state.pins.map((id) => byId[id]), (o, i) => ({ key: i + 1 }));
    const recent = state.recent.filter((id) => !state.pins.includes(id)).map((id) => byId[id]);
    section("Recent", recent);
    for (const g of state.lib.groups) section(g, state.lib.objections.filter((o) => o.group === g));
    listEl.appendChild(addButton());
  }

  function addButton() {
    const wrap = document.createElement("div");
    wrap.className = "list-actions";
    const add = document.createElement("button");
    add.type = "button";
    add.className = "ghost";
    add.textContent = "+ Add objection";
    add.addEventListener("click", () => openEditor(null));
    const manage = document.createElement("button");
    manage.type = "button";
    manage.className = "ghost phone-only";
    manage.textContent = "Manage";
    manage.addEventListener("click", openManage);
    wrap.append(add, manage);
    return wrap;
  }

  // ------------------------------------------------------------- detail
  function renderDetail() {
    if (state.panel === "edit") return renderEditor();
    if (state.panel === "manage") return renderManage();
    if (state.panel === "stats") return renderStats();
    const o = byId[state.openId];
    if (!o) return renderEmpty();

    const mode = o.forceMode || state.mode;
    const fits = o.rebuttals.filter((r) => !r.mode || r.mode === state.mode);
    const list = fits.length ? fits : o.rebuttals;
    const otherMode = state.mode === "inside" ? "field" : "inside";
    const pinned = state.pins.includes(o.id);

    let html = backButton();
    html += `<div class="detail-head"><h2 class="title">${escapeHtml(o.title)}</h2>`;
    html += `<div class="head-actions"><button type="button" class="pin ghost" aria-pressed="${pinned}">${pinned ? "★ Pinned" : "☆ Pin"}</button>`;
    html += `<button type="button" class="edit ghost">Edit</button></div></div>`;
    if (state.depth === "close") {
      detailEl.innerHTML = html + transitionBlock(mode, o.forceMode && o.forceMode !== state.mode, outcomeBar(mode, false));
      detailEl.scrollTop = 0;
      wireBack();
      wireHead(o);
      wireOutcome(o, list, mode);
      return;
    }
    if (o.custom) html += `<p class="sub">Your own wording, not from the official script.</p>`;
    if (state.depth === "cue") {
      html += `<blockquote class="primary"><p class="label">Cue</p><p class="line">${script(cueFor(o, list[0]))}</p></blockquote>`;
      detailEl.innerHTML = html + transitionBlock(mode, o.forceMode && o.forceMode !== state.mode, outcomeBar(mode, false));
      detailEl.scrollTop = 0;
      wireBack();
      wireHead(o);
      wireOutcome(o, list, mode);
      return;
    }
    if (o.note) html += `<p class="callout">${escapeHtml(o.note)}</p>`;
    if (!fits.length) html += `<p class="callout">Written for ${escapeHtml(modeName(otherMode))} calls. Adapt the wording, or switch the call type.</p>`;

    if (o.probe) {
      html += `<div class="probe"><p class="label">Ask first</p><p class="ask">${escapeHtml(o.probe.ask)}</p><div class="answers">`;
      o.probe.answers.forEach((a, i) => {
        html += `<button type="button" class="answer" data-i="${i}">${escapeHtml(a.label)}</button>`;
      });
      html += `</div><div class="probe-out"></div></div>`;
    }

    list.forEach((r, i) => {
      html += `<blockquote class="${i === 0 ? "primary" : "alt"}${i === state.used ? " used" : ""}" data-i="${i}">`;
      html += `<p class="label">${i === 0 ? "Say this" : "Or try"}</p>`;
      html += `<p class="line">${script(r.text)}</p>`;
      if (r.note) html += `<p class="coach">${escapeHtml(r.note)}</p>`;
      html += `</blockquote>`;
    });

    html += transitionBlock(mode, o.forceMode && o.forceMode !== state.mode, outcomeBar(mode, list.length > 1));

    detailEl.innerHTML = html;
    detailEl.scrollTop = 0;
    wireBack();
    wireHead(o);
    wireOutcome(o, list, mode);
    detailEl.querySelectorAll("blockquote").forEach((q) => q.addEventListener("click", () => {
      state.used = Number(q.dataset.i);
      detailEl.querySelectorAll("blockquote").forEach((x) => x.classList.toggle("used", x === q));
    }));
    detailEl.querySelectorAll(".answer").forEach((b) => {
      b.addEventListener("click", () => {
        const a = o.probe.answers[Number(b.dataset.i)];
        detailEl.querySelectorAll(".answer").forEach((x) => x.classList.toggle("on", x === b));
        detailEl.querySelector(".probe-out").innerHTML =
          `<p class="line">${script(a.text)}</p>` + (a.coach ? `<p class="coach">${escapeHtml(a.coach)}</p>` : "");
      });
    });
  }

  function wireHead(o) {
    detailEl.querySelector(".pin").addEventListener("click", () => togglePin(o.id));
    detailEl.querySelector(".edit").addEventListener("click", () => openEditor(o.id));
  }

  function wireOutcome(o, list, mode) {
    detailEl.querySelectorAll(".outcome button").forEach((b) => b.addEventListener("click", () => {
      logCall(o, list[state.used] || list[0], mode, b.dataset.out);
    }));
  }

  function transitionBlock(mode, forced, extra) {
    const t = state.lib.transitions[mode];
    if (!t.close && !t.assumptive.length) return `<div class="transition ${mode}">${extra || ""}</div>`;
    let html = `<div class="transition ${mode}">`;
    html += `<p class="label">Then · ${escapeHtml(t.label)}</p>`;
    if (forced) html += `<p class="coach">Use the ${escapeHtml(modeName(mode))} close for this one, whatever the call type.</p>`;
    if (t.close) html += `<p class="line">${script(t.close)}</p>`;
    if (t.confirm) html += `<p class="sub">Once they agree:</p><p class="line small">${script(t.confirm)}</p>`;
    if (t.assumptive.length) {
      html += `<details><summary>Assumptive transitions</summary><ul>`;
      for (const a of t.assumptive) html += `<li>${script(a)}</li>`;
      html += `</ul></details>`;
    }
    return html + (extra || "") + `</div>`;
  }

  function renderEmpty() {
    const t = state.lib.transitions[state.mode];
    detailEl.innerHTML = `
      <div class="empty">
        <p class="empty-lead">Type what the prospect said, or press a quick-pick number.</p>
        <p class="muted">This is a <strong>${escapeHtml(modeName(state.mode))}</strong> call. Every card ends with this close:</p>
        ${t.close ? `<div class="transition ${state.mode}"><p class="label">${escapeHtml(t.label)}</p><p class="line">${script(t.close)}</p></div>` : ""}
        <p class="muted small">Showing <strong>${escapeHtml(state.lib.name)}</strong> (${state.lib.objections.length} objections). Use <strong>Manage</strong> to load your own.</p>
      </div>`;
  }

  function backButton() { return `<button type="button" class="back ghost">← All objections</button>`; }
  function wireBack() { detailEl.querySelector(".back").addEventListener("click", showList); }

  // ------------------------------------------------------------- editor
  let draft = null; // objection being edited

  function openEditor(id) {
    const o = id ? byId[id] : null;
    draft = o ? clone(o) : { id: null, title: searchEl.value.trim(), group: state.lib.groups[0] || "Other", keywords: [], rebuttals: [{ text: "" }] };
    state.panel = "edit";
    state.openId = id;
    if (narrow.matches) document.body.dataset.view = "detail";
    renderList();
    renderDetail();
    const first = detailEl.querySelector("#f-title");
    if (first) first.focus();
  }

  function renderEditor() {
    const d = draft;
    const opts = (r) => ["", ...MODES].map((m) =>
      `<option value="${m}"${(r.mode || "") === m ? " selected" : ""}>${m ? escapeHtml(modeName(m)) + " only" : "Both call types"}</option>`).join("");

    let html = backButton();
    html += `<h2 class="title">${d.id ? "Edit objection" : "New objection"}</h2>`;
    html += `<form class="form" id="edit-form" novalidate>
      <label>What they say<input id="f-title" value="${escapeHtml(d.title)}" placeholder="e.g. I need to think about it" required></label>
      <label>Section<input id="f-group" list="groups" value="${escapeHtml(d.group)}"></label>
      <datalist id="groups">${state.lib.groups.map((g) => `<option value="${escapeHtml(g)}">`).join("")}</datalist>
      <label>Search words <span class="hint">comma separated</span><input id="f-keywords" value="${escapeHtml(d.keywords.join(", "))}" placeholder="think, consider, decide"></label>
      <label>One-line cue <span class="hint">optional, shown in Cue view. Leave blank to use the start of the first rebuttal.</span><input id="f-cue" value="${escapeHtml(d.cue || "")}" maxlength="140"></label>
      <label>Reminder <span class="hint">optional, shown above the rebuttals</span><input id="f-note" value="${escapeHtml(d.note || "")}"></label>
      <fieldset><legend>Rebuttals <span class="hint">the first one is "Say this". Use [brackets] for blanks.</span></legend>`;
    d.rebuttals.forEach((r, i) => {
      html += `<div class="rebuttal-edit" data-i="${i}">
        <textarea id="f-r-${i}" rows="3" aria-label="Rebuttal ${i + 1}">${escapeHtml(r.text)}</textarea>
        <div class="rebuttal-meta">
          <select id="f-rm-${i}" aria-label="Call type for rebuttal ${i + 1}">${opts(r)}</select>
          <input id="f-rn-${i}" value="${escapeHtml(r.note || "")}" placeholder="Coaching note (optional)" aria-label="Note for rebuttal ${i + 1}">
          <button type="button" class="ghost small remove-rebuttal" data-i="${i}" ${d.rebuttals.length < 2 ? "disabled" : ""}>Remove</button>
        </div>
      </div>`;
    });
    html += `<button type="button" class="ghost small" id="add-rebuttal">+ Add rebuttal</button></fieldset>`;
    if (d.probe) html += `<p class="sub">This card also has an "Ask first" question. It's kept as is; change it by editing your exported file.</p>`;
    html += `<p class="form-error" id="form-error" hidden></p>
      <div class="form-actions">
        <button type="submit" class="primary-btn">Save</button>
        <button type="button" class="ghost" id="cancel-edit">Cancel</button>
        ${d.id ? `<button type="button" class="ghost danger" id="delete-objection">Delete</button>` : ""}
      </div>
    </form>`;

    detailEl.innerHTML = html;
    wireBack();

    detailEl.querySelector("#add-rebuttal").addEventListener("click", () => {
      readDraft();
      draft.rebuttals.push({ text: "" });
      renderEditor();
      detailEl.querySelector(`#f-r-${draft.rebuttals.length - 1}`).focus();
    });
    detailEl.querySelectorAll(".remove-rebuttal").forEach((b) => b.addEventListener("click", () => {
      readDraft();
      draft.rebuttals.splice(Number(b.dataset.i), 1);
      renderEditor();
    }));
    detailEl.querySelector("#cancel-edit").addEventListener("click", closeEditor);
    const del = detailEl.querySelector("#delete-objection");
    if (del) confirmClick(del, "Click again to delete", () => deleteObjection(d.id));
    detailEl.querySelector("#edit-form").addEventListener("submit", (e) => {
      e.preventDefault();
      saveDraft();
    });
  }

  function readDraft() {
    const v = (id) => (detailEl.querySelector("#" + id) || { value: "" }).value;
    draft.title = v("f-title").trim();
    draft.group = v("f-group").trim() || "Other";
    draft.keywords = v("f-keywords").split(",").map((s) => s.trim()).filter(Boolean);
    draft.note = v("f-note").trim();
    draft.cue = v("f-cue").trim();
    draft.rebuttals = draft.rebuttals.map((r, i) => {
      const out = { text: v("f-r-" + i).trim() };
      const mode = v("f-rm-" + i);
      if (mode) out.mode = mode;
      const note = v("f-rn-" + i).trim();
      if (note) out.note = note;
      return out;
    });
  }

  function saveDraft() {
    readDraft();
    const errorEl = detailEl.querySelector("#form-error");
    const fail = (msg) => { errorEl.textContent = msg; errorEl.hidden = false; };
    if (!draft.title) return fail("Add what the prospect says, so you can find this card.");
    if (!draft.rebuttals.some((r) => r.text)) return fail("Add at least one rebuttal.");

    const item = clone(draft);
    item.rebuttals = item.rebuttals.filter((r) => r.text);
    if (!item.note) delete item.note;
    if (!item.cue) delete item.cue;
    const lib = state.lib;
    if (item.id) {
      lib.objections = lib.objections.map((o) => (o.id === item.id ? item : o));
    } else {
      item.id = uniqueId(slug(item.title), new Set(lib.objections.map((o) => o.id)));
      lib.objections.push(item);
    }
    if (!lib.groups.includes(item.group)) lib.groups.push(item.group);
    lib.groups = lib.groups.filter((g) => lib.objections.some((o) => o.group === g));
    state.panel = "card";
    state.openId = item.id;
    state.query = "";
    searchEl.value = "";
    commitLibrary();
  }

  function deleteObjection(id) {
    const lib = state.lib;
    lib.objections = lib.objections.filter((o) => o.id !== id);
    lib.groups = lib.groups.filter((g) => lib.objections.some((o) => o.group === g));
    state.pins = state.pins.filter((p) => p !== id);
    save("pins", state.pins);
    state.panel = "card";
    state.openId = null;
    commitLibrary();
  }

  function closeEditor() {
    state.panel = "card";
    draft = null;
    renderList();
    renderDetail();
  }

  // ------------------------------------------------------------- manage
  function renderManage() {
    const lib = state.lib;
    let html = backButton();
    html += `<h2 class="title">Manage objections</h2>`;
    html += `<p class="muted">You're using <strong>${escapeHtml(lib.name)}</strong> with ${lib.objections.length} objections. Changes are saved in this browser only${storageOk ? "" : ", and this browser isn't saving right now, so export before you close the page"}.</p>`;

    html += `<section class="manage-block">
      <h3>Back up or move your set</h3>
      <p class="sub">Copy your set as text, or save it as a file. Keep that file private if it has your company's wording in it.</p>
      <div class="form-actions">
        <button type="button" class="ghost" id="copy-json">Copy as text</button>
        <button type="button" class="ghost" id="download-json">Save as file</button>
      </div>
      <textarea id="export-box" rows="4" readonly hidden aria-label="Your objection set as text"></textarea>
    </section>`;

    html += `<section class="manage-block">
      <h3>Load a set</h3>
      <p class="sub">Choose a saved file, or paste the text. This replaces the objections you have now.</p>
      <input type="file" id="import-file" accept=".json,application/json" aria-label="Choose a saved set">
      <textarea id="import-box" rows="4" placeholder="…or paste a saved set here" aria-label="Paste a saved set"></textarea>
      <p class="form-error" id="import-error" hidden></p>
      <div class="form-actions">
        <button type="button" class="ghost" id="import-go">Load this set</button>
        <button type="button" class="ghost danger" id="reset-demo">Reset to demo set</button>
      </div>
    </section>`;

    html += `<section class="manage-block"><h3>Call types and closing scripts</h3>
      <p class="sub">Rename the two call types and write the close each card ends with. Use [brackets] for blanks.</p>
      <form class="form" id="scripts-form" novalidate>`;
    for (const m of MODES) {
      const md = lib.modes[m], t = lib.transitions[m];
      html += `<fieldset><legend>${m === "inside" ? "First" : "Second"} call type</legend>
        <div class="two">
          <label>Name<input id="s-${m}-name" value="${escapeHtml(md.name)}"></label>
          <label>Short hint<input id="s-${m}-hint" value="${escapeHtml(md.hint)}"></label>
        </div>
        <label>Close heading<input id="s-${m}-label" value="${escapeHtml(t.label)}"></label>
        <label>Close<textarea id="s-${m}-close" rows="2">${escapeHtml(t.close)}</textarea></label>
        <label>Once they agree <span class="hint">optional</span><textarea id="s-${m}-confirm" rows="2">${escapeHtml(t.confirm)}</textarea></label>
        <label>Assumptive lines <span class="hint">one per line</span><textarea id="s-${m}-assumptive" rows="3">${escapeHtml(t.assumptive.join("\n"))}</textarea></label>
      </fieldset>`;
    }
    html += `<label>Set name<input id="s-name" value="${escapeHtml(lib.name)}"></label>
      <div class="form-actions"><button type="submit" class="primary-btn">Save scripts</button><span class="saved" id="scripts-saved" hidden>Saved</span></div>
      </form></section>`;

    detailEl.innerHTML = html;
    detailEl.scrollTop = 0;
    wireBack();

    const exportBox = detailEl.querySelector("#export-box");
    const exported = () => JSON.stringify({ ...lib, pins: state.pins }, null, 2);
    detailEl.querySelector("#copy-json").addEventListener("click", (e) => {
      exportBox.value = exported();
      exportBox.hidden = false;
      const btn = e.currentTarget;
      const done = () => { btn.textContent = "Copied"; setTimeout(() => (btn.textContent = "Copy as text"), 2000); };
      try {
        navigator.clipboard.writeText(exportBox.value).then(done, () => { exportBox.select(); btn.textContent = "Select all and copy below"; });
      } catch (err) {
        exportBox.select();
      }
    });
    detailEl.querySelector("#download-json").addEventListener("click", () => {
      const blob = new Blob([exported()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = slug(lib.name) + ".json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      // Some embedded viewers block downloads; show the text too so nothing is lost.
      exportBox.value = exported();
      exportBox.hidden = false;
    });

    const importBox = detailEl.querySelector("#import-box");
    const importError = detailEl.querySelector("#import-error");
    detailEl.querySelector("#import-file").addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { importBox.value = String(reader.result); };
      reader.readAsText(file);
    });
    confirmClick(detailEl.querySelector("#import-go"), "Click again to replace your set", () => {
      try {
        const parsed = cleanLibrary(JSON.parse(importBox.value));
        if (!parsed.objections.length) throw new Error("That set has no objections with rebuttals.");
        replaceLibrary(parsed);
      } catch (err) {
        importError.textContent = err instanceof SyntaxError ? "That text isn't a saved set. Copy the whole file and try again." : err.message;
        importError.hidden = false;
      }
    });
    confirmClick(detailEl.querySelector("#reset-demo"), "Click again to reset", () => {
      remove("library");
      replaceLibrary(cleanLibrary(clone(window.DEMO_LIBRARY)));
    });

    detailEl.querySelector("#scripts-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = (id) => detailEl.querySelector("#" + id).value.trim();
      for (const m of MODES) {
        lib.modes[m] = { name: v(`s-${m}-name`) || lib.modes[m].name, hint: v(`s-${m}-hint`) };
        lib.transitions[m] = {
          label: v(`s-${m}-label`) || lib.transitions[m].label,
          close: v(`s-${m}-close`),
          confirm: v(`s-${m}-confirm`),
          assumptive: v(`s-${m}-assumptive`).split("\n").map((s) => s.trim()).filter(Boolean),
        };
      }
      lib.name = v("s-name") || lib.name;
      save("library", lib);
      renderMode();
      detailEl.querySelector("#scripts-saved").hidden = false;
    });
  }

  function replaceLibrary(lib) {
    state.lib = lib;
    remove("pins");
    state.recent = [];
    save("recent", []);
    state.panel = "card";
    state.openId = null;
    state.query = "";
    searchEl.value = "";
    commitLibrary();
  }


  // -------------------------------------------------------- call outcomes
  // One tap after a call logs the objection, the rebuttal said, and how it
  // ended. The log stays in this browser only, newest last, capped at MAX_CALLS.
  const MAX_CALLS = 2000;
  const WINS = { inside: "Transferred", field: "Booked" };
  const OUTCOME_LABEL = { won: "Won", lost: "Lost" };
  let toastTimer = 0;

  function outcomeBar(mode, several) {
    return `<div class="outcome" role="group" aria-label="Log how the call ended">
      <p class="label">How did it end?${several ? ` <span class="hint">Tap the line you said if it wasn't the first.</span>` : ""}</p>
      <div class="outcome-btns">
        <button type="button" class="win" data-out="won">${escapeHtml(WINS[mode])}</button>
        <button type="button" class="lose" data-out="lost">Lost</button>
      </div></div>`;
  }

  function logCall(o, r, mode, out) {
    const entry = { t: Date.now(), id: o.id, title: o.title, line: r ? r.text.slice(0, 80) : "", mode, out };
    state.calls = [...state.calls, entry].slice(-MAX_CALLS);
    save("calls", state.calls);
    newCall();
    showToast(`${out === "won" ? WINS[mode] : "Lost"} · ${o.title}`, () => {
      state.calls = state.calls.filter((c) => c !== entry);
      save("calls", state.calls);
      if (state.panel === "stats") renderDetail();
    });
  }

  function showToast(text, undo) {
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.innerHTML = `<span></span>`;
    el.firstChild.textContent = "Logged: " + text;
    const u = document.createElement("button");
    u.type = "button";
    u.textContent = "Undo";
    u.addEventListener("click", () => { undo(); el.hidden = true; });
    el.appendChild(u);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 6000);
  }

  const pct = (w, n) => (n ? Math.round((100 * w) / n) + "%" : "–");

  function tally(calls, keyOf) {
    const m = new Map();
    for (const c of calls) {
      const k = keyOf(c);
      const e = m.get(k) || { n: 0, w: 0, c };
      e.n++;
      if (c.out === "won") e.w++;
      m.set(k, e);
    }
    return [...m.values()];
  }

  function renderStats() {
    const calls = state.calls;
    let html = backButton() + `<h2 class="title">Call outcomes</h2>`;
    if (!calls.length) {
      detailEl.innerHTML = html + `<p class="muted">Nothing logged yet. After a call, tap how it ended at the bottom of the card and it shows up here. Logs are saved in this browser only.</p>`;
      return wireBack();
    }
    const wins = calls.filter((c) => c.out === "won").length;
    html += `<p class="muted">${calls.length} call${calls.length === 1 ? "" : "s"} logged, ${wins} won (${pct(wins, calls.length)}). Saved in this browser only.</p>`;

    const byObj = tally(calls, (c) => c.id).sort((a, b) => b.n - a.n).slice(0, 10);
    html += `<section class="manage-block"><h3>Top objections</h3><table class="stats"><thead><tr><th>Objection</th><th>Heard</th><th>Won</th></tr></thead><tbody>`;
    for (const e of byObj) html += `<tr><td>${escapeHtml(byId[e.c.id] ? byId[e.c.id].title : e.c.title)}</td><td>${e.n}</td><td>${pct(e.w, e.n)}</td></tr>`;
    html += `</tbody></table></section>`;

    // Only lines used at least twice on an objection are ranked against each other.
    const lines = tally(calls, (c) => c.id + "\u0000" + c.line).filter((e) => e.n >= 2 && e.c.line)
      .sort((a, b) => b.w / b.n - a.w / a.n || b.n - a.n).slice(0, 10);
    html += `<section class="manage-block"><h3>Which rebuttals convert</h3>`;
    if (!lines.length) html += `<p class="sub">Needs a line used on at least two calls before it shows a rate.</p>`;
    else {
      html += `<table class="stats"><thead><tr><th>Rebuttal</th><th>Used</th><th>Won</th></tr></thead><tbody>`;
      for (const e of lines) {
        const title = byId[e.c.id] ? byId[e.c.id].title : e.c.title;
        html += `<tr><td><strong>${escapeHtml(title)}</strong><br><span class="sub">${escapeHtml(e.c.line)}…</span></td><td>${e.n}</td><td>${pct(e.w, e.n)}</td></tr>`;
      }
      html += `</tbody></table>`;
    }
    html += `</section>`;

    html += `<section class="manage-block"><h3>Your log</h3><div class="form-actions">
      <button type="button" class="ghost" id="calls-csv">Save as CSV</button>
      <button type="button" class="ghost danger" id="calls-clear">Clear log</button></div></section>`;
    detailEl.innerHTML = html;
    detailEl.scrollTop = 0;
    wireBack();
    detailEl.querySelector("#calls-csv").addEventListener("click", () => {
      const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
      const rows = ["time,objection,rebuttal,call type,outcome", ...calls.map((c) =>
        [new Date(c.t).toISOString(), q(c.title), q(c.line), q((state.lib.modes[c.mode] || {}).name || c.mode), c.out].join(","))];
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
      a.download = "call-outcomes.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    const clear = detailEl.querySelector("#calls-clear");
    confirmClick(clear, "Really clear?", () => {
      state.calls = [];
      remove("calls");
      renderStats();
    });
  }

  function openStats() {
    state.panel = "stats";
    if (narrow.matches) {
      document.body.dataset.view = "detail";
      window.scrollTo(0, 0);
    }
    renderList();
    renderDetail();
  }

  // ------------------------------------------------------------- chrome
  function renderMode() {
    modeButtons.forEach((b) => {
      const m = b.dataset.mode;
      b.setAttribute("aria-checked", String(m === state.mode));
      b.innerHTML = `${escapeHtml(state.lib.modes[m].name)}${state.lib.modes[m].hint ? ` <span>${escapeHtml(state.lib.modes[m].hint)}</span>` : ""}`;
    });
    document.body.dataset.mode = state.mode;
  }

  function renderDepth() {
    depthButtons.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.depth === state.depth)));
    document.body.dataset.depth = state.depth;
  }

  // ------------------------------------------------------------ actions
  // keep: true when the rep committed to this objection (click, Enter, number key).
  function open(id, keep) {
    if (id !== state.openId) state.used = 0;
    state.openId = id;
    state.panel = "card";
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
    if (state.panel !== "card") state.panel = "card";
    document.body.dataset.view = "list";
    renderList();
    renderDetail();
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
    if (state.matches.length && !narrow.matches && state.panel === "card") state.openId = state.matches[0].id;
    renderList();
    if (state.panel === "card") renderDetail();
  }

  function newCall() {
    searchEl.value = "";
    state.query = "";
    state.matches = [];
    state.openId = null;
    state.panel = "card";
    document.body.dataset.view = "list";
    renderList();
    renderDetail();
    searchEl.focus();
  }

  function setMode(mode) {
    state.mode = mode;
    save("mode", mode);
    renderMode();
    if (state.panel === "card") renderDetail();
  }

  function setDepth(depth) {
    state.depth = depth;
    save("depth", depth);
    renderDepth();
    if (state.panel === "card") renderDetail();
  }

  modeButtons.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  depthButtons.forEach((b) => b.addEventListener("click", () => setDepth(b.dataset.depth)));
  document.getElementById("new-call").addEventListener("click", newCall);
  function openManage() {
    state.panel = "manage";
    if (narrow.matches) {
      document.body.dataset.view = "detail";
      window.scrollTo(0, 0);
    }
    renderList();
    renderDetail();
  }
  document.getElementById("manage").addEventListener("click", openManage);
  document.getElementById("stats").addEventListener("click", openStats);

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
  const typingInForm = (el) => el && el !== searchEl && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);

  // Alt shortcuts work from anywhere, including the search box. They use the physical
  // key (e.code) because Alt+letter types a different character on a Mac.
  function altShortcut(e) {
    if (!e.altKey || e.ctrlKey || e.metaKey) return false;
    if (e.code === "KeyV") setDepth(DEPTHS[(DEPTHS.indexOf(state.depth) + 1) % DEPTHS.length]);
    else if (e.code === "KeyT") setMode(state.mode === "inside" ? "field" : "inside");
    else if (state.query && /^Digit[1-9]$/.test(e.code) && state.matches[Number(e.code.slice(5)) - 1]) {
      open(state.matches[Number(e.code.slice(5)) - 1].id, true);
      searchEl.select();
    } else return false;
    e.preventDefault();
    return true;
  }

  searchEl.addEventListener("keydown", (e) => {
    if (altShortcut(e)) return;
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
      state.panel = "card";
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
    if (altShortcut(e)) return;
    if (typingInForm(e.target)) return;
    // Type anywhere: a letter on the card view starts a search, no need to click first.
    if (state.panel === "card" && e.key.length === 1 && /[^\s/\d]/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      searchEl.focus();
      searchEl.select();
      return; // the keystroke lands in the search box
    }
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

  rebuild();
  renderMode();
  renderDepth();
  renderList();
  renderDetail();
})();
