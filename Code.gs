/**
 *  Assembly Heaters → Google Sheet receiver   (Google Apps Script — Web App)   gs-2.3
 *  ------------------------------------------------------------------------
 *  HOW TO USE (details in google-sheet-telugu.html):
 *   1. Open your Google Sheet → Extensions → Apps Script
 *   2. Delete everything in Code.gs, paste THIS file, press Save (💾)
 *   3. Run ▶ "setup" once → Review permissions → Allow   (creates the "Readings" sheet)
 *   4. Deploy → New deployment → ⚙ Web app → Execute as: Me · Who has access: Anyone → Deploy
 *   5. Copy the Web app URL (…/exec) → Heaters app → Setup (admin) → Google Sheet → Test
 *   ★ After ANY change to this file: Deploy → Manage deployments → ✏ → Version: New → Deploy
 *
 *  WHAT IT CREATES (all rows are created automatically):
 *   • "Readings"  – one row per confirmed reading (log). Re-capturing the same point
 *                   UPDATES the same row (no duplicates). Clearing a cell deletes the row.
 *   • "Board dd-mm-yyyy X" – one sheet per date + shift in the Excel layout
 *                   (Heating zones / Phase / LINE-1 … LINE-7 / Remarks), zero → red cell,
 *                   manual (typed) values → italic + cell note. Values are stored without sign (gs-2.1).
 *                   Lead pot phase-imbalance error (from the app) → orange cell + "PHASE IMBALANCE ERROR" remark (gs-2.2).
 *                   gs-2.3 (Phase 2): NA cells (grey, reason in Remarks), out-of-range (yellow), "RESOLVED ✔ note" in Remarks,
 *                   Readings columns P na_reason · Q range · R resolved; actions board / history (live board + history in the app),
 *                   photo (issue photo → Drive folder "Assembly Heaters photos"), mailcfg / mailtest (daily summary e-mail trigger).
 *   • "Settings"  – HIDDEN sheet: app settings snapshot (components, zero threshold …)
 *                   pushed by the admin from the app. Never contains the password.
 *
 *  ADMIN PASSWORD
 *   • The app never sends the password itself — only its SHA-256 hash.
 *   • The current hash is kept in Script Properties (ADMIN_HASH), invisible to sheet viewers.
 *   • Changing the password in the app (Setup → Admin) updates it here automatically —
 *     you do NOT need to edit this file.
 *   • Forgot it?  Run ▶ resetAdminPassword() from this editor → back to the default.
 *
 *  This project corporates Somu & Kiran · Powered by somu.ss74@gmail.com
 */

/* ===== [S1] SETTINGS YOU MAY CHANGE ===== */
var LOG_SHEET  = 'Readings';
var SET_SHEET  = 'Settings';
var LINES      = 7;                                   // number of assembly lines (columns LINE-1 … LINE-7)
var DEFAULT_ADMIN_HASH = '8dc42a1daaf8a4236c40a0e74b8579588ef11407c8f2696914c74eb18a4c22c9'; // hash of the default admin password (same as in assembly.html)
/* ======================================== */

var LOG_HEADER = ['saved_at','date','shift','line','battery_type','component','phase','value','unit','operator','meter','zero','captured_at','key','error','na_reason','range','resolved'];   // O = PHASE IMBALANCE (gs-2.2) · P Q R = Phase 2 (gs-2.3)
var GS_VERSION = 'gs-2.3';
var PHOTO_FOLDER = 'Assembly Heaters photos';   // Drive folder for issue photos (created on first upload)

/* ---------- entry points ---------- */
function setup() {                       // run once from the editor to authorize + create the log sheet
  var sh = getLog_();
  try { MailApp.getRemainingDailyQuota(); DriveApp.getRootFolder(); } catch (_) {}   // gs-2.3: asks for Gmail + Drive permission now (daily e-mail, photos)
  SpreadsheetApp.getActiveSpreadsheet().toast('Ready. "' + sh.getName() + '" sheet created. Now Deploy → Web app.', 'Assembly Heaters', 8);
}
function resetAdminPassword() {          // run from the editor if the admin password is forgotten
  PropertiesService.getScriptProperties().deleteProperty('ADMIN_HASH');
  settingsRow_('admin_password', 'reset to default at ' + new Date());
  SpreadsheetApp.getActiveSpreadsheet().toast('Admin password reset to the default.', 'Assembly Heaters', 8);
}

