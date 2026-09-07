# Fluke 378 FC — Bluetooth Dashboard & Assembly Heaters Reading Entry

Offline web apps (Web Bluetooth) for the Fluke 37x FC clamp meter. No Fluke app needed.

| Page | Link (replace USERNAME / REPO) |
|---|---|
| Assembly heaters reading entry | `https://USERNAME.github.io/REPO/assembly.html` |
| Live dashboard | `https://USERNAME.github.io/REPO/index.html` |
| Telugu guide (with pictures) | `https://USERNAME.github.io/REPO/vivarana-telugu.html` |

Open on **Android Chrome**, tap **Connect meter**, pick **378FC**.
---
**This project corporates: Somu & Kiran**  
Powered by [somu.ss74@gmail.com](mailto:somu.ss74@gmail.com)

Unofficial community tool — not affiliated with Fluke Corporation.

## Google Sheet auto-save (v2026-09-04.11)
- `Code.gs` — Google Apps Script web app (paste into your Sheet → Extensions → Apps Script → Run `setup` → Deploy → Web app, access: Anyone).
- Paste the `/exec` URL in assembly.html → Setup → Google Sheet → Test connection. Every Confirm then writes a row to the **Readings** tab and fills the **Board dd-mm-yyyy Shift** tab (Excel layout). Offline readings queue on the phone and sync automatically.
- Telugu step-by-step guide: `google-sheet-telugu.html`.

## Admin lock & manual entry (v2026-09-04.12)
- Setup tab, ✎ Manual value, New day and settings need the admin password (SHA-256 hash only; never stored in plain text). 🔓 stays unlocked 8 h per phone.
- Change password in Setup → Admin: updates the phone **and** the Apps Script (Script Properties `ADMIN_HASH`) so every phone using the same Sheet gets it. Forgot it → run `resetAdminPassword` in the Apps Script editor.
- Manual values are tagged `MANUAL (name)` (italic + ✎ in app, italic + note in Sheet, `*` in the PDF).
- Developer map with `[A1]…[C7]` tags at the top of assembly.html; `[S1]` in Code.gs.

## v2026-09-04.13 — Light premium theme
- Light theme (factory brightness), premium card / button styling, bigger reading display.
- Bottom bar = single green **Confirm reading** button (Stop button removed).
- Premium admin unlock modal (inline error + shake, eye toggle).
- Auto-advance: when the last point of a line is confirmed the app jumps to the next unfinished line.

## v2026-09-04.14 — Sticky reading dock + motion
- Reading display lives in a sticky dock under the header; on scroll it shrinks to a compact bar that still shows the value and the current target (`idx/25 · name · phase`).
- Animations: value flies into the table cell, saved cell flash, Confirm button pop, target slide by direction, pulsing live dot, zero pulse, line-complete ✓ burst, page transitions. Disabled under *prefers-reduced-motion*.

## v2026-09-04.15 — Waiting screen, scroll fit, English-only UI
- "Waiting for meter" state: breathing dashes + scanning line; returns to it after Demo stop / disconnect.
- Compact dock shows the full target label; opaque header strip (no bleed-through). All Telugu strings removed from the app UI.
- Premium graphics: mesh-gradient background, glass cards, LCD texture/reflection, shimmer on Confirm.

## v2026-09-04.16 — SVG icon set, calmer notifications
- `[A4] ICONS`: inline SVG sprite (Lucide-style) after `<body>`; use `<svg class="ic"><use href="#i-name"/></svg>` in HTML or `ICO('name')` in JS. Emoji replaced everywhere (tabs, header pill, admin badge, card headings, nav/board/setup buttons, password modal, Confirm button).
- Icon animations: radar sweep while waiting, animated signal bars when live, blinking alert on stale / volts / zero, Bluetooth pulse when connected, gear spin on Setup tab, drawing check on Confirm, spinning sync icon while sending, admin badge pop on lock/unlock, eye/eye-off toggle.
- Notifications: no toast per reading (button label + cell flash + fly show it), no toast on line/point select; battery reminder only once per line; toast moved to the bottom (above Confirm) so it never covers the reading.

