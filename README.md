# Steady Keys

A small Chrome Manifest V3 extension for Vimium-style page navigation. Its in-page shortcuts are hard-coded in `content.js`; there is no settings page or remapping system.

## Install in Chrome

1. Open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Choose **Load unpacked** and select this folder (the repository root).
4. Reload any pages that were already open.

## Fixed keys

| Key | Action |
| --- | --- |
| `j` / `k` | Scroll down / up |
| `d` / `u` | Scroll down / up by half a screen |
| `h` / `l` | Scroll left / right |
| `gg` / `G` | Go to top / bottom |
| `H` / `L` | Back / forward in page history |
| `J` / `K` | Next / previous tab in the current window |
| `f` / `F` | Show numbered targets / open selected link in a new tab |
| `Esc` | Cancel link hints |
| 20 on YouTube | Toggle full screen |
| 19 on YouTube | Toggle theater mode |

Keys are ignored while typing in inputs, textareas, selects, or editable regions. Chrome reserves some pages and keystrokes; extensions cannot run on Chrome internal pages, the Chrome Web Store, or browser UI. Browser and operating-system shortcuts can also take precedence.

On YouTube, a fixed shortcut panel stays in the lower-right corner and dims after 2.8 seconds. Type `20` to toggle full screen or `19` to toggle theater mode. A lone `1` or `2` still seeks to 10% or 20%, after a short 700 ms wait so the two-key shortcuts can be recognized.

The extension requests the `tabs` permission to switch tabs and open links in new tabs. It does not read or store browsing history.




