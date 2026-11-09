/* Topology Explorer: interactive view of a DTAP-MAS world (layer 1) and its agent network (layer 3).
 *
 * Input is the raw JSON the worldgen package reads (worldgen/topology/schema.py, agents.py).
 * Norm resolution and agent-link derivation mirror the Python so the panel shows the same facts.
 */
(() => {
"use strict";

// ---------------------------------------------------------------- constants

const PALETTE = ["#e07a5f", "#3d8b7d", "#f2a541", "#5c80bc", "#b56576",
                 "#81b29a", "#9a8c98", "#6d597a", "#e5989b", "#4a7c59"];
const NO_GROUP = "#a9adb3";
const EDGE_COLORS = { kin: "#c8553d", social: "#2f6690", work: "#3a7d44", service: "#8d8d8d", group: "#7b5ea7", sibling: "#555" };
const KIND_ORDER = ["team", "family", "project", "friend_circle", "club", "class", "neighborhood", "organization", "household"];
const DEFAULT_HULLS = new Set(["family", "friend_circle", "club", "class", "neighborhood", "team", "project"]);
const NORM_CATS = ["schedule", "location", "finance", "health", "credentials", "relationships", "identity_docs",
                   "source_code", "customer_data", "business"];
const KIN = new Set(["parent", "grandparent", "aunt_uncle", "sibling", "cousin", "spouse", "partner", "in_law"]);
const SOCIAL = new Set(["close_friend", "friend", "acquaintance", "housemate", "neighbor", "colleague"]);
const WORK = new Set(["manager", "teammate", "collaborator"]);
const category = t => KIN.has(t) ? "kin" : SOCIAL.has(t) ? "social" : WORK.has(t) ? "work" : "service";
const short = name => (name.split(/\s+/).find(p => !p.endsWith(".")) || name);

// ---------------------------------------------------------------- state

const S = {
  world: null, net: null, layer: "people", tool: "pan",
  model: null,              // derived lookups for the loaded world
  pos: new Map(),           // person id -> {x, y}
  view: null,               // what is drawn now: {nodes, edges, hulls, ghosts}
  selected: null,           // {kind: "node"|"edge"|"group"|"selection", id | ids}
  selection: new Set(),     // ids picked by the box tool
  isolated: null,           // Set of node ids when isolating
  hullOn: new Set(),        // group ids with a visible outline
  transform: d3.zoomIdentity,
};

const $ = id => document.getElementById(id);
const svg = d3.select("#graph");
const root = svg.append("g").attr("class", "viewport");
const gHulls = root.append("g"), gGhosts = root.append("g"), gEdges = root.append("g"),
      gHits = root.append("g"), gEdgeLabels = root.append("g"), gNodes = root.append("g");
const mini = d3.select("#minimap");
const miniG = mini.append("g");
const miniView = mini.append("rect").attr("class", "view");

// ---------------------------------------------------------------- loading

function fail(msg) {
  const el = $("error");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(fail.t);
  fail.t = setTimeout(() => (el.hidden = true), 9000);
  console.error(msg);
}

function ingest(json, name = "") {
  if (json && json.people && json.relationships) {
    loadWorld(json);
    $("file-world").parentElement.classList.add("loaded");
  } else if (json && json.agents) {
    if (!S.world) return fail("Load the world before its agent network.");
    loadAgents(json);
    $("file-agents").parentElement.classList.add("loaded");
  } else {
    fail(`${name || "This file"} is neither a world (people, relationships) nor an agent network (agents).`);
  }
}

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}

function readFile(file) {
  return file.text().then(t => {
    try { return JSON.parse(t); } catch (e) { throw new Error(`${file.name}: not valid JSON (${e.message})`); }
  });
}

// ---------------------------------------------------------------- model

function buildModel(w) {
  const errors = [];
  const people = w.people || {}, groups = w.groups || {}, channels = w.channels || {};
  const rels = new Map((w.relationships || []).map(r => [r.id, r]));
  for (const r of rels.values()) {
    if (!people[r.a] || !people[r.b]) errors.push(`${r.id}: endpoint is not a person`);
  }
  for (const [gid, g] of Object.entries(groups)) {
    for (const m of Object.keys(g.members || {})) if (!people[m]) errors.push(`${gid}: member ${m} is not a person`);
  }
  for (const [cid, c] of Object.entries(channels)) {
    if (c.kind === "dm" ? !rels.has(c.backs) : !groups[c.backs]) errors.push(`${cid}: backs unknown ${c.backs}`);
  }
  if (errors.length) throw new Error("Invalid world (run `python -m worldgen.topology validate`):\n" + errors.join("\n"));

  const channelMembers = cid => {
    const c = channels[cid];
    if (c.kind === "dm") { const r = rels.get(c.backs); return [r.a, r.b]; }
    return c.members || Object.keys(groups[c.backs].members);
  };
  const groupsOf = new Map(Object.keys(people).map(p => [p, []]));
  for (const [gid, g] of Object.entries(groups)) for (const m of Object.keys(g.members)) groupsOf.get(m).push(gid);
  const relsOf = new Map(Object.keys(people).map(p => [p, []]));
  for (const r of rels.values()) { relsOf.get(r.a).push(r); relsOf.get(r.b).push(r); }
  const channelsOf = new Map(Object.keys(people).map(p => [p, []]));
  for (const cid of Object.keys(channels)) for (const m of channelMembers(cid)) channelsOf.get(m)?.push(cid);

  const colorable = Object.keys(groups).filter(g => groups[g].kind !== "household");
  const groupColor = new Map(colorable.map((g, i) => [g, PALETTE[i % PALETTE.length]]));
  const colorOf = pid => {
    const gs = [...groupsOf.get(pid)].sort((a, b) => KIND_ORDER.indexOf(groups[a].kind) - KIND_ORDER.indexOf(groups[b].kind));
    const g = gs.find(g => groupColor.has(g));
    return g ? groupColor.get(g) : NO_GROUP;
  };

  // Edge override, then "type:context", then "type"; remember where each value came from.
  const norms = (r, dir) => {
    const out = {};
    for (const [key, src] of [[r.type, "type"], [`${r.type}:${r.context}`, "context"]]) {
      const d = (w.norm_defaults || {})[key];
      if (!d) continue;
      const vals = d.a_to_b || d.b_to_a ? (d[dir] || {}) : d;
      for (const [k, v] of Object.entries(vals)) out[k] = { v, src };
    }
    for (const [k, v] of Object.entries((r[dir] && r[dir].norms) || {})) out[k] = { v, src: "edge" };
    return out;
  };

  return { people, groups, channels, rels, channelMembers, groupsOf, relsOf, channelsOf, groupColor, colorOf, norms };
}

function deriveLinks(m, net) {
  const reach = new Map();
  for (const [aid, a] of Object.entries(net.agents)) {
    const set = new Set();
    for (const cid of Object.keys(m.channels)) {
      if (a.access[m.channels[cid].service] && m.channelMembers(cid).includes(a.principal)) set.add(cid);
    }
    reach.set(aid, set);
  }
  const between = new Map();
  for (const r of m.rels.values()) {
    const k = [r.a, r.b].sort().join("|");
    between.set(k, (between.get(k) || []).concat(r.id));
  }
  const ids = Object.keys(net.agents).sort(), links = [];
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const x = ids[i], y = ids[j], px = net.agents[x].principal, py = net.agents[y].principal;
    if (px === py) { links.push({ a: x, b: y, kind: "sibling", channels: [], relationships: [] }); continue; }
    const shared = [...reach.get(x)].filter(c => reach.get(y).has(c)).sort();
    if (shared.length) links.push({ a: x, b: y, kind: "peer", channels: shared,
                                    relationships: between.get([px, py].sort().join("|")) || [] });
  }
  return { links, reach };
}