## v2026-09-04.17 — Industrial HMI reading panel + hold-to-delete
- `[A5] HMI PANEL`: navy control-room panel, glowing amber 7-segment style digits with ghost segments behind, LED lamps (LINK blue/amber for meter/demo, STABLE green, ZERO red blinking), 12-segment stability bar graph with %, cyan trend sparkline of the last 40 readings, glass sweep + scanlines; zero reading turns digits red with a pulsing red frame; stale → grey digits.
- `[A6] HOLD-DELETE`: press and hold any captured value in the table for 3 s → red progress ring with trash icon (vibration ticks), release/move early = cancel; when full the cell shrinks away, the reading is deleted (also from Google Sheet queue) and that point becomes the active target, so the next Confirm re-captures it. Short tap still jumps to the point.

## v2026-09-04.18 — Hold-to-delete bubble above the finger
- The 3-second delete indicator is now a callout bubble placed **above** the finger (label "Deleting <point>", big red ring with a 3-2-1 countdown, tail pointing at the cell). It flips below the finger when it would cover the reading dock, and renders above all sticky layers. Row is tinted while holding; label turns red "Deleted" with a trash icon on completion.

## v2026-09-04.19 — Reliable updates + app renamed "Assembly Dashboard"
- Renamed: title/header "Assembly Dashboard", home-screen short name "Assembly", brand mark "AD", new icons `icon-assembly-192/512.png`, manifest `id`, `start_url` and manifest link carry the version.
- Update fix: the service worker is registered as `sw.js?v=<APP_VERSION>` with `updateViaCache:'none'`, so every release installs a fresh worker even when the phone cached the old `sw.js`. Checks run on load, on foreground, every 15 min and on 'online'; a waiting worker gets `SKIP_WAITING` and the page reloads on `controllerchange`. Tapping the version tag (bottom-right) forces a check, clears caches and hard-reloads. HTML remains network-first (cache fallback offline).
- Guide `GITHUB-PAGES-Telugu.md` update section rewritten (upload → verify version on GitHub URL → phone auto-updates / tap version / clear storage; re-install once to get the new name/icon).
- Release checklist unchanged: bump `APP_VERSION` + the `v2026-…` strings (assembly.html, index.html) and `VERSION` in sw.js.

## v2026-09-04.20 — Bluetooth connect/disconnect from the header
- The header connection pill is now a button (no admin password): idle → "Not connected · Connect"; tap → meter chooser → "378FC · Disconnect" (green); tap again → disconnect. While choosing/reconnecting it shows "Cancel". Setup page keeps its own Connect / Disconnect / Demo buttons unchanged.

## v2026-09-04.21 — Review updates: disconnect confirm, open manual, AUTO capture, no minus sign, board per date+shift
- **Disconnect asks first**: header pill (connected/connecting) and Setup → Disconnect open a "Disconnect meter?" dialog (`askConfirm`, [C2]); the meter is dropped only after **Yes, disconnect**. Tapping the pill while Demo runs just stops the demo.
- **✎ Manual for everyone**: no password. Values are always identifiable as manual — purple italic ✎ in the app, *italic\** in the PDF, CSV column `manual=YES` + meter `MANUAL (name)`, Google Sheet italic + note. Setup page stays admin-only.
- **AUTO capture** (Setup → Capture settings → Capture mode = AUTO, window 2–6 s, default 3 s) — [C3b]: live value rises above the zero threshold → armed (amber bar + countdown in the target card, LCD "CAPTURING") → highest value of the window is saved through the same path as Confirm (`saveValue`: store → Sheet queue → animations → auto-advance) with a beep + vibration → "UNCLAMP" until the value returns to ~0 → "READY". Early release cancels. Confirm and Manual keep working (after a button save the same clamp cannot auto-fill the next point). 0 A points must be confirmed by hand. Setting is pushed to the Sheet settings snapshot (`capture_mode`, `auto_window_s`).
- **No minus sign anywhere**: `absStr()` strips the sign at parse time (`handleValue`), on stored/migrated values, in table/board/PDF/CSV and in `gsItem`; Code.gs `gs-2.1` `toNum_` uses `Math.abs`. Zero detection unchanged.
- **One board per Date + Shift**: storage `asm-data-v2` = `{ "yyyy-mm-dd|Shift": { data, batt } }` (old `asm-data-v1`/`asm-batt-v1` migrated once into the current date+shift). Changing Date or Shift on the Entry page opens that board (new = empty, toast "New empty board"); the Board page has a **Board** picker listing every saved board; "Clear this board" (admin) clears only the open board; up to 90 boards kept on the phone (older ones stay in the Sheet). Opening the app on a later day switches to today's board automatically (unless the date was picked by hand in the last 10 h or the board was used in the last 5 h — night shift). Choosing a new shift while an old date is showing starts that shift **today**. Google Sheet keeps one tab per date+shift as before; "Send this board to Sheet" sends the open board.
- Files: assembly.html (APP_VERSION 2026-09-04.21), sw.js `v21`, manifest start_url, index.html footer/SW string, Code.gs `gs-2.1` (also embedded in google-sheet-telugu.html), guide text updated.

