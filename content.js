(() => {
  if (window.__steadyKeysLoaded) return;
  window.__steadyKeysLoaded = true;
  let hintMode = false, hints = [], typed = "", sequence = "", sequenceTimer, hud;
  const editable = (el) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
  function showHud(message) {
    if (!hud) {
      hud = document.createElement("div");
      hud.style.cssText = "position:fixed;z-index:2147483647;right:18px;bottom:18px;padding:9px 13px;background:#111827;color:#fff;border:1px solid #64748b;border-radius:8px;font:13px/1.4 system-ui,sans-serif;box-shadow:0 4px 18px #0005;";
      hud.setAttribute("aria-live", "polite"); document.documentElement.append(hud);
    }
    hud.textContent = message; hud.style.display = "block"; clearTimeout(showHud.timer);
    showHud.timer = setTimeout(() => { if (!hintMode) hud.style.display = "none"; }, 1600);
  }
  function clearHints() { hintMode = false; hints.forEach(({ badge }) => badge.remove()); hints = []; if (hud) hud.style.display = "none"; }
  function startHints(newTab) {
    clearHints();
    const targets = [...document.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,[role=button],[onclick],summary")].filter((el) => {
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !el.closest("[aria-hidden=true]");
    });
    if (!targets.length) { showHud("No links or controls here"); return; }
    hintMode = true; typed = "";
    targets.forEach((el, i) => {
      const width = String(targets.length).length, code = String(i + 1).padStart(width, "0"), r = el.getBoundingClientRect(), badge = document.createElement("span");
      badge.textContent = code;
      badge.style.cssText = `position:fixed;z-index:2147483647;left:${Math.max(0, Math.min(innerWidth - 28, r.left))}px;top:${Math.max(0, Math.min(innerHeight - 24, r.top))}px;padding:2px 5px;background:#facc15;color:#111827;border:1px solid #111827;border-radius:4px;font:bold 12px/1.2 ui-monospace,monospace;pointer-events:none;`;
      document.documentElement.append(badge); hints.push({ el, badge, code });
    });
    showHud(`Link hints · type a number · ${newTab ? "new tab" : "open"} · Esc to cancel`); startHints.newTab = newTab;
  }
  function chooseHint() {
    const match = hints.find(({ code }) => code === typed); if (!match) return false;
    const el = match.el, href = el.closest("a[href]")?.href || (el.matches("a[href]") ? el.href : null), newTab = startHints.newTab;
    clearHints();
    if (href && newTab) chrome.runtime.sendMessage({ type: "open-link", url: href, active: true });
    else if (href) location.assign(href); else el.click();
    return true;
  }
  const pageScroll = (factor) => window.scrollBy({ top: Math.round(innerHeight * factor), behavior: "smooth" });
  function onKeyDown(e) {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if (hintMode) {
      if (e.key === "Escape") { e.preventDefault(); clearHints(); return; }
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault(); typed += e.key;
        const possible = hints.filter(({ code }) => code.startsWith(typed));
        if (typed.length === hints[0].code.length && possible.length === 1) chooseHint();
        else if (!possible.length) { typed = ""; showHud("No matching hint · try again or Esc"); hud.style.display = "block"; }
        else showHud(`Hint ${typed}… · Esc to cancel`);
      }
      return;
    }
    if (editable(e.target) || e.isComposing) return;
    const k = e.key;
    if (k === "Escape") { sequence = ""; clearTimeout(sequenceTimer); return; }
    if (k === "f" || k === "F") { e.preventDefault(); startHints(k === "F"); return; }
    if (k === "j") { e.preventDefault(); window.scrollBy({ top: 80, behavior: "smooth" }); return; }
    if (k === "k") { e.preventDefault(); window.scrollBy({ top: -80, behavior: "smooth" }); return; }
    if (k === "d") { e.preventDefault(); pageScroll(.5); return; }
    if (k === "u") { e.preventDefault(); pageScroll(-.5); return; }
    if (k === "h") { e.preventDefault(); window.scrollBy({ left: -80, behavior: "smooth" }); return; }
    if (k === "l") { e.preventDefault(); window.scrollBy({ left: 80, behavior: "smooth" }); return; }
    if (k === "G") { e.preventDefault(); window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }); return; }
    if (k === "H") { e.preventDefault(); history.back(); return; }
    if (k === "L") { e.preventDefault(); history.forward(); return; }
    if (k === "J") { e.preventDefault(); chrome.runtime.sendMessage({ type: "switch-tab", direction: 1 }); return; }
    if (k === "K") { e.preventDefault(); chrome.runtime.sendMessage({ type: "switch-tab", direction: -1 }); return; }
    if (k === "g") {
      sequence += "g"; clearTimeout(sequenceTimer); sequenceTimer = setTimeout(() => { sequence = ""; }, 700);
      if (sequence === "gg") { e.preventDefault(); sequence = ""; window.scrollTo({ top: 0, behavior: "smooth" }); }
    }
  }
  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("scroll", () => { if (hintMode) clearHints(); }, { passive: true });
})();

