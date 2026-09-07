# మీ ప్రశ్నలు — పూర్తి జవాబులు (Telugu)

> Fluke 378 FC → ఫోన్ dashboard గురించి మీరు అడిగిన ప్రతి ప్రశ్నకి ఇక్కడ జవాబు ఉంది.

---

## ప్రశ్న 1: ఇది నిజంగా పనిచేస్తుందా? (Real work or not?)

**అవును — నిజంగా పనిచేస్తుంది.** ఇది నా ఊహ కాదు; ఇద్దరు వేర్వేరు వ్యక్తులు నిజమైన మీటర్ మీద test చేసి, results బయట పెట్టారు:

| ఎవరు | ఎప్పుడు | ఏం చేశారు | Proof |
|---|---|---|---|
| **LambdaFox** (blog) | Aug 2024 | కొత్త Fluke 376 FC కొని, Python తో Bluetooth data చదివి, Qt GUI లో చూపించారు. Screenshots + code publish చేశారు | lambdafox.com/clamp-connect |
| **zach-edf** (GitHub) | Mar–Apr 2026 | పూర్తి desktop app + CLI + SDK రాశారు. **Mar 28, 2026 న నిజమైన 376 FC మీద** scan, live stream, SQLite logging, CSV/JSON export, chart export అన్నీ validate చేశారు | github.com/zach-edf/fluke-app |

**వాళ్ళు కనుగొన్నది:** మీటర్ తన display text ని **సాదాగా (encrypt చేయకుండా)** Bluetooth లో పంపుతుంది. ఉదా: `"   0.7 A  dc"`.

**ఒక్క నిజాయితీ గమనిక:** ఆ ఇద్దరూ **376 FC** మీద test చేశారు. మీది **378 FC**. రెండూ ఒకే family (377/378 FC ఒకే manual, ఒకే Bluetooth radio, ఒకే Fluke Connect app). కాబట్టి 378 లో కూడా same అయ్యే అవకాశం **చాలా ఎక్కువ** — కానీ మీ మీటర్ మీద మొదటి connect లో మీరే confirm చేయాలి. వేరుగా ఉంటే 5 నిమిషాల fix ఉంది (ప్రశ్న 7 చూడండి).

**నేను చేయలేనిది:** నా దగ్గర మీటర్ లేదు కాబట్టి నేను స్వయంగా test చేయలేదు. Code ని syntax check చేశాను, Demo mode తో logic test చేశాను, కానీ **నిజమైన మీటర్ తో మొదటి test మీరే చేయాలి.**

---

## ప్రశ్న 2: ఏ apps కావాలి? (Any apps?)

### మీ ఫోన్‌లో (dashboard వాడటానికి):

| App | కావాలా? | ఎందుకు |
|---|---|---|
| **Google Chrome** | ✅ తప్పనిసరి | ఇందులోనే Web Bluetooth ఉంది. Android ఫోన్లలో ఇప్పటికే ఉంటుంది |
| **Fluke Connect** | ❌ వద్దు | మన dashboard దీన్ని replace చేస్తుంది. Connect చేసేటప్పుడు ఇది **close** చేసి ఉంచాలి |
| **nRF Connect for Mobile** | ⚠️ అవసరమైతే మాత్రమే | Connected అయ్యి కూడా అంకె రాకపోతే UUID చూడటానికి (free, Nordic Semiconductor) |
| ఇంకేదైనా app / installation | ❌ వద్దు | — |

### Laptop లో (ఒక్కసారి, files upload చేయడానికి):
- ఏ browser అయినా → **app.netlify.com/drop** (free website). Install ఏమీ లేదు.

### Laptop లో నిరంతర logging కావాలంటే (optional, advanced):
- **Python 3.11+** + GitHub project (ప్రశ్న 6 చూడండి).

---

## ప్రశ్న 3: Script అంటే ఏమిటి? నేను రాయాలా? (Any script?)

**మీరు ఏమీ రాయనవసరం లేదు.** అంతా నేను రాశాను.

"Script" అంటే computer కి ఇచ్చే instructions. మన `index.html` file లో మూడు భాగాలు ఉన్నాయి:

```
index.html
 ├── HTML   → ఏమేం కనిపించాలి (బటన్లు, అంకె, table)
 ├── CSS    → ఎలా కనిపించాలి (రంగులు, sizes)
 └── JavaScript (= script) → ఏం చేయాలి:
       1. Chrome ని అడుగు: "Bluetooth device కి connect అవ్వు"
       2. మీటర్ నుంచి వచ్చే text ని చదువు
       3. అందులో అంకె, unit (A/V/Ω), mode (dc/ac) వేరు చేయి
       4. పెద్దగా చూపించు, graph గీయి, table లో పెట్టు
       5. ఫోన్‌లో save చేయి, CSV తయారు చేయి
```

