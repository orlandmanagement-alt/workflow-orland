export const sanitizeMessage = (text: string): string => {
  // 1. Regex No HP (Indonesia 08xxx / +62xxx)
  const phoneRegex = /(\+62|62|0)8[1-9][0-9]{6,10}/g;
  
  // 2. Regex Email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  
  // 3. Daftar Kata Kotor (Banned Words)
  const bannedWords = ['bodoh', 'goblok', 'anjing', 'bangsat', 'fuck', 'shit']; 
  
  let filtered = text;

  // Sensor No HP & Email
  filtered = filtered.replace(phoneRegex, '[NOMOR TERPROTEKSI]');
  filtered = filtered.replace(emailRegex, '[EMAIL TERPROTEKSI]');

  // Sensor Kata Kotor
  bannedWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });

  return filtered;
};
