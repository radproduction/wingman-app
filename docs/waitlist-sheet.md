# Live waitlist Google Sheet

Every signup on the landing page (`imyourwingman.ai`) already lands in the
`waitlist` table (email, IP, country) and emails the team. This wires those same
signups into a **Google Sheet that updates itself in real time**, so the boss can
just keep the sheet open and watch leads arrive.

No Google service account or API key is needed on the server — we POST each row
to a **Google Apps Script Web App** that is bound to the sheet and appends/updates
a row. The server only needs the Web App URL.

---

## One-time setup (≈5 minutes)

### 1. Make the sheet
1. Create a new Google Sheet (name it e.g. **Wingman Waitlist**).
2. **Extensions → Apps Script**. Delete the sample `myFunction` and paste the
   whole script from [the Apps Script](#apps-script) section below.
3. (Optional but recommended) set `SECRET` in the script to a long random string.
   You'll put the *same* string in `WAITLIST_SHEET_SECRET` on the server so only
   Wingman can write to the sheet. Leave it `''` to skip the check.
4. **Save** (💾).

### 2. Deploy it as a Web App
1. **Deploy → New deployment**.
2. Gear icon → **Web app**.
3. **Execute as:** *Me* · **Who has access:** *Anyone*.
4. **Deploy**, authorize when Google asks (it's your own script).
5. Copy the **Web app URL** — it ends in `/exec`.

> Re-deploying later: use **Deploy → Manage deployments → Edit → New version** so
> the URL stays the same.

### 3. Point Wingman at it
On the droplet's `.env`:

```
WAITLIST_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/AKfyc.../exec
WAITLIST_SHEET_SECRET=the-same-secret-you-put-in-the-script   # or leave blank
```

Then recreate the container (env-only change — **no image rebuild needed**):

```bash
cd /root/wingman && docker restart wingman   # or your run command
```

### 4. Backfill the signups you already have
So the rows collected before the sheet existed show up too (safe to re-run):

```bash
curl -X POST "https://app.imyourwingman.ai/api/admin/waitlist/sync-sheet?key=$ADMIN_PASSWORD"
```

Response: `{"ok":true,"total":N,"sent":N}`. From now on new signups appear on
their own — email + IP instantly, country a few seconds later.

---

## How it behaves

- **Upserts by email** — the same person signing up twice never duplicates a row,
  and the country fills into the *same* row when it resolves. Re-running the
  backfill is safe.
- **Best-effort** — if the sheet is unreachable, the signup still succeeds (DB +
  team email are unaffected). Failures are logged as `[waitlist] sheet push failed`.
- **Columns:** Email · IP · Country · Signed up · Last updated.

---

## Apps Script

Paste this whole file into the sheet's Apps Script editor.

```javascript
// Wingman waitlist → Google Sheet sink.
// Set SECRET to match WAITLIST_SHEET_SECRET on the server ('' = no check), then
// Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.

const SECRET = '';                 // must equal WAITLIST_SHEET_SECRET ('' = skip check)
const SHEET_NAME = 'Waitlist';
const HEADERS = ['Email', 'IP', 'Country', 'Signed up', 'Last updated'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // serialise writes so concurrent signups don't clash
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (SECRET && body.secret !== SECRET) return json({ ok: false, error: 'forbidden' });

    const rows = Array.isArray(body.rows) ? body.rows : (body.email ? [body] : []);
    const sheet = getSheet();
    const byEmail = indexByEmail(sheet);
    let upserted = 0;

    rows.forEach(function (r) {
      const email = String(r.email || '').trim().toLowerCase();
      if (!email) return;
      const now = new Date();
      const at = byEmail[email];
      if (at) {
        // Existing row: fill IP/Country only when we now have a value; touch "Last updated".
        const rng = sheet.getRange(at, 1, 1, HEADERS.length);
        const v = rng.getValues()[0];
        if (r.ip) v[1] = r.ip;
        if (r.country) v[2] = r.country;
        v[4] = now;
        rng.setValues([v]);
      } else {
        const signed = r.created_at ? new Date(r.created_at) : now;
        sheet.appendRow([email, r.ip || '', r.country || '', signed, now]);
        byEmail[email] = sheet.getLastRow();
      }
      upserted++;
    });

    return json({ ok: true, upserted: upserted });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

// A browser GET confirms the deployment is live.
function doGet() {
  return json({ ok: true, service: 'wingman-waitlist-sink' });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function indexByEmail(sheet) {
  const map = {};
  const last = sheet.getLastRow();
  if (last < 2) return map;
  const emails = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < emails.length; i++) {
    const em = String(emails[i][0] || '').trim().toLowerCase();
    if (em) map[em] = i + 2; // 1-based sheet row
  }
  return map;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```
