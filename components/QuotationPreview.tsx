
import React, { useState } from 'react';
import { TravelQuotation } from '../types';
import { Plane, Hotel, Calendar, CheckCircle, Info, MapPin, Utensils, Check, Clock, Globe, ArrowRight, Star, Shield, ThumbsUp, Quote, Edit2 } from 'lucide-react';

interface QuotationPreviewProps {
  data: TravelQuotation | null;
  loading: boolean;
  id: string;
  onUpdatePrice?: (newPrice: string) => void;
}

// Curated list of high-quality food images for fallbacks
const FALLBACK_FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80", // Fine dining
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80", // Cocktails/Bar
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80", // Plated steak/main
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80", // Comfort food
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80", // Salad/Fresh
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80", // Pizza
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80", // French cuisine
];

const getFallbackImage = (index: number) => {
    return FALLBACK_FOOD_IMAGES[index % FALLBACK_FOOD_IMAGES.length];
};

const QuotationPreview: React.FC<QuotationPreviewProps> = ({ data, loading, id, onUpdatePrice }) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState('');

  // Standard container class for alignment consistency
  const CONTAINER_CLASS = "max-w-5xl mx-auto px-6 md:px-8";

  // Helper to handle broken images
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop";
    e.currentTarget.onerror = null; // Prevent infinite loop
  };

  const startEditingPrice = () => {
    if (data) {
        setTempPrice(data.totalPrice);
        setIsEditingPrice(true);
    }
  };

  const savePrice = () => {
    if (onUpdatePrice && tempPrice) {
        onUpdatePrice(tempPrice);
    }
    setIsEditingPrice(false);
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
        {/* Animated Loading State */}
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 via-sky-100 to-indigo-100 animate-pulse opacity-50"></div>
        <div className="z-10 text-center space-y-8 p-12 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl">
           <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-waya-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Waya.AI V Logo SVG */}
                <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 animate-pulse">
                  <defs>
                    <linearGradient id="load_logo_1" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4F46E5" />
                      <stop offset="1" stopColor="#7C3AED" />
                    </linearGradient>
                    <linearGradient id="load_logo_2" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#EC4899" />
                      <stop offset="1" stopColor="#F472B6" />
                    </linearGradient>
                  </defs>
                  <path d="M12 14 C12 14 28 50 28 50 L36 50 L20 14 Z" fill="url(#load_logo_1)" />
                  <path d="M52 14 C52 14 36 50 36 50 L44 50 L60 14 Z" fill="url(#load_logo_2)" />
                </svg>
              </div>
           </div>
           <div>
             <h3 className="text-2xl font-serif font-bold text-slate-800">Curating your experience...</h3>
             <p className="text-slate-600 mt-2">Checking live availability & retrieving reviews</p>
           </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-12 bg-slate-50 border-2 border-dashed border-slate-300 rounded-3xl text-slate-400 m-4">
        <MapPin className="w-16 h-16 mb-4 opacity-20" />
        <p className="font-medium text-lg">Your journey begins here.</p>
        <p className="text-sm opacity-60">Enter details to generate a preview.</p>
      </div>
    );
  }

  // --- Logic to detect view type (Flight Only vs Hotel Only vs Package) ---
  const hasFlights = data.flights && data.flights.length > 0;
  const hasHotels = data.hotels && data.hotels.length > 0;
  const hasItinerary = data.itinerary && data.itinerary.length > 0;

  const isFlightOnly = hasFlights && !hasHotels && !hasItinerary;
  const isHotelOnly = hasHotels && !hasFlights && !hasItinerary;
  
  // Fallbacks
  const displayInclusions = (data.inclusions && data.inclusions.length > 0) 
    ? data.inclusions 
    : [
        "International Flights", 
        "5-Star Accommodation", 
        "Daily Breakfast", 
        "Private Transfers", 
        "English Guide", 
        "All Entrance Fees"
      ];

  const heroBg = data.heroImage || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop";

  // --- SPECIAL VIEW: FLIGHT ONLY ---
  if (isFlightOnly) {
     return (
        <div id={id} className="bg-slate-100 min-h-screen font-sans text-slate-800 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 pt-8 pb-12 text-white shadow-lg">
                <div className={CONTAINER_CLASS}>
                    <div className="flex justify-between items-center">
                        <div>
                           <h1 className="text-2xl font-bold flex items-center"><Plane className="mr-2" /> Flight Itinerary</h1>
                           <p className="text-blue-200 text-sm mt-1">{data.flights.length} flights found for {data.destination}</p>
                        </div>
                        <div className="text-right">
                           {isEditingPrice ? (
                               <div className="flex items-center gap-2">
                                   <input 
                                       type="text" 
                                       value={tempPrice}
                                       onChange={(e) => setTempPrice(e.target.value)}
                                       className="bg-blue-800 text-white border border-blue-500 rounded px-2 py-1 w-32 text-right font-bold"
                                   />
                                   <button onClick={savePrice} className="bg-green-500 p-1 rounded hover:bg-green-600"><Check className="w-4 h-4" /></button>
                               </div>
                           ) : (
                               <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={startEditingPrice}>
                                   <div className="text-3xl font-bold">{data.totalPrice}</div>
                                   <Edit2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                               </div>
                           )}
                           <div className="text-sm text-blue-200">{data.currency} Total</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className={CONTAINER_CLASS}>
                {/* Sub-header / Tabs */}
                <div className="bg-white rounded-xl shadow-sm -mt-6 mb-6 flex border border-slate-200 overflow-hidden">
                   <div className="flex-1 py-4 text-center border-b-2 border-blue-600 font-bold text-blue-700 bg-blue-50">
                      Recommended
                   </div>
                   <div className="flex-1 py-4 text-center border-b-2 border-transparent text-slate-500 hover:bg-slate-50">
                      Cheapest
                   </div>
                   <div className="flex-1 py-4 text-center border-b-2 border-transparent text-slate-500 hover:bg-slate-50">
                      Fastest
                   </div>
                </div>

                {/* Flight Cards */}
                <div className="space-y-4">
                   {data.flights.map((flight, idx) => (
                      <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                         <div className="flex flex-col md:flex-row items-center gap-6">
                            {/* Airline Info */}
                            <div className="w-full md:w-1/6 flex items-center gap-3">
                               <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                                  <Plane className="text-slate-600" />
                               </div>
                               <div>
                                  <div className="font-bold text-slate-800">{flight.airline}</div>
                                  <div className="text-xs text-slate-500">{flight.flightNumber}</div>
                               </div>
                            </div>

                            {/* Route Info */}
                            <div className="flex-1 flex items-center justify-center gap-6 w-full">
                               <div className="text-right min-w-[80px]">
                                  <div className="text-xl font-bold text-slate-800">{flight.departureTime}</div>
                                  <div className="text-xs text-slate-500 font-medium">{flight.departureAirport}</div>
                               </div>
                               
                               <div className="flex-1 flex flex-col items-center px-4">
                                  <div className="text-xs text-slate-400 mb-1">{flight.duration || 'Duration --'}</div>
                                  <div className="w-full h-px bg-slate-300 relative flex items-center justify-center">
                                     <div className={`w-2 h-2 rounded-full ${flight.stops === 'Non-stop' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                                  </div>
                                  <div className={`text-xs mt-1 font-medium ${flight.stops === 'Non-stop' ? 'text-green-600' : 'text-orange-600'}`}>
                                     {flight.stops || 'Direct'}
                                  </div>
                               </div>

                               <div className="text-left min-w-[80px]">
                                  <div className="text-xl font-bold text-slate-800">{flight.arrivalTime}</div>
                                  <div className="text-xs text-slate-500 font-medium">{flight.arrivalAirport}</div>
                               </div>
                            </div>

                            {/* Price & Action */}
                            <div className="w-full md:w-1/6 text-right pl-6 border-l border-slate-100">
                               <div className="text-xl font-bold text-slate-900 mb-2">{data.currency} {Math.round(parseInt(data.totalPrice.replace(/[^0-9]/g, '')) / data.flights.length)}</div>
                               <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors">
                                  Select
                               </button>
                            </div>
                         </div>
                         
                         <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-medium flex items-center">
                               <CheckCircle className="w-3 h-3 mr-1" /> Baggage Included
                            </span>
                            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded font-medium flex items-center">
                               <Utensils className="w-3 h-3 mr-1" /> Meal Included
                            </span>
                         </div>
                      </div>
                   ))}
                </div>

                {/* Footer */}
                <div className="mt-12 text-center text-slate-400">
                    <div className="w-8 h-8 mx-auto mb-2 text-slate-300">
                        {/* Waya V Logo - Footer */}
                        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 14 C12 14 28 50 28 50 L36 50 L20 14 Z" fill="#94a3b8" />
                            <path d="M52 14 C52 14 36 50 36 50 L44 50 L60 14 Z" fill="#cbd5e1" />
                        </svg>
                    </div>
                    <p>Generated by Waya.AI</p>
                </div>
            </div>
        </div>
     );
  }

  // --- SPECIAL VIEW: HOTEL ONLY ---
  if (isHotelOnly) {
     return (
        <div id={id} className="bg-slate-50 min-h-screen font-sans text-slate-800 pb-20 pt-12">
           <div className={CONTAINER_CLASS}>
              <div className="flex justify-between items-end mb-8">
                 <div>
                    <h1 className="text-3xl font-serif font-bold text-slate-900">Stays in {data.destination}</h1>
                    <p className="text-slate-500">{data.hotels.length} properties found • {data.startDate} - {data.endDate}</p>
                 </div>
                 <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium shadow-sm hover:bg-slate-50">Filter</button>
                    <button className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium shadow-sm hover:bg-slate-50">Sort by: Recommended</button>
                 </div>
              </div>

              <div className="space-y-6">
                 {data.hotels.map((hotel, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow group">
                       <div className="md:w-1/3 h-64 md:h-auto relative overflow-hidden">
                          <img 
                             src={hotel.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80"} 
                             alt={hotel.name}
                             onError={handleImageError}
                             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <button className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white text-slate-600 transition-colors">
                             <ThumbsUp className="w-4 h-4" />
                          </button>
                       </div>
                       <div className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                             <div className="flex justify-between items-start">
                                <div>
                                   <h2 className="text-xl font-bold text-slate-900 mb-1">{hotel.name}</h2>
                                   <p className="text-sm text-slate-500 flex items-center mb-2">
                                      <MapPin className="w-3 h-3 mr-1" /> {hotel.location} • <a href="#" className="underline ml-1">Map</a>
                                   </p>
                                </div>
                                {hotel.rating && (
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center bg-blue-900 text-white px-2 py-1 rounded-lg font-bold text-sm">
                                            {hotel.rating}
                                        </div>
                                        <span className="text-xs text-slate-500 mt-1">{hotel.reviewCount || 'Reviews'}</span>
                                    </div>
                                )}
                             </div>
                             
                             <div className="flex flex-wrap gap-2 my-4">
                                {hotel.amenities.slice(0, 4).map((am, i) => (
                                   <span key={i} className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200">
                                      {am}
                                   </span>
                                ))}
                             </div>
                          </div>
                          
                          <div className="flex items-end justify-between mt-4 pt-4 border-t border-slate-100">
                             <div>
                                <div className="text-green-600 text-xs font-bold mb-1">Free Cancellation</div>
                                <div className="text-slate-500 text-xs">{hotel.roomType}</div>
                             </div>
                             <div className="text-right">
                                <div className="text-2xl font-bold text-slate-900">{data.currency} {Math.round(parseInt(data.totalPrice.replace(/[^0-9]/g, '')) / data.hotels.length)}</div>
                                <div className="text-xs text-slate-500 mb-2">Total price incl. taxes</div>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors flex items-center">
                                   Check Availability <ArrowRight className="w-4 h-4 ml-1" />
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
     );
  }


  // --- DEFAULT: PACKAGE VIEW (Mixed) ---
  return (
    <div 
      id={id}
      className="bg-slate-50 w-full min-h-screen relative font-sans text-slate-800 pb-20 overflow-hidden"
    >
      {/* 1. Immersive Hero Section */}
      <div className="relative h-[85vh] w-full group">
         <img 
            src={heroBg} 
            alt={data.destination} 
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
         />
         {/* Gradient Overlay */}
         <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-90"></div>

         {/* Top Navigation Overlay */}
         <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
               <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-inner">
                  {data.customerName.charAt(0)}
               </div>
               <span className="text-white font-medium text-sm pr-2">Prepared for {data.customerName}</span>
            </div>
            <div className="hidden md:flex bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-xs font-medium tracking-widest uppercase">
               Waya.AI Exclusive Collection
            </div>
         </div>

         {/* Hero Content (Bottom Center/Left) */}
         {/* Adjusted padding to ensure it aligns with the Stats Bar negative margin area */}
         <div className="absolute bottom-0 left-0 w-full pb-20 z-10">
            <div className={CONTAINER_CLASS}>
                <div className="space-y-6">
                   <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-md bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 text-orange-200 text-xs font-bold uppercase tracking-wider">
                      <Globe className="w-3 h-3" />
                      <span>{data.destination}</span>
                   </div>
                   
                   <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-white leading-[0.9] drop-shadow-2xl">
                      {data.tripTitle}
                   </h1>

                   <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pt-4">
                      <div className="flex items-center space-x-2 text-slate-200 text-lg">
                         <Calendar className="w-5 h-5 text-orange-400" />
                         <span>{data.startDate}</span>
                         <span className="opacity-50 mx-2">—</span>
                         <span>{data.endDate}</span>
                      </div>
                      
                      <div className="hidden md:block w-px h-8 bg-white/20 mx-4"></div>

                      <div className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold text-lg shadow-xl flex items-center transform transition-transform cursor-pointer hover:bg-slate-50">
                         {isEditingPrice ? (
                           <div className="flex items-center gap-2">
                               <input 
                                   type="text" 
                                   value={tempPrice}
                                   onChange={(e) => setTempPrice(e.target.value)}
                                   className="bg-slate-100 text-slate-900 border border-slate-300 rounded px-2 py-1 w-32 outline-none text-right font-bold"
                                   autoFocus
                               />
                               <button onClick={savePrice} className="text-green-600 hover:text-green-700"><Check className="w-5 h-5" /></button>
                           </div>
                         ) : (
                           <div onClick={startEditingPrice} className="flex items-center gap-2 group">
                              <span>{data.totalPrice}</span>
                              <span className="text-sm font-normal text-slate-500">{data.currency}</span>
                              <Edit2 className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                           </div>
                         )}
                      </div>
                   </div>
                </div>
            </div>
         </div>
      </div>

      {/* 2. Floating Stats Bar (Glassmorphism) - UPDATED FOR ALIGNMENT */}
      <div className="relative z-20 -mt-8 mb-12">
        <div className={`${CONTAINER_CLASS}`}>
            {/* Added top border for better definition against hero image in PDF */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border-t border-white/40 border-b border-white/20 p-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
                        <Plane className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Flight Status</p>
                        <p className="font-bold text-slate-800">{data.flights && data.flights.length > 0 ? 'Included' : 'Not Included'}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-xl flex-shrink-0">
                        <Hotel className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Accommodation</p>
                        <p className="font-bold text-slate-800">{data.hotels?.length || 0} Premium Stays</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Trip Protection</p>
                        <p className="font-bold text-slate-800">Verified</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl flex-shrink-0">
                        <Star className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Experience Level</p>
                        <p className="font-bold text-slate-800">Luxury / Private</p>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className={`${CONTAINER_CLASS} space-y-20`}>
         
         {/* 3. Summary & Inclusions - Left Aligned for consistency */}
         <section className="flex flex-col gap-12">
            <div className="text-left w-full">
               <h3 className="text-3xl font-serif font-bold text-slate-900 mb-6">The Experience</h3>
               <p className="text-lg text-slate-600 leading-relaxed font-light">
                  {data.summary}
               </p>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
               <h4 className="font-bold text-slate-900 mb-6 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-emerald-500" />
                  Package Inclusions
               </h4>
               <div className="flex flex-wrap justify-start gap-3">
                  {displayInclusions.map((item, i) => (
                     <span key={i} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold rounded-full border border-slate-200 transition-colors cursor-default">
                        {item}
                     </span>
                  ))}
               </div>
            </div>
         </section>

         {/* 4. Hotels - Visual Cards */}
         {data.hotels && data.hotels.length > 0 && (
            <section>
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-serif font-bold text-slate-900">Where You'll Stay</h3>
                  <span className="hidden md:inline-flex items-center text-sm font-bold text-orange-600 cursor-pointer hover:underline">
                     View All <ArrowRight className="w-4 h-4 ml-1" />
                  </span>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {data.hotels.map((hotel, idx) => (
                     <div key={idx} className="group relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                        <div className="h-64 w-full relative overflow-hidden">
                           <img 
                              src={hotel.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80"} 
                              alt={hotel.name} 
                              onError={handleImageError}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                           />
                           <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                              {hotel.roomType}
                           </div>
                           {hotel.rating && (
                               <div className="absolute bottom-4 left-4 flex items-center bg-blue-900/90 text-white px-2 py-1 rounded-lg backdrop-blur-sm">
                                   <span className="font-bold text-sm mr-1">{hotel.rating}</span>
                                   <span className="text-[10px] opacity-80">Excellent</span>
                               </div>
                           )}
                        </div>
                        <div className="p-6">
                           <div className="flex justify-between items-start mb-2">
                              <h4 className="text-xl font-bold text-slate-900">{hotel.name}</h4>
                              <div className="flex text-orange-400">
                                 {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                              </div>
                           </div>
                           <p className="text-slate-500 text-sm mb-4 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" /> {hotel.location}
                           </p>
                           
                           <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                              {hotel.amenities?.slice(0, 3).map((am, i) => (
                                 <span key={i} className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">{am}</span>
                              ))}
                              {hotel.amenities && hotel.amenities.length > 3 && (
                                 <span className="text-xs text-slate-400 px-2 py-1">+more</span>
                              )}
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </section>
         )}

         {/* 5. Itinerary Timeline - Refactored for alignment */}
         <section>
            <h3 className="text-3xl font-serif font-bold text-slate-900 mb-10">Your Daily Itinerary</h3>
            {/* Using a grid/flex layout to ensure perfect alignment without arbitrary margins */}
            <div className="space-y-0">
               {data.itinerary?.map((day, idx) => (
                  <div key={idx} className="flex gap-4 md:gap-6 group">
                     {/* Left Column: Date Marker & Line - Reduced width to tighten gap */}
                     <div className="flex flex-col items-center flex-shrink-0 w-12 md:w-16 pt-2">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Day</div>
                        <div className="text-xl font-bold text-slate-800 mb-2">{day.day}</div>
                        {/* Connecting Line - Thinner */}
                        <div className="flex-1 w-[2px] bg-slate-200 group-last:bg-transparent min-h-[40px]"></div>
                     </div>

                     {/* Right Column: Content Card */}
                     <div className="flex-1 pb-12">
                         <div className="bg-white rounded-2xl shadow-md border border-slate-100 hover:shadow-lg transition-shadow overflow-hidden">
                            {day.image && (
                                <div className="h-48 w-full relative">
                                        <img 
                                            src={day.image} 
                                            className="w-full h-full object-cover" 
                                            alt={day.title} 
                                            onError={handleImageError}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <h4 className="absolute bottom-4 left-6 text-xl font-bold text-white shadow-sm">{day.title}</h4>
                                </div>
                            )}
                            <div className="p-6">
                                {!day.image && <h4 className="text-xl font-bold text-slate-800 mb-4">{day.title}</h4>}
                                {day.date && <div className="text-sm font-semibold text-orange-500 mb-3">{day.date}</div>}
                                
                                <ul className="space-y-6">
                                    {day.activities.map((act, actIdx) => (
                                        <li key={actIdx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                                            <div className="flex-shrink-0">
                                                <span className="inline-block text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg min-w-[80px] text-center">
                                                    {act.time}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-slate-700 leading-relaxed text-sm md:text-base">{act.description}</p>
                                                {act.location && (
                                                    <span className="inline-block mt-2 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                        📍 {act.location}
                                                    </span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                         </div>
                     </div>
                  </div>
               ))}
            </div>
         </section>
         
         {/* 6. Dining - Horizontal Scroll */}
         {data.restaurants && data.restaurants.length > 0 && (
             <section>
                <h3 className="text-3xl font-serif font-bold text-slate-900 mb-8 flex items-center">
                   <Utensils className="w-8 h-8 mr-3 text-orange-500" /> Dining & Culinary
                </h3>
                <div className="flex overflow-x-auto pb-8 gap-6 no-scrollbar snap-x -mx-6 px-6 md:-mx-8 md:px-8">
                   {data.restaurants.map((rest, idx) => (
                      <div key={idx} className="min-w-[300px] md:min-w-[350px] snap-center bg-white rounded-3xl overflow-hidden shadow-md border border-slate-100 flex flex-col">
                         <div className="h-48 relative">
                            <img 
                               src={rest.image || getFallbackImage(idx)} 
                               className="w-full h-full object-cover" 
                               onError={(e) => {
                                   e.currentTarget.src = getFallbackImage(idx);
                                   e.currentTarget.onerror = null;
                               }}
                            />
                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                               {rest.cuisine}
                            </div>
                         </div>
                         <div className="p-6 flex-1 flex flex-col">
                            <h4 className="font-bold text-lg text-slate-900 mb-2">{rest.name}</h4>
                            <p className="text-sm text-slate-500 italic mb-4 flex-1">"{rest.description}"</p>
                            <button className="w-full py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors">
                               View Menu
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
             </section>
         )}

         {/* 7. Flights - Compact List */}
         {data.flights && data.flights.length > 0 && (
            <section className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
               {/* Decorative Background */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-waya-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
               
               <h3 className="text-2xl font-serif font-bold mb-8 relative z-10 flex items-center">
                  <Plane className="w-6 h-6 mr-3 text-waya-400" /> Flight Itinerary
               </h3>
               
               <div className="space-y-4 relative z-10">
                  {data.flights.map((flight, idx) => (
                     <div key={idx} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                                 <Plane className="w-5 h-5 text-slate-900" />
                              </div>
                              <div>
                                 <div className="font-bold text-lg">{flight.airline}</div>
                                 <div className="text-sm text-slate-400">{flight.flightNumber} • {flight.date}</div>
                              </div>
                           </div>
                           
                           <div className="flex items-center flex-1 justify-center gap-4 text-sm">
                              <div className="text-right">
                                 <div className="font-bold text-xl">{flight.departureTime}</div>
                                 <div className="text-slate-400">{flight.departureAirport}</div>
                              </div>
                              <div className="flex-1 max-w-[100px] h-px bg-white/20 relative">
                                 <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-waya-400"></div>
                              </div>
                              <div>
                                 <div className="font-bold text-xl">{flight.arrivalTime}</div>
                                 <div className="text-slate-400">{flight.arrivalAirport}</div>
                              </div>
                           </div>
                           {/* Add Stops/Duration if available */}
                           {(flight.duration || flight.stops) && (
                              <div className="hidden md:block text-right text-xs text-slate-300 min-w-[80px]">
                                  {flight.duration && <div>{flight.duration}</div>}
                                  {flight.stops && <div className="text-waya-300">{flight.stops}</div>}
                              </div>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </section>
         )}

         {/* 8. Travel Tips */}
         <section className="bg-orange-50 rounded-3xl p-8 border border-orange-100 mb-12">
            <h3 className="text-lg font-bold text-orange-800 mb-6 flex items-center">
               <Info className="w-5 h-5 mr-2" /> Essential Travel Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {data.travelTips?.map((tip, i) => (
                  <div key={i} className="flex items-start p-4 bg-white/60 rounded-xl">
                     <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs mr-3 flex-shrink-0">
                        {i + 1}
                     </div>
                     <p className="text-sm text-slate-700">{tip}</p>
                  </div>
               ))}
            </div>
         </section>

      </div>

      {/* Brand Footer */}
      <div className="mt-20 py-12 bg-white border-t border-slate-100 text-center">
         <div className="w-16 h-16 mx-auto mb-4">
            {/* Waya.AI V Logo - Footer */}
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <defs>
                    <linearGradient id="footer_grad_1" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#4F46E5" />
                      <stop offset="1" stopColor="#7C3AED" />
                    </linearGradient>
                    <linearGradient id="footer_grad_2" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#EC4899" />
                      <stop offset="1" stopColor="#F472B6" />
                    </linearGradient>
                </defs>
                <path d="M12 14 C12 14 28 50 28 50 L36 50 L20 14 Z" fill="url(#footer_grad_1)" />
                <path d="M52 14 C52 14 36 50 36 50 L44 50 L60 14 Z" fill="url(#footer_grad_2)" />
            </svg>
         </div>
         <h4 className="font-serif font-bold text-xl text-slate-900">Waya.AI</h4>
         <p className="text-slate-400 text-sm mt-2">Premium AI Travel Experiences</p>
      </div>
    </div>
  );
};

export default QuotationPreview;