// ---------------------------------------------------------------- layout

function computeLayout(m) {
  const nodes = Object.keys(m.people).map(id => ({ id }));
  const hubs = Object.keys(m.groups).map(g => ({ id: "hub:" + g, hub: true }));
  const links = [...m.rels.values()].map(r => ({ source: r.a, target: r.b, c: r.closeness ?? .5 }));
  for (const [gid, g] of Object.entries(m.groups)) {
    for (const p of Object.keys(g.members)) links.push({ source: "hub:" + gid, target: p, hub: g.kind });
  }
  const sim = d3.forceSimulation(nodes.concat(hubs))
    .randomSource(d3.randomLcg(0.42))
    .force("link", d3.forceLink(links).id(d => d.id)
      .distance(l => l.hub ? (l.hub === "household" ? 30 : 60) : 95 + 130 * (1 - l.c))
      .strength(l => l.hub ? (l.hub === "household" ? .9 : .45) : .15 + .55 * l.c))
    .force("charge", d3.forceManyBody().strength(d => d.hub ? -60 : -700).distanceMax(1200))
    .force("collide", d3.forceCollide(d => d.hub ? 0 : 42))
    .force("x", d3.forceX(0).strength(.04)).force("y", d3.forceY(0).strength(.05))
    .stop();
  for (let i = 0; i < 600; i++) sim.tick();
  return new Map(nodes.map(n => [n.id, { x: n.x, y: n.y }]));
}

// ---------------------------------------------------------------- views

function peopleView(m) {
  const deg = new Map(Object.keys(m.people).map(p => [p, m.relsOf.get(p).length]));
  const nodes = Object.entries(m.people).map(([id, p]) => ({
    id, kind: "person", label: short(p.name), color: m.colorOf(id), r: 6 + 2.2 * Math.sqrt(deg.get(id)),
    anchor: id,
  }));
  const edges = [...m.rels.values()].map(r => ({
    id: r.id, kind: "rel", a: r.a, b: r.b, cat: category(r.type), w: r.closeness ?? .5,
    dashed: (r.closeness ?? .5) < .3, label: r.type + (r.context ? ` · ${r.context}` : ""),
  }));
  const hulls = Object.entries(m.groups).map(([gid, g]) => ({ id: gid, members: Object.keys(g.members) }));
  return { nodes, edges, hulls, ghosts: [] };
}

function agentView(m, net) {
  const byOwner = d3.group(Object.keys(net.agents).sort(), a => net.agents[a].principal);
  const nodes = [];
  for (const [owner, aids] of byOwner) {
    aids.forEach((aid, i) => {
      const a = net.agents[aid];
      const ang = 2 * Math.PI * i / aids.length + Math.PI / 4;
      const r = aids.length === 1 ? 0 : 26;
      nodes.push({ id: aid, kind: "agent", label: a.name.replace("'s ", "·"), color: m.colorOf(owner), r: 11,
                   anchor: owner, dx: r * Math.cos(ang), dy: r * Math.sin(ang) });
    });
  }
  const { links, reach } = deriveLinks(m, net);
  const edges = links.map(l => {
    if (l.kind === "sibling") return { id: `${l.a}~${l.b}`, kind: "link", link: l, a: l.a, b: l.b, cat: "sibling",
                                       w: .45, dashed: true, label: "same principal" };
    const rs = l.relationships.map(id => m.rels.get(id)).sort((x, y) => y.closeness - x.closeness);
    const top = rs[0];
    return { id: `${l.a}~${l.b}`, kind: "link", link: l, a: l.a, b: l.b, cat: top ? category(top.type) : "group",
             w: top ? top.closeness : .25, dashed: !top, label: top ? top.type : "shared channel" };
  });
  const hulls = Object.keys(m.groups).map(gid => ({
    id: gid,
    members: Object.keys(net.agents).filter(aid => [...reach.get(aid)].some(c => {
      const ch = m.channels[c]; return ch.kind !== "dm" && ch.backs === gid;
    })),
  }));
  const owners = new Set(Object.values(net.agents).map(a => a.principal));
  const ghosts = Object.keys(m.people).map(id => ({ id, label: short(m.people[id].name), color: m.colorOf(id), owns: owners.has(id) }));
  return { nodes, edges, hulls, ghosts };
}

function posOf(n) {
  const p = S.pos.get(n.anchor);
  return { x: p.x + (n.dx || 0), y: p.y + (n.dy || 0) };
}

// ---------------------------------------------------------------- render

function loadWorld(w, fit = true) {
  try { S.model = buildModel(w); } catch (e) { return fail(e.message); }
  S.world = w;
  S.net = null;
  S.layer = "people";
  S.pos = computeLayout(S.model);
  S.hullOn = new Set(Object.keys(w.groups || {}).filter(g => DEFAULT_HULLS.has(w.groups[g].kind)));
  S.selected = null; S.selection = new Set(); S.isolated = null;
  $("file-agents").parentElement.classList.remove("loaded");
  $("world-title").textContent = w.world_id || "world";
  $("world-sub").textContent = `${w.domain || "?"} · v${w.version ?? "?"} · ${Object.keys(w.people).length} people · ` +
                               `${w.relationships.length} relationships · ${Object.keys(w.groups || {}).length} groups`;
  $("empty").hidden = true;
  syncLayerButtons();
  redraw(fit);
}

function loadAgents(net) {
  const errs = [];
  for (const [aid, a] of Object.entries(net.agents)) {
    const p = S.model.people[a.principal];
    if (!p) { errs.push(`${aid}: principal ${a.principal} is not in the world`); continue; }
    for (const svc of Object.keys(a.access || {})) {
      if (!(p.accounts || {})[svc]) errs.push(`${aid}: ${a.principal} has no ${svc} account to delegate`);
    }
  }
  if (net.world_id && net.world_id !== S.world.world_id) errs.push(`agent network is for ${net.world_id}, not ${S.world.world_id}`);
  if (errs.length) return fail("Invalid agent network:\n" + errs.join("\n"));
  S.net = net;
  syncLayerButtons();
  setLayer("agents");
}

function setLayer(layer) {
  if (layer === "agents" && !S.net) return;
  S.layer = layer;
  S.selected = null; S.selection = new Set(); S.isolated = null;
  syncLayerButtons();
  redraw(true);
}

function syncLayerButtons() {
  $("layer-agents").disabled = !S.net;
  $("layer-agents").title = S.net ? "Agent network (layer 3)" : "Load an agent network to enable";
  for (const b of document.querySelectorAll("[data-layer]")) b.classList.toggle("on", b.dataset.layer === S.layer);
}

function visible(id) { return !S.isolated || S.isolated.has(id); }

