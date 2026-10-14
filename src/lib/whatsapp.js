import companyData from '../../data/company.json';

/**
 * Single source of truth for company contact details.
 */
export const COMPANY_CONTACT = {
  name: companyData.name || 'FlowerSpot Events & Wedding Planners',
  phoneDisplay: companyData.phone || '+91 80984 15066',
  // Digits only in international format for WhatsApp wa.me link (no +, -, or spaces)
  whatsappNumber: (companyData.whatsapp || '918098415066').replace(/[^0-9]/g, ''),
  // E.164 dialer format for native tel: links
  phoneDial: (companyData.phone || '+918098415066').replace(/[^0-9+]/g, '').startsWith('+')
    ? (companyData.phone || '+918098415066').replace(/[^0-9+]/g, '')
    : `+${(companyData.phone || '918098415066').replace(/[^0-9]/g, '')}`,
  address: companyData.address || 'Shop No.B6, Poomarket, Coimbatore - 641001.',
  city: companyData.city || 'Coimbatore, Tamil Nadu',
  workingHours: companyData.workingHours || 'Open Every Day: 24/7'
};

/**
 * Builds the official WhatsApp Click-to-Chat URL with an encoded, professionally formatted message.
 * Follows the format:
 *
 * Hello, I would like to get an instant quote.
 *
 * Name: [Full Name]
 * Contact Number: [WhatsApp Number]
 * Email: [Email Address]
 * Service: [Selected Service]
 * Event Date: [Event Date]
 * Location: [Event Location]
 * Budget: [Budget Range]
 *
 * Additional Requirements:
 * [Additional Requirements]
 *
 * Please contact me with the details and pricing. Thank you!
 *
 * (Optional fields are omitted if empty)
 */
export function buildWhatsAppQuoteUrl({
  fullName,
  whatsappNumber,
  email,
  service,
  eventDate,
  location,
  budget,
  requirements,
  recipientNumber = COMPANY_CONTACT.whatsappNumber
}) {
  const cleanRecipient = String(recipientNumber).replace(/[^0-9]/g, '');

  const lines = [
    'Hello, I would like to get an instant quote.',
    '',
    `Name: ${fullName?.trim() || ''}`,
    `Contact Number: ${whatsappNumber?.trim() || ''}`
  ];

  if (email && email.trim()) {
    lines.push(`Email: ${email.trim()}`);
  }

  lines.push(`Service: ${service?.trim() || 'General Stage Decoration'}`);

  if (eventDate && eventDate.trim()) {
    lines.push(`Event Date: ${eventDate.trim()}`);
  }

  if (location && location.trim()) {
    lines.push(`Location: ${location.trim()}`);
  }

  if (budget && budget.trim()) {
    lines.push(`Budget: ${budget.trim()}`);
  }

  if (requirements && requirements.trim()) {
    lines.push('');
    lines.push('Additional Requirements:');
    lines.push(requirements.trim());
  }

  lines.push('');
  lines.push('Please contact me with the details and pricing. Thank you!');

  const rawMessage = lines.join('\n');
  const encodedMessage = encodeURIComponent(rawMessage);
  const url = `https://wa.me/${cleanRecipient}?text=${encodedMessage}`;

  return {
    url,
    rawMessage,
    recipientNumber: cleanRecipient
  };
}