## v2026-09-04.22 — AUTO switch on the Entry page
- New **AUTO** toggle button in the bottom bar next to Confirm (operator control, no password): OFF → ON turns hands-free capture on immediately; the button shows the scan window ("3 s"), pulses "SCAN…" while a window is running and pops when a value is saved. Setup → Capture mode stays in sync (same `set.auto`).
- **Scan window chips 3 s / 4 s / 5 s** in the Navigation card (Setup still allows 2–6). Flow: clamp on → scan 3–5 s → highest value saved (beep + vibration, "Auto ✔ 20.4 A") → next point → unclamp → clamp next point → again.
- Confirm button label shortened to "Confirm" while AUTO is on so both buttons fit on a 360 px phone; saved label "Auto ✔ 20.4 A".
- Versions: APP_VERSION 2026-09-04.22, sw.js `v22`, manifest start_url, index.html strings.

## v2026-09-04.23 — Professional manual-entry sheet, fixed 4 s AUTO window, quieter dashboard
- **✎ Manual** now opens a styled sheet (`askManual`, [C2]) instead of the browser prompt: Line / component / phase badge, large numeric field (decimal keypad, unit A), current value shown, inline validation with shake, purple "Save" button, MANUAL tag reminder. Enter = save, Esc = cancel. Saved value pops on the Confirm button ("✎ 7.5 A").
- **AUTO scan window fixed at 4 s** (`AUTO_SEC`); the 3/4/5 chips and the Setup window field were removed. Switch shows "ON · 4 s" / "SCAN…".
- **Fewer messages**: removed the battery-type warning, line-complete/all-complete toasts (the burst animation stays), early-release / signal-lost / paused toasts, battery-chip toast, long AUTO on/off toasts; shortened the target-card hints ("Clamp on and hold 4 s", "Saved 25.6 A · 09:43 ✎"), navigation hint (one line), LCD waiting hint, board-page note, connection toasts, line/progress counters.
- Versions: APP_VERSION 2026-09-04.23, sw.js `v23`, manifest start_url, index.html strings.

## v2026-09-04.24 — Lead pot phase-imbalance ERROR
- Rule (Lead pot only, `IMB_COMP`): once R, Y and B are captured, a phase more than **6 A** (Setup → "Lead pot imbalance limit", 1–30) below the highest phase is an error. 25/25/16 → B is 9.0 A low → error; 25/22/19 → OK; a zero phase keeps the zero rule (red), not orange. Functions `imbCheck / isImb / imbText / imbAlert` next to `isZero` in [C1].
- Where it shows: capture time (Confirm, AUTO or Manual) → orange **ERROR** pop-up "Lead pot — phase imbalance · Line 1 · R 25 / Y 25 / B 16 · Phase B is 9.0 A lower than the highest phase · Limit 6 A · check the heater / connection, then re-capture" + long vibration + error tone; Entry table and Board → orange ⚠ cell; Remarks → "PHASE IMBALANCE ERROR: L1-B (25/25/16)"; PDF → orange cell, legend, "Phase imbalance errors: n" in the header; CSV → new last column `error` = PHASE IMBALANCE; Google Sheet (Code.gs **gs-2.2**) → orange cell, remark "L1 B PHASE IMBALANCE ERROR", new Readings column O `error`. Re-capturing within the limit clears everything (the other two Lead pot phases are re-sent to the Sheet so their colour updates).
- Versions: APP_VERSION 2026-09-04.24, sw.js `v24`, manifest start_url, index.html strings, Code.gs gs-2.2 (embedded copy in google-sheet-telugu.html updated).

