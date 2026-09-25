export type GeoLocation = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  hint: string;
};

// Street-View-friendly coordinates (on/near roads with coverage).
// True answer is the landmark; panorama is close enough to explore.
export const LOCATIONS: GeoLocation[] = [
  { id: "eiffel", name: "Eiffel Tower", country: "France", lat: 48.8584, lng: 2.2945, hint: "Iron lady, 1889 World's Fair. Look for French road signs." },
  { id: "times-square", name: "Times Square", country: "USA", lat: 40.758, lng: -73.9855, hint: "Yellow cabs, billboards, Broadway." },
  { id: "big-ben", name: "Big Ben / Westminster", country: "United Kingdom", lat: 51.5007, lng: -0.1246, hint: "Drive on the left. Red buses." },
  { id: "shibuya", name: "Shibuya Crossing", country: "Japan", lat: 35.6595, lng: 139.7005, hint: "World's busiest crossing. Kanji everywhere." },
  { id: "sydney-opera", name: "Sydney Opera House", country: "Australia", lat: -33.8568, lng: 151.2153, hint: "Sails by the harbour. English, but drives left." },
  { id: "copacabana", name: "Copacabana Beach", country: "Brazil", lat: -22.9711, lng: -43.1822, hint: "Portuguese, wave-pattern promenade, beach." },
  { id: "pyramids", name: "Pyramids of Giza", country: "Egypt", lat: 29.9792, lng: 31.1342, hint: "Desert + Arabic signs. Camels optional." },
  { id: "colosseum", name: "Colosseum", country: "Italy", lat: 41.8902, lng: 12.4922, hint: "Ancient amphitheatre. Italian plates (blue EU strip)." },
  { id: "sagrada", name: "Sagrada Familia", country: "Spain", lat: 41.4036, lng: 2.1744, hint: "Gaudi basilica in Barcelona. Spanish/Catalan signs." },
  { id: "brandenburg", name: "Brandenburg Gate", country: "Germany", lat: 52.5163, lng: 13.3777, hint: "Berlin landmark. German umlauts on signs." },
  { id: "amsterdam", name: "Amsterdam Canals", country: "Netherlands", lat: 52.3676, lng: 4.9041, hint: "Canals + bikes everywhere. Dutch gables." },
  { id: "santorini", name: "Santorini (Fira)", country: "Greece", lat: 36.3918, lng: 25.4595, hint: "White houses, blue domes, Aegean sea." },
  { id: "bosphorus", name: "Istanbul — Galata", country: "Türkiye", lat: 41.0257, lng: 28.9744, hint: "Europe meets Asia. Turkish signs, minarets." },
  { id: "moscow-red", name: "Red Square", country: "Russia", lat: 55.7539, lng: 37.6208, hint: "Cyrillic signs, onion domes." },
  { id: "dubai-marina", name: "Dubai Marina", country: "UAE", lat: 25.0805, lng: 55.1403, hint: "Supertall towers, desert sun, Arabic + English." },
  { id: "marina-bay", name: "Marina Bay Sands", country: "Singapore", lat: 1.2836, lng: 103.8607, hint: "Tropical, spotless, English + Mandarin/Malay signs." },
  { id: "kl-towers", name: "Petronas Towers", country: "Malaysia", lat: 3.1579, lng: 101.7116, hint: "Twin towers, Kuala Lumpur. Malay signs." },
  { id: "bangkok-palace", name: "Grand Palace Bangkok", country: "Thailand", lat: 13.75, lng: 100.4913, hint: "Thai script (curly, no spaces). Tuk-tuks." },
  { id: "hongkong", name: "Victoria Harbour, Hong Kong", country: "China", lat: 22.293, lng: 114.1696, hint: "Dense towers, double-deck trams. Traditional characters." },
  { id: "great-wall", name: "Great Wall (Badaling)", country: "China", lat: 40.4319, lng: 116.5704, hint: "Mountains + ancient wall. Simplified characters nearby." },
  { id: "seoul", name: "Gyeongbokgung, Seoul", country: "South Korea", lat: 37.5796, lng: 126.977, hint: "Hangul alphabet (circles + lines). Palaces + neon." },
  { id: "delhi-gate", name: "India Gate, Delhi", country: "India", lat: 28.6129, lng: 77.2295, hint: "Hindi + English signs. Auto-rickshaws, left driving." },
  { id: "taj", name: "Taj Mahal (road view)", country: "India", lat: 27.1751, lng: 78.0421, hint: "White marble mausoleum. Agra, Uttar Pradesh." },
  { id: "table-mountain", name: "Table Mountain Road", country: "South Africa", lat: -33.9628, lng: 18.4098, hint: "Cape Town. English + Afrikaans, drives left." },
  { id: "marrakech", name: "Marrakech Medina", country: "Morocco", lat: 31.6295, lng: -7.9811, hint: "Arabic + French. Souks, red walls." },
  { id: "nairobi", name: "Nairobi — Kenyatta Ave", country: "Kenya", lat: -1.2864, lng: 36.8172, hint: "English signs, matatus, drives left." },
  { id: "reykjavik", name: "Reykjavik — Hallgrimskirkja", country: "Iceland", lat: 64.1466, lng: -21.9426, hint: "Nordic church, Icelandic (þ, ð letters)." },
  { id: "oslo-opera", name: "Oslo Opera House", country: "Norway", lat: 59.9075, lng: 10.7529, hint: "Fjord + white marble roof. Norwegian (ø, å)." },
  { id: "stockholm", name: "Gamla Stan, Stockholm", country: "Sweden", lat: 59.3256, lng: 18.0709, hint: "Colourful old town. Swedish (ö, ä)." },
  { id: "helsinki", name: "Helsinki Cathedral", country: "Finland", lat: 60.1704, lng: 24.9522, hint: "White cathedral. Finnish (double vowels: aa, ii)." },
  { id: "copenhagen", name: "Nyhavn, Copenhagen", country: "Denmark", lat: 55.6797, lng: 12.5913, hint: "Coloured harbour houses. Danish (ø, æ)." },
  { id: "lisbon", name: "Belem Tower, Lisbon", country: "Portugal", lat: 38.6916, lng: -9.216, hint: "Portuguese tiles, trams, custard tarts." },
  { id: "venice", name: "Venice — Rialto area", country: "Italy", lat: 45.4379, lng: 12.3358, hint: "No cars — canals and alleys." },
  { id: "prague", name: "Charles Bridge, Prague", country: "Czechia", lat: 50.0865, lng: 14.4114, hint: "Gothic towers. Czech diacritics (ř, š, č)." },
  { id: "vienna", name: "Schönbrunn Palace", country: "Austria", lat: 48.1845, lng: 16.3119, hint: "Imperial yellow palace. German signs." },
  { id: "budapest", name: "Parliament, Budapest", country: "Hungary", lat: 47.5071, lng: 19.0456, hint: "Danube + neo-Gothic. Hungarian (long words, ő ű)." },
  { id: "krakow", name: "Main Square, Krakow", country: "Poland", lat: 50.0614, lng: 19.9366, hint: "Polish (ł, ż, ó). Pigeons + bugles." },
  { id: "toronto-cn", name: "CN Tower, Toronto", country: "Canada", lat: 43.6426, lng: -79.3871, hint: "English + French on federal signs. drives right." },
  { id: "niagara", name: "Niagara Falls", country: "Canada", lat: 43.0962, lng: -79.0377, hint: "Huge waterfalls on US/Canada border." },
  { id: "golden-gate", name: "Golden Gate Bridge", country: "USA", lat: 37.8199, lng: -122.4783, hint: "Orange bridge + fog. California plates." },
  { id: "hollywood", name: "Hollywood Sign viewpoint", country: "USA", lat: 34.1341, lng: -118.3215, hint: "Hills + white letters. Los Angeles." },
  { id: "chichen", name: "Chichen Itza", country: "Mexico", lat: 20.6843, lng: -88.5678, hint: "Mayan pyramid. Spanish signs, Yucatan." },
  { id: "machu-picchu", name: "Machu Picchu viewpoint", country: "Peru", lat: -13.1631, lng: -72.545, hint: "Andes citadel. Spanish + Quechua." },
  { id: "christ-redeemer", name: "Christ the Redeemer (road)", country: "Brazil", lat: -22.9511, lng: -43.2105, hint: "Hilltop statue over Rio." },
  { id: "buenos-aires", name: "Obelisco, Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816, hint: "Wide avenues, Spanish, steak houses." },
  { id: "santiago", name: "Plaza de Armas, Santiago", country: "Chile", lat: -33.4372, lng: -70.6506, hint: "Andes backdrop. Chilean Spanish." },
  { id: "auckland", name: "Auckland Sky Tower", country: "New Zealand", lat: -36.8485, lng: 174.7622, hint: "English + Māori (wh, macrons). drives left." },
  { id: "uluru-road", name: "Uluru Highway", country: "Australia", lat: -25.3444, lng: 131.0369, hint: "Red desert, giant rock. Outback road trains." },
];