function doGet(e) {                      // used by the app's "Test connection" button
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var log = getLog_();
  return json_({ ok: true, spreadsheet: ss.getName(), url: ss.getUrl(), readings: Math.max(0, log.getLastRow() - 1), version: GS_VERSION });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var locked = false;
  try {
    lock.waitLock(25000); locked = true;
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var action = body.action || 'save';

    if (action === 'ping')        return doGet(e);
    if (action === 'auth')        return json_({ ok: true, auth: isAdmin_(body.hash) });
    if (action === 'setpass') {
      if (!isAdmin_(body.oldHash)) return json_({ ok: true, auth: false, error: 'Current password wrong' });
      if (!body.newHash || String(body.newHash).length < 32) return json_({ ok: false, error: 'Bad new password hash' });
      PropertiesService.getScriptProperties().setProperty('ADMIN_HASH', String(body.newHash));
      settingsRow_('admin_password', 'changed ' + new Date() + (body.by ? ' by ' + body.by : ''));
      return json_({ ok: true, auth: true, changed: true });
    }
    if (action === 'settings') {
      if (!isAdmin_(body.hash)) return json_({ ok: true, auth: false, error: 'Admin password required' });
      saveSettings_(body.settings || {}, body.by);
      return json_({ ok: true, auth: true, saved: true });
    }
    if (action === 'getsettings') {
      if (!isAdmin_(body.hash)) return json_({ ok: true, auth: false, error: 'Admin password required' });
      return json_({ ok: true, auth: true, settings: loadSettings_() });
    }
    /* ---- gs-2.3 Phase 2 actions ---- */
    if (action === 'board')    return json_({ ok: true, items: boardItems_(body.date, body.shift), version: GS_VERSION });          // live board: every reading of one date+shift (all phones)
    if (action === 'history')  return json_({ ok: true, items: historyItems_(body.line, body.component, body.phase, body.days), version: GS_VERSION });
    if (action === 'photo') {
      if (!body.data) return json_({ ok: false, error: 'No image data' });
      var url = savePhoto_(body.name || 'photo.jpg', body.mime || 'image/jpeg', body.data, body.meta || {});
      return json_({ ok: true, url: url, version: GS_VERSION });
    }
    if (action === 'mailcfg') {
      if (!isAdmin_(body.hash)) return json_({ ok: true, auth: false, mail: true, error: 'Admin password required' });
      var tz = setMailSchedule_(body.to || '', Number(body.hour), body.tz || '');
      return json_({ ok: true, auth: true, mail: true, tz: tz, to: body.to || '', hour: Number(body.hour) });
    }
    if (action === 'mailtest') {
      if (!isAdmin_(body.hash)) return json_({ ok: true, auth: false, mail: true, error: 'Admin password required' });
      sendDailySummary_(body.to || '', true);
      return json_({ ok: true, auth: true, mail: true, sent: true });
    }

    /* action === 'save'  → {items:[...], comps:[[name,'RYB'],...]} */
    var items = body.items || [], comps = body.comps || [];
    var log = getLog_(), keyIdx = loadKeys_(log), saved = 0, deleted = 0;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.battOnly) { setBattery_(it, comps); continue; }
      if (it.del) { deleted += delReading_(log, keyIdx, it); }
      else        { saveReading_(log, keyIdx, it); saved++; }
      updateBoard_(it, comps);
    }
    SpreadsheetApp.flush();
    return json_({ ok: true, saved: saved, deleted: deleted, total: Math.max(0, log.getLastRow() - 1), version: GS_VERSION });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    if (locked) { try { lock.releaseLock(); } catch (_) {} }
  }
}

/* ---------- admin ---------- */
function isAdmin_(hash) {
  if (!hash) return false;
  var cur = PropertiesService.getScriptProperties().getProperty('ADMIN_HASH') || DEFAULT_ADMIN_HASH;
  return String(hash) === String(cur);
}

