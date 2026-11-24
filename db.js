const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFile = path.join(dataDir, 'kuima_operations.json');

function defaultState() {
  return {
    client_sites: [],
    shift_logs: [],
    client_instructions: [],
    quotes: [],
    inquiries: [],
    applications: []
  };
}

function readDb() {
  if (!fs.existsSync(dbFile)) {
    const init = defaultState();
    fs.writeFileSync(dbFile, JSON.stringify(init, null, 2), 'utf8');
    return init;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
    return Object.assign(defaultState(), parsed);
  } catch (e) {
    const fallback = defaultState();
    fs.writeFileSync(dbFile, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

function writeDb(state) {
  fs.writeFileSync(dbFile, JSON.stringify(state, null, 2), 'utf8');
}

async function initDatabase() {
  const state = readDb();

  if (state.client_sites.length === 0) {
    const defaultPinHash = await bcrypt.hash('123456', 10);
    const now = new Date().toISOString();

    state.client_sites = [
      {
        id: 1,
        site_code: 'POM-COMP-04',
        site_name: 'Port Moresby Commercial Compound 04 (NCD)',
        region: 'Port Moresby (NCD)',
        pin_hash: defaultPinHash,
        status: 'ACTIVE',
        created_at: now
      },
      {
        id: 2,
        site_code: 'UNITECH-01',
        site_name: 'PNGUoT Taraka Campus Main Gate & Halls (Lae)',
        region: 'Lae (Morobe)',
        pin_hash: defaultPinHash,
        status: 'ACTIVE',
        created_at: now
      },
      {
        id: 3,
        site_code: 'POM-TAURAMA',
        site_name: 'Taurama Executive Residential Estate (NCD)',
        region: 'Port Moresby (NCD)',
        pin_hash: defaultPinHash,
        status: 'ACTIVE',
        created_at: now
      }
    ];

    const today = new Date().toISOString().split('T')[0];
    state.shift_logs = [
      {
        id: 1,
        site_code: 'POM-COMP-04',
        shift_date: today,
        shift_window: 'Day Shift (06:00 – 18:00)',
        assigned_officers: '4 Officers (Posts 1–4)',
        radio_checkins: '12 / 12 Hourly Check-Ins',
        nfc_scans: '24 / 24 NFC Tags Scanned',
        supervisor_audit: 'Inspected 11:20 AM by Sup. M. Kila',
        notes: 'All gates secure; visitor logs verified.',
        created_at: now
      },
      {
        id: 2,
        site_code: 'POM-COMP-04',
        shift_date: today,
        shift_window: 'Night Shift (18:00 – 06:00)',
        assigned_officers: '6 Officers + 1 K9 Unit',
        radio_checkins: 'Active (On Schedule)',
        nfc_scans: '18 / 18 NFC Tags Scanned',
        supervisor_audit: 'Inspected 10:45 PM by Mobile Unit 02',
        notes: 'Perimeter floodlights operational; K9 sweep clear.',
        created_at: now
      },
      {
        id: 3,
        site_code: 'UNITECH-01',
        shift_date: today,
        shift_window: 'Day Shift (06:00 – 18:00)',
        assigned_officers: '12 Officers (Gates A–D)',
        radio_checkins: '24 / 24 Hourly Check-Ins',
        nfc_scans: '48 / 48 NFC Tags Scanned',
        supervisor_audit: 'Inspected 10:15 AM by Lae Command',
        notes: 'Campus traffic and ID checks normal.',
        created_at: now
      },
      {
        id: 4,
        site_code: 'POM-TAURAMA',
        shift_date: today,
        shift_window: 'Night Shift (18:00 – 06:00)',
        assigned_officers: '4 Officers + K9 Sweep',
        radio_checkins: '12 / 12 Hourly Check-Ins',
        nfc_scans: '20 / 20 NFC Tags Scanned',
        supervisor_audit: 'Inspected 01:15 AM by NCD Patrol',
        notes: 'Residential compound quiet and secure.',
        created_at: now
      }
    ];

    writeDb(state);
  }
}

module.exports = {
  readDb,
  writeDb,
  initDatabase
};
