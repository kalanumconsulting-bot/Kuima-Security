const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { readDb, writeDb, initDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const SESSION_SECRET = process.env.SESSION_SECRET || 'kuima-security-png-secret-2026-change-me';
const ADMIN_USER = process.env.ADMIN_USER || 'controlroom';
const ADMIN_PASS = process.env.ADMIN_PASS || 'KuimaAdmin2026!';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000
    }
  })
);

// Built-in lightweight rate limiter compatible with Node v13.14.0
const loginAttempts = {};
function loginLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;

  if (!loginAttempts[ip] || now - loginAttempts[ip].start > windowMs) {
    loginAttempts[ip] = { count: 1, start: now };
    return next();
  }

  loginAttempts[ip].count += 1;
  if (loginAttempts[ip].count > 20) {
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please wait 15 minutes or call +675 475 7255.'
    });
  }
  return next();
}

// Serve static public files
app.use(express.static(path.join(__dirname, 'public')));

// Auth middlewares
function requireClientAuth(req, res, next) {
  if (req.session && req.session.clientSite) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Unauthorized. Please sign in with your Site Code and PIN.'
  });
}

function requireAdminAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Control Room Admin authentication required.'
  });
}

// Clean page routes
const pages = [
  'about',
  'our-story',
  'services',
  'clients',
  'technology',
  'quote',
  'client-portal',
  'careers',
  'contact',
  'admin'
];

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

pages.forEach((page) => {
  app.get('/' + page, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', page + '.html'));
  });
});

// ==========================================================================
// 1. PUBLIC FORMS: QUOTE, CONTACT DISPATCH & CAREERS
// ==========================================================================

app.post('/api/quote', (req, res) => {
  try {
    const body = req.body || {};
    const clientName = body.clientName;
    const companyName = body.companyName;
    const clientPhone = body.clientPhone;

    if (!clientName || !companyName || !clientPhone) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your contact name, company/institution name, and phone number.'
      });
    }

    const refNum = 'KSS-' + Math.floor(100000 + Math.random() * 900000);
    const state = readDb();

    state.quotes.unshift({
      id: Date.now(),
      ref_num: refNum,
      region: body.region || '',
      service_type: body.serviceType || '',
      shift_type: body.shiftType || '',
      personnel_count: parseInt(body.personnelCount, 10) || 1,
      duration_days: parseInt(body.durationDays, 10) || 30,
      include_k9: body.includeK9 ? 1 : 0,
      include_gps: body.includeGPS ? 1 : 0,
      client_name: clientName,
      company_name: companyName,
      client_phone: clientPhone,
      est_subtotal: body.estSubtotal || 'K 0.00',
      est_gst: body.estGst || 'K 0.00',
      est_total: body.estTotal || 'K 0.00',
      created_at: new Date().toISOString()
    });

    writeDb(state);

    res.json({
      success: true,
      refNum: refNum,
      message: 'Thank you, ' + clientName + '. Your Security Deployment Estimate (Ref: ' + refNum + ') has been logged. Kuima Security Services Operations will contact you shortly.'
    });
  } catch (err) {
    console.error('Quote error:', err);
    res.status(500).json({ success: false, message: 'Server error saving quote request.' });
  }
});

app.post('/api/contact', (req, res) => {
  try {
    const body = req.body || {};
    const urgencyLevel = body.urgencyLevel || 'standard';
    const name = body.name;
    const company = body.company || '';
    const contactInfo = body.contactInfo;
    const requirements = body.requirements;

    if (!name || !contactInfo || !requirements) {
      return res.status(400).json({ success: false, message: 'Please complete all required fields.' });
    }

    const ticketId = 'DSP-' + Math.floor(100000 + Math.random() * 900000);
    const state = readDb();

    state.inquiries.unshift({
      id: Date.now(),
      ticket_id: ticketId,
      urgency_level: urgencyLevel,
      name: name,
      company: company,
      contact_info: contactInfo,
      requirements: requirements,
      status: 'Open',
      created_at: new Date().toISOString()
    });

    writeDb(state);

    res.json({ success: true, ticketId: ticketId, urgencyLevel: urgencyLevel });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ success: false, message: 'Server error logging inquiry.' });
  }
});

