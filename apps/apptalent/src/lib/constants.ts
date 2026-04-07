export const MASTER_DATA = {
  CITIES: [
    "Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar", 
    "Palembang", "Tangerang", "Depok", "Bekasi", "Bogor", "Denpasar (Bali)", 
    "Yogyakarta", "Malang", "Surakarta (Solo)", "Balikpapan", "Banjarmasin", 
    "Pontianak", "Samarinda", "Batam", "Pekanbaru", "Padang", "Bandar Lampung",
    "Jambi", "Manado", "Mataram", "Kupang", "Ambon", "Jayapura", "Sorong", "Luar Indonesia / Other"
  ],
  CATEGORY: ["Model", "Actor", "Voice Over", "Influencer", "Dancer", "Other"],
  ETHNICITY: ["Asian", "Caucasian", "Hispanic", "African Descent", "Mixed Race", "Other"],
  INTERESTS: [
    "Acting", "Modeling", "Reality TV", "Theater", "Music Videos", 
    "Singing", "Dancing", "Promotional Models", "Voice-Over", 
    "Extras", "Commercials", "Content Creators", "Influencers"
  ],
  APPEARANCE: {
    EYES: ["Brown", "Black", "Blue", "Green", "Grey", "Hazel", "Other", "N/A"],
    HAIR: ["Black", "Brown", "Blonde", "Grey", "Red", "White", "Bald", "Other", "N/A"],
    BODY_TYPE: ["Athletic", "Average", "Curvy", "Muscular", "Plus-sized", "Slim", "Petite", "N/A"],
    TATTOOS: ["None", "Arms", "Back", "Chest", "Leg", "Neck", "Hand", "Face", "Other"],
    PIERCINGS: ["None", "Ear/Ears", "Nose", "Eyebrow", "Lip", "Tongue", "Other"],
    SPECIFIC_CHARACTERISTICS: ["None", "Large Scar", "Vitiligo", "Eczema", "Deaf", "Blind", "Other"]
  }
};

export const getHeights = () => {
    return Array.from(new Array(60), (_, index) => 150 + index); // 150 - 209
};

export const getWeights = () => {
    return Array.from(new Array(161), (_, index) => 40 + index); // 40 - 200
};
