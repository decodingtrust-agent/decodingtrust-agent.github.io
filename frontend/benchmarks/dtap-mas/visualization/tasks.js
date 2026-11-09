/* DTap-MAS task cards with URL-backed search, type, domain and risk-category filters. */
"use strict";

const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const DOMAIN_LABELS = { personal: "Personal", coding: "Coding" };
const DOMAIN_ICONS = { personal: "users", coding: "code-xml" };
const MAX_VISIBLE_TAGS = 3, ITEMS_PER_PAGE = 60;  // as on the site
const titled = slug => slug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

// The site's theme button: a sun in light mode, a moon in dark mode
function themeIcon() {
  const r = document.documentElement;
  const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  $("theme").innerHTML = `<i data-lucide="${dark ? "moon" : "sun"}"></i>`;
  if (window.lucide) lucide.createIcons();
}

let all = [], page = 1;
const F = { q: $("q"), type: $("f-type"), domain: $("f-domain"), category: $("f-category") };

function card(t) {
  const isRedTeam = t.type === "rt";
  const tags = t.tags || [], shown = tags.slice(0, MAX_VISIBLE_TAGS), more = tags.length - shown.length;
  const text = isRedTeam && t.malicious_goal ? t.malicious_goal : t.task_instruction;
  return `<a class="card" href="task.html?t=${encodeURIComponent(t.id)}">
    <div class="top"><h3>${esc(t.task_id)}</h3><i data-lucide="square-arrow-out-up-right"></i></div>
    <div class="badges">
      <span class="domain"><i data-lucide="${DOMAIN_ICONS[t.domain] || "terminal"}"></i>${esc(DOMAIN_LABELS[t.domain] || t.domain)}</span>
      <span class="type ${t.type}">${isRedTeam ? "Red-Teaming" : "Benign"}</span>
    </div>
    <p class="desc">${esc((text || "").trim())}</p>
    <div class="foot">
      <p class="by">${t.principals} principals · ${t.agents} agents · ${t.people} people</p>
      <div class="foot-row">
        <div class="tags">${shown.map(x => `<span class="tag">#${esc(x)}</span>`).join("")}${more > 0 ? `<span class="more">+${more}</span>` : ""}</div>
        <span class="source">Source</span>
      </div>
    </div>
  </a>`;
}

function orderTasks(tasks) {
  const sorted = [...tasks].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const pinned = sorted.filter(t => t.has_trajectory && t.type === "rt");
  const seen = new Set(pinned.map(t => `${t.domain}/${t.category_slug}`));
  const featured = [], rest = [];
  for (const task of sorted.filter(t => t.type === "rt" && !t.has_trajectory)) {
    const category = `${task.domain}/${task.category_slug}`;
    if (seen.has(category)) rest.push(task);
    else { seen.add(category); featured.push(task); }
  }
  const queues = ["personal", "coding"].map(domain => featured.filter(t => t.domain === domain));
  const representatives = [];
  while (queues.some(queue => queue.length)) for (const queue of queues) if (queue.length) representatives.push(queue.shift());
  return [...pinned, ...representatives, ...rest, ...sorted.filter(t => t.type === "benign")];
}

function render() {
  const q = F.q.value.trim().toLowerCase(), world = new URLSearchParams(location.search).get("world");
  const list = all.filter(t => (!F.type.value || t.type === F.type.value)
    && (!F.domain.value || t.domain === F.domain.value)
    && (!F.category.value || t.category_slug === F.category.value)
    && (!world || t.world === world)
    && (!q || [t.task_id, t.id, t.title, t.task_instruction, t.malicious_goal, t.category_slug, t.scenario]
      .some(x => (x || "").toLowerCase().includes(q))));
  const pages = Math.max(1, Math.ceil(list.length / ITEMS_PER_PAGE));
  page = Math.min(page, pages);
  $("grid").innerHTML = list.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map(card).join("");
  $("empty").hidden = list.length > 0;
  $("pages").hidden = pages < 2;
  $("pages").innerHTML = Array.from({ length: pages }, (_, i) =>
    `<button class="${i + 1 === page ? "on" : ""}" data-page="${i + 1}">${i + 1}</button>`).join("");
  const active = Object.entries(F).filter(([, el]) => el.value);
  $("clear").hidden = !active.length && !world;
  for (const [k, el] of Object.entries(F)) if (k !== "q") el.classList.toggle("on", !!el.value);
  const p = new URLSearchParams(Object.fromEntries(active.map(([k, el]) => [k, el.value])));
  if (world) p.set("world", world);
  if (page > 1) p.set("page", page);
  history.replaceState(null, "", p.toString() ? "?" + p : location.pathname);
  if (window.lucide) lucide.createIcons();
}

async function boot() {
  themeIcon();
  $("theme").onclick = () => window.DTapTheme.toggle();
  addEventListener("dtap:theme", themeIcon);
  $("copy").onclick = async () => {
    try { await navigator.clipboard.writeText($("cmd").textContent); } catch (_) { return; }
    $("copy").innerHTML = `<i data-lucide="check"></i>`; lucide.createIcons();
    setTimeout(() => { $("copy").innerHTML = `<i data-lucide="copy"></i>`; lucide.createIcons(); }, 1500);
  };
  try {
    const response = await fetch("data/tasks.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    all = (await response.json()).filter(t => t.kind === "benign" || t.kind === "rt");
  } catch (e) {
    $("error").textContent = "Could not load benchmark tasks: " + e; $("error").hidden = false; return;
  }
  all = orderTasks(all);
  const opts = (label, xs, name = x => x) => `<option value="">${label}</option>` +
    [...new Set(xs)].sort().map(x => `<option value="${esc(x)}">${esc(name(x))}</option>`).join("");
  F.domain.innerHTML = opts("All domains", all.map(t => t.domain), d => DOMAIN_LABELS[d] || d);
  F.category.innerHTML = opts("All risk categories", all.filter(t => t.category_slug).map(t => t.category_slug), titled);
  const q = new URLSearchParams(location.search);
  if (q.get("type") === "malicious") q.set("type", "rt");
  for (const [k, el] of Object.entries(F)) if (q.get(k)) el.value = q.get(k);
  page = +q.get("page") || 1;
  F.q.oninput = () => { page = 1; render(); };
  for (const [k, el] of Object.entries(F)) if (k !== "q") el.onchange = () => { page = 1; render(); };
  $("clear").onclick = () => {
    for (const el of Object.values(F)) el.value = "";
    history.replaceState(null, "", location.pathname); page = 1; render();
  };
  $("pages").onclick = e => { const b = e.target.closest("button"); if (b) { page = +b.dataset.page; render(); scrollTo(0, 0); } };
  render();
}
boot();
