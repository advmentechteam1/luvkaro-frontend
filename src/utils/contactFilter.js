// Strict detector for Phone numbers, Instagram IDs, Social media handles, and external links in Free Chat
export function detectRestrictedContactInfo(rawText) {
  if (!rawText) return null;
  const text = rawText.toLowerCase();

  // 1. Check for 6 or more consecutive/spaced digits (e.g. 9876543210, 98765 43210, 9-8-7-6-5-4-3-2-1-0)
  const digitsOnly = text.replace(/\D/g, '');
  if (digitsOnly.length >= 6) {
    return 'Phone number ya digits share karna Free chat me strictly band hai';
  }

  // 2. Check for written Hindi/English digit words (e.g. "nine eight seven six...")
  const numberWords = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ek', 'do', 'teen', 'char', 'panch', 'che', 'saat', 'aath', 'nau', 'das',
  ];
  let wordHits = 0;
  const words = text.split(/[\s,.-]+/);
  for (const w of words) {
    if (numberWords.includes(w)) wordHits++;
  }
  if (wordHits >= 4) {
    return 'Words me phone number likhna Free chat me allowed nahi hai';
  }

  // 3. Check for @handle (Instagram, Telegram, Twitter) or email
  if (/@\w{2,}/i.test(rawText) || /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(rawText)) {
    return 'Instagram/Telegram handle (@id) ya Email share karna Free chat me allowed nahi hai';
  }

  // 4. Social media keywords & links
  const banned = [
    /\binsta\b/i,
    /\binstagram\b/i,
    /\big\s*[:-]?\s*[a-z0-9._]+/i,
    /\bsnap\b/i,
    /\bsnapchat\b/i,
    /\btelegram\b/i,
    /\bwhatsapp\b/i,
    /\bwa\.me\b/i,
    /\bfacebook\b/i,
    /\bfb\s*id\b/i,
    /\bmy\s*id\b/i,
    /\binsta\s*id\b/i,
    /\bnumber\s*lo\b/i,
    /\bnumber\s*do\b/i,
    /\bcall\s*me\b/i,
    /\bdm\s*me\b/i,
    /\bcontact\s*me\b/i,
    /https?:\/\//i,
    /www\./i,
    /\.com\b/i,
    /\.in\b/i,
  ];

  for (const pattern of banned) {
    if (pattern.test(text)) {
      return 'Instagram ID ya Social Media handle share karna Free chat me strictly band hai';
    }
  }

  return null;
}