Script లో అసలు "మంత్రం" ఈ 3 lines మాత్రమే (మిగతా అంతా display కోసం):

```javascript
// 1. Chrome device list చూపిస్తుంది, మీరు 378FC select చేస్తారు
device = await navigator.bluetooth.requestDevice({ filters: [{ services: [SERVICE_UUID] }] });

// 2. మీటర్ లోపల reading ఉండే "పెట్టె" ని పట్టుకో
chr = await (await device.gatt.connect()).getPrimaryService(SERVICE_UUID).getCharacteristic(CHAR_UUID);

// 3. మీటర్ కొత్త reading పంపిన ప్రతిసారీ ఈ function నడుస్తుంది
chr.addEventListener('characteristicvaluechanged', e => handleValue(e.target.value));
await chr.startNotifications();
```

**మీరు మార్చాల్సింది ఏమీ లేదు.** UUID వేరుగా ఉంటే కూడా code లో కాదు — page లోని **Advanced** box లో paste చేస్తే చాలు.

---

## ప్రశ్న 4: Data ఎలా save అవుతుంది? (How data save?)

Dashboard లో **3 levels** లో data ఉంటుంది:

### Level 1 — Screen మీద (live)
పెద్ద అంకె, Min/Max/Avg, graph — connect అయినప్పటి నుంచి. Page reload చేస్తే stats reset అవుతాయి.

### Level 2 — ఫోన్ లోపల automatic save ✅ (కొత్తగా add చేశాను)
- ప్రతి reading **automatic గా ఫోన్ browser storage లో** save అవుతుంది (దీన్ని *localStorage* అంటారు).
- Page close చేసినా, meter disconnect అయినా, ఫోన్ restart అయినా — **data పోదు.**
- మళ్ళీ page open చేస్తే: *"Restored 128 saved readings"* అని చూపిస్తుంది, table లో పాత readings ఉంటాయి.
- చివరి **5000 readings** ఉంచుతుంది (సెకనుకు 1 reading అయితే ~1.5 గంటలు; అంతకంటే ఎక్కువ కావాలంటే మధ్యలో CSV export చేయండి).
- **🗑 Clear saved** బటన్ నొక్కితేనే delete అవుతుంది.
- Internet కి ఏమీ వెళ్ళదు. అంతా మీ ఫోన్‌లోనే.

### Level 3 — CSV file (శాశ్వతం, share చేయడానికి)
- **⬇ Export CSV** నొక్కితే ఫోన్ **Downloads** folder లో file వస్తుంది: `fluke_log_2026-09-03T15-20-01.csv`
- ఇందులో columns: `timestamp, value, unit, mode, raw_text, raw_hex`
- Excel / Google Sheets లో open అవుతుంది → graph వేయవచ్చు, report చేయవచ్చు.
- WhatsApp / Email లో share చేయవచ్చు.

```
మీటర్ → [Screen: live]  →  [ఫోన్ storage: automatic, 5000 readings]  →  [CSV: మీరు నొక్కినప్పుడు, శాశ్వతం]
```

**Cloud / Google Sheets లో automatic save కావాలంటే:** అది కూడా సాధ్యమే, కానీ దానికి internet కావాలి + Google Apps Script setup (~20 నిమిషాలు). కావాలంటే చెప్పండి, తర్వాత add చేస్తాను.

---

## ప్రశ్న 5: ఎలా వాడాలి? (How to use — క్లుప్తంగా)

### ఒక్కసారి setup (10 నిమిషాలు)
1. `fluke-dashboard` folder లోని files download: `index.html`, `sw.js`, `manifest.json`, `icon-192.png`, `icon-512.png`
2. Laptop → **app.netlify.com/drop** → free account → folder drag & drop → link వస్తుంది (`https://xxx.netlify.app`)
3. ఫోన్ **Chrome** లో ఆ link open → పైన **"✔ offline ready"**
4. Chrome menu ⋮ → **Add to Home screen** → "Fluke Dash" icon
5. Bluetooth ON; Location/Nearby devices permission → Allow
6. **▶ Demo mode** నొక్కి practice

### రోజూ (1 నిమిషం)
1. మీటర్ ON → **F బటన్** → display లో Bluetooth గుర్తు
2. ఫోన్ → **Fluke Dash** → **🔵 Connect meter**
3. List లో **378FC** → **Pair**
4. పచ్చ చుక్క = connected → live అంకె
5. అయ్యాక **⬇ Export CSV** → **Disconnect**

