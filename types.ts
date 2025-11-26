export interface Flight {
  airline: string;
  flightNumber: string;
  departureTime: string;
  departureAirport: string;
  arrivalTime: string;
  arrivalAirport: string;
  date: string;
  duration?: string;
  stops?: string;
}

export interface Hotel {
  name: string;
  location: string;
  checkIn: string;
  checkOut: string;
  amenities: string[];
  roomType: string;
  image?: string;
  rating?: string;       // e.g., "4.8"
  reviewCount?: string;  // e.g., "1,240 reviews"
  recentReview?: string; // e.g., "Best stay ever! The pool was amazing."
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
  heroImage?: string;
  flights: Flight[];
  hotels: Hotel[];
  itinerary: ItineraryDay[];
  restaurants: Restaurant[];
  inclusions: string[];
  exclusions: string[];
  travelTips: string[];
}

export interface SavedQuotation extends TravelQuotation {
  id: string;
  createdAt: number;
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