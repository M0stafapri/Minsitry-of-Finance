/**
 * Phone number validation utilities
 */

// Country codes and their expected phone number lengths (excluding the country code)
export const countryCodes = [
  // Middle East & North Africa
  { code: '+20', country: 'Egypt', arabicName: 'مصر', lengths: [10], flag: 'eg' },
  { code: '+966', country: 'Saudi Arabia', arabicName: 'السعودية', lengths: [9], flag: 'sa' },
  { code: '+971', country: 'UAE', arabicName: 'الإمارات', lengths: [9], flag: 'ae' },
  { code: '+974', country: 'Qatar', arabicName: 'قطر', lengths: [8], flag: 'qa' },
  { code: '+965', country: 'Kuwait', arabicName: 'الكويت', lengths: [8], flag: 'kw' },
  { code: '+968', country: 'Oman', arabicName: 'عمان', lengths: [8], flag: 'om' },
  { code: '+973', country: 'Bahrain', arabicName: 'البحرين', lengths: [8], flag: 'bh' },
  { code: '+962', country: 'Jordan', arabicName: 'الأردن', lengths: [9], flag: 'jo' },
  { code: '+961', country: 'Lebanon', arabicName: 'لبنان', lengths: [7, 8], flag: 'lb' },
  { code: '+963', country: 'Syria', arabicName: 'سوريا', lengths: [9], flag: 'sy' },
  { code: '+964', country: 'Iraq', arabicName: 'العراق', lengths: [10], flag: 'iq' },
  { code: '+970', country: 'Palestine', arabicName: 'فلسطين', lengths: [9], flag: 'ps' },
  { code: '+212', country: 'Morocco', arabicName: 'المغرب', lengths: [9], flag: 'ma' },
  { code: '+213', country: 'Algeria', arabicName: 'الجزائر', lengths: [9], flag: 'dz' },
  { code: '+216', country: 'Tunisia', arabicName: 'تونس', lengths: [8], flag: 'tn' },
  { code: '+218', country: 'Libya', arabicName: 'ليبيا', lengths: [9], flag: 'ly' },
  { code: '+249', country: 'Sudan', arabicName: 'السودان', lengths: [9], flag: 'sd' },
  { code: '+967', country: 'Yemen', arabicName: 'اليمن', lengths: [9], flag: 'ye' },
  
  // Europe
  { code: '+44', country: 'United Kingdom', arabicName: 'المملكة المتحدة', lengths: [10], flag: 'gb' },
  { code: '+33', country: 'France', arabicName: 'فرنسا', lengths: [9], flag: 'fr' },
  { code: '+49', country: 'Germany', arabicName: 'ألمانيا', lengths: [10, 11], flag: 'de' },
  { code: '+39', country: 'Italy', arabicName: 'إيطاليا', lengths: [9, 10], flag: 'it' },
  { code: '+34', country: 'Spain', arabicName: 'إسبانيا', lengths: [9], flag: 'es' },
  { code: '+31', country: 'Netherlands', arabicName: 'هولندا', lengths: [9], flag: 'nl' },
  { code: '+32', country: 'Belgium', arabicName: 'بلجيكا', lengths: [9], flag: 'be' },
  { code: '+41', country: 'Switzerland', arabicName: 'سويسرا', lengths: [9], flag: 'ch' },
  { code: '+46', country: 'Sweden', arabicName: 'السويد', lengths: [9], flag: 'se' },
  { code: '+47', country: 'Norway', arabicName: 'النرويج', lengths: [8], flag: 'no' },
  { code: '+45', country: 'Denmark', arabicName: 'الدنمارك', lengths: [8], flag: 'dk' },
  { code: '+358', country: 'Finland', arabicName: 'فنلندا', lengths: [9], flag: 'fi' },
  { code: '+30', country: 'Greece', arabicName: 'اليونان', lengths: [10], flag: 'gr' },
  { code: '+351', country: 'Portugal', arabicName: 'البرتغال', lengths: [9], flag: 'pt' },
  { code: '+353', country: 'Ireland', arabicName: 'أيرلندا', lengths: [9], flag: 'ie' },
  { code: '+43', country: 'Austria', arabicName: 'النمسا', lengths: [10], flag: 'at' },
  { code: '+48', country: 'Poland', arabicName: 'بولندا', lengths: [9], flag: 'pl' },
  { code: '+36', country: 'Hungary', arabicName: 'المجر', lengths: [9], flag: 'hu' },
  { code: '+420', country: 'Czech Republic', arabicName: 'جمهورية التشيك', lengths: [9], flag: 'cz' },
  { code: '+90', country: 'Turkey', arabicName: 'تركيا', lengths: [10], flag: 'tr' },
  
  // Americas
  { code: '+1', country: 'United States', lengths: [10], flag: 'us' },
  { code: '+1', country: 'Canada', lengths: [10], flag: 'ca' },
  { code: '+52', country: 'Mexico', lengths: [10], flag: 'mx' },
  { code: '+55', country: 'Brazil', lengths: [10, 11], flag: 'br' },
  { code: '+54', country: 'Argentina', lengths: [10], flag: 'ar' },
  { code: '+56', country: 'Chile', lengths: [9], flag: 'cl' },
  { code: '+57', country: 'Colombia', lengths: [10], flag: 'co' },
  { code: '+51', country: 'Peru', lengths: [9], flag: 'pe' },
  { code: '+58', country: 'Venezuela', lengths: [10], flag: 've' },
  
  // Asia & Pacific
  { code: '+86', country: 'China', lengths: [11], flag: 'cn' },
  { code: '+91', country: 'India', lengths: [10], flag: 'in' },
  { code: '+81', country: 'Japan', lengths: [10], flag: 'jp' },
  { code: '+82', country: 'South Korea', lengths: [9, 10], flag: 'kr' },
  { code: '+65', country: 'Singapore', lengths: [8], flag: 'sg' },
  { code: '+60', country: 'Malaysia', lengths: [9, 10], flag: 'my' },
  { code: '+66', country: 'Thailand', lengths: [9], flag: 'th' },
  { code: '+62', country: 'Indonesia', lengths: [9, 10, 11, 12], flag: 'id' },
  { code: '+63', country: 'Philippines', lengths: [10], flag: 'ph' },
  { code: '+84', country: 'Vietnam', lengths: [9, 10], flag: 'vn' },
  { code: '+61', country: 'Australia', lengths: [9], flag: 'au' },
  { code: '+64', country: 'New Zealand', lengths: [9], flag: 'nz' },
  
  // Africa
  { code: '+27', country: 'South Africa', lengths: [9], flag: 'za' },
  { code: '+234', country: 'Nigeria', lengths: [10], flag: 'ng' },
  { code: '+254', country: 'Kenya', lengths: [9], flag: 'ke' },
  { code: '+251', country: 'Ethiopia', lengths: [9], flag: 'et' },
  { code: '+255', country: 'Tanzania', lengths: [9], flag: 'tz' },
  { code: '+256', country: 'Uganda', lengths: [9], flag: 'ug' },
  { code: '+233', country: 'Ghana', lengths: [9], flag: 'gh' },
  { code: '+237', country: 'Cameroon', lengths: [9], flag: 'cm' },
  { code: '+225', country: 'Ivory Coast', lengths: [8], flag: 'ci' },
];