(పూర్తి బొమ్మలతో వివరణ: `vivarana-telugu.html`)

---

## ప్రశ్న 6: GitHub project — పూర్తి వివరణ

**Link:** https://github.com/zach-edf/fluke-app
**పేరు:** Fluke Community Desktop
**License:** MIT (free, open source — ఎవరైనా వాడవచ్చు, మార్చవచ్చు)
**Fluke తో సంబంధం:** లేదు — unofficial community project

### ఇది ఏమిటి?
Laptop/PC కోసం ఒక **పూర్తి desktop application** — మన HTML dashboard కంటే చాలా ఎక్కువ features. Python లో రాశారు.

### మన dashboard vs GitHub project

| | మన `index.html` | GitHub `fluke-app` |
|---|---|---|
| ఎక్కడ నడుస్తుంది | **Android ఫోన్** (Chrome) | **Laptop/PC** (Windows/Mac; Linux untested) |
| Install | ఏమీ లేదు — link open చేస్తే చాలు | Python 3.11+ install, 5–6 commands |
| Live reading | ✅ | ✅ |
| Graph | ✅ (చివరి 240) | ✅ (full session, PNG export) |
| Data save | ఫోన్ storage (5000) + CSV | **SQLite database** (unlimited) |
| Export | CSV | CSV, JSON, analysis CSV, chart PNG, debug bundle |
| Sessions (title, notes, markers) | ❌ | ✅ |
| పాత sessions replay / compare | ❌ | ✅ |
| Guided workflows (battery check, solar test…) | ❌ | ✅ |
| రాత్రంతా background logging | ❌ (page open ఉండాలి) | ✅ (laptop on ఉంటే చాలు) |
| Offline | ✅ | ✅ |
| Field లో పని (pocket లో) | ✅ best | ❌ laptop మోయాలి |
| Real hardware test | ఇంకా లేదు (376 findings మీద ఆధారం) | ✅ 376 FC మీద validated (Mar 28, 2026) |
| 378 FC support | default UUIDs 376 వి; Advanced లో మార్చవచ్చు | profile `fluke_376fc` మాత్రమే; 378 కి కొత్త profile plugin రాయాలి (docs ఉన్నాయి) |

**సారాంశం:** Field లో రోజువారీ పనికి → మన dashboard. Office/lab లో గంటల తరబడి logging, reports → GitHub project.

### GitHub project లో ఏమేం చేయవచ్చు (వాళ్ళ docs ప్రకారం)
- దగ్గరలోని Fluke మీటర్ల కోసం scan
- Connect అయ్యి live readings stream
- Sessions ని SQLite database లో record
- Markers, notes add చేయడం (ఉదా: "ఇక్కడ motor start అయింది")
- పాత sessions replay, compare
- Session data, charts export
- Guided workflows (Battery Pack Check, Solar Panel Test, Charger Output Check, Continuity Checklist)
- కొత్త device profiles / plugins (378 FC కి ఇక్కడే add చేయాలి)

### Data ఎక్కడ save అవుతుంది (GitHub project)
SQLite database file:
- Windows: `%LOCALAPPDATA%\fluke-community\fluke.db`
- macOS: `~/Library/Application Support/fluke-community/fluke.db`
- Linux: `~/.local/share/fluke-community/fluke.db`

ఒక session లో: session id, device id, title, notes, tags, start/end time, **అన్ని readings**, అన్ని markers.

Exports (Session tab నుంచి): `session-<ID>.csv`, `session-<ID>.json`, `session-<ID>-analysis.csv`, `session-<ID>-segments.json`, chart PNG.

### Install ఎలా (Windows — వాళ్ళ docs నుంచి)

**ముందుగా:** Python 3.11 లేదా కొత్తది install (python.org → "Add to PATH" tick చేయండి). Laptop లో Bluetooth ఉండాలి.

```powershell
# 1. Project download
git clone https://github.com/zach-edf/fluke-app.git
cd fluke-app
# (git లేకపోతే: GitHub page లో Code → Download ZIP → extract → ఆ folder లో PowerShell open)

# 2. Virtual environment (project కి separate Python space)
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. అవసరమైన libraries install
python -m pip install --upgrade pip
python -m pip install -r requirements-full.txt
python -m pip install -e .

# 4. Desktop app start
fluke-desktop
```

(Mac/Linux లో step 2 లో `source .venv/bin/activate` వాడండి.)

