// Local portrait pools used only as default avatar presets when a real user signs up without uploading a custom photo
export const FEMALE_PHOTO_POOL = [
  '/priya-sharma.jpg',
  '/images%20(7).jpg',
  '/images%20(11).jpg',
  '/images%20(5).jpg',
  '/images%20(13).jpg',
  '/images%20(10).jpg',
];

export const MALE_PHOTO_POOL = [
  '/rohit-verma.jpg',
  '/aman-singh.jpg',
  '/images%20(14).jpg',
  '/images%20(6).jpg',
  '/images%20(2).jpg',
  '/images%20(18).jpg',
];

export function getDefaultPhotoForGender(gender = 'female', index = 0) {
  const pool =
    String(gender).toLowerCase() === 'male' ? MALE_PHOTO_POOL : FEMALE_PHOTO_POOL;
  return pool[Math.abs(index) % pool.length];
}

const DUMMY_EMAILS_SET = new Set([
  'priya.sharma@lovekaro.com',
  'sneha.patel@lovekaro.com',
  'ananya.verma@lovekaro.com',
  'kavya.nair@lovekaro.com',
  'riya.malhotra@lovekaro.com',
  'meera.joshi@lovekaro.com',
  'rohit.verma@lovekaro.com',
  'aman.singh@lovekaro.com',
  'vikram.rathore@lovekaro.com',
  'siddharth.mehta@lovekaro.com',
  'arjun.kapoor@lovekaro.com',
  'karan.oberoi@lovekaro.com',
  'kabir.khan@lovekaro.com',
  'vikram.aditya@lovekaro.com',
  'siddharth.malhotra@lovekaro.com',
  'riya.kapoor@lovekaro.com',
]);

const DUMMY_PHONES_SET = new Set([
  '9811001101',
  '9811001102',
  '9811001103',
  '9811001104',
  '9811001105',
  '9811001106',
  '9811002201',
  '9811002202',
  '9811002203',
  '9811002204',
  '9811002205',
  '9811002206',
]);

const DUMMY_NAMES_SET = new Set([
  'priya sharma',
  'sneha patel',
  'ananya verma',
  'kavya nair',
  'riya malhotra',
  'meera joshi',
  'rohit verma',
  'aman singh',
  'vikram rathore',
  'siddharth mehta',
  'arjun kapoor',
  'karan oberoi',
  'kabir khan',
  'vikram aditya',
  'siddharth malhotra',
  'riya kapoor',
]);

// Strict check to ensure dummy/seed profiles never appear anywhere in the UI
export function isRealRegisteredUser(u) {
  if (!u) return false;
  const email = String(u.email || '').trim().toLowerCase();
  const phone = String(u.phone || '').trim();
  const name = String(u.name || '').trim().toLowerCase();
  if (email && DUMMY_EMAILS_SET.has(email)) return false;
  if (phone && DUMMY_PHONES_SET.has(phone)) return false;
  if (name && DUMMY_NAMES_SET.has(name) && (!email || email.endsWith('@lovekaro.com'))) {
    return false;
  }
  if (DUMMY_NAMES_SET.has(name) && !u.email) {
    return false;
  }
  return true;
}

export const femaleProfiles = [];
export const maleProfiles = [];
export const profiles = [];

export function getProfilesForViewer() {
  return [];
}