function redraw(fit = false) {
  if (!S.model) return;
  const v = S.view = S.layer === "agents" ? agentView(S.model, S.net) : peopleView(S.model);
  const nodes = v.nodes.filter(n => visible(n.id));
  const nodeById = new Map(v.nodes.map(n => [n.id, n]));
  const edges = v.edges.filter(e => visible(e.a) && visible(e.b));

  // hulls
  const hulls = v.hulls.filter(h => S.hullOn.has(h.id))
    .map(h => ({ ...h, members: h.members.filter(m => visible(m) && nodeById.has(m)) }))
    .filter(h => h.members.length >= 2);
  const hullSel = gHulls.selectAll("g.hull").data(hulls, d => d.id).join(enter => {
    const g = enter.append("g").attr("class", "hull");
    g.append("path"); g.append("text").attr("text-anchor", "middle");
    return g;
  });
  hullSel.select("path")
    .attr("fill", d => S.model.groupColor.get(d.id) || NO_GROUP).attr("fill-opacity", .11)
    .attr("stroke", d => S.model.groupColor.get(d.id) || NO_GROUP).attr("stroke-opacity", .35)
    .style("cursor", "pointer")
    .on("click", (ev, d) => { ev.stopPropagation(); selectGroup(d.id); })
    .on("mousemove", (ev, d) => tip(ev, `<b>${esc(S.model.groups[d.id].name)}</b> <span>${esc(S.model.groups[d.id].kind)}</span>`))
    .on("mouseleave", untip);
  hullSel.select("text").attr("fill", d => S.model.groupColor.get(d.id) || NO_GROUP)
    .text(d => S.model.groups[d.id].name);

  // ghosts (principals behind agents)
  gGhosts.selectAll("g.ghost").data(v.ghosts.filter(g => visible(g.id) || [...(S.isolated || [])].some(
    id => nodeById.get(id)?.anchor === g.id)), d => d.id).join(enter => {
    const g = enter.append("g").attr("class", "ghost");
    g.append("circle").attr("r", 20);
    g.append("text").attr("text-anchor", "middle").attr("dy", 34);
    return g;
  }).call(g => {
    g.select("circle").attr("fill", d => d.color);
    g.select("text").text(d => d.owns ? "" : d.label);
  });

  // edges
  gEdges.selectAll("line.edge").data(edges, d => d.id).join("line").attr("class", "edge")
    .attr("stroke", d => EDGE_COLORS[d.cat] || "#555").attr("stroke-opacity", .55)
    .attr("stroke-width", d => 1.2 + 4.5 * d.w).attr("stroke-dasharray", d => d.dashed ? "6 5" : null);
  gHits.selectAll("line.edge-hit").data(edges, d => d.id).join("line").attr("class", "edge-hit")
    .on("click", (ev, d) => { ev.stopPropagation(); selectEdge(d.id); })
    .on("mousemove", (ev, d) => tip(ev, `<b>${esc(labelOf(d.a))} — ${esc(labelOf(d.b))}</b><br><span>${esc(d.label)}</span>`))
    .on("mouseleave", untip);
  gEdgeLabels.selectAll("text").data(edges, d => d.id).join("text").attr("class", "edge-label")
    .attr("text-anchor", "middle").text(d => d.label);

  // nodes
  const nodeSel = gNodes.selectAll("g.node").data(nodes, d => d.id).join(enter => {
    const g = enter.append("g").attr("class", "node");
    g.append(d => document.createElementNS("http://www.w3.org/2000/svg", d.kind === "agent" ? "rect" : "circle"))
      .attr("class", "shape");
    g.append("text").attr("text-anchor", "middle");
    return g;
  });
  nodeSel.select(".shape").each(function (d) {
    const s = d3.select(this).attr("fill", d.color);
    if (d.kind === "agent") s.attr("x", -d.r).attr("y", -d.r).attr("width", 2 * d.r).attr("height", 2 * d.r).attr("rx", 4);
    else s.attr("r", d.r);
  });
  nodeSel.select("text").text(d => d.label);
  placeLabels();
  nodeSel
    .on("click", (ev, d) => { ev.stopPropagation(); selectNode(d.id); })
    .on("mousemove", (ev, d) => tip(ev, nodeTip(d)))
    .on("mouseleave", untip)
    .call(d3.drag().clickDistance(3)
      .on("start", ev => ev.sourceEvent.stopPropagation())
      .on("drag", (ev, d) => {
        const p = S.pos.get(d.anchor);
        p.x += ev.dx; p.y += ev.dy;
        place();
      }));

  place();
  drawLegend();
  drawMinimap();
  refreshSearch();
  applyHighlight();
  renderPanel();
  if (fit) fitTo(nodes.map(n => posOf(n)), 0);
  $("isolate").disabled = !selectionIds().length;
  $("isolate").hidden = !!S.isolated;
  $("exit-isolate").hidden = !S.isolated;
}

function labelOf(id) {
  const n = S.view.nodes.find(n => n.id === id);
  return n ? n.label : id;
}

// Node labels sit just below the shape, at a gap that stays constant on screen.
function placeLabels() {
  const k = S.transform.k;
  gNodes.selectAll("g.node text").attr("y", d => d.r + 13 / k);
  gGhosts.selectAll("g.ghost text").attr("dy", 20 + 14 / k);
}

// Recompute geometry from S.pos (after layout, drag or isolate).
function place() {
  const at = new Map(S.view.nodes.map(n => [n.id, posOf(n)]));
  gNodes.selectAll("g.node").attr("transform", d => `translate(${at.get(d.id).x},${at.get(d.id).y})`);
  for (const sel of [gEdges.selectAll("line.edge"), gHits.selectAll("line.edge-hit")]) {
    sel.attr("x1", d => at.get(d.a).x).attr("y1", d => at.get(d.a).y)
       .attr("x2", d => at.get(d.b).x).attr("y2", d => at.get(d.b).y);
  }
  gEdgeLabels.selectAll("text")
    .attr("x", d => (at.get(d.a).x + at.get(d.b).x) / 2).attr("y", d => (at.get(d.a).y + at.get(d.b).y) / 2 - 4);
  gGhosts.selectAll("g.ghost").each(function (g) {
    const p = S.pos.get(g.id), el = d3.select(this);
    el.attr("transform", `translate(${p.x},${p.y})`);
    const owned = S.view.nodes.filter(n => n.anchor === g.id && (n.dx || n.dy) && visible(n.id));
    el.selectAll("line").data(owned).join("line").attr("stroke", g.color)
      .attr("x2", n => n.dx).attr("y2", n => n.dy);
  });

  // hulls: smooth padded outline around members; label on the outer side, pointing away from the
  // centre of the graph, anchored on the members unique to the group
  const count = new Map();
  gHulls.selectAll("g.hull").each(d => d.members.forEach(m => count.set(m, (count.get(m) || 0) + 1)));
  const all = [...at.values()], cx = d3.mean(all, p => p.x), cy = d3.mean(all, p => p.y);
  const placed = [];
  gHulls.selectAll("g.hull").each(function (d) {
    const pad = 30, ring = [];
    for (const m of d.members) {
      const p = at.get(m);
      for (let k = 0; k < 12; k++) ring.push([p.x + pad * Math.cos(k * Math.PI / 6), p.y + pad * Math.sin(k * Math.PI / 6)]);
    }
    const hull = d3.polygonHull(ring);
    d3.select(this).select("path").attr("d", d3.line().curve(d3.curveCatmullRomClosed.alpha(.5))(hull));
    const own = d.members.filter(m => count.get(m) === 1);
    const pts = (own.length ? own : d.members).map(m => at.get(m));
    const gx = d3.mean(pts, p => p.x), gy = d3.mean(pts, p => p.y);
    let ux = gx - cx, uy = gy - cy;
    const len = Math.hypot(ux, uy) || 1;
    ux /= len; uy /= len;
    const far = d3.greatest(hull, p => (p[0] - gx) * ux + (p[1] - gy) * uy);
    const half = 3.4 * S.model.groups[d.id].name.length;
    let x = far[0] + ux * (half * Math.abs(ux) + 8), y = far[1] + uy * 14 + (uy > 0 ? 8 : -2);
    while (placed.some(q => Math.abs(q.x - x) < half + q.half && Math.abs(q.y - y) < 15)) y += uy >= 0 ? 16 : -16;
    placed.push({ x, y, half });
    d3.select(this).select("text").attr("x", x).attr("y", y);
  });
  drawMinimap();
}