### Desktop app లో మొదటిసారి (వాళ్ళ recommended path)
1. App launch → **Device Discovery** tab
2. **Scan** → list లో మీటర్ → select → **Connect**
3. **Live Reading** tab → values update అవుతున్నాయా చూడండి
4. Session title, notes type చేయండి → **Start Logging**
5. మధ్యలో ఏదైనా event అయితే **marker** add చేయండి
6. **Stop Logging**
7. **Session** tab → saved run చూడండి → **Export** (CSV/JSON/PNG)
8. **Workflows** tab → guided steps కావాలంటే

### CLI (command line) — quick test కి
```powershell
fluke scan --timeout 10                                  # మీటర్ కనిపిస్తుందా?
fluke stream --device "<DEVICE_ID>" --profile fluke_376fc  # live readings terminal లో
fluke log --device "<DEVICE_ID>" --profile fluke_376fc --duration 15 --title "First session"
fluke sessions list                                      # saved sessions
```
(`<DEVICE_ID>` = scan లో వచ్చిన address)

### ⚠️ 378 FC కి ముఖ్యమైన గమనిక
Project లో built-in profile **`fluke_376fc` మాత్రమే**. మీ 378 FC తో:
- Data format same అయితే (అవకాశం ఎక్కువ) → `--profile fluke_376fc` తోనే పనిచేయవచ్చు; device name match కోసం చిన్న మార్పు అవసరం కావచ్చు.
- పనిచేయకపోతే → వాళ్ళ `docs/developer/new-device-profile.md` ప్రకారం కొత్త profile plugin రాయాలి (Python తెలిసిన వాళ్ళకి ~1 గంట పని). Author కి GitHub Issue కూడా వేయవచ్చు — "Request new device profile" template ఉంది.

### Project folder structure (అర్థం కోసం)
```
fluke-app/
 ├ apps/        → desktop app (PySide6) + CLI
 ├ packages/    → shared code: BLE, protocol decode, SQLite, exports
 ├ profiles/    → measurement task profiles (ac_line_check, dc_battery_test, mode_sweep)
 ├ plugins/     → కొత్త device profiles ఇక్కడ add చేయాలి (example template ఉంది)
 ├ workflows/   → guided workflow definitions
 ├ docs/        → getting-started, desktop-guide, cli-guide, data-and-exports, sdk-guide…
 ├ fixtures/    → నిజమైన మీటర్ నుంచి capture చేసిన raw BLE packets (test కి)
 └ tests/       → automated tests
```

---

## ప్రశ్న 7: Connected అయ్యి కూడా అంకె రాకపోతే? (UUID fix)

1. Play Store → **nRF Connect for Mobile** install
2. మీటర్ F బటన్ → nRF Connect → **SCAN** → **378FC** → **CONNECT**
3. **"Unknown Service"** → UUID note చేయండి (`b698…` లాగా ఉండాలి)
4. లోపల **"Unknown Characteristic"** (NOTIFY, READ) → UUID note చేయండి
5. దాని పక్కన ↓ (read) నొక్కితే value లో reading text కనిపించాలి ✅
6. nRF Connect లో **DISCONNECT**
7. Dashboard → **Advanced** → రెండు UUIDs paste → **Connect meter**

nRF Connect లో కనిపించిన screen photo నాకు పంపితే, ఏది ఏమిటో చెబుతాను.

---

## ప్రశ్న 8: ఏవి సాధ్యం కాదు? (నిజాయితీగా)

| ❌ | ఎందుకు |
|---|---|
| iPhone Safari | Apple Web Bluetooth ఇవ్వదు |
| Page close చేసి / screen off లో logging | Web Bluetooth page open ఉన్నప్పుడే → దీనికి GitHub project (laptop) |
| WhatsApp కి automatic messages | WhatsApp కి అలాంటి facility లేదు → CSV manual share |
| 10+ మీటర్ల దూరం | మీటర్ radio బలహీనం → 3 m లోపు |
| Fluke official support / warranty coverage | Community పద్ధతి; మీటర్ కి ఏ హాని లేదు (మనం చదువుతున్నాం మాత్రమే, ఏమీ రాయడం లేదు) |
| 100% guarantee 378 లో పనిచేస్తుందని | 376 మీద proven; 378 మీద మీరే మొదటి test |

---

## ఒక్క వాక్యంలో

**నిజంగా పనిచేస్తుంది (376 FC మీద ఇద్దరు proof చేశారు) · Chrome తప్ప ఏ app వద్దు · Script అంతా నేను రాశాను, మీరు రాయనవసరం లేదు · Data ఫోన్‌లో automatic save + CSV export · Laptop లో పెద్ద logging కావాలంటే GitHub project (free, open source) · 378 FC మీద మొదటి test మీరే చేయాలి — వేరుగా ఉంటే 5 నిమిషాల UUID fix.**
