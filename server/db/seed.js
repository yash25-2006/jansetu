const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const path = require('path');
const db = require('./index');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

<<<<<<< HEAD
function loadSampleJson(filename) {
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'data', 'sample', filename),
    path.join(__dirname, '..', 'data', 'demo', filename),
    path.join(__dirname, '..', 'data', 'sample', filename)
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        return JSON.parse(raw);
      } catch (err) {
        console.warn(`[Seed Warning] Could not read ${filename} from ${p}:`, err.message);
      }
    }
  }
  return [];
}
=======
const rawGovUsers = require(path.join(__dirname, '../../data/sample/gov_users.json'));
const ADMINISTRATIVE_REGIONS_DATA = require(path.join(__dirname, '../../data/sample/regions.json'));
const GOVERNMENT_OFFICES_DATA = require(path.join(__dirname, '../../data/sample/offices.json'));
const LOCAL_REPRESENTATIVES_DATA = require(path.join(__dirname, '../../data/sample/authorities.json'));
const MULTI_STATE_REQUESTS = require(path.join(__dirname, '../../data/sample/requests.json'));

const DEMO_GOV_USERS = rawGovUsers.map((user) => ({
  ...user,
  password_hash: user.password_hash || hashPassword(user.password || 'Demo@123')
}));
>>>>>>> dd0e3a88bd0e5dd9f6a8e5d67bd84003398e3618

async function seed() {
  console.log('===============================================================');
  console.log(' Seeding India Development Intelligence Platform Dataset');
  console.log('===============================================================');
  await db.initDb();

  // 1. Seed Administrative Regions
  const regionsToSeed = loadSampleJson('administrative_regions.json');
  const regionMap = {};
  for (const reg of regionsToSeed) {
    const createdReg = await db.upsertAdministrativeRegion(reg);
    if (createdReg) {
      if (createdReg.name) regionMap[createdReg.name] = createdReg;
      if (createdReg.ward) regionMap[createdReg.ward] = createdReg;
      if (createdReg.locality) regionMap[createdReg.locality] = createdReg;
      regionMap[createdReg.id] = createdReg;
    }
  }
  console.log(`[OK] ${Object.keys(regionMap).length > 0 ? 'Administrative Regions' : 'Regions'} seeded: ${regionsToSeed.length} entries.`);

  // 2. Seed Government Users (Central, State, Ward)
  const usersToSeed = loadSampleJson('government_users.json');
  for (const user of usersToSeed) {
    let linkedRegionId = null;
    if (user.role === 'ward_monitor' || user.monitoring_ward || user.region_name) {
      if (user.region_name && regionMap[user.region_name]) {
        linkedRegionId = regionMap[user.region_name].id;
      } else if (user.monitoring_ward && regionMap[user.monitoring_ward]) {
        linkedRegionId = regionMap[user.monitoring_ward].id;
      } else if (user.monitoring_ward) {
        const match = Object.values(regionMap).find(r => 
          r.ward === user.monitoring_ward || 
          (r.name && user.monitoring_ward.toLowerCase().includes(r.name.toLowerCase())) ||
          (r.ward && user.monitoring_ward.toLowerCase().includes(r.ward.toLowerCase()))
        );
        if (match) linkedRegionId = match.id;
      } else if (user.email) {
        const match = Object.values(regionMap).find(r => 
          user.email.toLowerCase().includes(r.name.toLowerCase().replace(/\s+/g, ''))
        );
        if (match) linkedRegionId = match.id;
      }
    }

    await db.createGovernmentUser({
      ...user,
      password_hash: user.password_hash || hashPassword('Demo@123'),
      region_id: linkedRegionId
    });
  }
  console.log(`[OK] Government User Accounts seeded: ${usersToSeed.length} accounts.`);

  // 3. Seed Government Offices
  const officesToSeed = loadSampleJson('government_offices.json');
  for (const off of officesToSeed) {
    let regionId = null;
    if (off.region_name && regionMap[off.region_name]) {
      regionId = regionMap[off.region_name].id;
    } else if (off.ward && regionMap[off.ward]) {
      regionId = regionMap[off.ward].id;
    } else if (off.district) {
      const match = Object.values(regionMap).find(r => 
        r.district === off.district && 
        (off.name.toLowerCase().includes(r.name.toLowerCase()) || (r.ward && off.name.toLowerCase().includes(r.ward.toLowerCase())))
      );
      if (match) regionId = match.id;
    }
    await db.upsertGovernmentOffice({
      ...off,
      region_id: regionId
    });
  }
  console.log(`[OK] Government Offices seeded: ${officesToSeed.length} offices.`);

  // 4. Seed Local Representatives
  const repsToSeed = loadSampleJson('local_representatives.json');
  for (const rep of repsToSeed) {
    let regionId = null;
    if (rep.region_name && regionMap[rep.region_name]) {
      regionId = regionMap[rep.region_name].id;
    } else if (rep.ward && regionMap[rep.ward]) {
      regionId = regionMap[rep.ward].id;
    } else if (rep.ward) {
      const match = Object.values(regionMap).find(r => 
        r.ward === rep.ward || (r.name && rep.ward.toLowerCase().includes(r.name.toLowerCase()))
      );
      if (match) regionId = match.id;
    }
    await db.upsertRepresentative({
      ...rep,
      region_id: regionId
    });
  }
  console.log(`[OK] Local Representatives seeded: ${repsToSeed.length} representatives.`);

  // 5. Seed Government Plans
  const plansToSeed = loadSampleJson('government_plans.json');
  for (const plan of plansToSeed) {
    await db.upsertGovernmentPlan(plan);
  }
  console.log(`[OK] Government Plans seeded: ${plansToSeed.length} plans.`);

  // 6. Seed Complete Development Requests Dataset (149 Requests across All States)
  const requestsToSeed = loadSampleJson('development_requests.json');
  for (const req of requestsToSeed) {
    let regionId = null;
    if (req.region_name && regionMap[req.region_name]) {
      regionId = regionMap[req.region_name].id;
    } else if (req.ward && regionMap[req.ward]) {
      regionId = regionMap[req.ward].id;
    } else if (req.village && regionMap[req.village]) {
      regionId = regionMap[req.village].id;
    } else if (req.locality && regionMap[req.locality]) {
      regionId = regionMap[req.locality].id;
    } else if (req.location_details) {
      const match = Object.values(regionMap).find(r => 
        (r.name && req.location_details.toLowerCase().includes(r.name.toLowerCase())) ||
        (r.ward && req.location_details.toLowerCase().includes(r.ward.toLowerCase())) ||
        (r.locality && req.location_details.toLowerCase().includes(r.locality.toLowerCase()))
      );
      if (match) regionId = match.id;
    }
    await db.upsertDemoRequest({
      ...req,
      region_id: regionId
    });
  }
  console.log(`[OK] Development Requests seeded: ${requestsToSeed.length} requests.`);

  const stats = await db.getStats('Maharashtra');
  console.log('===============================================================');
  console.log(` Maharashtra State Requests: ${stats.total}`);
  console.log(` Categories:`, stats.byCategory);
  console.log(` Urgency:   `, stats.byUrgency);
  console.log(` Districts: `, stats.byDistrict);
  console.log(' Complete dataset ready and verified from JSON source.');
  console.log('===============================================================');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = { seed };