// ---------------------------------------------------------------- zoom, fit, minimap

const zoom = d3.zoom().scaleExtent([0.15, 8]).clickDistance(4)
  .filter(ev => (ev.type === "wheel" || (!ev.shiftKey && S.tool === "pan")) && !ev.button && !(ev.ctrlKey && ev.type !== "wheel"))
  .on("zoom", ev => {
    S.transform = ev.transform;
    root.attr("transform", ev.transform).style("--k", ev.transform.k);
    placeLabels();
    gEdgeLabels.style("display", ev.transform.k >= 1.5 || S.isolated ? null : "none");
    updateMiniView();
  });
svg.call(zoom).on("dblclick.zoom", null);
svg.on("click", () => { if (S.model) clearSelection(); });

const history = [];
function pushView() {
  history.push(S.transform);
  if (history.length > 30) history.shift();
  $("back").disabled = false;
}
function back() {
  const t = history.pop();
  $("back").disabled = !history.length;
  if (t) svg.transition().duration(500).call(zoom.transform, t);
}

function fitTo(points, duration = 600, pad = 70, maxK = 3) {
  if (!points.length) return;
  pushView();
  const { width, height } = svg.node().getBoundingClientRect();
  const x0 = d3.min(points, p => p.x) - pad, x1 = d3.max(points, p => p.x) + pad;
  const y0 = d3.min(points, p => p.y) - pad, y1 = d3.max(points, p => p.y) + pad;
  const k = Math.min(maxK, Math.min(width / (x1 - x0), height / (y1 - y0)));
  const t = d3.zoomIdentity.translate(width / 2, height / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
  (duration ? svg.transition().duration(duration).ease(d3.easeCubicInOut) : svg).call(zoom.transform, t);
}

function fitAll() {
  if (!S.view) return;
  fitTo(S.view.nodes.filter(n => visible(n.id)).map(posOf));
}

let miniScale = null;
function drawMinimap() {
  if (!S.view) return;
  const W = 190, H = 136, pad = 10;
  const pts = S.view.nodes.map(n => ({ ...posOf(n), c: n.color, id: n.id }));
  const xs = d3.extent(pts, p => p.x), ys = d3.extent(pts, p => p.y);
  const k = Math.min((W - 2 * pad) / (xs[1] - xs[0] || 1), (H - 2 * pad) / (ys[1] - ys[0] || 1));
  const ox = (W - k * (xs[1] - xs[0])) / 2 - k * xs[0], oy = (H - k * (ys[1] - ys[0])) / 2 - k * ys[0];
  miniScale = { k, ox, oy };
  mini.attr("viewBox", [0, 0, W, H]);
  miniG.selectAll("circle").data(pts, d => d.id).join("circle").attr("r", 2.6)
    .attr("cx", d => ox + k * d.x).attr("cy", d => oy + k * d.y).attr("fill", d => d.c)
    .attr("opacity", d => visible(d.id) ? .9 : .2);
  updateMiniView();
}

function updateMiniView() {
  if (!miniScale) return;
  const { width, height } = svg.node().getBoundingClientRect();
  const t = S.transform, { k, ox, oy } = miniScale;
  const [x0, y0] = t.invert([0, 0]), [x1, y1] = t.invert([width, height]);
  miniView.attr("x", ox + k * x0).attr("y", oy + k * y0).attr("width", k * (x1 - x0)).attr("height", k * (y1 - y0));
}

mini.on("pointerdown pointermove", ev => {
  if (!miniScale || (ev.type === "pointermove" && !ev.buttons)) return;
  const [mx, my] = d3.pointer(ev, mini.node());
  const vb = mini.node().viewBox.baseVal, rect = mini.node().getBoundingClientRect();
  const sx = mx * vb.width / rect.width, sy = my * vb.height / rect.height;
  const x = (sx - miniScale.ox) / miniScale.k, y = (sy - miniScale.oy) / miniScale.k;
  const { width, height } = svg.node().getBoundingClientRect();
  svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(S.transform.k).translate(-x, -y));
});

// ---------------------------------------------------------------- box zoom

const brushEl = $("brush");
let boxStart = null;
svg.on("pointerdown.box", ev => {
  if (!S.model || ev.button || !(S.tool === "box" || ev.shiftKey)) return;
  if (ev.target.closest && ev.target.closest(".node")) return;
  const r = svg.node().getBoundingClientRect();
  boxStart = { x: ev.clientX - r.left, y: ev.clientY - r.top };
  svg.node().setPointerCapture(ev.pointerId);
  Object.assign(brushEl.style, { left: boxStart.x + "px", top: boxStart.y + "px", width: 0, height: 0 });
  brushEl.hidden = false;
  ev.preventDefault();
});
svg.on("pointermove.box", ev => {
  if (!boxStart) return;
  const r = svg.node().getBoundingClientRect();
  const x = ev.clientX - r.left, y = ev.clientY - r.top;
  Object.assign(brushEl.style, {
    left: Math.min(x, boxStart.x) + "px", top: Math.min(y, boxStart.y) + "px",
    width: Math.abs(x - boxStart.x) + "px", height: Math.abs(y - boxStart.y) + "px",
  });
});
svg.on("pointerup.box pointercancel.box", ev => {
  if (!boxStart) return;
  const r = svg.node().getBoundingClientRect();
  const end = { x: ev.clientX - r.left, y: ev.clientY - r.top };
  brushEl.hidden = true;
  const start = boxStart;
  boxStart = null;
  if (Math.abs(end.x - start.x) < 6 || Math.abs(end.y - start.y) < 6) return;
  const [x0, y0] = S.transform.invert([Math.min(start.x, end.x), Math.min(start.y, end.y)]);
  const [x1, y1] = S.transform.invert([Math.max(start.x, end.x), Math.max(start.y, end.y)]);
  const ids = S.view.nodes.filter(n => visible(n.id)).filter(n => {
    const p = posOf(n); return p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;
  }).map(n => n.id);
  suppressClick();
  if (!ids.length) return;
  S.selection = new Set(ids);
  S.selected = { kind: "selection" };
  // Zoom to the drawn box itself, so the view matches what was framed.
  fitTo([{ x: x0, y: y0 }, { x: x1, y: y1 }], 650, 10, 6);
  afterSelect();
});

function suppressClick() {
  const stop = e => { e.stopPropagation(); window.removeEventListener("click", stop, true); };
  window.addEventListener("click", stop, true);
  setTimeout(() => window.removeEventListener("click", stop, true), 0);
}

function setTool(tool) {
  S.tool = tool;
  $("tool-pan").classList.toggle("on", tool === "pan");
  $("tool-box").classList.toggle("on", tool === "box");
  $("stage").classList.toggle("box-mode", tool === "box");
  $("box-hint").hidden = tool !== "box";
}