/* ---------- Settings (hidden sheet) ---------- */
function getSettingsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SET_SHEET);
  if (!sh) {
    sh = ss.insertSheet(SET_SHEET);
    sh.getRange(1, 1, 1, 3).setValues([['key', 'value', 'updated']]).setFontWeight('bold').setBackground('#ffe600');
    sh.setColumnWidth(1, 160); sh.setColumnWidth(2, 520); sh.setColumnWidth(3, 170);
    try { sh.hideSheet(); } catch (_) {}
  }
  return sh;
}
function settingsRow_(key, value) {
  var sh = getSettingsSheet_(), n = sh.getLastRow(), row = 0;
  if (n > 1) { var keys = sh.getRange(2, 1, n - 1, 1).getValues(); for (var i = 0; i < keys.length; i++) if (String(keys[i][0]) === key) { row = i + 2; break; } }
  if (!row) row = n + 1;
  sh.getRange(row, 1, 1, 3).setValues([[key, value, new Date()]]);
}
function saveSettings_(s, by) {
  var keys = Object.keys(s);
  for (var i = 0; i < keys.length; i++) {
    var v = s[keys[i]];
    settingsRow_(keys[i], (typeof v === 'object') ? JSON.stringify(v) : String(v));
  }
  settingsRow_('updated_by', by || '');
}
function loadSettings_() {
  var sh = getSettingsSheet_(), n = sh.getLastRow(), out = {};
  if (n > 1) {
    var v = sh.getRange(2, 1, n - 1, 2).getValues();
    for (var i = 0; i < v.length; i++) {
      var k = String(v[i][0]); if (!k || k === 'admin_password') continue;
      var val = v[i][1]; try { if (typeof val === 'string' && /^[\[{]/.test(val)) val = JSON.parse(val); } catch (_) {}
      out[k] = val;
    }
  }
  return out;
}

/* ---------- Readings log ---------- */
function getLog_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(LOG_SHEET);
  if (!sh) sh = ss.insertSheet(LOG_SHEET, 0);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, LOG_HEADER.length).setValues([LOG_HEADER]).setFontWeight('bold').setBackground('#ffe600');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 150); sh.setColumnWidth(13, 150); sh.setColumnWidth(14, 220);
  }
  if (sh.getMaxColumns() >= 15 && !sh.getRange(1, 15).getValue()) sh.getRange(1, 15).setValue('error').setFontWeight('bold').setBackground('#ffe600');   // gs-2.2: add the error header to an existing sheet
  if (sh.getMaxColumns() >= 18 && !sh.getRange(1, 16).getValue()) sh.getRange(1, 16, 1, 3).setValues([['na_reason', 'range', 'resolved']]).setFontWeight('bold').setBackground('#ffe600');   // gs-2.3
  return sh;
}
function loadKeys_(sh) {                 // key → row number (column N)
  var n = sh.getLastRow() - 1, m = {};
  if (n > 0) {
    var keys = sh.getRange(2, LOG_HEADER.length, n, 1).getValues();
    for (var i = 0; i < keys.length; i++) if (keys[i][0]) m[String(keys[i][0])] = i + 2;
  }
  return m;
}
function rowKey_(it) { return [it.date, it.shift, it.line, it.component, it.phase].join('|'); }
function saveReading_(sh, keyIdx, it) {
  var key = rowKey_(it);
  var row = [new Date(), it.date, it.shift, Number(it.line), it.batt || '', it.component, it.phase, toNum_(it.value), it.unit || '',
             it.operator || '', it.meter || '', it.zero ? 'YES' : '', it.time ? new Date(Number(it.time)) : '', key];
  var r = keyIdx[key];
  if (!r) { r = sh.getLastRow() + 1; keyIdx[key] = r; }
  sh.getRange(r, 1, 1, row.length).setValues([row]);
  if (sh.getMaxColumns() >= 15) sh.getRange(r, 15).setValue(it.error || '');   // error column (gs-2.2); older sheets without column O are left as they are
  if (sh.getMaxColumns() >= 18) sh.getRange(r, 16, 1, 3).setValues([[it.na || '', it.range || '', it.resolved || '']]);   // gs-2.3: P na_reason · Q range · R resolved
  sh.getRange(r, 1).setNumberFormat('dd-mm-yyyy hh:mm:ss'); sh.getRange(r, 13).setNumberFormat('dd-mm-yyyy hh:mm:ss');
  var vc = sh.getRange(r, 8);
  if (isNA_(it))       vc.setBackground('#e2e8f0').setFontColor('#334155');
  else if (it.zero)    vc.setBackground('#fecaca').setFontColor('#b91c1c');
  else if (it.error)   vc.setBackground('#ffedd5').setFontColor('#9a3412');
  else if (it.range)   vc.setBackground('#fef9c3').setFontColor('#854d0e');
  else                 vc.setBackground(null).setFontColor(null);
  vc.setFontStyle(isManual_(it) ? 'italic' : 'normal');
}
function delReading_(sh, keyIdx, it) {
  var key = rowKey_(it), r = keyIdx[key];
  if (!r) return 0;
  sh.deleteRow(r); delete keyIdx[key];
  for (var k in keyIdx) if (keyIdx[k] > r) keyIdx[k]--;
  return 1;
}
function toNum_(v) { var n = parseFloat(v); return isNaN(n) ? String(v == null ? '' : v) : Math.abs(n); }   // gs-2.1: magnitude only (no minus sign)
function isManual_(it) { return String(it.meter || '').indexOf('MANUAL') === 0; }
function isNA_(it) { return String(it.value) === 'NA' || String(it.meter || '') === 'NA'; }   // gs-2.3: point not measured

