export interface Flight {
  airline: string;
  flightNumber: string;
  departureTime: string;
  departureAirport: string;
  arrivalTime: string;
  arrivalAirport: string;
  date: string;
}

export interface Hotel {
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  amenities: string[];
  roomType: string;
  image?: string;
}

export interface Activity {
  time: string;
  description: string;
  location?: string;
}

export interface ItineraryDay {
  day: number;
  date: string;
  title: string;
  activities: Activity[];
  image?: string;
}

export interface Restaurant {
  name: string;
  cuisine: string;
  description: string;
  image?: string;
}

export interface TravelQuotation {
  customerName: string;
  tripTitle: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalPrice: string;
  currency: string;
  summary: string;
  flights: Flight[];
  hotels: Hotel[];
  itinerary: ItineraryDay[];
  restaurants: Restaurant[];
  inclusions: string[];
  exclusions: string[];
  travelTips: string[];
  heroImage?: string;
}

export interface SavedQuotation extends TravelQuotation {
  id: string;
  createdAt: string;
}

export interface FileUpload {
  name: string;
  type: string;
  data: string; // Base64
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferences: string;
}