// ---------------------------------------------------------------- selection

function selectNode(id) { S.selected = { kind: "node", id }; S.selection = new Set(); afterSelect(); }
function selectEdge(id) { S.selected = { kind: "edge", id }; S.selection = new Set(); afterSelect(); }
function selectGroup(gid) {
  const hull = S.view.hulls.find(h => h.id === gid);
  S.selected = { kind: "group", id: gid };
  S.selection = new Set((hull ? hull.members : []).filter(visible));
  afterSelect();
}
function clearSelection() { S.selected = null; S.selection = new Set(); afterSelect(); }

function selectionIds() {
  if (S.selection.size) return [...S.selection];
  if (S.selected?.kind === "node") return [S.selected.id];
  return [];
}

function afterSelect() {
  applyHighlight();
  renderPanel();
  $("isolate").disabled = !selectionIds().length;
}

function applyHighlight() {
  if (!S.view) return;
  let keepN = null, keepE = null;
  const sel = S.selected;
  if (sel?.kind === "node") {
    keepN = new Set([sel.id]); keepE = new Set();
    for (const e of S.view.edges) if (e.a === sel.id || e.b === sel.id) { keepE.add(e.id); keepN.add(e.a); keepN.add(e.b); }
  } else if (sel?.kind === "edge") {
    const e = S.view.edges.find(e => e.id === sel.id);
    keepN = new Set([e.a, e.b]); keepE = new Set([e.id]);
  } else if (S.selection.size) {
    keepN = S.selection;
    keepE = new Set(S.view.edges.filter(e => keepN.has(e.a) && keepN.has(e.b)).map(e => e.id));
  }
  gNodes.selectAll("g.node")
    .classed("dim", d => keepN && !keepN.has(d.id))
    .classed("selected", d => sel?.kind === "node" && d.id === sel.id)
    .classed("in-selection", d => S.selection.has(d.id));
  gEdges.selectAll("line.edge").classed("dim", d => keepE && !keepE.has(d.id)).classed("hl", d => keepE && keepE.has(d.id));
  gEdgeLabels.selectAll("text").classed("dim", d => keepE && !keepE.has(d.id));
  gHulls.selectAll("g.hull").classed("dim", d => sel?.kind === "group" ? d.id !== sel.id : !!keepN && !d.members.some(m => keepN.has(m)));
}

function isolate() {
  const ids = selectionIds();
  if (!ids.length) return;
  S.isolated = new Set(ids);
  redraw();
  fitAll();
}

function exitIsolate() {
  S.isolated = null;
  redraw();
  fitAll();
}

// ---------------------------------------------------------------- panel

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dot = c => `<span class="dot" style="background:${c}"></span>`;
const bar = v => `<span class="bar-mini"><i style="width:${Math.round(100 * v)}%"></i></span>`;
const norm = n => n ? `<span class="norm ${n.v}">${n.v}<small>${n.src}</small></span>` : `<span class="muted">—</span>`;

function renderPanel() {
  const P = $("panel"), sel = S.selected, m = S.model;
  if (!m) { P.innerHTML = `<p class="muted">No world loaded.</p>`; return; }
  if (sel?.kind === "node") P.innerHTML = S.layer === "agents" ? agentPanel(sel.id) : personPanel(sel.id);
  else if (sel?.kind === "edge") P.innerHTML = S.layer === "agents" ? linkPanel(sel.id) : relPanel(sel.id);
  else if (sel?.kind === "group" || S.selection.size) P.innerHTML = selectionPanel();
  else P.innerHTML = worldPanel();
  for (const el of P.querySelectorAll("[data-node]")) el.onclick = () => focusNode(el.dataset.node);
  for (const el of P.querySelectorAll("[data-edge]")) el.onclick = () => focusEdge(el.dataset.edge);
  for (const el of P.querySelectorAll("[data-group]")) el.onclick = ev => {
    if (ev.target.tagName === "INPUT") return;
    selectGroup(el.dataset.group);
    fitTo(S.view.nodes.filter(n => S.selection.has(n.id)).map(posOf));
  };
  for (const el of P.querySelectorAll("[data-hull]")) el.onchange = () => {
    el.checked ? S.hullOn.add(el.dataset.hull) : S.hullOn.delete(el.dataset.hull);
    redraw();
  };
  P.querySelector("[data-act=isolate]")?.addEventListener("click", isolate);
  P.querySelector("[data-act=zoom]")?.addEventListener("click", () =>
    fitTo(S.view.nodes.filter(n => S.selection.has(n.id)).map(posOf)));
  P.querySelector("[data-act=clear]")?.addEventListener("click", clearSelection);
}

function focusNode(id) {
  if (!S.view.nodes.some(n => n.id === id)) return;
  if (!visible(id)) exitIsolate();
  selectNode(id);
  const n = S.view.nodes.find(n => n.id === id), p = posOf(n);
  const { width, height } = svg.node().getBoundingClientRect();
  const k = Math.max(S.transform.k, 1.4);
  svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(k).translate(-p.x, -p.y));
}

function focusEdge(id) {
  const e = S.view.edges.find(e => e.id === id);
  if (!e) return;
  if (!visible(e.a) || !visible(e.b)) exitIsolate();
  selectEdge(id);
  fitTo([e.a, e.b].map(x => posOf(S.view.nodes.find(n => n.id === x))), 600, 140);
}

function personLink(pid) {
  const p = S.model.people[pid];
  return `<li data-node="${esc(pid)}">${dot(S.model.colorOf(pid))}<span class="grow">${esc(p.name)}</span></li>`;
}

function worldPanel() {
  const w = S.world, m = S.model;
  const cats = d3.rollup([...m.rels.values()], v => v.length, r => category(r.type));
  const groups = Object.entries(m.groups).map(([gid, g]) => `
    <li class="group-row" data-group="${esc(gid)}">
      <input type="checkbox" data-hull="${esc(gid)}" ${S.hullOn.has(gid) ? "checked" : ""} title="Show outline">
      ${dot(m.groupColor.get(gid) || NO_GROUP)}<span class="grow">${esc(g.name)}</span>
      <span class="meta">${esc(g.kind)} · ${Object.keys(g.members).length}</span></li>`).join("");
  const agents = S.net ? `<div class="stat"><b>${Object.keys(S.net.agents).length}</b><span>agents</span></div>` : "";
  return `
    <div class="kicker">World · ${esc(w.domain)}</div>
    <h2>${esc(w.world_id)}</h2>
    <div class="sub">version ${esc(w.version)} · services: ${esc((w.services || []).join(", "))}</div>
    <div class="stat-grid">
      <div class="stat"><b>${Object.keys(m.people).length}</b><span>people</span></div>
      <div class="stat"><b>${m.rels.size}</b><span>ties</span></div>
      <div class="stat"><b>${Object.keys(m.channels).length}</b><span>channels</span></div>
      <div class="stat"><b>${cats.get("kin") || 0}</b><span>kin</span></div>
      <div class="stat"><b>${cats.get("social") || 0}</b><span>social</span></div>
      <div class="stat"><b>${cats.get("service") || 0}</b><span>service</span></div>
      ${agents}
    </div>
    <h3>Groups <span class="muted">(tick to outline, click to zoom)</span></h3>
    <ul class="list">${groups}</ul>
    <h3>How to explore</h3>
    <p class="muted">Click a person or a tie for details. Draw a box (<kbd>B</kbd> or <kbd>⇧</kbd>+drag) around
      part of the network to zoom into it, then <b>Isolate</b> to hide everything else.</p>`;
}

