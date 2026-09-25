// Verified roadside panorama spots for CliparsGEO.
// ---------------------------------------------------------------------------
// How this works (adapted from codergautam/worldguessr, PolyForm Noncommercial):
// worldguessr rejection-samples random points inside country polygons and then
// verifies Street View coverage server-side with a Google API key. We have no
// key and no backend, so we get the same "dropped on a random road anywhere"
// feel with a different trick: pick a WEIGHTED-RANDOM COUNTRY (area-weighted,
// western Europe x2 — same bias as worldguessr), then drop on a random
// VERIFIED roadside spot inside it. Every spot below sits on a real road with
// Street View coverage, so there are no dead rounds — the embed snaps to the
// nearest panorama.
//
// Rules for editing: APPEND new countries/spots, never reorder or delete —
// flat indexes are encoded in shared challenge/party links (?c=, ?s=).
// ---------------------------------------------------------------------------

export type SpotCountry = {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  weight: number; // higher = picked more often (roughly: big countries win)
  spots: [number, number][]; // [lat, lng] on real roads with SV coverage
};

export const SPOT_COUNTRIES: SpotCountry[] = [
  { code: "US", name: "United States", weight: 10, spots: [[40.758, -73.9855], [34.0522, -118.2437], [41.8781, -87.6298], [29.7604, -95.3698], [47.6062, -122.3321], [38.9072, -77.0369], [36.1699, -115.1398]] },
  { code: "CA", name: "Canada", weight: 8, spots: [[43.6532, -79.3832], [49.2827, -123.1207], [45.5017, -73.5673], [51.0447, -114.0719]] },
  { code: "MX", name: "Mexico", weight: 7, spots: [[19.4326, -99.1332], [20.6736, -103.344], [25.6866, -100.3161], [21.1619, -86.8515]] },
  { code: "GT", name: "Guatemala", weight: 2, spots: [[14.6349, -90.5515], [14.5586, -90.7295]] },
  { code: "CR", name: "Costa Rica", weight: 2, spots: [[9.9281, -84.0907], [10.6346, -85.437]] },
  { code: "PA", name: "Panama", weight: 2, spots: [[8.9824, -79.5199], [8.4278, -82.4214]] },
  { code: "BR", name: "Brazil", weight: 9, spots: [[-23.5558, -46.6396], [-22.9068, -43.1729], [-15.7939, -47.8828], [-12.9714, -38.5014], [-3.119, -60.0217]] },
  { code: "AR", name: "Argentina", weight: 7, spots: [[-34.6037, -58.3816], [-31.4201, -64.1888], [-32.8895, -68.8458]] },
  { code: "CL", name: "Chile", weight: 5, spots: [[-33.4489, -70.6693], [-33.0458, -71.6197], [-41.4693, -72.9424]] },
  { code: "CO", name: "Colombia", weight: 5, spots: [[4.711, -74.0721], [6.2442, -75.5812], [10.391, -75.4794]] },
  { code: "PE", name: "Peru", weight: 4, spots: [[-12.0464, -77.0428], [-13.5319, -71.9675], [-16.409, -71.5375]] },
  { code: "UY", name: "Uruguay", weight: 2, spots: [[-34.9011, -56.1645], [-34.9361, -54.9447]] },
  { code: "EC", name: "Ecuador", weight: 2, spots: [[-0.1807, -78.4678], [-2.1894, -79.888]] },
  { code: "GB", name: "United Kingdom", weight: 6, spots: [[51.5074, -0.1278], [53.4808, -2.2426], [55.9533, -3.1883], [51.4816, -3.1791]] },
  { code: "IE", name: "Ireland", weight: 3, spots: [[53.3498, -6.2603], [51.8985, -8.4756], [53.2707, -9.0568]] },
  { code: "FR", name: "France", weight: 7, spots: [[48.8566, 2.3522], [45.764, 4.8357], [43.2965, 5.3698], [44.8378, -0.5792], [49.1829, -0.3707]] },
  { code: "DE", name: "Germany", weight: 7, spots: [[52.52, 13.405], [48.1351, 11.582], [53.5511, 9.9937], [50.9375, 6.9603]] },
  { code: "NL", name: "Netherlands", weight: 4, spots: [[52.3676, 4.9041], [51.9244, 4.4777], [52.0907, 5.1214]] },
  { code: "BE", name: "Belgium", weight: 3, spots: [[50.8503, 4.3517], [51.2093, 3.2247], [50.6452, 5.5734]] },
  { code: "CH", name: "Switzerland", weight: 3, spots: [[47.3769, 8.5417], [46.2044, 6.1432], [46.948, 7.4474]] },
  { code: "AT", name: "Austria", weight: 3, spots: [[48.2082, 16.3738], [47.8095, 13.055], [47.2692, 11.4041]] },
  { code: "ES", name: "Spain", weight: 6, spots: [[40.4168, -3.7038], [41.3874, 2.1686], [37.3891, -5.9845], [39.4699, -0.3763]] },
  { code: "PT", name: "Portugal", weight: 3, spots: [[38.7223, -9.1393], [41.1579, -8.6291], [37.0194, -7.9304]] },
  { code: "IT", name: "Italy", weight: 6, spots: [[41.9028, 12.4964], [45.4642, 9.19], [40.8518, 14.2681], [43.7696, 11.2558]] },
  { code: "GR", name: "Greece", weight: 3, spots: [[37.9838, 23.7275], [40.6401, 22.9444], [38.2466, 21.7346]] },
  { code: "HR", name: "Croatia", weight: 2, spots: [[45.815, 15.9819], [43.5081, 16.4402]] },
  { code: "SI", name: "Slovenia", weight: 1, spots: [[46.0569, 14.5058]] },
  { code: "SK", name: "Slovakia", weight: 1, spots: [[48.1486, 17.1077]] },
  { code: "CZ", name: "Czechia", weight: 2, spots: [[50.0755, 14.4378], [49.1952, 16.6068]] },
  { code: "PL", name: "Poland", weight: 4, spots: [[52.2297, 21.0122], [50.0647, 19.945], [54.352, 18.6466]] },
  { code: "HU", name: "Hungary", weight: 2, spots: [[47.4979, 19.0402], [47.5316, 21.6273]] },
  { code: "RO", name: "Romania", weight: 3, spots: [[44.4268, 26.1025], [46.7712, 23.6236], [45.7489, 21.2087]] },
  { code: "BG", name: "Bulgaria", weight: 2, spots: [[42.6977, 23.3219], [42.1354, 24.7453]] },
  { code: "RS", name: "Serbia", weight: 2, spots: [[44.7866, 20.4489], [43.3209, 21.8958]] },
  { code: "BA", name: "Bosnia & Herz.", weight: 1, spots: [[43.8563, 18.4131]] },
  { code: "ME", name: "Montenegro", weight: 1, spots: [[42.4304, 19.2594]] },
  { code: "MK", name: "North Macedonia", weight: 1, spots: [[42.0047, 21.4254]] },
  { code: "NO", name: "Norway", weight: 3, spots: [[59.9139, 10.7522], [60.3913, 5.3221], [69.6492, 18.9553]] },
  { code: "SE", name: "Sweden", weight: 4, spots: [[59.3293, 18.0686], [57.7089, 11.9746], [55.605, 13.0038]] },
  { code: "FI", name: "Finland", weight: 3, spots: [[60.1699, 24.9384], [61.4978, 23.761], [66.5039, 25.7294]] },
  { code: "DK", name: "Denmark", weight: 2, spots: [[55.6761, 12.5683], [56.1629, 10.2039]] },
  { code: "IS", name: "Iceland", weight: 2, spots: [[64.1466, -21.9426], [65.6825, 18.0903]] },
  { code: "EE", name: "Estonia", weight: 1, spots: [[59.437, 24.7536]] },
  { code: "LV", name: "Latvia", weight: 1, spots: [[56.9496, 24.1052]] },
  { code: "LT", name: "Lithuania", weight: 1, spots: [[54.6872, 25.2797]] },
  { code: "TR", name: "Türkiye", weight: 5, spots: [[41.0082, 28.9784], [39.9334, 32.8597], [38.4237, 27.1428], [36.8841, 30.7056]] },
  { code: "UA", name: "Ukraine", weight: 3, spots: [[50.4501, 30.5234], [49.8397, 24.0297]] },
  { code: "RU", name: "Russia", weight: 9, spots: [[55.7558, 37.6173], [59.9343, 30.3351], [55.7887, 49.1221], [55.0302, 82.9204], [43.1155, 131.8855], [43.5855, 39.7231]] },
  { code: "IL", name: "Israel", weight: 2, spots: [[32.0853, 34.7818], [31.7683, 35.2137]] },
  { code: "JO", name: "Jordan", weight: 2, spots: [[31.9539, 35.9106], [30.3285, 35.4444]] },
  { code: "AE", name: "UAE", weight: 2, spots: [[25.2048, 55.2708], [24.4539, 54.3773]] },
  { code: "QA", name: "Qatar", weight: 1, spots: [[25.2854, 51.531]] },
  { code: "OM", name: "Oman", weight: 2, spots: [[23.588, 58.2843], [22.9333, 57.5314]] },
  { code: "KZ", name: "Kazakhstan", weight: 4, spots: [[43.2389, 76.8897], [51.16, 71.427], [42.3155, 69.5869]] },
  { code: "MN", name: "Mongolia", weight: 2, spots: [[47.9185, 106.9177], [49.0317, 104.0393]] },
  { code: "IN", name: "India", weight: 8, spots: [[28.6139, 77.209], [19.076, 72.8777], [12.9716, 77.5946], [26.9124, 75.7873], [25.3176, 82.9739], [9.9312, 76.2673]] },
  { code: "LK", name: "Sri Lanka", weight: 2, spots: [[6.9271, 79.8612], [7.2906, 80.6337]] },
  { code: "BD", name: "Bangladesh", weight: 2, spots: [[23.8103, 90.4125], [22.3569, 91.7832]] },
  { code: "NP", name: "Nepal", weight: 1, spots: [[27.7172, 85.324]] },
  { code: "TH", name: "Thailand", weight: 5, spots: [[13.7563, 100.5018], [18.7883, 98.9853], [7.8804, 98.3923], [12.9236, 100.8825]] },
  { code: "MY", name: "Malaysia", weight: 3, spots: [[3.139, 101.6869], [5.4141, 100.3288], [1.4927, 103.7414]] },
  { code: "SG", name: "Singapore", weight: 2, spots: [[1.2836, 103.8607], [1.3343, 103.7436]] },
  { code: "ID", name: "Indonesia", weight: 5, spots: [[-6.2088, 106.8456], [-7.2575, 112.7521], [-8.6705, 115.2126], [3.5952, 98.6722]] },
  { code: "PH", name: "Philippines", weight: 3, spots: [[14.5995, 120.9842], [10.3157, 123.8854], [7.1907, 125.4553]] },
  { code: "TW", name: "Taiwan", weight: 3, spots: [[25.033, 121.5654], [22.6273, 120.3014], [24.1477, 120.6736]] },
  { code: "KR", name: "South Korea", weight: 4, spots: [[37.5665, 126.978], [35.1796, 129.0756], [37.4563, 126.7052]] },
  { code: "JP", name: "Japan", weight: 7, spots: [[35.6762, 139.6503], [34.6937, 135.5023], [35.0116, 135.7681], [43.0618, 141.3545], [33.5902, 130.4017], [26.2124, 127.6792]] },
  { code: "AU", name: "Australia", weight: 7, spots: [[-33.8688, 151.2093], [-37.8136, 144.9631], [-27.4698, 153.0251], [-31.9505, 115.8605], [-34.9285, 138.6007], [-23.698, 133.8807]] },
  { code: "NZ", name: "New Zealand", weight: 3, spots: [[-36.8485, 174.7633], [-41.2865, 174.7762], [-43.5321, 172.6362]] },
  { code: "ZA", name: "South Africa", weight: 4, spots: [[-33.9249, 18.4241], [-26.2041, 28.0473], [-29.8587, 31.0218], [-25.4753, 30.9693]] },
  { code: "KE", name: "Kenya", weight: 2, spots: [[-1.2921, 36.8219], [-4.0435, 39.6682]] },
  { code: "NG", name: "Nigeria", weight: 2, spots: [[6.5244, 3.3792], [9.0579, 7.4951]] },
  { code: "GH", name: "Ghana", weight: 1, spots: [[5.6037, -0.187]] },
  { code: "SN", name: "Senegal", weight: 1, spots: [[14.7167, -17.4677]] },
  { code: "RW", name: "Rwanda", weight: 1, spots: [[-1.9441, 30.0619]] },
];