## v2026-09-04.28 — Floating chat bubble + full-screen Insights chat
- **Round chat bubble** (bottom-right, every page; above the Confirm bar on Entry) opens the Insights chat **full screen** — WhatsApp-style header (bot avatar, board strip with 7 line dots), bot bubbles left / questions right, typing dots, chips, round input with optional 🎤 (when the Voice feature is on), phone Back closes it. `[B9]` markup · `[D0d]` CSS · `[D5]` JS.
- **Red badge** on the bubble = number of *new* abnormal readings (zero / error / out-of-range) since the chat was last opened, per board (`asm-ui-v1.seen`). No sound, no pop-up, no toast.
- **⋮ Chat options** (in the window and on the Board card, **no password** — per phone): *Chat bubble on screen* ON/OFF · *Badge on abnormal reading* ON/OFF · *Share whole chat* (one WhatsApp message) · *Clear chat* · *Help*. Admin master switch unchanged: Setup → Features → *Insights chat* hides bubble + card.
- The Board card and the window share **one** chat DOM (moved in/out) — one history, one logic. Bubble hides automatically behind pop-ups / sheets and in print.

## v2026-09-04.27 — Share sheet fix (WhatsApp / Drive) + Insights chat
- **Share report now opens the phone's share sheet** (WhatsApp, Drive, Gmail…). Root cause of the old "only a download" behaviour: Android Chrome shows the share sheet only when `navigator.share()` runs *inside the tap*; building the PDF first (an `await`) lost the tap. Now the PDF is prepared in the background after every board change (`pdfPrepare()`, cached by `pdfKey()`) and `sharePdf()` shares the cached file synchronously.
- If the browser cannot share files (or the share fails), a **"Report ready"** sheet appears: *Share PDF* · *Save PDF to phone* (Downloads) · *WhatsApp text summary* (`wa.me`). Cancelling the share sheet is silent.
- **Insights bot → chat window** (`#botChat`): bot bubbles on the left, your questions on the right, *Copy* + *WhatsApp* per answer, quick chips (Abnormal now? · Repeated problems · Trends · Vs previous board · What is pending? · Help) and a typed question box. Per board: one opening remark, one *Update* bubble when the abnormal set changes, one *Board complete* bubble. Still rule-based, offline, ₹0 — no data leaves the phone. Switch: Setup → Features → *Insights chat*.
- Fix: "repeated problems" was answered by the *abnormal* rule (word "problem" matched first); intent order corrected.

## v2026-09-04.26 — Digital signatures, built-in one-page PDF, Insights bot
- **Share report (PDF) = built-in PDF writer** (`[D3]` `class Pdf`, `shiftPdf()`, `sharePdf()`): the app writes the A4-landscape PDF itself — always **exactly one page** — with Helvetica text (WinAnsi widths table `PDF_W`), coloured cells (red zero / orange ! imbalance / yellow ^v range / grey NA, `*` = manual), remarks, legend, the three signature PNGs (RGB + SMask XObjects) and the credit line, then opens the **Web Share sheet** (WhatsApp / Drive / Files) or falls back to a download. Android's print service (which chose Letter/portrait and spilled to 2 pages) is no longer involved. Fallback on error: `printNow()`.
- **Print CSS fix** (still used by the Period report and the browser-print fallback): `fitReport()` measures the report at page width and sets `--rs` (CSS `zoom`) so the shift report fits one page; `html,body{height:auto;overflow:visible}`, `#report *{overflow:visible}`, rows never split, `thead` repeats. The **period report** (`#report.multi`) paginates normally over as many pages as needed.
- **bot** Insights (feature switch, ON) — `[B8]`/`[D4]`: quiet card on the Board (no pop-ups, no toasts, no internet). Rule-based over the last 10 boards on the phone: **Abnormal now?** (zero / imbalance / range / NA of the open board), **Repeated problems** (points failing ≥ 2 of the last 10 boards), **Trends** (monotonic ≥ 15 % change over the last 3–5 values), **Vs previous board** (jumps ≥ 25 % and ≥ 2 A), **What is pending?** (missing points per line, next signature, unresolved issues, unsent Sheet rows) and free text ("line 3", "H-2 R", "lead pot"). Copy button for chat. Optional Gemini free-text mode is NOT included (₹0, offline by design).
- **sign** Digital signatures (feature switch, ON) — Board → **Signatures** card with three steps in order **1 Operator → 2 Supervisor → 3 In-charge**. Each step opens a pen pad pop-up (`askSignature`): name (pick / type), finger or stylus drawing on a canvas with speed/pressure-based line width (real-pen look, navy ink), confirmation tick, **Save signature** → cropped transparent PNG stored per board (`boards[key].sig = {op|sup|inc: {name, img, t, pts}}`). Operator may sign an incomplete board after a confirm; the report then says "signed with 172/175".
- PDF report bottom: three signature boxes — ink image on the line, **name**, role · date time (or "— not signed"). Feature OFF → plain Operator / Supervisor / In-charge lines as before. Summary text gets a "Signed:" line.
- **Signed board guard** (`sigGuard`) — Confirm / Manual / NA / delete / hold-delete / AUTO on a signed board first asks "Board is signed … remove signatures and edit?"; Yes clears the signatures (all must sign again), No keeps everything. Clear-board also removes signatures. Signatures stay on the phone + PDF only (not sent to the Sheet).
- Developer map: `[B7]` sign card, `[B8]` Insights card, `[D0b]`/`[D0c]` CSS, `[D2]` print-fit + pen pad, `[D3]` PDF writer, `[D4]` bot rules. Tests: `.gs-test/test_v26.py` (31) + `test_v26b.py` (PDF writer + bot, 19) + `test_v25.py` (14 features) + `test_regress.py` — all FAILS: none.
- Versions: APP_VERSION 2026-09-04.26, sw.js `v26`, manifest start_url, index.html strings. Code.gs unchanged (gs-2.3).

