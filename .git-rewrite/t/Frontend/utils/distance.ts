import { UNIVERSITY_LOCATIONS } from "./universities";

export interface Coordinate {
  lat: number;
  lng: number;
}

// District coordinates (main city centers)
export const DISTRICT_COORDS: Record<string, Coordinate> = {
  Colombo: { lat: 6.9271, lng: 79.8612 },
  Gampaha: { lat: 7.0873, lng: 80.0144 },
  Kalutara: { lat: 6.5854, lng: 79.9607 },
  Kandy: { lat: 7.2906, lng: 80.6337 },
  Matale: { lat: 7.4675, lng: 80.6234 },
  "Nuwara Eliya": { lat: 6.9497, lng: 80.7891 },
  Galle: { lat: 6.0535, lng: 80.2210 },
  Matara: { lat: 5.9549, lng: 80.5550 },
  Hambantota: { lat: 6.1246, lng: 81.1185 },
  Jaffna: { lat: 9.6615, lng: 80.0255 },
  Kilinochchi: { lat: 9.3975, lng: 80.4053 },
  Mannar: { lat: 8.9770, lng: 79.9040 },
  Vavuniya: { lat: 8.7542, lng: 80.4983 },
  Mullaitivu: { lat: 9.2671, lng: 80.8140 },
  Batticaloa: { lat: 7.7436, lng: 81.7010 },
  Ampara: { lat: 7.3017, lng: 81.6753 },
  Trincomalee: { lat: 8.5874, lng: 81.2152 },
  Kurunegala: { lat: 7.4813, lng: 80.3650 },
  Puttalam: { lat: 8.0330, lng: 79.8258 },
  Anuradhapura: { lat: 8.3114, lng: 80.4037 },
  Polonnaruwa: { lat: 7.9403, lng: 81.0189 },
  Badulla: { lat: 6.9934, lng: 81.0550 },
  Monaragala: { lat: 6.8725, lng: 81.3486 },
  Ratnapura: { lat: 6.6828, lng: 80.4012 },
  Kegalle: { lat: 7.2543, lng: 80.3416 },
};

// Colombo area coordinates
export const COLOMBO_CITY_COORDS: Record<string, Coordinate> = {
  "Colombo 01": { lat: 6.9355, lng: 79.8428 },
  "Colombo 02": { lat: 6.9214, lng: 79.8482 },
  "Colombo 03": { lat: 6.9100, lng: 79.8539 },
  "Colombo 04": { lat: 6.9008, lng: 79.8652 },
  "Colombo 05": { lat: 6.8912, lng: 79.8777 },
  "Colombo 06": { lat: 6.8750, lng: 79.8697 },
  "Colombo 07": { lat: 6.9067, lng: 79.8680 },
  "Colombo 08": { lat: 6.9106, lng: 79.8870 },
  "Colombo 09": { lat: 6.9380, lng: 79.8656 },
  "Colombo 10": { lat: 6.9350, lng: 79.8773 },
  "Colombo 11": { lat: 6.9430, lng: 79.8795 },
  "Colombo 12": { lat: 6.9560, lng: 79.8845 },
  "Colombo 13": { lat: 6.9587, lng: 79.8710 },
  "Colombo 14": { lat: 6.9650, lng: 79.8715 },
  "Colombo 15": { lat: 6.9730, lng: 79.8670 },
  Dehiwala: { lat: 6.8500, lng: 79.8650 },
  "Mount Lavinia": { lat: 6.8340, lng: 79.8640 },
  Ratmalana: { lat: 6.8214, lng: 79.8865 },
  Moratuwa: { lat: 6.7951, lng: 79.9009 },
  Piliyandala: { lat: 6.8018, lng: 79.9224 },
  Kesbewa: { lat: 6.7969, lng: 79.9407 },
  Maharagama: { lat: 6.8485, lng: 79.9266 },
  Nugegoda: { lat: 6.8653, lng: 79.8896 },
  Kottawa: { lat: 6.8412, lng: 79.9631 },
  Homagama: { lat: 6.8440, lng: 80.0020 },
  Malabe: { lat: 6.9147, lng: 79.9724 },
  Athurugiriya: { lat: 6.8731, lng: 80.0016 },
  Kaduwela: { lat: 6.9340, lng: 79.9847 },
  Kolonnawa: { lat: 6.9326, lng: 79.8916 },
  Angoda: { lat: 6.9286, lng: 79.9324 },
  Battaramulla: { lat: 6.9006, lng: 79.9180 },
  Rajagiriya: { lat: 6.9120, lng: 79.8934 },
  Wellampitiya: { lat: 6.9351, lng: 79.8796 },
  "Ja-Ela": { lat: 7.0744, lng: 79.8913 },
};

// Create university coordinates map
export const UNIVERSITY_COORDS: Record<string, Coordinate> = {};
UNIVERSITY_LOCATIONS.forEach((uni) => {
  UNIVERSITY_COORDS[uni.name] = { lat: uni.lat, lng: uni.lng };
});

// Haversine formula for distance calculation
export function haversineKm(a: Coordinate, b: Coordinate): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

// Get reference coordinate based on university or district
export function getReferenceCoordinate(
  university: string | null,
  district: string | null,
  colomboArea: string | null
): Coordinate | null {
  if (university) {
    return UNIVERSITY_COORDS[university] ?? null;
  }

  if (district) {
    if (district === "Colombo" && colomboArea) {
      return COLOMBO_CITY_COORDS[colomboArea] ?? null;
    }
    return DISTRICT_COORDS[district] ?? null;
  }

  return null;
}

// Get reference name for display
export function getReferenceName(
  university: string | null,
  district: string | null,
  colomboArea: string | null
): string | null {
  if (university) {
    return university;
  }

  if (district) {
    if (district === "Colombo" && colomboArea) {
      return colomboArea;
    }
    return district;
  }

  return null;
}