/**
 * Formats a phone number with proper country code
 * @param {string} phoneNumber - The phone number to format
 * @returns {string} - The formatted phone number with country code
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove any non-digit characters except for the plus sign at the beginning
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If the number doesn't start with +, assume it's an Egyptian number
  if (!cleaned.startsWith('+')) {
    // If it starts with a 0, remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    // Add Egyptian country code
    cleaned = '+20' + cleaned;
  }
  
  return cleaned;
};

/**
 * Validates a phone number
 * @param {string} phoneNumber - The phone number to validate
 * @returns {Object} - Validation result with isValid flag and error message
 */
export const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) {
    return { isValid: false, error: 'رقم الهاتف مطلوب' };
  }
  
  // Format the phone number
  const formattedNumber = formatPhoneNumber(phoneNumber);
  
  // Check if the number starts with a valid country code
  const countryCode = countryCodes.find(cc => formattedNumber.startsWith(cc.code));
  
  if (!countryCode) {
    return { 
      isValid: false, 
      error: 'رمز الدولة غير صالح. يرجى استخدام رمز دولة صالح (مثل +20 لمصر)' 
    };
  }
  
  // Check the length of the number (excluding the country code)
  const numberWithoutCode = formattedNumber.substring(countryCode.code.length);
  const isValidLength = countryCode.lengths.includes(numberWithoutCode.length);
  
  // Get the country name in Arabic
  const countryName = countryCode.arabicName || countryCode.country;
  
  if (!isValidLength) {
    return { 
      isValid: false, 
      error: `رقم هاتف ${countryName} يجب أن يكون ${countryCode.lengths.join(' أو ')} أرقام (بدون رمز الدولة)` 
    };
  }
  
  return { isValid: true, formattedNumber };
};

/**
 * Displays a phone number with or without the country code based on the country
 * @param {string} phoneNumber - The phone number with country code
 * @returns {string} - The formatted phone number for display
 */
export const displayPhoneWithoutCountryCode = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Find the country code in the phone number
  const countryCode = countryCodes.find(cc => phoneNumber.startsWith(cc.code));
  
  if (!countryCode) {
    // If no country code is found, return the original number
    return phoneNumber;
  }
  
  // Special case for Egypt: remove the country code and add leading zero
  if (countryCode.code === '+20') {
    return '0' + phoneNumber.substring(countryCode.code.length);
  }
  
  // For all other countries, keep the country code
  return phoneNumber;
};

/**
 * Displays WhatsApp number or 'Not Available' message
 * @param {string} whatsappNumber - The WhatsApp number
 * @returns {string} - The WhatsApp number or 'Not Available' message
 */
export const displayWhatsApp = (whatsappNumber) => {
  if (!whatsappNumber) return 'غير متوفر'; // 'غير متوفر' in Arabic
  
  // Find the country code in the phone number
  const countryCode = countryCodes.find(cc => whatsappNumber.startsWith(cc.code));
  
  if (!countryCode) {
    // If no country code is found, return the original number
    return whatsappNumber;
  }
  
  // For all countries, keep the country code for WhatsApp
  return whatsappNumber;
};