function personPanel(pid) {
  const m = S.model, p = m.people[pid];
  const chips = [p.age != null && `${p.age} y/o`, p.gender, p.occupation, p.location, p.life_stage]
    .filter(Boolean).map(c => `<span class="chip">${esc(c)}</span>`).join("");
  const traits = (p.traits || []).map(t => `<span class="chip">${esc(t)}</span>`).join("");
  const accounts = Object.entries(p.accounts || {}).map(([s, h]) => `<tr><td>${esc(s)}</td><td>${esc(h)}</td></tr>`).join("")
    || `<tr><td colspan="2" class="muted">no accounts</td></tr>`;
  const groups = m.groupsOf.get(pid).map(gid => `<li data-group="${esc(gid)}">${dot(m.groupColor.get(gid) || NO_GROUP)}
      <span class="grow">${esc(m.groups[gid].name)}</span><span class="meta">${esc(m.groups[gid].members[pid])}</span></li>`).join("");
  const rels = [...m.relsOf.get(pid)].sort((a, b) => b.closeness - a.closeness).map(r => {
    const other = r.a === pid ? r.b : r.a;
    const dir = r.a === pid ? "" : " (of you)";
    return `<li data-edge="${esc(r.id)}">${dot(EDGE_COLORS[category(r.type)])}<span class="grow">${esc(m.people[other].name)}</span>
      <span class="meta">${esc(r.type)}${["parent", "grandparent", "aunt_uncle", "provider"].includes(r.type) ? dir : ""}</span>${bar(r.closeness)}</li>`;
  }).join("");
  const channels = m.channelsOf.get(pid).map(cid => {
    const c = m.channels[cid];
    return `<li class="static"><span class="grow">${esc(c.name || cid)}</span><span class="meta">${esc(c.service)} · ${esc(c.kind)}</span></li>`;
  }).join("") || `<li class="static muted">none</li>`;
  const agents = S.net ? Object.entries(S.net.agents).filter(([, a]) => a.principal === pid)
    .map(([aid, a]) => `<li class="static"><span class="grow">${esc(a.name)}</span><span class="meta">${esc(a.role)}</span></li>`).join("") : "";
  return `
    <div class="kicker">Person · ${esc(pid)}</div>
    <h2>${esc(p.name)}</h2>
    <div class="chips">${chips}</div>
    ${traits ? `<h3>Traits</h3><div class="chips">${traits}</div>` : ""}
    <h3>Ties (${m.relsOf.get(pid).length}) <span class="muted">by closeness</span></h3><ul class="list">${rels}</ul>
    <h3>Groups</h3><ul class="list">${groups || `<li class="static muted">none</li>`}</ul>
    <h3>Accounts</h3><table class="kv">${accounts}</table>
    <h3>Channels</h3><ul class="list">${channels}</ul>
    ${agents ? `<h3>Agents</h3><ul class="list">${agents}</ul>` : ""}`;
}

function relPanel(rid) {
  const m = S.model, r = m.rels.get(rid), A = m.people[r.a], B = m.people[r.b];
  const ab = m.norms(r, "a_to_b"), ba = m.norms(r, "b_to_a");
  const dir = (from, to, d) => `<div class="dir"><div class="t">${esc(short(from.name))} → ${esc(short(to.name))}</div>
    <div>trust <span class="v">${(d.trust ?? 0).toFixed(2)}</span></div><div>authority <span class="v">${esc(d.authority || "none")}</span></div></div>`;
  const rows = NORM_CATS.map(c => `<tr><td>${c.replace("_", " ")}</td><td>${norm(ab[c])}</td><td>${norm(ba[c])}</td></tr>`).join("");
  const channels = Object.entries(m.channels).filter(([, c]) => c.kind === "dm" && c.backs === rid)
    .map(([cid, c]) => `<li class="static"><span class="grow">${esc(c.name || cid)}</span><span class="meta">${esc(c.service)} dm</span></li>`).join("");
  const shared = m.groupsOf.get(r.a).filter(g => m.groupsOf.get(r.b).includes(g))
    .map(gid => `<li data-group="${esc(gid)}">${dot(m.groupColor.get(gid) || NO_GROUP)}<span class="grow">${esc(m.groups[gid].name)}</span></li>`).join("");
  const directed = ["parent", "grandparent", "aunt_uncle", "provider"].includes(r.type);
  return `
    <div class="kicker">Relationship · ${esc(category(r.type))}</div>
    <h2>${esc(short(A.name))} ${directed ? "→" : "⇄"} ${esc(short(B.name))}</h2>
    <div class="sub">${directed ? `${esc(A.name)} is ${esc(r.type)} of ${esc(B.name)}` : esc(r.type)}${r.context ? ` · ${esc(r.context)}` : ""}${r.since ? ` · since ${esc(r.since)}` : ""}</div>
    <table class="kv" style="margin-top:12px"><tr><td>closeness</td><td>${bar(r.closeness)} ${(r.closeness ?? 0).toFixed(2)}</td></tr></table>
    <h3>Per direction</h3><div class="dirs">${dir(A, B, r.a_to_b || {})}${dir(B, A, r.b_to_a || {})}</div>
    <h3>Information-flow norms</h3>
    <table class="norms"><tr><th>category</th><th>${esc(short(A.name))} → ${esc(short(B.name))}</th><th>${esc(short(B.name))} → ${esc(short(A.name))}</th></tr>${rows}</table>
    <p class="muted" style="font-size:11.5px">Tag shows the source: <b>edge</b> override, <b>context</b> default, or <b>type</b> default.</p>
    <h3>People</h3><ul class="list">${personLink(r.a)}${personLink(r.b)}</ul>
    ${shared ? `<h3>Shared groups</h3><ul class="list">${shared}</ul>` : ""}
    ${channels ? `<h3>Channels</h3><ul class="list">${channels}</ul>` : ""}`;
}

function agentPanel(aid) {
  const m = S.model, a = S.net.agents[aid];
  const access = Object.entries(a.access).map(([s, sc]) => `<tr><td>${esc(s)}</td><td>${esc(sc.join(", "))}</td></tr>`).join("");
  const links = S.view.edges.filter(e => e.a === aid || e.b === aid).map(e => {
    const o = e.a === aid ? e.b : e.a;
    return `<li data-edge="${esc(e.id)}">${dot(EDGE_COLORS[e.cat] || "#555")}<span class="grow">${esc(S.net.agents[o].name)}</span>
      <span class="meta">${esc(e.label)}</span></li>`;
  }).join("") || `<li class="static muted">no links</li>`;
  const reach = Object.keys(m.channels).filter(c => a.access[m.channels[c].service] && m.channelMembers(c).includes(a.principal))
    .map(c => `<li class="static"><span class="grow">${esc(m.channels[c].name || c)}</span><span class="meta">${esc(m.channels[c].service)}</span></li>`).join("")
    || `<li class="static muted">none</li>`;
  return `
    <div class="kicker">Agent · ${esc(aid)}</div>
    <h2>${esc(a.name)}</h2>
    <div class="sub">${esc(a.role)}</div>
    <h3>Principal</h3><ul class="list">${personLink(a.principal)}</ul>
    <h3>Delegated access</h3><table class="kv">${access}</table>
    <h3>Reachable channels</h3><ul class="list">${reach}</ul>
    <h3>Links</h3><ul class="list">${links}</ul>`;
}

