"use strict";

(() => {
  const embedded = window.parent !== window && new URLSearchParams(location.search).get("embed") === "1";
  const root = document.documentElement;
  root.dataset.embed = String(embedded);
  const post = message => { if (embedded) window.parent.postMessage(message, location.origin); };
  let theme = "light";
  try { theme = localStorage.getItem("theme") === "dark" ? "dark" : "light"; } catch (_) { /* storage unavailable */ }

  function setTheme(value, persist = true) {
    if (value !== "dark" && value !== "light") return;
    root.dataset.theme = value;
    if (persist) {
      try { localStorage.setItem("theme", value); } catch (_) { /* storage unavailable */ }
      post({ type: "dtap-mas:theme", theme: value });
    }
    window.dispatchEvent(new CustomEvent("dtap:theme"));
  }
  root.dataset.theme = theme;
  window.DTapTheme = { set: setTheme, toggle: () => setTheme(root.dataset.theme === "dark" ? "light" : "dark") };
  window.DTap = {
    setViewer(viewer) {
      if (viewer) root.dataset.viewer = viewer;
      else delete root.dataset.viewer;
      post({ type: "dtap-mas:viewer", viewer });
    },
    navigate(href) {
      const url = new URL(href, location.href);
      if (embedded) post({ type: "dtap-mas:navigate", url: url.href });
      else location.href = url.href;
    },
  };

  window.addEventListener("message", event => {
    if (event.origin === location.origin && event.source === window.parent && event.data?.type === "dtap:theme") {
      setTheme(event.data.theme, false);
    }
    if (event.origin === location.origin && event.source === window.parent && event.data?.type === "dtap:viewer-close") {
      window.DTap.closeViewer?.();
    }
  });
  window.addEventListener("storage", event => { if (event.key === "theme") setTheme(event.newValue, false); });

  const notifyState = () => {
    if (location.pathname.endsWith("/tasks.html")) {
      try { sessionStorage.setItem("dtap-mas:list", location.href); } catch (_) { /* storage unavailable */ }
    }
    post({ type: "dtap-mas:state", url: location.href });
  };
  const replaceState = history.replaceState.bind(history);
  history.replaceState = (...args) => { replaceState(...args); notifyState(); };
  window.addEventListener("popstate", notifyState);

  document.addEventListener("DOMContentLoaded", () => {
    const back = document.getElementById("back");
    if (location.pathname.endsWith("/task.html") && back) {
      try {
        const previous = new URL(sessionStorage.getItem("dtap-mas:list"));
        if (previous.origin === location.origin && previous.pathname.endsWith("/tasks.html")) back.href = previous.href;
      } catch (_) { /* no previous task list */ }
    }
    if (!embedded) return;
    document.addEventListener("click", event => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (link.getAttribute("href").startsWith("#") || link.target === "_blank") return;
      const url = new URL(link.href, location.href);
      const base = new URL(".", location.href).pathname;
      if (url.origin === location.origin && url.pathname.startsWith(base) && /\/(tasks|task|index)\.html$/.test(url.pathname)) {
        event.preventDefault();
        window.DTap.navigate(url.href);
      } else if (url.origin === location.origin && !url.pathname.startsWith(base)) {
        link.target = "_top";
      }
    });
    let scheduled = false;
    const resize = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        post({ type: "dtap-mas:height", height: Math.ceil(document.body.getBoundingClientRect().height) + 2 });
      });
    };
    new ResizeObserver(resize).observe(document.body);
    window.addEventListener("load", resize);
    notifyState();
    resize();
  });
})();
