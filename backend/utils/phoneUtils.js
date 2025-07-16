function formatPhone(phone) {
  if (!phone) return phone;

  phone = phone.trim();

  if (phone.startsWith("+")) return phone;

  if (/^01[0-9]{9}$/.test(phone)) {
    return `+2${phone}`;
  }

  return null;
}

// Add isValidInternationalPhone for compatibility with supplier controller
function isValidInternationalPhone(phone) {
  return formatPhone(phone);
}

module.exports = { formatPhone, isValidInternationalPhone };
