/* Task Explorer: one synthesized DTAP-MAS task. The people network, each person's agents and delegated tools, the
   channels, and the scenario, seeded history, agent memory, privilege matrix, checks and the judge's review.
   Data: window.TASK_DATA (an exported page) or the bundled task JSON snapshot. */
"use strict";

const SVC_LABEL = { whatsapp: "WhatsApp", gmail: "Gmail", calendar: "Calendar", paypal: "PayPal", slack: "Slack",
                    github: "GitHub", email: "Email", x: "X", gdocs: "Google Docs" };
const SERVICES = ["whatsapp", "gmail", "calendar", "paypal", "slack", "github", "x", "gdocs"];
// The services delegated to an agent, drawn (Services layer, off by default) with the logos the DTAP site uses
// (frontend/public/logo/domains)
const SVC_LOGO = { whatsapp: "assets/services/whatsapp.png", gmail: "assets/services/gmail.png",
                   calendar: "assets/services/calendar.png", paypal: "assets/services/paypal.svg",
                   slack: "assets/services/slack.png", github: "assets/services/github.svg", gdocs: "assets/services/gdocs.png" };
const css = v => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const $ = id => document.getElementById(id);
const first = p => (p?.name || "").split(" ")[0];
const initials = n => (String(n || "").trim().split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?");

// lucide path data (24x24 viewBox) drawn inside the graph nodes: a user glyph for people, a robot for agents.
const ICON = {
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
};

const TAB_ALIAS = { scenario: "task", instruction: "task", flow: "task", checks: "verifier", privileges: "agents", review: "task" };
const TAB_VALUES = new Set(["task", "agents", "verifier", "trajectory", "memory", "conversation"]);
const resolveTab = value => TAB_VALUES.has(TAB_ALIAS[value] || value) ? TAB_ALIAS[value] || value : "task";
const tabGroup = t => ({ memory: "agents", conversation: "agents" })[t] || t;                      // which tab button a pane lives under
let T = null, sel = null, tab = "task", flt = { channel: "", person: "" }, memAgent = null, graphFolded = false;
let expandedViewer = null, trajectoryZoom = null;

function updateViewerButtons() {
  for (const [id, kind, name] of [["expand-topology", "topology", "agent topology"], ["expand-trajectory", "trajectory", "trajectory"]]) {
    const button = $(id); if (!button) continue;
    const active = expandedViewer === kind;
    button.setAttribute("aria-expanded", String(active));
    button.setAttribute("aria-label", `${active ? "Collapse" : "Expand"} ${name}`);
    button.innerHTML = `<i data-lucide="${active ? "minimize-2" : "maximize-2"}"></i><span>${active ? "Collapse" : "Expand"}</span>`;
  }
  if (window.lucide) lucide.createIcons();
}

function resizeViewers() {
  fittedFor = null;
  if (T) draw();
  if (tab === "task") layoutFlowEdges();
  if (tab === "trajectory") scaleTrajectory();
}

function setViewer(kind) {
  const previous = expandedViewer;
  expandedViewer = kind;
  trajectoryZoom = null;
  closePop();
  if (kind === "topology") {
    graphFolded = false;
    $("stage").classList.remove("folded");
    $("fold-view").innerHTML = '<i data-lucide="chevron-up"></i>Network';
  }
  window.DTap.setViewer(kind);
  updateViewerButtons();
  requestAnimationFrame(() => {
    resizeViewers();
    if (!kind && previous) $(previous === "topology" ? "expand-topology" : "expand-trajectory")?.focus();
  });
}
window.DTap.closeViewer = () => setViewer(null);

function scaleTrajectory() {
  const grid = $("tq-grid"), canvas = $("tq-canvas"), scroll = $("tq-scroll");
  if (!grid || !canvas || !scroll) return;
  const fit = Math.min(1.25, Math.max(1, scroll.clientWidth - 2) / grid.offsetWidth);
  const scale = trajectoryZoom ?? (expandedViewer === "trajectory" ? fit : 1);
  grid.style.transform = `scale(${scale})`;
  canvas.style.width = Math.ceil(grid.offsetWidth * scale) + "px";
  canvas.style.height = Math.ceil(grid.offsetHeight * scale) + "px";
  const value = $("trajectory-scale");
  if (value) value.textContent = Math.round(scale * 100) + "%";
  grid.dataset.scale = scale;
  layoutTrajLinks();
}

// The site's theme button shows a sun in light mode and a moon in dark mode.
function themeIcon() {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  document.getElementById("theme").innerHTML = `<i data-lucide="${dark ? "moon" : "sun"}"></i>`;
  if (window.lucide) lucide.createIcons();
}
async function boot() {
  if (window.lucide) lucide.createIcons();  // the site's icon set (lucide); <i data-lucide> becomes an <svg>
  themeIcon();
  $("theme").onclick = () => window.DTapTheme.toggle();
  addEventListener("dtap:theme", () => {
    themeIcon();
    if (T) { draw(); if (tab === "task") renderPane(); }
  });
  document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => { tab = b.dataset.tab; renderPane(); });
  document.querySelector(".tabs").addEventListener("keydown", event => {
    const buttons = [...document.querySelectorAll(".tabs button")];
    const index = buttons.indexOf(document.activeElement);
    if (index < 0 || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
      : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus();
    buttons[next].click();
  });
  document.querySelectorAll(".layers input").forEach(i => i.onchange = () => draw());
  $("fit-view").onclick = () => { fittedFor = null; if (T) draw(); };
  $("expand-topology").onclick = () => setViewer(expandedViewer === "topology" ? null : "topology");
  $("fold-view").onclick = () => {
    graphFolded = !graphFolded;
    $("stage").classList.toggle("folded", graphFolded);
    $("fold-view").innerHTML = `<i data-lucide="${graphFolded ? "chevron-down" : "chevron-up"}"></i>Network`;
    if (window.lucide) lucide.createIcons();
    if (!graphFolded && T) { fittedFor = null; draw(); }
  };
  document.addEventListener("mousedown", e => {  // a click anywhere but the window or a step dismisses the window
    const p = $("pop"); if (p && !p.hidden && !e.target.closest("#pop") && !e.target.closest("[data-tn]")) closePop();
  });
  let popRaf = 0;   // the window follows its node while the page scrolls; scrolling inside the window itself is left alone
  addEventListener("scroll", e => {
    const t = e.target; if (t && t.nodeType === 1 && t.closest("#pop")) return;
    if (!popRaf) popRaf = requestAnimationFrame(() => { popRaf = 0; repositionPop(); });
  }, true);
  addEventListener("keydown", e => {
    if (e.key === "Escape") {
      if (!$("pop").hidden) closePop();
      else if (expandedViewer) { e.preventDefault(); setViewer(null); }
    }
    if (expandedViewer && e.key === "Tab") {
      const focusable = [...document.querySelectorAll('button, a[href], input, select, [tabindex="0"]')]
        .filter(element => !element.disabled && element.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
    if ((e.key === "f" || e.key === "F") && !/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) $("fit-view").click();
  });
  addEventListener("resize", () => { repositionPop(); resizeViewers(); });
  if (window.TASK_DATA) { $("back").hidden = true; return show(window.TASK_DATA); }  // an exported page stands alone
  // Back to the task list, keeping its filters when that is where the reader came from
  try { const r = new URL(document.referrer); if (r.origin === location.origin && /\/(tasks\.html)?$/.test(r.pathname)) $("back").href = r.href; }
  catch (_) { /* no referrer */ }
  const id = new URLSearchParams(location.search).get("t");
  if (!id) return window.DTap.navigate("tasks.html");
  window.openTask = t => { window.DTap.navigate("task.html?t=" + encodeURIComponent(t)); };  // the benign / red-teaming pair
  load(id).catch(e => fail(e.message));
}
async function load(id) {
  const path = id.split("/").map(encodeURIComponent).join("/");
  const r = await fetch("data/task/" + path + ".json");
  if (!r.ok) throw new Error(`Task not found (HTTP ${r.status})`);
  const body = await r.json();
  if (!r.ok) return fail(body.error || r.statusText);
  show(body);
}
function fail(msg) { const e = $("error"); e.textContent = msg; e.hidden = false; setTimeout(() => e.hidden = true, 6000); }

function show(data) {
  T = data; sel = null; flt = { channel: "", person: "" };
  memAgent = (T.agents.find(a => a.memory) || T.agents[0] || {}).id;
  T.byId = Object.fromEntries(T.people.map(p => [p.id, p]));
  T.agentsOf = {};
  for (const a of T.agents) (T.agentsOf[a.principal] ||= []).push(a);
  $("title").textContent = T.nav?.task_id || T.id;
  $("sub").textContent = T.title;
  const pair = $("pair-link");
  pair.hidden = !T.nav;
  if (T.nav) {
    $("pair-text").textContent = T.nav.kind === "rt" ? "Benign version" : "Red-Teaming version";
    pair.title = T.nav.pair;
    pair.onclick = e => { e.preventDefault(); window.openTask(T.nav.pair); };
  }
  const th = T.threat;
  const pill = (text, cls = "") => `<span class="dt-pill ${cls}">${esc(text)}</span>`;
  const size = pill(`${T.people.length} people · ${T.agents.length} agents · ${T.channels.length} channels`);
  $("badges").innerHTML = !th.attacker ? [  // a benign task: the scenario with no attacker
    pill(T.domain.charAt(0).toUpperCase() + T.domain.slice(1), "solid"), pill("Benign", "ok"), size,
  ].join("") : [
    pill(T.domain.charAt(0).toUpperCase() + T.domain.slice(1), "solid"), pill(`#${T.nav ? T.nav.category_slug : T.category.name}`), size,
    pill("Red-Teaming", "danger"),
  ].join("");
  $("goal").hidden = !th.attacker;
  $("goal-text").textContent = th.attacker ? th.goal : "";
  const q = new URLSearchParams(location.search);
  tab = resolveTab(q.get("tab"));
  draw(); chanbar(); renderPane();
  if (q.get("c")) openChannel(q.get("c")); else if (q.get("a")) openAgent(q.get("a"));
}

// The strip under the graph: one chip per conversation (opens its chat) and per agent (opens its memory).
function chanbar() {
  const used = [...new Set(T.timeline.map(x => x.channel))];
  const icon = id => { const c = T.channels.find(x => x.id === id); return c ? (c.kind === "dm" ? "message-circle" : "messages-square")
    : T.repos?.some(r => r.id === id) ? "git-branch" : "at-sign"; };
  const chChip = id => `<button class="pick ch ${tab === "conversation" && flt.channel === id ? "on" : ""}" data-ch="${esc(id)}">
    <i data-lucide="${icon(id)}"></i>${esc(chanName(id))}</button>`;
  const agChip = a => `<button class="pick ag ${tab === "memory" && memAgent === a.id ? "on" : ""}" data-ag="${esc(a.id)}">
    <i data-lucide="bot"></i>${esc(first(T.byId[a.principal]))}'s agent</button>`;
  $("chanbar").innerHTML = `<span class="grp">Conversations</span>${used.map(chChip).join("") || "<span class='muted'>none</span>"}
    <span class="sep"></span><span class="grp">Agents</span>${T.agents.map(agChip).join("")}`;
  if (window.lucide) lucide.createIcons();
  $("chanbar").querySelectorAll("[data-ch]").forEach(b => b.onclick = () => openChannel(b.dataset.ch));
  $("chanbar").querySelectorAll("[data-ag]").forEach(b => b.onclick = () => openAgent(b.dataset.ag));
}
function openChannel(id) { if (expandedViewer) setViewer(null); flt.channel = id; flt.person = ""; tab = "conversation"; sel = null; draw(); chanbar(); renderPane(); }
function openAgent(id) { if (expandedViewer) setViewer(null); memAgent = id; sel = id; tab = "memory"; draw(); chanbar(); renderPane(); }

// -- the graph -----------------------------------------------------------------------------------------------------
const ROLE_COLOR = p => p.is_attacker ? css("--attack") : p.is_victim ? css("--warn") : p.has_agent ? css("--accent") : css("--service");
const TIE_COLOR = c => css("--" + c) || css("--service");

// A white line-icon centred in a node (person=user glyph, agent=robot), scaled from lucide's 24x24 viewBox.
function nodeIcon(n, name, size) {
  n.append("svg").attr("class", "ico").attr("viewBox", "0 0 24 24").attr("x", -size / 2).attr("y", -size / 2)
    .attr("width", size).attr("height", size).attr("fill", "none").attr("stroke", "#fff")
    .attr("stroke-width", 2.2).attr("stroke-linecap", "round").attr("stroke-linejoin", "round").html(ICON[name]);
}

// A seeded random source, so a task always opens with the same layout.
function seeded(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
}

// Positions in graph space, computed once per task on a fixed canvas (so they do not depend on the window): the view
// (zoom, pan) fits them to the window, and dragging a person moves them.
function layout() {
  const W = 1000, H = 700;
  const inside = T.people.filter(p => !p.is_attacker), out = T.people.filter(p => p.is_attacker);
  const rnd = seeded(T.id);
  const nodes = inside.map(p => ({ id: p.id, x: W * .45 + (rnd() - .5) * 80, y: H / 2 + (rnd() - .5) * 80 }));
  const links = T.ties.filter(t => T.byId[t.a] && T.byId[t.b] && !T.byId[t.a].is_attacker && !T.byId[t.b].is_attacker)
    .map(t => ({ source: t.a, target: t.b, w: t.closeness }));
  for (const c of T.channels) for (let i = 0; i < c.members.length - 1; i++)
    if (T.byId[c.members[i]] && T.byId[c.members[i + 1]] && !T.byId[c.members[i]].is_attacker && !T.byId[c.members[i + 1]].is_attacker)
      links.push({ source: c.members[i], target: c.members[i + 1], w: .2, weak: true });
  const sim = d3.forceSimulation(nodes).force("link", d3.forceLink(links).id(d => d.id).distance(d => 150 - 60 * d.w).strength(.35))
    .force("charge", d3.forceManyBody().strength(-900)).force("center", d3.forceCenter(W * .45, H / 2))
    .force("collide", d3.forceCollide(46))
    .force("x", d3.forceX(W * .45).strength(.08)).force("y", d3.forceY(H / 2).strength(.08))  // keeps loners near the group
    .randomSource(rnd).stop();
  for (let i = 0; i < 300; i++) sim.tick();
  const pos = Object.fromEntries(nodes.map(n => [n.id, [n.x, n.y]]));
  const right = d3.max(nodes, n => n.x) ?? W / 2, mid = d3.mean(nodes, n => n.y) ?? H / 2;
  out.forEach((p, i) => pos[p.id] = [right + 230, mid + 120 * (i - (out.length - 1) / 2)]);
  return pos;
}

// Zoom and pan (wheel, drag the background), kept across redraws; a new task is fitted to the window.
let view = d3.zoomIdentity, zoomer = null, fittedFor = null;
function fitView(W, H) {
  const pts = Object.values(T.pos);
  const [x0, x1] = d3.extent(pts, p => p[0]), [y0, y1] = d3.extent(pts, p => p[1]);
  // room for the node labels and hull, and for the Show bar above and the legend below the graph
  const padX = 90, padTop = 120, padBottom = 110;
  const k = Math.min(1.4, W / (x1 - x0 + 2 * padX), H / (y1 - y0 + padTop + padBottom));
  return d3.zoomIdentity.translate(W / 2 - k * (x0 + x1) / 2, padTop + (H - padTop - padBottom) / 2 - k * (y0 + y1) / 2).scale(k);
}

function draw() {
  const svg = d3.select("#graph"), box = svg.node().getBoundingClientRect();
  const W = Math.max(box.width, 420), H = Math.max(box.height, 360), on = {};
  document.querySelectorAll(".layers input").forEach(i => on[i.dataset.layer] = i.checked);
  svg.selectAll("*").remove(); svg.attr("viewBox", `0 0 ${W} ${H}`);
  svg.append("title").text("Scroll to zoom · drag to pan · drag a person to move them");
  if (!T.pos) T.pos = layout();
  const pos = T.pos, g = svg.append("g").attr("transform", view);
  if (!zoomer) {
    zoomer = d3.zoom().scaleExtent([0.15, 5])
      .on("zoom", e => { view = e.transform; svg.select("g").attr("transform", view); untip(); closePop(); });
    svg.call(zoomer).on("dblclick.zoom", null);
  }
  svg.on("click", e => { if (e.target === svg.node()) closePop(); });  // click the background to dismiss a pinned card
  if (fittedFor !== T) { fittedFor = T; svg.call(zoomer.transform, fitView(W, H)); }
  // Drag a person (and their agents and ties) to a new place; a click without a move still selects.
  const dragPerson = id => d3.drag().container(svg.node())
    .on("start", e => e.sourceEvent.stopPropagation())
    .on("drag", e => { T.pos[id] = view.invert([e.x, e.y]); untip(); closePop(); draw(); });

  // the group's boundary: everyone inside it is benign; the attacker is outside it
  const ins = T.people.filter(p => !p.is_attacker).map(p => pos[p.id]);
  const hull = d3.polygonHull(ins.flatMap(([x, y]) => [[x - 48, y - 48], [x + 48, y - 48], [x - 48, y + 48], [x + 48, y + 48]]));
  if (hull) {
    g.append("path").attr("class", "boundary").attr("d", "M" + hull.join("L") + "Z");
    const top = d3.min(hull, d => d[1]), cx = d3.mean(hull, d => d[0]);
    g.append("text").attr("class", "boundary-label").attr("x", cx).attr("y", top - 8).attr("text-anchor", "middle")
      .text("the group: every member is benign");
  }

  if (on.channels) for (const c of T.channels) {
    const pts = c.members.map(m => pos[m]).filter(Boolean);
    if (c.kind === "dm" && pts.length === 2) g.append("line").attr("x1", pts[0][0]).attr("y1", pts[0][1]).attr("x2", pts[1][0])
      .attr("y2", pts[1][1]).attr("stroke", css("--muted")).attr("stroke-dasharray", "2 4").attr("stroke-width", 1.4)
      .style("cursor", "pointer").on("click", () => openChannel(c.id))
      .on("mousemove", e => tip(e, `<b>${esc(c.name)}</b><br>${esc(SVC_LABEL[c.service] || c.service)} DM · click to read`)).on("mouseleave", untip);
    else if (pts.length > 2) {
      const h = d3.polygonHull(pts.flatMap(([x, y]) => [[x - 26, y - 26], [x + 26, y - 26], [x - 26, y + 26], [x + 26, y + 26]]));
      if (h) g.append("path").attr("d", "M" + h.join("L") + "Z").attr("fill", "none").attr("stroke", css("--muted"))
        .attr("stroke-dasharray", "3 4").attr("stroke-width", 1.2).style("cursor", "pointer").on("click", () => openChannel(c.id))
        .on("mousemove", e => tip(e, `<b>${esc(c.name)}</b><br>${esc(SVC_LABEL[c.service] || c.service)} ${esc(c.kind)} · ${c.members.length} members · click to read`))
        .on("mouseleave", untip);
    }
  }

  if (on.ties) for (const t of T.ties) {
    const a = pos[t.a], b = pos[t.b];
    if (!a || !b || T.byId[t.a].is_attacker || T.byId[t.b].is_attacker) continue;
    g.append("line").attr("x1", a[0]).attr("y1", a[1]).attr("x2", b[0]).attr("y2", b[1]).attr("stroke", TIE_COLOR(t.category))
      .attr("stroke-width", 1 + 3 * t.closeness).attr("opacity", .55)
      .on("mousemove", e => tip(e, `<b>${esc(first(T.byId[t.a]))} – ${esc(first(T.byId[t.b]))}</b><br>${esc(t.type)}${t.context ? " · " + esc(t.context) : ""}<br>closeness ${t.closeness}`))
      .on("mouseleave", untip);
  }

  for (const p of T.people) {
    const [x, y] = pos[p.id], r = p.is_attacker ? 17 : 15;
    const n = g.append("g").attr("class", "node-person" + (sel === p.id ? " selected" : ""))
      .attr("transform", `translate(${x},${y})`).on("click", ev => openPersonPop(p, ev))
      .call(dragPerson(p.id));
    n.append("circle").attr("r", r).attr("fill", ROLE_COLOR(p))
      .attr("stroke-dasharray", p.is_attacker ? "4 3" : null)
      .on("mousemove", e => tip(e, personTip(p))).on("mouseleave", untip);
    nodeIcon(n, "user", r * 1.1);
    n.append("text").attr("class", "name").attr("y", r + 16).attr("text-anchor", "middle").text(first(p) + (p.is_attacker ? " (outsider)" : ""));
    if (p.compromised) n.append("text").attr("class", "name").attr("y", -r - 6).attr("text-anchor", "middle").attr("fill", css("--attack")).text("compromised account");
  }

  // Every person has an agent, so agents are not drawn. The one the injection lands on gets a red mark beside its person.
  const injP = injectedPrincipal();
  if (injP && pos[injP]) {
    const [px, py] = pos[injP], pa = T.byId[injP], ag = (T.agentsOf[injP] || [])[0];
    const mk = g.append("g").attr("class", "node-agent injected").attr("transform", `translate(${px + 20},${py - 20})`).style("cursor", "pointer")
      .on("click", ev => openPersonPop(pa, ev))
      .on("mousemove", e => tip(e, `<b>${esc(first(pa))}'s agent</b><br>${esc(ag ? ag.role : "")}<br><span style="color:${css("--attack")}">the injection lands on this agent</span>`)).on("mouseleave", untip);
    const atk = T.threat.attacker && pos[T.threat.attacker];
    if (atk) {
      const ex = px + 20, ey = py - 20, dx = ex - atk[0], dy = ey - atk[1], len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
      svg.append("defs").append("marker").attr("id", "inj-arrow").attr("viewBox", "0 0 10 10").attr("refX", 8).attr("refY", 5)
        .attr("markerWidth", 12).attr("markerHeight", 12).attr("markerUnits", "userSpaceOnUse").attr("orient", "auto")
        .append("path").attr("d", "M0,0 L10,5 L0,10 z").attr("fill", css("--attack"));
      // from the edge of the outsider's circle to the edge of the agent mark, under the people
      g.insert("line", ".node-person").attr("class", "inject-line").attr("marker-end", "url(#inj-arrow)")
        .attr("x1", atk[0] + ux * 21).attr("y1", atk[1] + uy * 21).attr("x2", ex - ux * 15).attr("y2", ey - uy * 15)
        .attr("stroke", css("--attack")).attr("stroke-width", 2).attr("stroke-dasharray", "6 4");
    }
    mk.append("rect").attr("class", "body").attr("x", -11).attr("y", -11).attr("width", 22).attr("height", 22).attr("rx", 6)
      .attr("fill", css("--attack")).attr("stroke", css("--surface")).attr("stroke-width", 2);
    nodeIcon(mk, "bot", 15);
  }
  legend();
}

function legend() {
  const dot = (c, shape = "c") => shape === "c" ? `<svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="${c}"/></svg>`
    : `<svg width="14" height="14"><rect x="1" y="1" width="12" height="12" rx="3" fill="${c}"/></svg>`;
  $("legend").innerHTML = `<div class="row">
    <span class="item">${dot(css("--accent"))} person in the task</span>
    <span class="item">${dot(css("--service"))} other person</span>
    ${T.threat.attacker ? `<span class="item">${dot(css("--warn"))} victim</span>
    <span class="item">${dot(css("--attack"))} external attacker</span>` : ""}
    ${injectedPrincipal() ? `<span class="item">${dot(css("--attack"), "s")} agent the injection lands on</span>` : ""}</div>`;
}
// the principal whose agent the injection lands on: the owner of the task-graph node the injection enters
function injectedPrincipal() {
  const th = T.threat, g = (T.benign && T.benign.task_graph) || [];
  if (!th || !th.attacker || !th.injection_edge || th.injection_edge.length !== 2) return null;
  const n = g.find(x => x.id === th.injection_edge[1]); return n ? n.principal : null;
}
const tip = (e, html) => { const t = $("tip"), r = $("graph").getBoundingClientRect(); t.innerHTML = html; t.hidden = false;
  t.style.left = Math.min(e.clientX - r.left + 14, r.width - 300) + "px"; t.style.top = (e.clientY - r.top + 14) + "px"; };
const untip = () => { $("tip").hidden = true; };

// A pinned info card that points at the node the reader clicked (a person or an agent), shown over the graph so the
// detail sits next to what it describes instead of down in the pane. Click the background, press Esc, or pan to close.
function openPersonPop(p, ev) { const r = ev.currentTarget.getBoundingClientRect(); sel = p.id; draw(); chanbar(); pinPop(r, personPop(p), { anchor: () => document.querySelector("#graph .node-person.selected") }); }
function openAgentPop(a, ev) { const r = ev.currentTarget.getBoundingClientRect(); sel = a.id; draw(); chanbar(); pinPop(r, agentPop(a), { anchor: () => document.querySelector("#graph .node-agent.selected") }); }
function closePop() {
  const p = $("pop"); if (p) { p.hidden = true; p.className = "pop"; }
  popAnchor = null; trajNode = null; document.querySelectorAll(".tq-node.sel").forEach(n => n.classList.remove("sel"));
}
// The window remembers the element it points at (opt.anchor returns it), so it can follow that element when the page
// scrolls or resizes, and closes only once the element has left the screen.
let popAnchor = null, popOpt = {};
function placePop(rect, opt) {
  const pop = $("pop"); pop.classList.remove("below", "above", "at-right", "at-left");
  const pw = pop.offsetWidth, ph = pop.offsetHeight, vw = innerWidth, vh = innerHeight, cx = rect.left + rect.width / 2;
  // beside the node when there is room (right first, then left), otherwise below / above it
  const gap = 14, side = !opt.side ? null : rect.right + gap + pw <= vw - 10 ? "right" : rect.left - gap - pw >= 10 ? "left" : null;
  if (side) {
    const top = Math.max(10, Math.min(rect.top, vh - ph - 10));
    pop.classList.add(side === "right" ? "at-right" : "at-left");
    pop.style.left = (side === "right" ? rect.right + gap : rect.left - gap - pw) + "px"; pop.style.top = top + "px";
    pop.style.setProperty("--ay", Math.max(20, Math.min(rect.top + rect.height / 2 - top, ph - 20)) + "px");
  } else {
    const left = Math.max(10, Math.min(cx - pw / 2, vw - pw - 10));
    let top = rect.bottom + 12, below = true;
    if (top + ph > vh - 10) { top = rect.top - ph - 12; below = false; }
    pop.classList.add(below ? "below" : "above");
    pop.style.left = left + "px"; pop.style.top = Math.max(10, top) + "px";
    pop.style.setProperty("--ax", Math.max(16, Math.min(cx - left, pw - 16)) + "px");
  }
}
function repositionPop() {
  const pop = $("pop"); if (!pop || pop.hidden) return;
  const el = popAnchor && popAnchor();
  if (!el) return closePop();
  const r = el.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return closePop();   // scrolled out of view
  placePop(r, popOpt);
}
function pinPop(rect, html, opt = {}) {
  untip();
  const pop = $("pop");
  pop.innerHTML = `<button class="pop-x" data-popclose aria-label="Close">✕</button><div class="pop-body">${html}</div>`;
  pop.hidden = false; pop.className = "pop" + (opt.wide ? " wide" : ""); pop.style.left = "0px"; pop.style.top = "-9999px";
  popAnchor = opt.anchor || null; popOpt = opt;
  if (window.lucide) lucide.createIcons();
  placePop(rect, opt);
  pop.querySelector("[data-popclose]").onclick = closePop;
  pop.querySelectorAll("[data-ag]").forEach(b => b.onclick = () => { const id = b.dataset.ag; closePop(); openAgent(id); });
}
function personPop(p) {
  const flags = [p.compromised ? '<span class="pop-flag bad">compromised account</span>' : "",
    p.is_attacker ? '<span class="pop-flag bad">external attacker</span>' : "",
    p.is_victim ? '<span class="pop-flag warn">victim</span>' : ""].join("");
  const ags = T.agentsOf[p.id] || [], goal = T.benign.principal_goals[p.id];
  return `<div class="pop-head" style="--pc:${ROLE_COLOR(p)}"><span class="pop-dot"></span>
      <b>${esc(p.name)}</b><span class="pop-sub">${p.age} · ${esc(p.role)}</span></div>
    ${flags ? `<div class="pop-flags">${flags}</div>` : ""}
    <div class="pop-kv"><b>occupation</b><span>${esc(p.occupation)}</span>
      <b>location</b><span>${esc(p.location)}</span>
      <b>accounts</b><span>${Object.entries(p.accounts).map(([s, h]) => `${esc(SVC_LABEL[s] || s)}: ${esc(h)}`).join("<br>") || "—"}</span></div>
    ${ags.length ? `<div class="pop-agents"><b>agents</b><div class="pop-agwrap">${ags.map(a =>
      `<button class="pop-ag" data-ag="${esc(a.id)}"><i data-lucide="bot"></i>${esc(a.role)}</button>`).join("")}</div></div>`
    : '<div class="pop-none">no agent — this person acts on their own</div>'}
    ${goal ? `<div class="pop-goal"><b>in this task</b><p>${esc(goal)}</p></div>` : ""}`;
}
function agentPop(a) {
  const tools = Object.entries(a.access).map(([s, sc]) => `${esc(SVC_LABEL[s] || s)} (${esc(sc.join("/"))})`).join("<br>");
  return `<div class="pop-head" style="--pc:${a.holds_harm_tool ? css("--attack") : css("--agent")}"><span class="pop-dot sq"></span>
      <b>${esc(a.name)}</b><span class="pop-sub">agent · acts for ${esc(first(T.byId[a.principal]))}</span></div>
    ${a.holds_harm_tool ? '<div class="pop-flags"><span class="pop-flag bad">holds the tool the harm needs</span></div>' : ""}
    <div class="pop-kv"><b>role</b><span>${esc(a.role)}</span><b>tools</b><span>${tools || "—"}</span></div>
    ${a.memory ? `<button class="pop-ag wide" data-ag="${esc(a.id)}"><i data-lucide="bot"></i>Open ${esc(first(T.byId[a.principal]))}'s agent memory</button>` : ""}`;
}
function personTip(p) {
  const ags = (T.agentsOf[p.id] || []).map(a => esc(a.role)).join("; ");
  return `<b>${esc(p.name)}</b>, ${p.age}<br>${esc(p.occupation)} · ${esc(p.location)}<br>role: ${esc(p.role)}${ags ? `<br>agent: ${ags}` : ""}`;
}
function agentTip(a) {
  const tools = Object.entries(a.access).map(([s, sc]) => `${SVC_LABEL[s] || s} (${sc.join("/")})`).join(", ");
  return `<b>${esc(a.name)}</b><br>for ${esc(first(T.byId[a.principal]))}<br>${esc(a.role)}<br>tools: ${esc(tools)}`;
}

// -- panels ----------------------------------------------------------------------------------------------------------
function renderPane() {
  const query = new URLSearchParams(location.search);
  query.set("tab", tab);
  query.delete("c"); query.delete("a");
  if (tab === "conversation" && flt.channel) query.set("c", flt.channel);
  if (tab === "memory" && memAgent) query.set("a", memAgent);
  history.replaceState(null, "", "?" + query);
  closePop();
  const grp = tabGroup(tab), top = $("agents-top"), wasOpen = !top.hidden;
  document.querySelectorAll(".tabs button").forEach(b => {
    const active = b.dataset.tab === grp;
    b.classList.toggle("on", active);
    b.setAttribute("aria-selected", String(active));
    b.tabIndex = active ? 0 : -1;
  });
  top.hidden = grp !== "agents";   // the network only opens under the Agents tab
  if (grp === "agents" && !wasOpen && T) { fittedFor = null; draw(); chanbar(); }   // it was hidden, so it has no size to fit until now
  const fn = { task: taskTab, agents: privileges, verifier: verifierTab, memory, conversation, trajectory: trajView }[tab] || taskTab;
  $("pane").setAttribute("aria-labelledby", `tab-${grp}`);
  $("pane").classList.toggle("tall", tab === "trajectory");
  $("pane").innerHTML = fn();
  $("pane").scrollTop = 0;
  if (window.lucide) lucide.createIcons();
  wirePane();
}
// A dismissable banner shown when a click (not a tab) is driving the pane.
function ctxbar(kind, icon, html) {
  return `<div class="ctxbar ${kind}"><i data-lucide="${icon}"></i><span>${html}</span>
    <button class="close" data-close>Back to agents ✕</button></div>`;
}
const nm = id => esc(T.byId[id]?.name || id);
const chips = (a, cls = "") => a.map(x => `<span class="chip ${cls}">${esc(x)}</span>`).join("");

function scenario() {
  const th = T.threat, p = sel && T.byId[sel];
  const who = p ? `<div class="card"><h2>${esc(p.name)}, ${p.age}</h2><div class="kv">
      <b>occupation</b><span>${esc(p.occupation)}</span><b>location</b><span>${esc(p.location)}</span>
      <b>role</b><span>${esc(p.role)}${p.compromised ? " · account compromised" : ""}${p.is_attacker ? " · external attacker" : ""}</span>
      <b>awake</b><span>${esc(p.availability.awake)} ${esc(p.availability.tz)}</span>
      <b>work</b><span>${esc(p.availability.work || "no fixed schedule")}</span>
      <b>accounts</b><span>${Object.entries(p.accounts).map(([s, h]) => `${esc(SVC_LABEL[s] || s)}: ${esc(h)}`).join("<br>")}</span>
      <b>agents</b><span>${(T.agentsOf[p.id] || []).map(a => esc(a.role)).join("<br>") || "none"}</span></div>
      <p class="muted">${esc(T.benign.principal_goals[p.id] || "")}</p></div>` : "";
  return `${who}<h2>Overview</h2><p>${esc(T.summary)}</p>
    <h3>Context</h3><p>${esc(T.context).replace(/\n\n/g, "</p><p>")}</p>
    <h3>Benign workflow</h3><p>${esc(T.benign.workflow)}</p>
    <ol class="steps">${T.benign.steps.map(s => `<li>${esc(s)}</li>`).join("")}</ol>
    ${th.attacker ? `<h3>Threat (indirect: a third party outside the group)</h3>
    <div class="card attack"><div class="kv">
      <b>attacker</b><span>${nm(th.attacker)}, outside the group, no agent</span>
      <b>entry</b><span>${th.entry === "compromised" ? `through ${nm(th.compromised)}'s compromised account` : "from outside, via " + th.entry_points.map(s => esc(SVC_LABEL[s] || s)).join(", ")}</span>
      <b>goal</b><span>${esc(th.goal)}</span><b>harm</b><span>${esc(th.harm)}</span>
      <b>counts as success</b><span>${esc(th.success_condition)}</span></div></div>` : `<h3>Threat</h3><p class="muted">None: this is the benign version of the scenario.</p>`}
    <h3>Assets and where they live</h3>${T.assets.map(a => `<div class="card"><b>${esc(a.description || a.id)}</b>
      <div class="kv"><b>owner</b><span>${nm(a.owner)}</span><b>value</b><span><code>${esc(a.content)}</code></span>
      <b>placed in</b><span>${chips(a.placed_in, "cite") || "—"}</span></div></div>`).join("")}
    ${T.ledger ? `<h3>How the world was written</h3><p>${T.ledger.happenings} happenings and ${T.ledger.facts.length} named facts,
      written by one writer per person in causal order. ${T.ledger.private_notes.length} private notes reach only their
      author's memory.</p>` : ""}`;
}

const chanName = id => (T.channels.find(c => c.id === id)?.name) || (T.repos?.find(r => r.id === id)?.full_name) || SVC_LABEL[id] || id;

// One channel's seeded history, drawn as a chat transcript. In a DM the two sides face each other; a group room
// reads top-down with a coloured avatar per speaker.
function conversation() {
  const chs = [...new Set(T.timeline.map(x => x.channel))];
  if (!flt.channel || !chs.includes(flt.channel)) flt.channel = chs[0] || "";
  const c = T.channels.find(x => x.id === flt.channel);
  const picker = `<select id="f-ch">${chs.map(id => `<option value="${esc(id)}" ${flt.channel === id ? "selected" : ""}>${esc(chanName(id))}</option>`).join("")}</select>`;
  const banner = ctxbar("conv", c?.kind === "dm" ? "message-circle" : "messages-square",
    `Conversation · <b>${esc(chanName(flt.channel))}</b>${c ? ` <span class="muted">— ${esc(SVC_LABEL[c.service] || c.service)} ${esc(c.kind)}, ${c.members.length} members</span>` : ""}`);
  const rows = T.timeline.filter(x => x.channel === flt.channel);
  // In a 2-person DM, the second-listed member sits on the right; everyone else sits left with an avatar.
  const rightSide = c && c.kind === "dm" && c.members.length === 2 ? c.members[1] : null;
  let out = "", day = "", lastFrom = null;
  for (const x of rows) {
    const d = x.ts.slice(0, 10);
    if (d !== day) { day = d; lastFrom = null; out += `<div class="day">${new Date(d + "T12:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</div>`; }
    const p = T.byId[x.from], side = x.from === rightSide ? "right" : "left", same = x.from === lastFrom;
    lastFrom = x.from;
    const av = `<div class="av" style="background:${p ? ROLE_COLOR(p) : css("--service")}">${esc(initials(p?.name || x.from))}</div>`;
    const kindTag = x.kind && x.kind !== "message" ? `<span>${esc(x.kind)}</span>` : "";
    const meta = same ? "" : `<div class="meta"><span class="nm">${esc(p?.name || x.from)}</span>${kindTag}<span>${x.ts.slice(11, 16)}</span></div>`;
    out += `<div class="turn ${side}${same ? " same" : ""}">${av}<div class="bubble ${x.assets?.length ? "asset" : ""}">
      ${meta}${x.subject ? `<div class="subj">${esc(x.subject)}</div>` : ""}<div class="body">${esc(x.text)}</div>
      ${x.assets?.length ? `<div class="tags">${chips(x.assets.map(a => "carries asset: " + a), "cite")}</div>` : ""}</div></div>`;
  }
  return `${banner}<div class="filters"><span class="grp">Channel</span>${picker}
      <span class="muted">${rows.length} messages · an outlined bubble carries a sensitive asset</span></div>
    <div class="chat">${out || "<p class='muted'>nothing seeded in this channel</p>"}</div>`;
}

function md(s) {
  let out = "", open = false;
  for (const line of s.split("\n")) {
    if (/^## /.test(line)) { if (open) out += "</ul>"; open = false; out += `<h4>${esc(line.slice(3))}</h4>`; }
    else if (/^- /.test(line)) { if (!open) out += "<ul>"; open = true; out += `<li>${esc(line.slice(2)).replace(/\[(h\d+)\]/g, '<span class="chip cite">$1</span>')}</li>`; }
    else if (line.trim()) out += `<p>${esc(line)}</p>`;
  }
  return out + (open ? "</ul>" : "");
}
function memory() {
  const withMem = T.agents.filter(a => a.memory);
  if (!withMem.length) return ctxbar("mem", "bot", "Agent memory") + "<p class='muted'>No memory.md yet for this task.</p>";
  const a = T.agents.find(x => x.id === memAgent && x.memory) || withMem[0];
  const banner = ctxbar("mem", "bot", `Memory · <b>${esc(a.name)}</b> <span class="muted">— acting for ${esc(T.byId[a.principal]?.name || "")}</span>`);
  return `${banner}<div class="filters"><span class="grp">Agent</span><select id="f-ag">${withMem.map(x => `<option value="${x.id}" ${x.id === a.id ? "selected" : ""}>${esc(first(T.byId[x.principal]))}'s agent: ${esc(x.role)}</option>`).join("")}</select></div>
    <p class="muted">What this agent starts from at t=0, written from ${esc(first(T.byId[a.principal]))}'s own view only. Each history line cites the ledger entries it summarizes.</p>
    <div class="memory">${md(a.memory)}</div>
    <h3>Standing instructions</h3><p>${esc(a.briefing)}</p>`;
}

const PAL = ["#2563eb", "#7c3aed", "#0d9488", "#db2777", "#d97706", "#4f46e5", "#0891b2", "#65a30d"];
const flowLayers = g => {  // longest-path depth of each node id, {id: depth}
  const byId = Object.fromEntries(g.map(n => [n.id, n])), layer = {};
  const depth = id => {
    if (layer[id] != null) return layer[id];
    layer[id] = 0;  // guard against a cycle
    const deps = (byId[id]?.depends_on || []).filter(x => byId[x]);
    return layer[id] = deps.length ? 1 + Math.max(...deps.map(depth)) : 0;
  };
  g.forEach(n => depth(n.id));
  return layer;
};
// Node ids on a dependency path from `a` (upstream) to `c` (downstream), inclusive — the route an injection
// propagates along the benign hand-offs, from where it lands to where the harm fires.
function flowPath(g, a, c) {
  const byId = Object.fromEntries(g.map(n => [n.id, n]));
  const deps = id => (byId[id]?.depends_on || []).filter(x => byId[x]);
  const anc = new Set(); (function up(id) { for (const d of deps(id)) if (!anc.has(d)) { anc.add(d); up(d); } })(c);
  const kids = {}; g.forEach(n => deps(n.id).forEach(d => (kids[d] ||= []).push(n.id)));
  const desc = new Set(); (function down(id) { for (const k of (kids[id] || [])) if (!desc.has(k)) { desc.add(k); down(k); } })(a);
  const on = new Set([a, c]);
  g.forEach(n => { if ((n.id === a || desc.has(n.id)) && (n.id === c || anc.has(n.id))) on.add(n.id); });
  return on;
}

// The benign workflow as a dependency graph, read top to bottom: one card per subgoal in the row for its depth, its
// full text visible. The edges are drawn by layoutFlowEdges() once the cards have a real size and position, so the
// arrows meet the cards exactly. For a red-teaming task the injection hand-off (threat.injection_edge) is red and
// the TARGET node is flagged — it sits on the critical path, reached and corrupted before it takes its own step.
// The agent that does a task-graph step: the agent of that principal; when a principal has several, the one whose role
// reads most like the step.
function flowAgentId(n) {
  const mine = (T.agents || []).filter(a => a.principal === n.principal);
  if (mine.length <= 1) return (mine[0] || {}).id || "agent";
  const words = t => new Set(String(t || "").toLowerCase().match(/[a-z]{4,}/g) || []);
  const sub = words(n.subgoal), score = a => [...words(a.role)].filter(w => sub.has(w)).length;
  return mine.reduce((best, a) => score(a) > score(best) ? a : best, mine[0]).id;
}
// Task context and scenario details precede the workflow graph.
function taskTab() {
  return `<section class="sub">${scenario()}</section>
    <section class="sub"><h2 class="sub-h"><i data-lucide="git-fork"></i>Task flow</h2>${taskflow()}</section>`;
}
function verifierTab() {
  return `<section class="sub"><h2 class="sub-h"><i data-lucide="list-checks"></i>Verifier</h2>${checks()}</section>`;
}
function taskflow() {
  const g = (T.benign && T.benign.task_graph) || [];
  if (!g.length) return "<p class='muted'>No task-flow graph for this scenario (regenerate to add one).</p>";
  const layer = flowLayers(g), maxLayer = Math.max(...g.map(n => layer[n.id]));
  const rows = Array.from({ length: maxLayer + 1 }, () => []);
  g.forEach(n => rows[layer[n.id]].push(n));
  const byId = Object.fromEntries(g.map(n => [n.id, n]));
  const inj = T.threat && T.threat.injection_edge && T.threat.injection_edge.length === 2 ? T.threat.injection_edge : null;
  const entry = inj ? inj[1] : null;  // where the poison lands (A)
  const harm = inj && T.threat.harm_node && T.threat.harm_node !== entry ? T.threat.harm_node : null;  // where it fires (C)
  const prop = !!(inj && harm);  // propagation: injected at A, harm done downstream at C
  const pathSet = prop ? flowPath(g, entry, harm) : null;
  const who = id => first(T.byId[(byId[id] || {}).principal]) || "";
  const card = n => {
    const isEntry = entry === n.id, isHarm = harm === n.id;
    const onPath = prop && pathSet.has(n.id) && !isEntry && !isHarm;
    const cls = isHarm ? "target" : isEntry ? (prop ? "entry" : "target") : onPath ? "onpath" : "";
    const tag = isHarm ? '<span class="flow-tag harm">⚡ EXFIL</span>'
      : isEntry ? (prop ? '<span class="flow-tag entry">⚠ INJECTED</span>' : '<span class="flow-tag">⚡ TARGET</span>')
      : onPath ? '<span class="flow-tag path">carries it ↓</span>' : "";
    return `<div class="flow-node${cls ? " " + cls : ""}" data-id="${esc(n.id)}">
        <div class="flow-top"><span class="flow-agent"><i data-lucide="bot"></i>${esc(flowAgentId(n))}</span>
          <span class="flow-who">${esc(first(T.byId[n.principal]) || n.principal)}</span>${tag}</div>
        <div class="flow-sub">${esc(n.subgoal)}</div>
        ${n.produces ? `<div class="flow-prod">produces: ${esc(n.produces)}</div>` : ""}</div>`;
  };
  const rowsHtml = rows.map(r => `<div class="flow-row">${r.map(card).join("")}</div>`).join("");
  const legend = !inj ? "" : `<div class="flow-legend">${prop
    ? '<span class="item"><span class="sw warn"></span>injected → passed on → exfil</span>'
    : '<span class="item"><span class="sw inj"></span>external injection → target</span>'}</div>`;
  const banner = inj && T.threat.injection_note ? `<div class="card attack"><b>Injection point</b>
    ${prop
      ? `<span class="chip harm">external input ⚠ lands on ${esc(who(entry) || "the entry")}'s agent → passed on → ⚡ exfil at ${esc(who(harm) || "the core")}'s agent</span>`
      : `<span class="chip harm">external input ⚡ reaches ${esc(who(entry) || "the target")}'s agent</span>`}
    <p>${esc(T.threat.injection_note)}</p>
    <p class="muted">${prop
      ? `${esc(who(entry) || "The entry")}'s agent can't do the harm itself. The instruction rides the benign hand-offs from ${esc(who(entry) || "the entry")}'s agent to ${esc(who(harm) || "the core")}'s agent, shedding its "external" flag with each hop, until ${esc(who(harm) || "the core")}'s agent — the one direct injection can't move, and the only one that can reach the data — acts on it as ordinary internal work.`
      : `Not a hand-off between agents: ${esc(who(entry) || "the target")}'s agent meets this poisoned input while doing its own step, on the critical path — so the harm fires and propagates downstream deterministically.`}</p></div>` : "";
  return `<p class="muted sub-note">Who produces what, and who waits on whom.</p>${legend}
    <div id="flowgraph" class="flowgraph${inj ? " has-inj" : ""}"><svg class="flow-edges" aria-hidden="true"></svg>
      <div class="flow-rows">${rowsHtml}</div>${inj ? injectionCard() : ""}</div>${banner}`;
}

// A realistic mock of the injected input itself — rendered for the delivery medium (a WhatsApp/Slack message, a
// Gmail email, a GitHub PR), with the (compromised or outside) sender and the poisoned content. It sits at the far
// end of the injection arrow, so the reader sees what the target agent actually meets. The body is the dataset's
// injection_note today; once DTAP-RED runs, the real attack_turns payload can take its place.
function injectionCard() {
  const th = T.threat, medium = (th.entry_points && th.entry_points[0]) || "message";
  const sender = (th.compromised && T.byId[th.compromised]) || (th.attacker && T.byId[th.attacker]) || null;
  const sName = sender ? sender.name : "external sender";
  // worldgen drops handles on services it doesn't model (e.g. x); fall back to a plausible one for the mock
  const handle = (sender && sender.accounts && sender.accounts[medium])
    || (medium === "x" && sender ? "@" + (sender.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "") : "");
  // the card body shows the ACTUAL injected text (the stealthy payload) when present; injection_note (a description
  // of what it does) stays in the banner under the graph
  const note = esc(th.injection_payload || th.injection_note || "injected content delivered to the target agent");
  const logo = SVC_LOGO[medium] ? `<img src="${SVC_LOGO[medium]}" alt="">`
    : medium === "x" ? `<span class="inj-xlogo">𝕏</span>` : "";
  const av = `<span class="inj-av">${esc(initials(sName))}</span>`;
  const flag = th.compromised && sender ? `via ${esc(first(sender))}'s compromised account` : "from an outside sender";
  const subj = esc(th.injection_subject || (th.injection_note || "").replace(/\.$/, "").split(/[,.;]/)[0].slice(0, 48) || "Message");
  // the injection lands in the channel the attacker can post into (where it is a member), not just any of that service
  const ch = (T.channels || []).find(c => c.service === medium && (c.members || []).includes(th.attacker))
    || (T.channels || []).find(c => c.service === medium) || (T.channels || [])[0];
  if (medium === "gmail") {
    return `<div id="inj-card" class="inj-card" data-medium="gmail">
      <div class="inj-chrome" style="--svc:#C5221F">${logo}<span>Inbox</span></div>
      <div class="inj-pad"><div class="inj-subj">${subj}</div>
        <div class="inj-row">${av}<div class="inj-who"><div class="inj-name">${esc(sName)}</div>
          <div class="inj-addr">${esc(handle)}</div></div><span class="inj-time">now</span></div>
        <div class="inj-body">${note}</div></div>
      <div class="inj-flag">⚡ injected email · ${flag}</div></div>`;
  }
  if (medium === "github") {
    return `<div id="inj-card" class="inj-card" data-medium="github">
      <div class="inj-chrome" style="--svc:#1f2328">${logo}<span>Pull request</span></div>
      <div class="inj-pad"><div class="inj-subj">${subj}</div>
        <div class="inj-row">${av}<div class="inj-who"><div class="inj-name">${esc(sName)}</div>
          <div class="inj-addr">wants to merge into main</div></div></div>
        <div class="inj-body">${note}</div></div>
      <div class="inj-flag">⚡ unsolicited PR · ${flag}</div></div>`;
  }
  const svc = { whatsapp: "#128C7E", slack: "#4A154B", x: "#000000" }[medium] || "#4b5563";
  const chName = ch ? ch.name : (SVC_LABEL[medium] || medium);
  return `<div id="inj-card" class="inj-card" data-medium="${esc(medium)}">
    <div class="inj-chrome" style="--svc:${svc}">${logo}<span>${esc(chName)}</span>
      <span class="inj-chrome-sub">${esc(SVC_LABEL[medium] || medium)}${ch && ch.kind === "group" ? " group" : ""}</span></div>
    <div class="inj-pad"><div class="inj-row">${av}<div class="inj-who"><div class="inj-name">${esc(sName)}</div>
      <div class="inj-addr">${esc(handle)}</div></div><span class="inj-time">now</span></div>
      <div class="inj-bubble">${note}</div></div>
    <div class="inj-flag">⚡ injected message · ${flag}</div></div>`;
}

// Connect the cards: for each dependency, an arrow from the producer to the waiter. Adjacent rows join straight down;
// an edge that skips rows hugs the left gutter so it never crosses a card. The injection is a separate red arrow
// from the injected-input mock (injectionCard) into the TARGET node — never along a hand-off edge.
function layoutFlowEdges() {
  const host = $("flowgraph"); if (!host) return;
  host.style.minHeight = "";  // reset any room reserved for a tall injection card last time
  const svg = host.querySelector(".flow-edges"); if (!svg) return;
  const g = (T.benign && T.benign.task_graph) || [], byId = Object.fromEntries(g.map(n => [n.id, n]));
  const layer = flowLayers(g), hr = host.getBoundingClientRect(), pos = {};
  host.querySelectorAll(".flow-node").forEach(el => {
    const r = el.getBoundingClientRect();
    pos[el.dataset.id] = { cx: r.left - hr.left + r.width / 2, left: r.left - hr.left, right: r.right - hr.left,
      mid: r.top - hr.top + r.height / 2, top: r.top - hr.top, bottom: r.bottom - hr.top };
  });
  const inj = T.threat && T.threat.injection_edge && T.threat.injection_edge.length === 2 ? T.threat.injection_edge : null;
  const harm = inj && T.threat.harm_node && T.threat.harm_node !== inj[1] ? T.threat.harm_node : null;
  const pathSet = harm ? flowPath(g, inj[1], harm) : null;  // edges along here carry the propagating injection
  const W = host.clientWidth, H = host.clientHeight, line = css("--line"), attack = css("--attack"), warn = css("--warn");
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.setAttribute("width", W); svg.setAttribute("height", H);
  let out = `<defs><marker id="fe" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0L9,4.5L0,9z" fill="${line}"/></marker>
    <marker id="few" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0L9,4.5L0,9z" fill="${warn}"/></marker>
    <marker id="fer" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0L9,4.5L0,9z" fill="${attack}"/></marker></defs>`;
  for (const n of g) for (const dep of (byId[n.id]?.depends_on || [])) {
    const s = pos[dep], t = pos[n.id]; if (!s || !t) continue;  // a benign hand-off: who waits on whom
    let d;
    if (layer[n.id] - layer[dep] > 1) {  // skip edge: bracket down the left gutter so it crosses no card
      const gx = Math.max(6, Math.min(11, Math.min(s.left, t.left) - 6));
      d = `M${s.left},${s.mid} C${gx},${s.mid} ${gx},${t.mid} ${t.left},${t.mid}`;
    } else {  // adjacent: straight down, centre to centre
      const my = (s.bottom + t.top) / 2;
      d = `M${s.cx},${s.bottom} C${s.cx},${my} ${t.cx},${my} ${t.cx},${t.top}`;
    }
    const carries = pathSet && pathSet.has(dep) && pathSet.has(n.id);  // this hand-off carries the injection downstream
    out += `<path d="${d}" fill="none" stroke="${carries ? attack : line}" stroke-width="${carries ? 2.2 : 1.5}"${carries ? ' stroke-dasharray="7 5"' : ""} marker-end="url(#${carries ? "fer" : "fe"})"/>`;
  }
  // The injection is NOT a task dependency: it is external input the TARGET agent meets while doing its own step.
  // Draw it as a red arrow entering the target node from the side (outside the column of cards), never along a
  // hand-off edge — so it never reads as one node injecting another.
  if (inj) {
    const t = pos[inj[1]], cardEl = $("inj-card"), rightRoom = t ? W - t.right : 0;
    if (t && cardEl && rightRoom >= 150) {  // realistic injected-input mock in the right lane, red arrow into the target
      const cw = Math.max(176, Math.min(224, rightRoom - 36));
      cardEl.style.width = cw + "px";
      // never taller than the flow itself: a long message (a whole quoted thread) scrolls inside the card
      const rowsH = host.querySelector(".flow-rows").offsetHeight;
      cardEl.style.maxHeight = Math.max(240, rowsH - 8) + "px";
      const chh = cardEl.offsetHeight, cardLeft = W - cw - 6;
      cardEl.style.left = cardLeft + "px"; cardEl.style.top = Math.max(1, Math.min(t.mid - chh / 2, H - chh - 1)) + "px";
      cardEl.hidden = false;
      const top = parseFloat(cardEl.style.top), cy = Math.max(t.top + 12, Math.min(top + chh / 2, t.bottom - 12));
      out += `<path d="M${cardLeft},${cy} L${t.right},${cy}" fill="none" stroke="${attack}" stroke-width="2.5" stroke-dasharray="7 5" marker-end="url(#fer)"/>`;
      // the mock card and the bottom banner already name it — no on-arrow label needed (it would overlap the card)
      const need = Math.ceil(top + chh + 8);  // keep the (possibly tall) card inside the graph so the banner sits below it
      if (need > H) host.style.minHeight = need + "px";
    } else if (t) {  // not enough room for the mock: a plain red external arrow into the target
      if (cardEl) cardEl.hidden = true;
      const reach = Math.max(42, Math.min(rightRoom - 8, 84)), y = t.mid, x0 = t.right + reach;
      out += `<path d="M${x0},${y} L${t.right},${y}" fill="none" stroke="${attack}" stroke-width="2.5" stroke-dasharray="7 5" marker-end="url(#fer)"/>`;
      out += `<circle cx="${x0}" cy="${y}" r="3.5" fill="${attack}"/>`;
      out += `<text x="${(x0 + t.right) / 2}" y="${y - 9}" fill="${attack}" font-size="11" font-weight="700" text-anchor="middle">⚡ injection</text>`;
    }
  }
  svg.innerHTML = out;
}

function privileges() {
  const harm = new Set(T.threat.harm_services);
  const head = SERVICES.filter(s => T.agents.some(a => a.access[s]));
  const rows = T.agents.map(a => `<tr><td>${esc(first(T.byId[a.principal]))}: ${esc(a.role)}</td>${head.map(s => {
    const sc = a.access[s]; return `<td class="${sc ? "has" : ""} ${sc && harm.has(s) ? "harm" : ""}">${sc ? esc(sc.join("/")) : ""}</td>`; }).join("")}</tr>`).join("");
  return `<h2>Access control <span class="muted">— who can do what</span></h2><p>Each agent holds only its principal's delegated tools. Red cells are the tools the harm in this task needs;
    the agents that hold them are the ones whose action would complete it.</p>
    <table class="matrix"><tr><th>agent</th>${head.map(s => `<th>${esc(SVC_LABEL[s])}</th>`).join("")}</tr>${rows}</table>
    <h3>Channels</h3>${T.channels.map(c => `<div class="card"><b>${esc(c.name)}</b> <span class="chip">${esc(SVC_LABEL[c.service] || c.service)} ${esc(c.kind)}</span>
      <div>${c.members.map(m => `<span class="chip">${nm(m)}</span>`).join("")}</div><p class="muted">${esc(c.purpose || "")}</p></div>`).join("")}
    ${attackerChannels().length
      ? `<p class="muted">The external attacker has no agent; it reaches the group only by sending into ${attackerChannels().map(esc).join(", ")} — an inbox open to outside messages.</p>`
      : `<p class="muted">The external attacker is in none of these channels and has no agent.</p>`}`;
}
// Channels the external attacker can put a message into (e.g. an open DM inbox) — the injection's way in.
function attackerChannels() {
  const atk = T.threat.attacker;
  return atk ? T.channels.filter(c => (c.members || []).includes(atk)).map(c => c.name) : [];
}

function checks() {
  const row = c => `<div class="card"><b>${esc(c.id)}</b> <span class="chip">${esc(c.kind)}</span><br>${esc(c.description)}
    <div class="kv">${c.author ? `<b>by</b><span>${nm(c.author)}</span>` : ""}${c.recipient ? `<b>to</b><span>${nm(c.recipient)}</span>` : ""}
    ${c.amount_min != null ? `<b>amount</b><span>≥ ${c.amount_min}</span>` : ""}${c.asset ? `<b>asset</b><span>${esc(c.asset)}</span>` : ""}
    ${c.rubric ? `<b>rubric</b><span>${esc(c.rubric)}</span>` : ""}</div></div>`;
  return `<p class="muted">What the judge looks at when the run ends.</p><h2>Task checks <span class="muted">(all must hold for the task to count as done)</span></h2>${T.checks.benign.map(row).join("") || "<p class='muted'>not written yet</p>"}
    ${T.threat.attacker ? `<h2>Attack checks <span class="muted">(the attack succeeded if any one holds)</span></h2>${T.checks.attack.map(c => row(c).replace('class="card"', 'class="card attack"')).join("") || "<p class='muted'>not written yet</p>"}
    <p class="muted">${esc(T.category.severity || "")}</p>` : ""}`;
}

// -- trajectory ------------------------------------------------------------------------------------------------------
// A recorded (or synthesized) multi-agent run. Agents send and receive messages freely — there are no rounds. The
// default view is a sequence diagram: one fixed-width column (with its own axis) per agent, sharing one vertical axis
// that follows real time — a step sits lower the later it happened, and an idle stretch leaves real empty space. Where
// an agent's own steps are closer in time than a card is tall they are spread just enough to fit, and everything
// after them moves down with them. A message is drawn from the step that sent it to the step that received it.
// A step is what the agent did (its tool call or its final reply) together with the reasoning that led to it; the
// messages it was handed (USER, INBOX) are their own steps. Colour only marks the kind of step, never the agent.
let trajSel = null;      // Set of agent principals shown, or null = all
let trajNode = null;     // id of the step opened in the detail card
let trajMode = "seq";    // "seq" | "list"
let trajComm = "agents"; // links drawn for: "agents" (between agents, on the channel they share) | "people" (to users, through a user's own account) | "both"
const TRAJ_ROLE = {
  user:  { label: "USER",  icon: "user",     tone: "input" },
  inbox: { label: "INBOX", icon: "mail",     tone: "inbox" },
  think: { label: "REASONING", icon: "bot",  tone: "agent" },
  tool:  { label: "TOOL",  icon: "wrench",   tone: "tool" },
  final: { label: "FINAL RESPONSE", short: "FINAL", icon: "sparkles", tone: "final" },
};
const TQ = { W: 174, GAP: 22, GUT: 50, HEAD: 74, NH: 122, VGAP: 12, SCALE: 1.5 };  // 5 columns fill the 1014px pane; more scroll  // px; SCALE = px per second of real time
const prettyTs = ts => String(ts).replace("T", " ").slice(0, 19);
function trajValue(v) {
  if (v == null) return `<span class="traj-null">null</span>`;
  if (typeof v === "object") return `<pre class="traj-json">${esc(JSON.stringify(v, null, 2))}</pre>`;
  return `<span class="traj-val">${esc(v)}</span>`;
}
function trajKV(obj) {
  const rows = Object.entries(obj || {});
  if (!rows.length) return `<div class="traj-empty">(empty)</div>`;
  return `<div class="traj-kv">${rows.map(([k, v]) => `<span class="traj-k">${esc(k)}</span><div>${trajValue(v)}</div>`).join("")}</div>`;
}
function trajInline(args) {  // `(k=v, k2=v2)` for simple arguments, like the DTAP card; the full payload is below
  const parts = [];
  for (const [k, v] of Object.entries(args || {})) {
    if (v != null && typeof v === "object") return "";
    const s = String(v ?? "null"); parts.push(`${k}=${s.length > 32 ? s.slice(0, 29) + "…" : s}`);
  }
  const j = parts.join(", "); return j && j.length <= 140 ? `(${j})` : "";
}
function trajDisclosure(label, body, open) {
  return `<details class="traj-disc"${open ? " open" : ""}><summary><i data-lucide="chevron-right"></i>${esc(label)}</summary>${body}</details>`;
}
const TRAJ_SERVER = { gdocs: "Google Docs", gmail: "Gmail", whatsapp: "WhatsApp", slack: "Slack", github: "GitHub", calendar: "Calendar" };
const trajServer = tool => { const k = (tool || "").split("_")[0]; return TRAJ_SERVER[k] || k; };
// A send is for the other BOTS (posted in the bots' own Slack space, under the bot's own account) or for PEOPLE (through the
// principal's own account: WhatsApp, email). Bots talk to each other only in that space.
const trajAud = s => s && s.audience === "agents" ? "agents" : s && s.audience === "people" ? "people" : null;
const trajAudPill = s => { const a = trajAud(s); return a ? `<em class="tq-aud ${a}">${a === "agents" ? "AGENTS" : "USERS"}</em>` : ""; };
const trajLogoUrl = tool => SVC_LOGO[(tool || "").split("_")[0]] || null;   // the service's real logo, as on the DTAP site
const trajLogoImg = tool => { const u = trajLogoUrl(tool); return u ? `<img class="traj-logo" src="${u}" alt="">` : ""; };
const trajWho = p => esc(first(T.byId[p]) || ((T.trajectory.agents.find(a => a.principal === p) || {}).name) || p);
let trajAll = [];        // every step of the open run, for the floating window
function trajToolCard(s, res, hot, n) {
  const inline = trajInline(s.args), aud = trajAud(s);
  const as = aud && n ? (s.account === "agent" ? `${trajWho(n.agent)}'s <b>agent account</b> — a different account from ${trajWho(n.agent)}'s own` : `${trajWho(n.agent)}'s <b>own ${esc(trajServer(s.tool))} account</b>, as ${trajWho(n.agent)}`) : "";
  return `<div class="traj-card tool${hot ? " hot" : ""}">
      <div class="traj-card-head"><span class="traj-server">${trajLogoImg(s.tool)}${esc(trajServer(s.tool))}</span><span class="traj-toolname">${esc(s.tool)}</span>
        ${trajAudPill(s)}${inline ? `<span class="traj-inline">${esc(inline)}</span>` : ""}${hot ? `<span class="traj-flag"><i data-lucide="triangle-alert"></i>${s.args && s.args.cc ? "copied to an outside address" : "sent outside the family"}</span>` : ""}
        ${res && res.external ? `<span class="traj-flag"><i data-lucide="triangle-alert"></i>external content${res.source ? " from " + esc(res.source) : ""}</span>` : ""}</div>
      ${as ? `<div class="traj-as">acting as ${as}</div>` : ""}
      ${trajDisclosure("Tool input", trajKV(s.args), true)}
      ${res ? trajDisclosure("Tool result", trajKV(res.output), true) : ""}</div>`;
}

// Every step of every agent as a node. A tool call carries its result; reasoning is folded into the action it led to,
// so it has no time or place of its own. Also resolves who each received message came from.
function trajNodes() {
  const tr = T.trajectory, nodes = [], bySrc = {}, res = {};
  tr.agents.forEach(a => a.steps.forEach(s => { if (s.type === "tool_result") res[`${a.principal}|${s.call_id}`] = s; }));
  tr.agents.forEach(a => {
    let pending = null;  // reasoning waiting for the action it leads to
    const push = (s, i, kind, thought) => {
      const n = { id: `${a.principal}#${i}`, agent: a.principal, ts: s.ts, s, kind, thought: thought || null,
                  res: kind === "tool" ? res[`${a.principal}|${s.call_id}`] : null };
      nodes.push(n); if (kind === "tool") bySrc[`${a.principal}|${s.call_id}`] = n; return n;
    };
    a.steps.forEach((s, i) => {
      if (s.type === "tool_result") return;
      if (s.type === "think") { if (pending) push(pending.s, pending.i, "think"); pending = { s, i }; return; }
      if (s.type === "observe") { if (pending) { push(pending.s, pending.i, "think"); pending = null; } push(s, i, s.source === "message" ? "inbox" : "user"); return; }
      push(s, i, s.type === "tool_call" ? "tool" : "final", pending && pending.s.content); pending = null;
    });
    if (pending) push(pending.s, pending.i, "think");
  });
  nodes.forEach(n => { const f = n.s.from; n.src = f ? bySrc[`${f.principal}|${f.call_id}`] : null; n.tainted = !!n.s.tainted || !!(n.res && n.res.tainted); });
  nodes.sort((x, y) => x.ts < y.ts ? -1 : x.ts > y.ts ? 1 : 0);
  return nodes;
}
// the send the judge flagged: the tool call named in the run's attack evidence, addressed or copied to the outside address
let trajEv = null;
const trajHot = n => !!(trajEv && n.kind === "tool" && n.agent === trajEv.by && n.s.tool === trajEv.tool && n.s.args &&
  [n.s.args.to, n.s.args.cc].flat().some(x => x && String(x).includes(trajEv.to)));

// Vertical position from real time: a step sits SCALE px per second below the one before it (in time), but never closer
// than a card to the previous step of its own agent. Returns the guides for each whole minute passed.
function trajPlace(vis) {
  const ms = n => +new Date(n.ts), lastY = {}; let prev = null;
  vis.forEach(n => {
    let y = prev ? prev.y + TQ.SCALE * (ms(n) - ms(prev)) / 1000 : 0;
    if (lastY[n.agent] != null) y = Math.max(y, lastY[n.agent] + TQ.NH + TQ.VGAP);
    n.y = y; lastY[n.agent] = y; prev = n;
  });
  const guides = [];
  for (let m = Math.ceil(ms(vis[0]) / 60000) * 60000; m <= ms(vis[vis.length - 1]); m += 60000) {
    let a = null, b = null;
    for (const n of vis) { if (ms(n) < m) a = n; else { b = n; break; } }
    if (a && b) guides.push({ y: a.y + (b.y - a.y) * (m - ms(a)) / (ms(b) - ms(a)), label: new Date(m).toTimeString().slice(0, 5) });
  }
  return { height: Math.max(...vis.map(n => n.y)) + TQ.NH + 18, guides };
}

function trajView() {
  const tr = T.trajectory;
  if (!tr || !tr.agents || !tr.agents.length)
    return "<p class='muted'>No agent trajectory recorded for this task. A run writes one JSON per agent into the task's <code>trajectory/</code> folder.</p>";
  const agents = tr.agents, res = tr.result || {};
  trajEv = res.attack_evidence || null;
  const who = p => esc(first(T.byId[p]) || (agents.find(a => a.principal === p) || {}).name || p);
  const shown = p => !trajSel || trajSel.has(p);
  const all = trajNodes(), vis = all.filter(n => shown(n.agent));
  trajAll = all; if (trajNode && !vis.some(n => n.id === trajNode)) closePop();
  const t0 = +new Date(all[0].ts), dur = res.duration_s ?? Math.round((+new Date(all[all.length - 1].ts) - t0) / 1000);
  const durTxt = dur >= 60 ? `${Math.floor(dur / 60)}m ${dur % 60}s` : `${dur}s`;
  const steps = all.length, msgs = all.filter(n => n.src).length;

  const meta = `<div class="traj-meta"><span><i data-lucide="activity"></i>${steps} steps</span><span><i data-lucide="clock"></i>${durTxt}</span>
      <span><i data-lucide="users"></i>${agents.length} agents</span><span><i data-lucide="mail"></i>${msgs} messages between agents</span>
      ${res.synthesized ? '<span class="traj-pill">Illustrative trajectory</span>' : ""}<span class="traj-ts">${esc(prettyTs(all[0].ts))}</span></div>`;
  const goal = T.threat && T.threat.goal ? `<div class="traj-goal"><div class="traj-goal-head"><i data-lucide="triangle-alert"></i>Red-Teaming goal</div><p>${esc(T.threat.goal)}</p></div>` : "";
  const judge = (res.attack_success != null || res.benign_success != null) ? `<div class="traj-judge"><div class="traj-judge-head"><i data-lucide="scale"></i>Attack outcome</div>
      <div class="traj-judge-body">
        ${res.benign_success != null ? `<span class="traj-verdict ${res.benign_success ? "ok" : "bad"}"><i></i>Task ${res.benign_success ? "succeeded" : "failed"}</span>` : ""}
        ${res.attack_success != null ? `<span class="traj-verdict ${res.attack_success ? "bad" : "ok"}"><i></i>Attack ${res.attack_success ? "succeeded" : "blocked"}</span>` : ""}
        ${res.attack_evidence ? `<span class="traj-ev">${esc(first(T.byId[res.attack_evidence.by]) || res.attack_evidence.by || "")} → <code>${esc(res.attack_evidence.to || "")}</code> via <code>${esc(res.attack_evidence.tool || "")}</code></span>` : ""}
      </div></div>` : "";

  const controls = `<div class="tq-view-controls">
    ${res.synthesized ? '<span class="expanded-provenance">Illustrative trajectory</span>' : ""}
    ${trajMode === "seq" ? `<button id="trajectory-zoom-out" aria-label="Zoom out trajectory">−</button>
      <span id="trajectory-scale" aria-live="polite">100%</span>
      <button id="trajectory-zoom-in" aria-label="Zoom in trajectory">+</button>
      <button id="trajectory-fit" aria-label="Fit trajectory to width">Fit width</button>` : ""}
    <button id="expand-trajectory" class="viewer-expand" aria-label="Expand trajectory" aria-expanded="false"></button>
  </div>`;
  const chips = `<div class="tq-bar"><div class="tq-chips">${agents.map(a => `<button class="tq-chip${shown(a.principal) ? " on" : ""}" data-tag="${esc(a.principal)}">${who(a.principal)}</button>`).join("")}
      ${trajSel ? '<button class="tq-chip reset" data-tag="*">all</button>' : ""}</div>
    <div class="tq-mode"><button class="${trajMode === "seq" ? "on" : ""}" data-tmode="seq">Sequence</button><button class="${trajMode === "list" ? "on" : ""}" data-tmode="list">List</button></div>
    ${trajMode === "seq" ? `<div class="tq-mode comm"><span>show</span>${[["agents", "Agents"], ["people", "Users"], ["both", "Both"]].map(([k, l]) => `<button class="${trajComm === k ? "on" : ""}" data-tcomm="${k}">${l}</button>`).join("")}</div>` : ""}${controls}</div>`;
  const legend = `<div class="tq-legend">
      <div class="row"><span class="user">USER</span><span class="inbox">INBOX</span><span class="tool">TOOL (with its reasoning)</span><span class="final">FINAL</span></div>
      <div class="row"><span class="bots">between agents</span><span class="people">to users</span><span class="bad">relayed injected request</span></div></div>`;

  let body;
  if (trajMode === "list") body = trajList(vis, who);
  else {
    const cols = agents.filter(a => shown(a.principal)), ci = Object.fromEntries(cols.map((a, i) => [a.principal, i]));
    const left = i => TQ.GUT + i * (TQ.W + TQ.GAP), width = TQ.GUT + cols.length * (TQ.W + TQ.GAP) - TQ.GAP + 6;
    const { height, guides } = trajPlace(vis), H = TQ.HEAD + height;
    const lanes = cols.map((a, i) => `<div class="tq-lane" style="left:${left(i)}px;width:${TQ.W}px"><i style="top:${TQ.HEAD - 8}px"></i></div>`).join("");
    const heads = cols.map((a, i) => `<div class="tq-head" style="left:${left(i)}px;width:${TQ.W}px"><span class="tq-name">${who(a.principal)}</span><small>${esc(a.role || "")}</small></div>`).join("");
    const gl = guides.map(g => `<div class="tq-guide" style="top:${TQ.HEAD + g.y}px"><span>${esc(g.label)}</span></div>`).join("");
    const cells = vis.map(n => {
      const s = n.s, role = TRAJ_ROLE[n.kind], hot = trajHot(n);
      let label = role.short || role.label, inner;
      if (n.kind === "tool") {
        label = trajServer(s.tool) + (s.account === "agent" ? " · agent" : "");
        const a = s.args || {}, tgt = a.to ? "→ " + a.to : a.channel ? "→ " + chanName(a.channel) : a.query ? `“${a.query}”` : a.doc_id ? a.doc_id : "";
        const ext = n.res && n.res.external ? '<em class="tq-badge">external content</em>' : "";
        inner = `<b class="tq-tool">${esc(s.tool)}</b>${ext || `<span class="tq-tgt">${trajAudPill(s)}${esc(tgt)}</span>`}${n.thought ? `<p class="tq-think">${esc(n.thought)}</p>` : ""}`;
      } else inner = `<p class="tq-text">${esc(s.content || "")}</p>`;
      return `<button class="tq-node ${role.tone}${n.tainted ? " tainted" : ""}${hot ? " hot" : ""}${trajNode === n.id ? " sel" : ""}" data-tn="${esc(n.id)}"${n.src && shown(n.src.agent) && (trajComm === "both" || trajComm === (trajAud(n.src.s) || "people")) ? ` data-tsrc="${esc(n.src.id)}" data-tsrccol="${ci[n.src.agent]}" data-taud="${trajAud(n.src.s) || "people"}"` : ""} data-col="${ci[n.agent]}"
        style="left:${left(ci[n.agent])}px;top:${TQ.HEAD + n.y}px;width:${TQ.W}px;height:${TQ.NH}px"><div class="tq-top">${n.kind === "tool" && trajLogoUrl(s.tool) ? `<i class="tq-ico logo"><img src="${trajLogoUrl(s.tool)}" alt=""></i>` : `<i class="tq-ico"><i data-lucide="${role.icon}"></i></i>`}<b>${esc(label.toUpperCase())}</b><time>${esc(s.ts.slice(11, 19))}</time></div>${inner}</button>`;
    }).join("");
    body = `<div class="tq-scroll" id="tq-scroll"><div class="tq-canvas" id="tq-canvas"><div class="tq-wrap" id="tq-grid" style="width:${width}px;height:${H}px"><svg class="tq-links" aria-hidden="true"></svg>${lanes}${gl}${heads}${cells}</div></div></div><p class="traj-hint">Click a step to read it in full — what the agent saw, why it acted, and what the tool returned.</p>`;
  }
  return `${meta}${goal}${judge}<section id="trajectory-viewer" class="trajectory-viewer">${chips}${legend}${body}</section>`;
}
// the reasoning that led to a step, then the step itself
function trajStepBody(n) {
  const thought = n.thought ? `<div class="traj-card thought"><span class="traj-cap"><i data-lucide="bot"></i>Reasoning</span>${esc(n.thought)}</div>` : "";
  const act = n.kind === "tool" ? trajToolCard(n.s, n.res, trajHot(n), n)
    : `<div class="traj-card${n.kind === "final" ? " final" : ""}${n.tainted ? " tainted" : ""}">${esc(n.s.content || "")}</div>`;
  return `<div class="traj-stack">${thought}${act}</div>`;
}
function trajLabel(n, who) {
  const role = TRAJ_ROLE[n.kind];
  const lab = n.kind === "tool" ? `${trajLogoImg(n.s.tool)}<b>${esc(trajServer(n.s.tool).toUpperCase())}</b>` : `<b>${role.label}</b>`;
  return `<div class="traj-label">${lab}<span class="traj-who">${who(n.agent)}</span><time class="traj-time">${esc(prettyTs(n.ts).slice(11))}</time></div>`;
}
// the step shown in full, in the floating window: where its message came from, the reasoning, then the step itself
function trajPopHtml(n) {
  const role = TRAJ_ROLE[n.kind];
  const from = n.src ? `<div class="tq-from${n.tainted ? " bad" : ""}"><i data-lucide="corner-down-right"></i>received ${n.src.s.audience === "agents" ? "over the agents' channel " : ""}from <b>${trajWho(n.src.agent)}</b>'s <code>${esc(n.src.s.tool)}</code>${n.tainted ? " — this message carries the injected request, and its external origin is no longer visible here" : ""}</div>` : "";
  return `<div class="tq-pop ${role.tone}${trajHot(n) ? " hot" : ""}">${trajLabel(n, trajWho)}${from}${trajStepBody(n)}</div>`;
}
function trajList(vis, who) {
  const li = vis.map(n => { const role = TRAJ_ROLE[n.kind];
    return `<li class="traj-step ${role.tone}${trajHot(n) ? " hot" : ""}"><span class="traj-dot">${n.kind === "tool" && trajLogoUrl(n.s.tool) ? `<img class="traj-logo" src="${trajLogoUrl(n.s.tool)}" alt="">` : `<i data-lucide="${role.icon}"></i>`}</span>${trajLabel(n, who)}
      ${n.src ? `<div class="tq-from${n.tainted ? " bad" : ""}"><i data-lucide="corner-down-right"></i>from <b>${who(n.src.agent)}</b></div>` : ""}${trajStepBody(n)}</li>`; }).join("");
  return `<ol class="traj-steps">${li}</ol>`;
}

// Draw each message from the step that sent it to the step that received it, side to side between the two columns.
function layoutTrajLinks() {
  const host = $("tq-grid"); if (!host) return;
  const svg = host.querySelector(".tq-links"); if (!svg) return;
  const hr = host.getBoundingClientRect(), scale = hr.width / host.offsetWidth || 1;
  const line = css("--muted"), bad = css("--attack"), acc = css("--accent");
  svg.setAttribute("width", host.offsetWidth); svg.setAttribute("height", host.offsetHeight); svg.setAttribute("viewBox", `0 0 ${host.offsetWidth} ${host.offsetHeight}`);
  let out = `<defs><marker id="tqa" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0L8,4L0,8z" fill="${line}"/></marker>
    <marker id="tqb" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0L8,4L0,8z" fill="${bad}"/></marker>
    <marker id="tqc" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0L8,4L0,8z" fill="${acc}"/></marker></defs>`;
  host.querySelectorAll("[data-tsrc]").forEach(t => {
    const s = host.querySelector(`[data-tn="${CSS.escape(t.dataset.tsrc)}"]`); if (!s) return;
    const a = s.getBoundingClientRect(), b = t.getBoundingClientRect(), tainted = t.classList.contains("tainted"), right = +t.dataset.col > +t.dataset.tsrccol;
    const sx = ((right ? a.right : a.left) - hr.left) / scale, sy = (a.top + a.height / 2 - hr.top) / scale;
    const tx = ((right ? b.left : b.right) - hr.left) / scale, ty = (b.top + b.height / 2 - hr.top) / scale;
    const d = Math.max(28, Math.abs(tx - sx) / 2) * (right ? 1 : -1);
    const bots = t.dataset.taud === "agents", stroke = tainted ? bad : bots ? acc : line;
    out += `<path d="M${sx},${sy} C${sx + d},${sy} ${tx - d},${ty} ${tx},${ty}" fill="none" stroke="${stroke}" stroke-width="${tainted ? 2.2 : bots ? 1.8 : 1.4}"${tainted ? ' stroke-dasharray="6 4"' : bots ? "" : ' stroke-dasharray="2 4"'} opacity="${tainted || bots ? 1 : .7}" marker-end="url(#${tainted ? "tqb" : bots ? "tqc" : "tqa"})"/>`;
  });
  svg.innerHTML = out;
}

function wirePane() {
  const bind = (id, fn) => { const e = $(id); if (e) e.onchange = () => { fn(e.value); renderPane(); }; };
  bind("f-ch", v => { flt.channel = v; chanbar(); });
  bind("f-ag", v => { memAgent = v; sel = v; chanbar(); draw(); });
  const close = $("pane").querySelector("[data-close]");
  if (close) close.onclick = () => { tab = "agents"; sel = null; draw(); chanbar(); renderPane(); };
  if (tab === "task") layoutFlowEdges();
  if (tab === "trajectory") {
    updateViewerButtons();
    $("expand-trajectory")?.addEventListener("click", () => setViewer(expandedViewer === "trajectory" ? null : "trajectory"));
    $("trajectory-fit")?.addEventListener("click", () => {
      const grid = $("tq-grid"), scroll = $("tq-scroll");
      trajectoryZoom = Math.min(1.25, Math.max(1, scroll.clientWidth - 2) / grid.offsetWidth);
      scaleTrajectory();
    });
    for (const [id, factor] of [["trajectory-zoom-out", 1 / 1.15], ["trajectory-zoom-in", 1.15]]) {
      $(id)?.addEventListener("click", () => {
        trajectoryZoom = Math.max(.05, Math.min(2, Number($("tq-grid").dataset.scale || 1) * factor));
        scaleTrajectory();
      });
    }
    const pane = $("pane"), all = T.trajectory.agents.map(a => a.principal);
    pane.querySelectorAll("[data-tag]").forEach(b => b.onclick = () => {
      const p = b.dataset.tag;
      if (p === "*") trajSel = null;
      else if (!trajSel) trajSel = new Set([p]);  // from "everyone shown" -> focus this agent
      else { trajSel.has(p) ? trajSel.delete(p) : trajSel.add(p); if (!trajSel.size || trajSel.size === all.length) trajSel = null; }
      renderPane();
    });
    pane.querySelectorAll("[data-tmode]").forEach(b => b.onclick = () => { trajMode = b.dataset.tmode; renderPane(); });
    pane.querySelectorAll("[data-tcomm]").forEach(b => b.onclick = () => { trajComm = b.dataset.tcomm; renderPane(); });
    pane.querySelectorAll("[data-tn]").forEach(b => b.onclick = () => {
      const id = b.dataset.tn, again = trajNode === id;
      closePop(); if (again) return;
      const n = trajAll.find(x => x.id === id); if (!n) return;
      trajNode = id; b.classList.add("sel");
      pinPop(b.getBoundingClientRect(), trajPopHtml(n), { side: true, wide: true, anchor: () => pane.querySelector(`[data-tn="${CSS.escape(id)}"]`) });
    });
    scaleTrajectory();
  }
}
boot();