function linkPanel(id) {
  const m = S.model, e = S.view.edges.find(e => e.id === id), l = e.link;
  const A = S.net.agents[l.a], B = S.net.agents[l.b];
  const chans = l.channels.map(c => `<li class="static"><span class="grow">${esc(m.channels[c].name || c)}</span>
      <span class="meta">${esc(m.channels[c].service)} · ${esc(m.channels[c].kind)}</span></li>`).join("");
  const rels = l.relationships.map(r => `<li data-rel="${esc(r)}" class="static">${dot(EDGE_COLORS[category(m.rels.get(r).type)])}
      <span class="grow">${esc(m.rels.get(r).type)}</span>${bar(m.rels.get(r).closeness)}</li>`).join("");
  return `
    <div class="kicker">Agent link · ${l.kind === "sibling" ? "same principal" : "peer"}</div>
    <h2>${esc(A.name)} ⇄ ${esc(B.name)}</h2>
    <div class="sub">${l.kind === "sibling" ? "Both act for " + esc(m.people[A.principal].name)
      : "Derived: both principals are in these channels, and both agents were delegated the service."}</div>
    ${chans ? `<h3>Shared channels</h3><ul class="list">${chans}</ul>` : ""}
    ${l.kind === "peer" ? `<h3>Principals' relationship</h3><ul class="list">${rels || `<li class="static muted">none: they only share a group channel</li>`}</ul>` : ""}
    <h3>Agents</h3><ul class="list">
      <li data-node="${esc(l.a)}">${dot(m.colorOf(A.principal))}<span class="grow">${esc(A.name)}</span></li>
      <li data-node="${esc(l.b)}">${dot(m.colorOf(B.principal))}<span class="grow">${esc(B.name)}</span></li></ul>`;
}

function selectionPanel() {
  const m = S.model, ids = [...S.selection], set = S.selection;
  const internal = S.view.edges.filter(e => set.has(e.a) && set.has(e.b));
  const cats = d3.rollup(internal, v => v.length, e => e.cat);
  const group = S.selected?.kind === "group" ? m.groups[S.selected.id] : null;
  const items = ids.map(id => {
    const n = S.view.nodes.find(n => n.id === id);
    const sub = n.kind === "agent" ? S.net.agents[id].role : m.people[id].occupation;
    const role = group && n.kind === "person" ? group.members[id] : sub;
    return `<li data-node="${esc(id)}">${dot(n.color)}<span class="grow">${esc(n.kind === "agent" ? S.net.agents[id].name : m.people[id].name)}</span>
      <span class="meta">${esc(role || "")}</span></li>`;
  }).join("");
  const touched = S.layer === "people" ? [...new Set(ids.flatMap(id => m.groupsOf.get(id)))]
    .map(gid => `<li data-group="${esc(gid)}">${dot(m.groupColor.get(gid) || NO_GROUP)}<span class="grow">${esc(m.groups[gid].name)}</span>
      <span class="meta">${ids.filter(i => m.groups[gid].members[i]).length}/${Object.keys(m.groups[gid].members).length}</span></li>`).join("") : "";
  const ties = internal.sort((a, b) => b.w - a.w).map(e => `<li data-edge="${esc(e.id)}">${dot(EDGE_COLORS[e.cat] || "#555")}
      <span class="grow">${esc(labelOf(e.a))} — ${esc(labelOf(e.b))}</span><span class="meta">${esc(e.label)}</span></li>`).join("");
  return `
    <div class="kicker">${group ? "Group · " + esc(group.kind) : "Sub-topology"}</div>
    <h2>${group ? esc(group.name) : `${ids.length} selected`}</h2>
    <div class="stat-grid">
      <div class="stat"><b>${ids.length}</b><span>${S.layer === "agents" ? "agents" : "people"}</span></div>
      <div class="stat"><b>${internal.length}</b><span>internal ties</span></div>
      <div class="stat"><b>${cats.get("kin") || 0}/${cats.get("social") || 0}/${cats.get("service") || 0}</b><span>kin/soc/svc</span></div>
    </div>
    <div class="btns">
      ${S.isolated ? "" : `<button class="primary" data-act="isolate">Isolate</button>`}
      <button data-act="zoom">Zoom to selection</button><button data-act="clear">Clear</button>
    </div>
    <h3>Members</h3><ul class="list">${items}</ul>
    ${touched ? `<h3>Groups touched</h3><ul class="list">${touched}</ul>` : ""}
    <h3>Ties inside the selection</h3><ul class="list">${ties || `<li class="static muted">none</li>`}</ul>`;
}

// ---------------------------------------------------------------- legend, tooltip, search

function drawLegend() {
  const used = new Set(S.view.edges.map(e => e.cat));
  const rows = Object.entries(EDGE_COLORS).filter(([k]) => used.has(k))
    .map(([k, c]) => `<div class="row"><span class="ln${k === "sibling" ? " dash" : ""}" style="background:${c}"></span>${k === "sibling" ? "same principal" : k}</div>`).join("");
  const shape = S.layer === "agents" ? `<div class="row"><span class="ln" style="background:none;border:2px solid var(--muted);width:11px;height:11px;border-radius:3px"></span>agent</div>
    <div class="row"><span class="ln" style="background:var(--muted);opacity:.3;width:12px;height:12px;border-radius:50%"></span>principal</div>` : "";
  $("legend").innerHTML = `<h3>Ties</h3>${rows}<div class="row"><span class="ln dash"></span>weak tie</div>${shape}`;
}

const tipEl = $("tip");
function tip(ev, html) {
  const r = $("stage").getBoundingClientRect();
  tipEl.innerHTML = html;
  tipEl.hidden = false;
  tipEl.style.left = Math.min(ev.clientX - r.left + 14, r.width - 290) + "px";
  tipEl.style.top = (ev.clientY - r.top + 14) + "px";
}
function untip() { tipEl.hidden = true; }

function nodeTip(d) {
  if (d.kind === "agent") {
    const a = S.net.agents[d.id];
    return `<b>${esc(a.name)}</b><br><span>${esc(a.role)} · ${esc(Object.keys(a.access).join(", "))}</span>`;
  }
  const p = S.model.people[d.id];
  return `<b>${esc(p.name)}</b><br><span>${esc(p.age)} · ${esc(p.occupation)} · ${esc(p.location)}</span>`;
}

function refreshSearch() {
  const opts = S.view.nodes.map(n => n.kind === "agent" ? S.net.agents[n.id].name : S.model.people[n.id].name);
  $("names").innerHTML = opts.map(o => `<option value="${esc(o)}">`).join("");
}

$("search").addEventListener("change", ev => {
  const q = ev.target.value.trim().toLowerCase();
  if (!q || !S.view) return;
  const name = n => (n.kind === "agent" ? S.net.agents[n.id].name : S.model.people[n.id].name).toLowerCase();
  const hit = S.view.nodes.find(n => name(n) === q) || S.view.nodes.find(n => name(n).includes(q));
  if (hit) focusNode(hit.id); else fail(`No one matches “${ev.target.value}”.`);
});

// ---------------------------------------------------------------- wiring

for (const b of document.querySelectorAll("[data-layer]")) b.onclick = () => setLayer(b.dataset.layer);
$("tool-pan").onclick = () => setTool("pan");
$("tool-box").onclick = () => setTool("box");
$("fit").onclick = fitAll;
$("back").onclick = back;
$("isolate").onclick = isolate;
$("exit-isolate").onclick = exitIsolate;
// The site's theme button shows a sun in light mode and a moon in dark mode.
function themeIcon() {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  document.getElementById("theme").innerHTML = `<i data-lucide="${dark ? "moon" : "sun"}"></i>`;
  if (window.lucide) lucide.createIcons();
}
$("theme").onclick = () => window.DTapTheme.toggle();
addEventListener("dtap:theme", () => { themeIcon(); if (S.model) redraw(false); });
themeIcon();

for (const [id, kind] of [["file-world", "world"], ["file-agents", "agents"]]) {
  $(id).addEventListener("change", async ev => {
    const f = ev.target.files[0];
    if (!f) return;
    try { ingest(await readFile(f), f.name); } catch (e) { fail(e.message); }
    ev.target.value = "";
  });
}

const stage = $("stage");
stage.addEventListener("dragover", ev => { ev.preventDefault(); stage.classList.add("dragover"); });
stage.addEventListener("dragleave", () => stage.classList.remove("dragover"));
stage.addEventListener("drop", async ev => {
  ev.preventDefault();
  stage.classList.remove("dragover");
  const files = [...ev.dataTransfer.files];
  try {
    const docs = await Promise.all(files.map(f => readFile(f).then(j => ({ j, name: f.name }))));
    // Worlds first, so an agent network dropped alongside its world loads after it.
    docs.sort((x, y) => (y.j.people ? 1 : 0) - (x.j.people ? 1 : 0)).forEach(d => ingest(d.j, d.name));
  } catch (e) { fail(e.message); }
});

document.addEventListener("keydown", ev => {
  if (ev.target.tagName === "INPUT") { if (ev.key === "Escape") ev.target.blur(); return; }
  const k = ev.key.toLowerCase();
  if (k === "b") setTool(S.tool === "box" ? "pan" : "box");
  else if (k === "p") setTool("pan");
  else if (k === "f") fitAll();
  else if (k === "i") (S.isolated ? exitIsolate : isolate)();
  else if (k === "/") { ev.preventDefault(); $("search").focus(); }
  else if (k === "backspace") back();
  else if (k === "escape") {
    if (S.tool === "box") setTool("pan");
    else if (S.selected || S.selection.size) clearSelection();
    else if (S.isolated) exitIsolate();
  }
});
addEventListener("resize", updateMiniView);

const EXAMPLE = "data/world/personal-01";
$("load-example").onclick = () => boot(`${EXAMPLE}.json`, "data/agents/personal-01.json");

async function boot(worldUrl, agentsUrl) {
  try {
    ingest(await fetchJSON(worldUrl), worldUrl);
    if (agentsUrl) { ingest(await fetchJSON(agentsUrl), agentsUrl); setLayer("people"); }
  } catch (e) {
    fail(`Could not load ${e.message}. Opened from file://? Serve the repo root over HTTP, or drop the files here.`);
  }
}

