import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(root, 'public');
const indexPath = path.join(publicRoot, 'index.html');
const adminPath = path.join(publicRoot, 'admin.html');
const index = fs.readFileSync(indexPath, 'utf8');
const admin = fs.readFileSync(adminPath, 'utf8');
const siteJs = fs.readFileSync(path.join(publicRoot, 'assets/js/site.js'), 'utf8');
const rsvpConfig = fs.readFileSync(path.join(publicRoot, 'assets/rsvp-config.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'backend/rsvp-backend.gs'), 'utf8');
const calendar = fs.readFileSync(path.join(publicRoot, 'wedding.ics'), 'utf8');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const authoritativeValues = [
  'Mohamed Badusha',
  'Mumthas Nadeera',
  'Sunday',
  '30 August 2026',
  '11:30 AM – 2:00 PM',
  'Planet Auditorium',
  "17 Rabi' al-awwal 1448",
  'Mr. Basheer',
  'Mrs. Subaida Basheer',
  'Veliyakath House',
  'Kurukol',
  'Mr. Muhammed Ali',
  'Mrs. Fakeera Muhammed Ali',
  'Erayathuparambil House',
  'Medippara, Ilathapadi',
  'https://maps.app.goo.gl/E7kseLG7TxHm4TL17'
];
authoritativeValues.forEach((value) => assert(index.includes(value), `Missing authoritative invitation value: ${value}`));
assert(index.indexOf('Mr. Basheer') < index.indexOf('Mr. Muhammed Ali'), 'Groom family must appear before bride family.');
assert(siteJs.includes("2026-08-30T11:30:00+05:30"), 'Countdown target is missing or incorrect.');
assert((index.match(/class="story-frame(?: is-active)?"/g) || []).length === 6, 'The invitation must contain exactly six story frames.');
for (let frame = 1; frame <= 6; frame += 1) {
  const number = String(frame).padStart(2, '0');
  assert(index.includes(`story_frame_${number}.webp`), `Missing desktop story frame ${number}.`);
  assert(index.includes(`story_frame_${number}_mobile.webp`), `Missing mobile story frame ${number}.`);
}
assert(index.includes('loading="lazy"'), 'Below-the-fold images should be lazy loaded.');
assert(index.includes('prefers-reduced-motion') || fs.readFileSync(path.join(publicRoot, 'assets/css/site.css'), 'utf8').includes('prefers-reduced-motion'), 'Reduced-motion support is missing.');
assert(index.includes('<link rel="canonical" href="https://badusha-wedding-invitation.pages.dev/">'), 'Production canonical URL is missing.');
assert(index.includes('<meta property="og:url" content="https://badusha-wedding-invitation.pages.dev/">'), 'Production Open Graph URL is missing.');
assert(index.includes('content="https://badusha-wedding-invitation.pages.dev/assets/story/story_frame_06.webp"'), 'Social sharing image must use an absolute production URL.');

['Responses', 'Accepted', 'Expected People', 'Declined', 'Average Party Size', 'Refresh', 'Export CSV'].forEach((value) => {
  assert(admin.includes(value), `Admin dashboard is missing: ${value}`);
});
assert(admin.includes('noindex, nofollow'), 'Admin noindex metadata is missing.');

assert(calendar.includes('DTSTART;TZID=Asia/Kolkata:20260830T113000'), 'Calendar start is incorrect.');
assert(calendar.includes('DTEND;TZID=Asia/Kolkata:20260830T140000'), 'Calendar end is incorrect.');
assert(calendar.includes('SUMMARY:Mohamed Badusha & Mumthas Nadeera — Wedding Reception'), 'Calendar summary is incorrect.');
assert(calendar.includes('https://maps.app.goo.gl/E7kseLG7TxHm4TL17'), 'Calendar map URL is missing.');

assert(!backend.includes("const ADMIN_PASSWORD ="), 'Backend source must not contain a hard-coded admin password.');
assert(backend.includes("getProperty('ADMIN_PASSWORD')"), 'Backend must read the admin password from Script Properties.');
assert(backend.includes('LockService.getScriptLock()'), 'Backend must lock RSVP upserts.');
assert(backend.includes("attendance === 'Yes'"), 'Backend attendance validation is missing.');
assert(backend.includes('guestCount: guestCount'), 'Backend guest-count normalization is missing.');

function localReferences(html) {
  const refs = [];
  for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) refs.push(match[1]);
  for (const match of html.matchAll(/srcset="([^"]+)"/g)) {
    match[1].split(',').forEach((part) => refs.push(part.trim().split(/\s+/)[0]));
  }
  return refs.filter((reference) => reference && !reference.startsWith('#') && !/^(?:https?:|mailto:|tel:|data:)/.test(reference));
}

const referenced = new Set([...localReferences(index), ...localReferences(admin)]);
for (const reference of referenced) {
  const clean = reference.split(/[?#]/)[0];
  assert(fs.existsSync(path.join(publicRoot, clean)), `Broken local reference: ${reference}`);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const publicFiles = walk(publicRoot);
assert(!publicFiles.some((file) => file.endsWith('.gs')), 'Google Apps Script source must not be inside public/.');
const publicText = publicFiles.filter((file) => /\.(?:html|js|css|json|webmanifest|txt|ics|svg)$/.test(file)).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
assert(!/(?:ADMIN_PASSWORD|password|passwd|credential)\s*[:=]\s*["']\d{6,}["']/i.test(publicText), 'A clear-text numeric credential leaked into public files.');
assert(/endpoint:\s*'https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec'/.test(rsvpConfig), 'A valid production Apps Script /exec endpoint is required.');

if (failures.length) {
  console.error(`Audit failed with ${failures.length} issue(s):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Audit passed: ${publicFiles.length} public files, ${referenced.size} local references, six responsive story frames, authoritative wedding data, calendar, RSVP backend, and admin dashboard checks.`);