/* ---------- Board sheet (Excel layout) ---------- */
function dmy_(iso) { var p = String(iso).split('-'); return p.length === 3 ? p[2] + '-' + p[1] + '-' + p[0] : String(iso); }
function boardName_(it) { return 'Board ' + dmy_(it.date) + ' ' + (it.shift || ''); }
function lineCol_(line) { return 2 + Number(line); }          // LINE-1 → column C
function remarksCol_() { return 2 + LINES + 1; }              // column J

function getBoard_(it, comps) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), name = boardName_(it);
  var sh = ss.getSheetByName(name);
  if (sh) return sh;
  sh = ss.insertSheet(name);
  var cols = remarksCol_();
  sh.getRange(1, 1, 1, cols).merge().setValue('Assembly lines Heaters monitoring status').setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');
  sh.getRange(2, 1).setValue('Operator:').setFontWeight('bold'); sh.getRange(2, 2).setValue(it.operator || '');
  sh.getRange(2, 4).setValue('Date:').setFontWeight('bold');     sh.getRange(2, 5).setValue(dmy_(it.date));
  sh.getRange(2, 7).setValue('Shift:').setFontWeight('bold');    sh.getRange(2, 8).setValue(it.shift || '');
  sh.getRange(3, 1).setValue('Battery Types:-').setFontWeight('bold');
  var hdr = ['Heating zones', 'Phase'];
  for (var L = 1; L <= LINES; L++) hdr.push('LINE-' + L);
  hdr.push('Remarks');
  sh.getRange(4, 1, 1, cols).setValues([hdr]).setFontWeight('bold').setBackground('#ffe600').setHorizontalAlignment('center');
  var rows = [];
  for (var c = 0; c < comps.length; c++) { var ph = String(comps[c][1] || 'R'); for (var j = 0; j < ph.length; j++) rows.push([comps[c][0], ph.charAt(j)]); }
  if (!rows.length) rows.push([it.component, it.phase]);
  sh.getRange(5, 1, rows.length, 2).setValues(rows);
  var i = 0;
  while (i < rows.length) {                                     // merge component name over its phases
    var j2 = i; while (j2 + 1 < rows.length && rows[j2 + 1][0] === rows[i][0]) j2++;
    if (j2 > i) sh.getRange(5 + i, 1, j2 - i + 1, 1).merge();
    sh.getRange(5 + i, 1).setVerticalAlignment('middle').setFontWeight('bold');
    i = j2 + 1;
  }
  sh.getRange(4, 1, rows.length + 1, cols).setBorder(true, true, true, true, true, true);
  sh.getRange(5, 2, rows.length, 1).setHorizontalAlignment('center').setFontWeight('bold');
  sh.getRange(5, 3, rows.length, LINES).setHorizontalAlignment('center');
  sh.getRange(3, 3, 1, LINES).setHorizontalAlignment('center').setFontWeight('bold');
  sh.setColumnWidth(1, 140); sh.setColumnWidth(2, 60);
  for (var cc = 3; cc < 3 + LINES; cc++) sh.setColumnWidth(cc, 75);
  sh.setColumnWidth(cols, 260);
  sh.setFrozenRows(4);
  return sh;
}
function findBoardRow_(sh, comp, phase) {
  var n = sh.getLastRow(); if (n < 5) return 0;
  var vals = sh.getRange(5, 1, n - 4, 2).getValues(), cur = '';
  for (var i = 0; i < vals.length; i++) {
    if (vals[i][0] !== '' && vals[i][0] != null) cur = String(vals[i][0]);
    if (cur === String(comp) && String(vals[i][1]) === String(phase)) return 5 + i;
  }
  return 0;
}
function setBattery_(it, comps) {
  var sh = getBoard_(it, comps);
  sh.getRange(3, lineCol_(it.line)).setValue(it.batt || '').setHorizontalAlignment('center').setFontWeight('bold');
}
function updateBoard_(it, comps) {
  var sh = getBoard_(it, comps);
  var r = findBoardRow_(sh, it.component, it.phase);
  if (!r) {                                                     // component not in the list → auto-create a row
    r = sh.getLastRow() + 1;
    sh.getRange(r, 1, 1, 2).setValues([[it.component, it.phase]]).setFontWeight('bold');
    sh.getRange(r, 1, 1, remarksCol_()).setBorder(true, true, true, true, true, true);
    sh.getRange(r, 3, 1, LINES).setHorizontalAlignment('center');
  }
  var col = lineCol_(it.line), cell = sh.getRange(r, col);
  if (it.del) { cell.clearContent().clearNote().setBackground(null).setFontColor(null).setFontWeight('normal').setFontStyle('normal'); setRemark_(sh, r, it, false); return; }
  cell.setValue(isNA_(it) ? 'NA' : toNum_(it.value));
  if (isNA_(it))     cell.setBackground('#e2e8f0').setFontColor('#334155').setFontWeight('bold');   // gs-2.3: not measured → grey
  else if (it.zero)  cell.setBackground('#fecaca').setFontColor('#b91c1c').setFontWeight('bold');
  else if (it.error) cell.setBackground('#ffedd5').setFontColor('#9a3412').setFontWeight('bold');   // gs-2.2: Lead pot phase imbalance → orange
  else if (it.range) cell.setBackground('#fef9c3').setFontColor('#854d0e').setFontWeight('bold');   // gs-2.3: outside the expected range → yellow
  else               cell.setBackground(null).setFontColor(null).setFontWeight('normal');
  if (isManual_(it)) cell.setFontStyle('italic').setNote('Manual entry (typed by hand, no meter): ' + it.meter + ' · ' + new Date());
  else               cell.setFontStyle('normal').clearNote();
  if (it.batt) sh.getRange(3, col).setValue(it.batt).setHorizontalAlignment('center').setFontWeight('bold');
  if (it.operator) {
    var cur = String(sh.getRange(2, 2).getValue() || '');
    if (!cur) sh.getRange(2, 2).setValue(it.operator);
    else if (cur.indexOf(it.operator) < 0) sh.getRange(2, 2).setValue(cur + ', ' + it.operator);
  }
  setRemark_(sh, r, it, !!it.zero, it.error || '');
}
function setRemark_(sh, r, it, isZero, error) {               // Remarks: "L1 R = 0 (check heater)" / "L1 B PHASE IMBALANCE ERROR" / "L2 R NA (Line down)" / "L1 R 31.2 ABOVE MAX 28" / "L1 B RESOLVED ✔ Heater replaced"
  var rc = sh.getRange(r, remarksCol_()), tag = 'L' + it.line + ' ' + it.phase;
  var cur = String(rc.getValue() || ''), parts = cur ? cur.split(' · ') : [], out = [];
  for (var i = 0; i < parts.length; i++) if (parts[i].indexOf(tag + ' ') !== 0) out.push(parts[i]);
  if (it.del) { rc.setValue(out.join(' · ')).setFontColor(out.length ? '#b91c1c' : null); return; }
  if (isNA_(it))   out.push(tag + ' NA (' + (it.na || 'not measured') + ')');
  else if (isZero) out.push(tag + ' = 0 (check heater)');
  else if (error)  out.push(tag + ' ' + error + ' ERROR');
  else if (it.range) out.push(tag + ' ' + toNum_(it.value) + ' ' + it.range);
  if (it.resolved) out.push(tag + ' RESOLVED ✔ ' + it.resolved);
  rc.setValue(out.join(' · ')).setFontColor(out.length ? '#b91c1c' : null);
}