// Load the bundled world index and its exported JSON documents.

const API = { id: null, version: null };

async function apiJSON(url) {
  const r = await fetch(url, { cache: "no-store" });
  const body = await r.json().catch(() => null);
  if (!r.ok || body === null) throw new Error((body && body.error) || `${url}: HTTP ${r.status}`);
  return body;
}

async function openWorld(id, keep = false) {
  const ver = await apiJSON(`data/version/${encodeURIComponent(id)}.json`);
  const w = await apiJSON(`data/world/${encodeURIComponent(id)}.json`);
  const net = ver.agents != null ? await apiJSON(`data/agents/${encodeURIComponent(id)}.json`) : null;
  const prev = keep && S.model ? { layer: S.layer, selected: S.selected, selection: S.selection,
                                   isolated: S.isolated, hullOn: S.hullOn } : null;
  loadWorld(w, !prev);
  S.net = net;
  $("file-world").parentElement.classList.add("loaded");
  $("file-agents").parentElement.classList.toggle("loaded", !!net);
  if (prev) {
    // Keep the reader's place: layer, selection, isolation and outlines survive a reload.
    S.layer = prev.layer === "agents" && net ? "agents" : "people";
    const v = S.layer === "agents" ? agentView(S.model, net) : peopleView(S.model);
    const ids = new Set(v.nodes.map(n => n.id)), eids = new Set(v.edges.map(e => e.id));
    S.selection = new Set([...prev.selection].filter(i => ids.has(i)));
    S.isolated = prev.isolated ? new Set([...prev.isolated].filter(i => ids.has(i))) : null;
    if (S.isolated && !S.isolated.size) S.isolated = null;
    const sel = prev.selected;
    S.selected = !sel ? null : sel.kind === "node" ? (ids.has(sel.id) ? sel : null)
      : sel.kind === "edge" ? (eids.has(sel.id) ? sel : null)
      : sel.kind === "group" ? (S.model.groups[sel.id] ? sel : null) : (S.selection.size ? sel : null);
    S.hullOn = new Set([...prev.hullOn].filter(g => S.model.groups[g]));
  }
  syncLayerButtons();
  redraw(false);
  if (!prev) fitAll();
  API.id = id;
  API.version = JSON.stringify(ver);
  $("world-pick").value = id;
  const link = $("tasks-link"), n = (API.tasks || []).filter(t => t.world === id && t.kind !== "rt").length;  // scenarios
  link.href = `tasks.html?world=${encodeURIComponent(id)}`;
  link.textContent = n ? `${n} task${n === 1 ? "" : "s"} in this world ↗` : "No tasks in this world";
  link.hidden = !API.tasks;
}

function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (el.hidden = true), 2500);
}

async function startServerMode() {
  let worlds;
  try { worlds = await apiJSON("data/worlds.json"); } catch (_) { return; }  // static hosting: no API
  const pick = $("world-pick");
  pick.innerHTML = worlds.map(w => `<option value="${esc(w.id)}">${esc(w.id)} · ${esc(w.domain || "?")} · ` +
    `${w.people} people${w.agents ? " · agents" : ""}</option>`).join("");
  pick.hidden = !worlds.length;
  pick.onchange = () => {
    window.history.replaceState(null, "", `?w=${encodeURIComponent(pick.value)}`);
    openWorld(pick.value).catch(e => fail(e.message));
  };
  $("load-example").hidden = true;
  try { API.tasks = await apiJSON("data/tasks.json"); } catch (_) { API.tasks = null; }  // served without --tasks: no link
  if (!worlds.length) {
    document.querySelector("#empty h2").textContent = "No worlds found";
    document.querySelector("#empty p").textContent = "No worlds are available in this benchmark snapshot.";
    return;
  }
  const want = new URLSearchParams(location.search).get("w");
  const id = worlds.some(w => w.id === want) ? want : worlds[0].id;
  try { await openWorld(id); } catch (e) { fail(e.message); }

}

if (window.lucide) lucide.createIcons();  // the site's icon set
const q = new URLSearchParams(location.search);
renderPanel();
if (q.get("world")) boot(q.get("world"), q.get("agents"));
else startServerMode();

// Exposed for tests and the console.
window.topology = { state: S, ingest, setLayer, setTool, selectNode, selectEdge, selectGroup, isolate, exitIsolate, fitAll };
})();
