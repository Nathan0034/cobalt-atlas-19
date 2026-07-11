require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { init, insertSubmission, listSubmissions, setProcessed } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'brooklynhuntington';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-before-deploying';

app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 12 },
}));

app.use(express.static(path.join(__dirname, '..', 'public')));

function requireStaffAuth(req, res, next) {
  if (req.session && req.session.staffAuthed) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

app.post('/api/submit', async (req, res, next) => {
  try {
    const b = req.body || {};
    const name = (b.name || '').trim();
    const dialCode = (b.phone_country_code || '').replace(/\D/g, '');
    const phoneNumber = (b.phone_number || '').replace(/\D/g, '');

    if (!name) return res.status(400).json({ error: 'name_required' });
    if (!dialCode) return res.status(400).json({ error: 'dialcode_required' });
    if (!phoneNumber) return res.status(400).json({ error: 'phone_required' });
    if (!b.marketing_consent) return res.status(400).json({ error: 'consent_required' });

    const addressType = b.address_type === 'INTL' ? 'INTL' : 'TW';

    await insertSubmission({
      name,
      gender: b.gender || null,
      phone_country_code: dialCode,
      phone_number: phoneNumber,
      birth_year: b.birth_year || null,
      birth_month: b.birth_month || null,
      birth_day: b.birth_day || null,
      email: (b.email || '').trim() || null,
      address_type: addressType,
      county: addressType === 'TW' ? (b.county || null) : null,
      district: addressType === 'TW' ? (b.district || null) : null,
      address_detail: (b.address_detail || '').trim() || null,
      marketing_consent: !!b.marketing_consent,
      language: b.language || 'zh-TW',
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.post('/api/staff/login', (req, res) => {
  const { password } = req.body || {};
  if (password === STAFF_PASSWORD) {
    req.session.staffAuthed = true;
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'invalid_password' });
});

app.post('/api/staff/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/staff/session', (req, res) => {
  res.json({ authed: !!(req.session && req.session.staffAuthed) });
});

app.get('/api/staff/submissions', requireStaffAuth, async (req, res, next) => {
  try {
    res.json(await listSubmissions());
  } catch (err) {
    next(err);
  }
});

app.post('/api/staff/submissions/:id/processed', requireStaffAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await setProcessed(id, !!req.body.processed);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.get('/api/staff/export.csv', requireStaffAuth, async (req, res, next) => {
  try {
    const rows = await listSubmissions();
    const header = ['id','name','gender','phone','birth_date','email','address_type','county','district','address_detail','marketing_consent','language','processed','created_at'];
    const lines = [header.join(',')];
    for (const r of rows) {
      const phone = `+${r.phone_country_code} ${r.phone_number}`;
      const birth = [r.birth_year, r.birth_month, r.birth_day].filter(Boolean).join('/');
      const vals = [
        r.id, r.name, r.gender || '', phone, birth, r.email || '',
        r.address_type || 'TW', r.county || '', r.district || '', r.address_detail || '',
        r.marketing_consent ? 'yes' : 'no', r.language || '',
        r.processed ? 'yes' : 'no', r.created_at,
      ].map(v => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(vals.join(','));
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
    res.send('﻿' + lines.join('\n'));
  } catch (err) {
    next(err);
  }
});

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`BKH customer form running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
