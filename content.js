(() => {
  if (window.__steadyKeysLoaded) return;
  window.__steadyKeysLoaded = true;
  const onYouTube = /(^|\.)youtube\.com$/i.test(location.hostname);
  let hintMode = false, hints = [], typed = "", sequence = "", sequenceTimer, hud, hudStatus;
  let numericSequence = "", numericTimer;
  const editable = (el) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

  function ensureHud() {
    if (hud) return;
    hud = document.createElement("div");
    hud.style.cssText = "position:fixed;z-index:2147483647;right:18px;bottom:18px;padding:0;opacity:1;transition:opacity 350ms ease;pointer-events:none;";
    if (onYouTube) {
      const shadow = hud.attachShadow({ mode: "open" });
      shadow.innerHTML = `<style>
        aside{min-width:205px;padding:12px 14px;border:1px solid #64748b;border-radius:12px;background:#111827;color:#f9fafb;box-shadow:0 5px 22px #0006;font:13px/1.4 system-ui,sans-serif}
        header{margin-bottom:8px;color:#facc15;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
        .row{display:flex;align-items:center;gap:10px;margin:6px 0}
        kbd{display:inline-block;min-width:31px;padding:2px 5px;border:1px solid #4b5563;border-radius:5px;background:#1f2937;color:#fff;text-align:center;font:700 12px ui-monospace,monospace}
        #status{display:block;margin-top:8px;padding-top:7px;border-top:1px solid #374151;color:#9ca3af;font-size:10px}
      </style><aside aria-label="Constant Shortcuts"><header>Constant Shortcuts</header><div class="row"><kbd>20</kbd><span>Full screen</span></div><div class="row"><kbd>19</kbd><span>Theater mode</span></div><small id="status">Fixed YouTube shortcuts</small></aside>`;
      hudStatus = shadow.querySelector("#status");
    } else {
      hud.style.cssText += "padding:9px 13px;background:#111827;color:#fff;border:1px solid #64748b;border-radius:8px;font:13px/1.4 system-ui,sans-serif;box-shadow:0 4px 18px #0005;";
    }
    document.documentElement.append(hud);
  }

  function showHud(message) {
    ensureHud();
    if (onYouTube) hudStatus.textContent = message;
    else hud.textContent = message;
    hud.style.display = "block"; hud.style.opacity = "1"; clearTimeout(showHud.timer);
    showHud.timer = setTimeout(() => { hud.style.opacity = "0.4"; }, 2800);
  }

  function clearHints() {
    const wasHinting = hintMode;
    hintMode = false; hints.forEach(({ badge }) => badge.remove()); hints = [];
    if (wasHinting) showHud(onYouTube ? "Fixed YouTube shortcuts" : "Steady Keys · f links · F new tab");
  }

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

  function seekToDigit(digit) {
    const video = document.querySelector("video");
    if (video && Number.isFinite(video.duration) && video.duration > 0) video.currentTime = video.duration * Number(digit) / 10;
  }

  function handleYouTubeDigits(event) {
    if (!onYouTube || !/^[0-9]$/.test(event.key)) return false;
    const key = event.key;
    if ((numericSequence === "2" && key === "0") || (numericSequence === "1" && key === "9")) {
      event.preventDefault(); clearTimeout(numericTimer); numericSequence = "";
      const action = key === "0" ? ".ytp-fullscreen-button" : ".ytp-size-button";
      document.querySelector(action)?.click();
      showHud(key === "0" ? "Full screen · 20" : "Theater mode · 19");
      return true;
    }
    if (numericSequence) { clearTimeout(numericTimer); seekToDigit(numericSequence); numericSequence = ""; }
    if (key === "1" || key === "2") {
      event.preventDefault(); numericSequence = key;
      numericTimer = setTimeout(() => { seekToDigit(numericSequence); numericSequence = ""; }, 700);
      return true;
    }
    return false;
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
        else if (!possible.length) { typed = ""; showHud("No matching hint · try again or Esc"); }
        else showHud(`Hint ${typed}… · Esc to cancel`);
      }
      return;
    }
    if (editable(e.target) || e.isComposing) return;
    if (handleYouTubeDigits(e)) return;
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
  if (onYouTube) {
    document.addEventListener("fullscreenchange", () => {
      if (hud) (document.fullscreenElement || document.documentElement).append(hud);
    });
    showHud("Fixed YouTube shortcuts");
  } else showHud("Steady Keys · f links · F new tab");
})();

