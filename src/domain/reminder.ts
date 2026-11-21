/** Keeps digits only and converts a local number to international format when a country code is given. */
export function normalizePhone(raw: string, defaultCountryCode = ''): string {
  let digits = raw.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.slice(1).replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  digits = digits.replace(/\D/g, '');
  if (defaultCountryCode && !digits.startsWith(defaultCountryCode)) {
    return defaultCountryCode + digits.replace(/^0+/, '');
  }
  return digits;
}

/** Builds a wa.me deep link that opens WhatsApp with a pre-filled message. */
export function buildWhatsAppLink(phone: string, message: string, defaultCountryCode = ''): string {
  const number = normalizePhone(phone, defaultCountryCode);
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}