app.post('/api/careers', (req, res) => {
  try {
    const body = req.body || {};
    const fullName = body.fullName;
    const branch = body.branch || '';
    const position = body.position || '';
    const phone = body.phone;
    const vettingStatus = body.vettingStatus || '';

    if (!fullName || !phone) {
      return res.status(400).json({ success: false, message: 'Full name and phone number are required.' });
    }

    const appId = 'HR-' + Math.floor(100000 + Math.random() * 900000);
    const state = readDb();

    state.applications.unshift({
      id: Date.now(),
      app_id: appId,
      full_name: fullName,
      branch: branch,
      position: position,
      phone: phone,
      vetting_status: vettingStatus,
      status: 'Under HR Review',
      created_at: new Date().toISOString()
    });

    writeDb(state);

    res.json({
      success: true,
      appId: appId,
      message: 'Application (' + appId + ') submitted to Kuima Security Services Ltd HR Department. Shortlisted candidates will be invited for physical screening and Royal PNG Constabulary police clearance verification.'
    });
  } catch (err) {
    console.error('Careers error:', err);
    res.status(500).json({ success: false, message: 'Server error submitting application.' });
  }
});

// ==========================================================================
// 2. CLIENT OPERATIONS & PATROL PORTAL API
// ==========================================================================

app.post('/api/portal/login', loginLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const siteCode = String(body.siteCode || '').trim().toUpperCase();
    const sitePass = String(body.sitePass || '').trim();

    if (!siteCode || !sitePass) {
      return res.status(400).json({ success: false, message: 'Site Code and Access PIN are required.' });
    }

    const state = readDb();
    const site = state.client_sites.find(
      (s) => s.site_code === siteCode && s.status === 'ACTIVE'
    );

    if (!site) {
      return res.status(401).json({ success: false, message: 'Invalid or inactive Client Site Code.' });
    }

    const validPin = await bcrypt.compare(sitePass, site.pin_hash);
    if (!validPin) {
      return res.status(401).json({ success: false, message: 'Incorrect Access PIN.' });
    }

    req.session.clientSite = {
      siteCode: site.site_code,
      siteName: site.site_name,
      region: site.region
    };

    const shifts = state.shift_logs
      .filter((l) => l.site_code === site.site_code)
      .slice(0, 20);

    const instructions = state.client_instructions
      .filter((i) => i.site_code === site.site_code)
      .slice(0, 10);

    res.json({
      success: true,
      site: req.session.clientSite,
      shifts: shifts,
      instructions: instructions
    });
  } catch (err) {
    console.error('Portal login error:', err);
    res.status(500).json({ success: false, message: 'Server error during portal login.' });
  }
});

app.get('/api/portal/me', requireClientAuth, (req, res) => {
  try {
    const siteCode = req.session.clientSite.siteCode;
    const state = readDb();

    const shifts = state.shift_logs
      .filter((l) => l.site_code === siteCode)
      .slice(0, 20);

    const instructions = state.client_instructions
      .filter((i) => i.site_code === siteCode)
      .slice(0, 10);

    res.json({
      success: true,
      site: req.session.clientSite,
      shifts: shifts,
      instructions: instructions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Unable to load portal data.' });
  }
});

app.post('/api/portal/instructions', requireClientAuth, (req, res) => {
  try {
    const siteCode = req.session.clientSite.siteCode;
    const body = req.body || {};
    const submittedBy = body.submittedBy;
    const priority = body.priority || 'Normal';
    const instructionText = body.instructionText;

    if (!submittedBy || !instructionText) {
      return res.status(400).json({ success: false, message: 'Your name and site instruction message are required.' });
    }

    const state = readDb();
    state.client_instructions.unshift({
      id: Date.now(),
      site_code: siteCode,
      submitted_by: String(submittedBy).trim(),
      priority: priority,
      instruction_text: String(instructionText).trim(),
      status: 'Pending Control Room Review',
      created_at: new Date().toISOString()
    });

    writeDb(state);

    const instructions = state.client_instructions
      .filter((i) => i.site_code === siteCode)
      .slice(0, 10);

    res.json({
      success: true,
      message: 'Site instruction transmitted to Kuima 24/7 Control Room.',
      instructions: instructions
    });
  } catch (err) {
    console.error('Instruction error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit site instruction.' });
  }
});

app.post('/api/portal/logout', (req, res) => {
  req.session.clientSite = null;
  res.json({ success: true });
});

// ==========================================================================
// 3. CONTROL ROOM ADMIN API (Lae HQ & Port Moresby Dispatch)
// ==========================================================================

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const body = req.body || {};
  const username = String(body.username || '').trim();
  const password = String(body.password || '').trim();

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: 'Invalid Control Room credentials.' });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.isAdmin = false;
  res.json({ success: true });
});

