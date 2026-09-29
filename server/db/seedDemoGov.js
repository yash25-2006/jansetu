const fs = require('fs');
const path = require('path');
const db = require('./index');
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function loadGovUsers() {
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'data', 'sample', 'government_users.json'),
    path.join(__dirname, '..', 'data', 'demo', 'government_users.json'),
    path.join(__dirname, '..', 'data', 'sample', 'government_users.json')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      } catch (e) {
        console.warn('Error reading government_users JSON:', e.message);
      }
    }
  }
  return [];
}

async function seedDemoGov() {
  console.log('Seeding government accounts from JSON...');
  const users = loadGovUsers();

  for (const user of users) {
    await db.createGovernmentUser({
      ...user,
      password_hash: user.password_hash || hashPassword('Demo@123')
    });
    console.log(`Demo account ready: ${user.email}`);
  }

  console.log(`Government accounts ready: ${users.length} accounts.`);
}

module.exports = { seedDemoGov };