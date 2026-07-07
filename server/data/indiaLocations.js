// Approximate state centroids for India-wide alumni/student map plotting
export const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

export const INDIA_STATE_COORDS = {
  'andhra pradesh': { lat: 15.9129, lng: 79.74 },
  'arunachal pradesh': { lat: 28.218, lng: 94.7278 },
  assam: { lat: 26.2006, lng: 92.9376 },
  bihar: { lat: 25.0961, lng: 85.3131 },
  chhattisgarh: { lat: 21.2787, lng: 81.8661 },
  goa: { lat: 15.2993, lng: 74.124 },
  gujarat: { lat: 22.2587, lng: 71.1924 },
  haryana: { lat: 29.0588, lng: 76.0856 },
  'himachal pradesh': { lat: 31.1048, lng: 77.1734 },
  jharkhand: { lat: 23.6102, lng: 85.2799 },
  karnataka: { lat: 15.3173, lng: 75.7139 },
  kerala: { lat: 10.8505, lng: 76.2711 },
  'madhya pradesh': { lat: 22.9734, lng: 78.6569 },
  maharashtra: { lat: 19.7515, lng: 75.7139 },
  manipur: { lat: 24.6637, lng: 93.9063 },
  meghalaya: { lat: 25.467, lng: 91.3662 },
  mizoram: { lat: 23.1645, lng: 92.9376 },
  nagaland: { lat: 26.1584, lng: 94.5624 },
  odisha: { lat: 20.9517, lng: 85.0985 },
  punjab: { lat: 31.1471, lng: 75.3412 },
  rajasthan: { lat: 27.0238, lng: 74.2179 },
  sikkim: { lat: 27.533, lng: 88.5122 },
  'tamil nadu': { lat: 11.1271, lng: 78.6569 },
  telangana: { lat: 18.1124, lng: 79.0193 },
  tripura: { lat: 23.9408, lng: 91.9882 },
  'uttar pradesh': { lat: 26.8467, lng: 80.9462 },
  uttarakhand: { lat: 30.0668, lng: 79.0193 },
  'west bengal': { lat: 22.9868, lng: 87.855 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  'jammu and kashmir': { lat: 33.7782, lng: 76.5762 },
  ladakh: { lat: 34.1526, lng: 77.577 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  puducherry: { lat: 11.9416, lng: 79.8083 }
};

const hashString = (value = '') => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const resolveIndiaCoordinates = ({ state = '', city = '', seed = '' } = {}) => {
  const normalizedState = String(state || '').trim().toLowerCase();
  const base = INDIA_STATE_COORDS[normalizedState] || INDIA_CENTER;
  const hash = hashString(`${city}-${seed}`);
  const latOffset = ((hash % 1000) / 1000 - 0.5) * 1.2;
  const lngOffset = (((hash >> 10) % 1000) / 1000 - 0.5) * 1.2;

  return {
    lat: Number((base.lat + latOffset).toFixed(6)),
    lng: Number((base.lng + lngOffset).toFixed(6))
  };
};

export const INDIAN_STATES = Object.keys(INDIA_STATE_COORDS)
  .map((state) => state.replace(/\b\w/g, (char) => char.toUpperCase()))
  .sort();