app.get('/api/admin/overview', requireAdminAuth, (req, res) => {
  try {
    const state = readDb();
    const sites = state.client_sites.map((s) => ({
      id: s.id,
      site_code: s.site_code,
      site_name: s.site_name,
      region: s.region,
      status: s.status,
      created_at: s.created_at
    }));

    res.json({
      success: true,
      sites: sites,
      shiftLogs: state.shift_logs.slice(0, 30),
      instructions: state.client_instructions.slice(0, 30),
      quotes: state.quotes.slice(0, 30),
      inquiries: state.inquiries.slice(0, 30),
      applications: state.applications.slice(0, 30)
    });
  } catch (err) {
    console.error('Admin overview error:', err);
    res.status(500).json({ success: false, message: 'Error loading Control Room data.' });
  }
});

app.post('/api/admin/sites', requireAdminAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const siteCode = String(body.siteCode || '').trim().toUpperCase();
    const siteName = String(body.siteName || '').trim();
    const region = String(body.region || '').trim();
    const pin = String(body.pin || '').trim();

    if (!siteCode || !siteName || !region || pin.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Site Code, Site Name, Region, and a PIN (min 4 digits) are required.'
      });
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const state = readDb();
    const existingIndex = state.client_sites.findIndex((s) => s.site_code === siteCode);

    if (existingIndex >= 0) {
      state.client_sites[existingIndex].site_name = siteName;
      state.client_sites[existingIndex].region = region;
      state.client_sites[existingIndex].pin_hash = pinHash;
      state.client_sites[existingIndex].status = 'ACTIVE';
    } else {
      state.client_sites.push({
        id: Date.now(),
        site_code: siteCode,
        site_name: siteName,
        region: region,
        pin_hash: pinHash,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      });
    }

    writeDb(state);
    res.json({ success: true, message: 'Client site ' + siteCode + ' saved.' });
  } catch (err) {
    console.error('Save site error:', err);
    res.status(500).json({ success: false, message: 'Failed to save client site.' });
  }
});

app.post('/api/admin/shift-logs', requireAdminAuth, (req, res) => {
  try {
    const body = req.body || {};
    const siteCode = String(body.siteCode || '').trim().toUpperCase();
    const shiftDate = body.shiftDate;
    const shiftWindow = body.shiftWindow;
    const assignedOfficers = body.assignedOfficers;

    if (!siteCode || !shiftDate || !shiftWindow || !assignedOfficers) {
      return res.status(400).json({
        success: false,
        message: 'Site Code, Shift Date, Shift Window, and Assigned Officers are required.'
      });
    }

    const state = readDb();
    state.shift_logs.unshift({
      id: Date.now(),
      site_code: siteCode,
      shift_date: shiftDate,
      shift_window: shiftWindow,
      assigned_officers: assignedOfficers,
      radio_checkins: body.radioCheckins || 'All Check-Ins Completed',
      nfc_scans: body.nfcScans || '100% NFC Tags Scanned',
      supervisor_audit: body.supervisorAudit || 'Verified by Control Room',
      notes: body.notes || '',
      created_at: new Date().toISOString()
    });

    writeDb(state);
    res.json({ success: true, message: 'Shift & NFC Patrol log published for ' + siteCode + '.' });
  } catch (err) {
    console.error('Shift log error:', err);
    res.status(500).json({ success: false, message: 'Failed to publish shift log.' });
  }
});

app.post('/api/admin/instructions/:id/ack', requireAdminAuth, (req, res) => {
  try {
    const targetId = String(req.params.id);
    const state = readDb();
    const item = state.client_instructions.find((i) => String(i.id) === targetId);
    if (item) {
      item.status = 'Acknowledged & Dispatched';
      writeDb(state);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// 404 Fallback
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log('Kuima Security Services Ltd (Node v13 Compatible) running at http://localhost:' + PORT);
      console.log('Control Room Admin Console available at http://localhost:' + PORT + '/admin.html');
    });
  })
  .catch((err) => {
    console.error('Database initialization failed:', err);
    process.exit(1);
  });
