// Japanese translations for locations and UI text

export const LOCATION_TRANSLATIONS = {
  'Tokyo': '東京',
  'Osaka': '大阪',
  'Sendai': '仙台',
  'Fukuoka': '福岡',
  'Okayama': '岡山',
  'Karuizawa': '軽井沢',
  'Toyama': '富山',
  'Kanazawa': '金沢',
  'Shirakawa-Go': '白川郷',
  'Nagahama': '長浜',
  'Otsu': '大津',
  'Tsuruga': '敦賀',
  'Takashima': '高島',
  'Higashiomi': '東近江',
  'Land': '到着',
  'Leave': '出発'
};

export const UI_TRANSLATIONS = {
  'Current Locations': '現在の場所',
  'Arriving in': '到着: ',
  'Departing': '出発: ',
  'person': '人',
  'people': '人',
  'No events scheduled for this date': 'この日の予定はありません'
};

/**
 * Translate a location name to Japanese
 * @param {String} location - Location name in English
 * @param {Boolean} useJapanese - Whether to use Japanese translation
 * @returns {String} Translated location name or original if translation not found
 */
export const translateLocation = (location, useJapanese = false) => {
  if (!useJapanese) return location;
  return LOCATION_TRANSLATIONS[location] || location;
};

/**
 * Translate UI text to Japanese
 * @param {String} text - UI text in English
 * @param {Boolean} useJapanese - Whether to use Japanese translation
 * @returns {String} Translated text or original if translation not found
 */
export const translateUI = (text, useJapanese = false) => {
  if (!useJapanese) return text;
  return UI_TRANSLATIONS[text] || text;
};