/* ---------- gs-2.3 Phase 2: live board + history (read from the Readings log) ---------- */
function logRows_() {                     // every row of the Readings log as objects (cheap enough for a few thousand rows)
  var sh = getLog_(), n = sh.getLastRow() - 1; if (n < 1) return [];
  var w = Math.min(sh.getLastColumn(), LOG_HEADER.length), v = sh.getRange(2, 1, n, w).getValues(), out = [];
  for (var i = 0; i < v.length; i++) {
    var r = v[i]; if (!r[13]) continue;
    out.push({ date: isoDate_(r[1]), shift: String(r[2]), line: Number(r[3]), batt: r[4], component: String(r[5]), phase: String(r[6]), value: r[7], unit: r[8], operator: r[9], meter: r[10], zero: r[11] === 'YES',
               time: (r[12] instanceof Date) ? r[12].getTime() : (r[0] instanceof Date ? r[0].getTime() : 0), error: r[14] || '', na: r[15] || '', range: r[16] || '', resolved: r[17] || '' });
  }
  return out;
}
function isoDate_(d) { if (d instanceof Date) return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'); return String(d); }
function boardItems_(date, shift) { var all = logRows_(), out = []; for (var i = 0; i < all.length; i++) if (all[i].date === String(date) && all[i].shift === String(shift)) out.push(all[i]); return out; }
function historyItems_(line, component, phase, days) {
  var all = logRows_(), out = [], lim = new Date(); lim.setDate(lim.getDate() - (Number(days) || 90)); var limIso = Utilities.formatDate(lim, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  for (var i = 0; i < all.length; i++) { var r = all[i]; if (r.line === Number(line) && r.component === String(component) && r.phase === String(phase) && r.date >= limIso) out.push(r); }
  out.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : (a.shift < b.shift ? -1 : 1); });
  return out;
}