## v2026-09-04.25 — Phase 2 "maintenance pack" (12 switchable features)
Every Phase 2 feature has an ON/OFF switch in **Setup → Features (Phase 2)** (`set.f`, all ON by default). Switching one OFF hides it everywhere (elements carry `data-f="key"` → class `.foff`); data is never deleted.
- **hist** History & trend — bottom sheet with past values of a point (all boards on the phone + "Load 90 days from Sheet"), trend tag (falling / rising / steady), MIN/MAX lines. Entry → **History** button, or tap any value on the Board.
- **sum** Shift summary card on the Board — points / lines / zero / errors / range / NA tiles, operator + duration, **Copy summary** / **Share** (Web Share API) text for WhatsApp.
- **cmp** Δ vs previous board — small ▲▼ under each Board value against the previous board (same shift preferred); toggle chip.
- **iss** Issues tab (with red badge) — zero / ERROR / RANGE / NA cards of the open board: **Go to point**, **Mark resolved** (reason chips + note → Remarks "RESOLVED ✔"), re-open.
- **photo** Photo on an issue → Apps Script `photo` action → Drive folder "Assembly Heaters photos" (link stored with the issue).
- **na** NA / Skip with reason (Line down, Heater removed, No power, Under maintenance, Not accessible, Other) — grey **NA** cell, Remarks "NA: L1-R Line down", CSV `na_reason`, Sheet column P + grey cell.
- **rng** Expected range per component (Setup → Expected range, MIN/MAX, blank = no check) — yellow ▲/▼ cell, short toast at capture, Remarks "OUT OF RANGE", CSV `range`, Sheet column Q + yellow cell. Priority per cell: NA > zero > imbalance > range.
- **period** Period report — bottom sheet (Last 7 days / This month / Last month / custom) → A4 PDF: per-shift table, per-point averages with 0×/⚠/▲ counts, repeated problems.
- **live** Live board — Board pulls other phones' readings for the open date+shift from the Sheet (`board` action) every 30 s; shown with ☁ (local value always wins), counted in the summary.
- **pin** Operator sign-in — Setup → Operators & PINs (`Name | PIN`, 4–6 digits, stored as SHA-256 `asm-op|name|pin` in `asm-ops-v1`); Entry shows a name list + PIN instead of the free-text box; sign-in lasts 12 h.
- **voice** Voice value entry — mic button in the Manual pop-up (Web Speech API, en-IN); `speechToNum()` parses "twenty five point six" → 25.6; operator confirms before Save.
- **mail** Daily e-mail summary — Setup → Daily e-mail (addresses + hour) → Apps Script `mailcfg` installs a daily trigger (`dailySummaryJob`); **Send test now** = `mailtest`. Summary: per-shift readings / zero / errors / range / NA / resolved + open issues + Sheet link.
- Code.gs **gs-2.3**: Readings columns P `na_reason` · Q `range` · R `resolved`; Board tab grey NA / yellow range cells, Remarks NA / range / RESOLVED; actions `board`, `history`, `photo`, `mailcfg`, `mailtest`; `setup()` now also requests Gmail + Drive permission (run it once more after pasting).
- CSV header: `…,manual,error,na_reason,range,resolved`. Settings snapshot adds `features`, `expected_range_a`, `operators`, `daily_mail_to`.
- Versions: APP_VERSION 2026-09-04.25, sw.js `v25`, manifest start_url, index.html strings, Code.gs gs-2.3 (re-deploy: Manage deployments → New version).