/* ---------- gs-2.3: issue photo → Drive ---------- */
function savePhoto_(name, mime, b64, meta) {
  var folders = DriveApp.getFoldersByName(PHOTO_FOLDER), folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(PHOTO_FOLDER);
  var blob = Utilities.newBlob(Utilities.base64Decode(b64), mime, name);
  var f = folder.createFile(blob);
  try { f.setDescription(JSON.stringify(meta)); f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
  settingsRow_('last_photo', f.getUrl());
  return f.getUrl();
}

/* ---------- gs-2.3: daily summary e-mail (time trigger) ---------- */
function setMailSchedule_(to, hour, tz) {
  var props = PropertiesService.getScriptProperties();
  var trig = ScriptApp.getProjectTriggers();
  for (var i = 0; i < trig.length; i++) if (trig[i].getHandlerFunction() === 'dailySummaryJob') ScriptApp.deleteTrigger(trig[i]);
  props.setProperty('MAIL_TO', to || ''); props.setProperty('MAIL_HOUR', String(isNaN(hour) ? 6 : hour));
  var zone = tz || Session.getScriptTimeZone() || 'Asia/Kolkata';
  if (to) { ScriptApp.newTrigger('dailySummaryJob').timeBased().everyDays(1).atHour(isNaN(hour) ? 6 : hour).inTimezone(zone).create(); }
  settingsRow_('daily_mail', to ? (to + ' at ' + hour + ':00 ' + zone) : 'off');
  return zone;
}
function dailySummaryJob() { var to = PropertiesService.getScriptProperties().getProperty('MAIL_TO'); if (to) sendDailySummary_(to, false); }
function sendDailySummary_(to, isTest) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), all = logRows_();
  var d = new Date(); if (!isTest) d.setDate(d.getDate() - 1);     // scheduled run = yesterday; test = today
  var day = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'), dmy = dmy_(day);
  var rows = all.filter(function (r) { return r.date === day; });
  if (!rows.length && !isTest) { var last = ''; all.forEach(function (r) { if (r.date < day && r.date > last) last = r.date; }); if (last) { day = last; dmy = dmy_(day); rows = all.filter(function (r) { return r.date === day; }); } }
  var shifts = {}; rows.forEach(function (r) { var s = shifts[r.shift] = shifts[r.shift] || { n: 0, zero: [], err: [], rng: [], na: [], fix: [], ops: {}, lines: {} }; s.n++; s.lines[r.line] = 1; if (r.operator) s.ops[r.operator] = 1;
    var tag = 'L' + r.line + ' ' + r.component + ' ' + r.phase;
    if (r.na) s.na.push(tag + ' (' + r.na + ')'); else if (r.zero) s.zero.push(tag); else if (r.error) s.err.push(tag + ' ' + r.error); else if (r.range) s.rng.push(tag + ' ' + r.value + ' ' + r.range);
    if (r.resolved) s.fix.push(tag + ' — ' + r.resolved); });
  var html = '<div style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a"><h2 style="margin:0 0 4px">Assembly Heaters — daily summary</h2><div style="color:#64748b;margin-bottom:12px">' + dmy + (isTest ? ' · TEST e-mail' : '') + ' · ' + ss.getName() + '</div>';
  var text = 'Assembly Heaters — daily summary ' + dmy + '\n';
  var keys = Object.keys(shifts).sort();
  if (!keys.length) { html += '<p>No readings were saved on ' + dmy + '.</p>'; text += 'No readings.\n'; }
  keys.forEach(function (k) { var s = shifts[k]; var ok = !s.zero.length && !s.err.length && !s.rng.length;
    html += '<div style="border:1px solid #e2e8f0;border-left:6px solid ' + (ok ? '#16a34a' : '#dc2626') + ';border-radius:10px;padding:10px 12px;margin-bottom:10px"><b>Shift ' + k + '</b> — ' + s.n + ' readings · lines ' + Object.keys(s.lines).join(', ') + ' · ' + (Object.keys(s.ops).join(', ') || '—') + '<br>'
      + '<span style="color:#b91c1c">Zero: ' + s.zero.length + '</span> · <span style="color:#9a3412">Errors: ' + s.err.length + '</span> · <span style="color:#854d0e">Range: ' + s.rng.length + '</span> · NA: ' + s.na.length + '<br>'
      + (s.zero.length ? '<div style="margin-top:6px"><b>Zero:</b> ' + s.zero.join(', ') + '</div>' : '') + (s.err.length ? '<div><b>Errors:</b> ' + s.err.join(', ') + '</div>' : '') + (s.rng.length ? '<div><b>Out of range:</b> ' + s.rng.join(', ') + '</div>' : '') + (s.na.length ? '<div><b>NA:</b> ' + s.na.join(', ') + '</div>' : '') + (s.fix.length ? '<div style="color:#166534"><b>Resolved ✔:</b> ' + s.fix.join(', ') + '</div>' : '') + '</div>';
    text += 'Shift ' + k + ': ' + s.n + ' readings · zero ' + s.zero.length + ' · errors ' + s.err.length + ' · range ' + s.rng.length + ' · NA ' + s.na.length + '\n' + (s.zero.length ? '  Zero: ' + s.zero.join(', ') + '\n' : '') + (s.err.length ? '  Errors: ' + s.err.join(', ') + '\n' : '') + (s.rng.length ? '  Range: ' + s.rng.join(', ') + '\n' : '') + (s.na.length ? '  NA: ' + s.na.join(', ') + '\n' : ''); });
  var openIss = all.filter(function (r) { return (r.zero || r.error) && !r.resolved && r.date >= Utilities.formatDate(new Date(Date.now() - 7 * 86400000), Session.getScriptTimeZone(), 'yyyy-MM-dd'); }).length;
  html += '<div style="margin:8px 0">Open zero / error points in the last 7 days (not marked resolved): <b>' + openIss + '</b></div><div><a href="' + ss.getUrl() + '">Open the Google Sheet</a></div><div style="color:#94a3b8;font-size:12px;margin-top:14px">This project corporates Somu &amp; Kiran · Powered by somu.ss74@gmail.com</div></div>';
  text += 'Sheet: ' + ss.getUrl() + '\n';
  MailApp.sendEmail({ to: to, subject: 'Assembly Heaters — ' + dmy + (isTest ? ' (test)' : '') + ' summary', htmlBody: html, body: text, name: 'Assembly Dashboard' });
  settingsRow_('last_mail', to + ' · ' + new Date());
}

/* ---------- helpers ---------- */
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
