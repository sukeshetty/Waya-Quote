import React from 'react';
import { TravelQuotation } from '../types';
import { Plane, Hotel, Calendar, CheckCircle, Info, MapPin, Utensils, Check, Clock, Globe, ArrowRight, Star, Shield, Wifi, Coffee, ChevronRight, ThumbsUp } from 'lucide-react';

interface QuotationPreviewProps {
  data: TravelQuotation | null;
  loading: boolean;
  id: string;
}

const QuotationPreview: React.FC<QuotationPreviewProps> = ({ data, loading, id }) => {
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
                 {/* Waya Logo SVG */}
                 <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 animate-pulse">
                   <path d="M14 16L20 34L26 16M22 16L28 34L34 16" stroke="#0EA5E9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                 </svg>
              </div>
           </div>
           <div>
             <h3 className="text-2xl font-serif font-bold text-slate-800">Curating your experience...</h3>
             <p className="text-slate-600 mt-2">Generating personalized visuals & itinerary</p>
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

  // Detect Quotation Type
  const hasFlights = data.flights && data.flights.length > 0;
  const hasHotels = data.hotels && data.hotels.length > 0;
  const isFlightOnly = hasFlights && !hasHotels;
  const isHotelOnly = hasHotels && !hasFlights;

  // Render Logic
  if (isFlightOnly) {
    return <FlightOnlyView data={data} id={id} />;
  }

  if (isHotelOnly) {
    return <HotelOnlyView data={data} id={id} />;
  }

  return <PackageView data={data} id={id} />;
};

// --- Specialized Views ---

const FlightOnlyView: React.FC<{ data: TravelQuotation; id: string }> = ({ data, id }) => {
  return (
    <div id={id} className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-6 md:p-10 shadow-lg">
         <h1 className="text-3xl font-bold font-serif mb-2">Departing to {data.destination}</h1>
         <div className="flex items-center text-blue-200 space-x-4 text-sm">
            <span>{data.flights.length} flights found</span>
            <span>•</span>
            <span>{data.startDate} - {data.endDate}</span>
            <span>•</span>
            <span>{data.customerName}</span>
         </div>
      </div>

      <div className="max-w-5xl mx-auto -mt-8 px-4 relative z-10 space-y-6">
         {/* Filter Tabs Mockup */}
         <div className="bg-white rounded-lg shadow-md p-1 grid grid-cols-3 text-center text-sm font-medium">
            <div className="py-3 bg-blue-50 text-blue-700 rounded border-b-2 border-blue-600 cursor-pointer">
              <div className="font-bold">Recommended</div>
              <div className="text-xs font-normal opacity-80">{data.totalPrice}</div>
            </div>
            <div className="py-3 text-slate-500 hover:bg-slate-50 cursor-pointer">
              <div className="font-bold">Cheapest</div>
              <div className="text-xs font-normal opacity-80">Save 15%</div>
            </div>
            <div className="py-3 text-slate-500 hover:bg-slate-50 cursor-pointer">
              <div className="font-bold">Fastest</div>
              <div className="text-xs font-normal opacity-80">Direct</div>
            </div>
         </div>

         {/* Flight Cards */}
         <div className="space-y-4">
            {data.flights.map((flight, idx) => (
               <div key={idx} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                  
                  {/* Badge */}
                  <div className="flex gap-2 mb-4">
                    {idx === 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">Best Value</span>}
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Baggage Included
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                     {/* Airline Info */}
                     <div className="flex items-center gap-4 w-full md:w-1/4">
                        <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded font-bold text-xs">
                           {flight.airline.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                           <div className="font-bold text-slate-900">{flight.airline}</div>
                           <div className="text-xs text-slate-500">{flight.flightNumber}</div>
                        </div>
                     </div>

                     {/* Times */}
                     <div className="flex items-center justify-center gap-4 w-full md:w-1/2">
                        <div className="text-right">
                           <div className="text-2xl font-bold text-slate-800">{flight.departureTime}</div>
                           <div className="text-xs text-slate-500 font-medium">{flight.departureAirport}</div>
                        </div>
                        
                        <div className="flex flex-col items-center w-32 px-2">
                           <div className="text-xs text-slate-400 mb-1">Non-stop</div>
                           <div className="w-full h-px bg-slate-300 relative">
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-slate-400 transform rotate-45"></div>
                           </div>
                           <div className="text-xs text-green-600 mt-1 font-medium">On Time</div>
                        </div>

                        <div className="text-left">
                           <div className="text-2xl font-bold text-slate-800">{flight.arrivalTime}</div>
                           <div className="text-xs text-slate-500 font-medium">{flight.arrivalAirport}</div>
                        </div>
                     </div>

                     {/* Price & Action */}
                     <div className="flex flex-col items-end gap-2 w-full md:w-1/4 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                        <div className="text-2xl font-bold text-slate-900">
                           {data.totalPrice}
                        </div>
                        <div className="text-xs text-slate-500 mb-2">per person</div>
                        <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded transition-colors shadow-sm">
                           Select
                        </button>
                     </div>
                  </div>
               </div>
            ))}
         </div>
         
         <BrandFooter />
      </div>
    </div>
  );
};

const HotelOnlyView: React.FC<{ data: TravelQuotation; id: string }> = ({ data, id }) => {
  return (
    <div id={id} className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      {/* Search Header */}
      <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-20 shadow-sm">
         <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
               <h1 className="text-xl font-bold text-slate-900">Stays in {data.destination}</h1>
               <p className="text-xs text-slate-500">{data.startDate} — {data.endDate} • {data.customerName}</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition-colors text-sm">
               Modify Search
            </button>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
         {/* Sort Bar */}
         <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <span className="px-4 py-1.5 bg-white border border-slate-300 rounded-full text-sm font-medium text-slate-700 whitespace-nowrap">Sort by: Recommended</span>
            <span className="px-4 py-1.5 bg-white border border-slate-300 rounded-full text-sm font-medium text-slate-700 whitespace-nowrap">Price</span>
            <span className="px-4 py-1.5 bg-white border border-slate-300 rounded-full text-sm font-medium text-slate-700 whitespace-nowrap">Star Rating</span>
         </div>

         {data.hotels.map((hotel, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row">
               {/* Image Section */}
               <div className="md:w-1/3 relative h-64 md:h-auto group">
                  <img 
                     src={hotel.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80"} 
                     alt={hotel.name}
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white text-slate-500 hover:text-red-500 transition-colors">
                     <ThumbsUp className="w-4 h-4" />
                  </button>
               </div>

               {/* Content Section */}
               <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                     <div className="flex justify-between items-start mb-2">
                        <div>
                           <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                              {hotel.name}
                              <div className="flex text-yellow-400">
                                 {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                              </div>
                           </h2>
                           <p className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1 cursor-pointer">
                              <MapPin className="w-3 h-3" /> {hotel.location} • Map
                           </p>
                        </div>
                        <div className="flex flex-col items-end">
                           <div className="bg-blue-900 text-white text-sm font-bold px-2 py-1 rounded-tr-lg rounded-bl-lg">9.2</div>
                           <span className="text-xs text-slate-500 mt-1">Excellent</span>
                        </div>
                     </div>

                     {/* Tags */}
                     <div className="flex flex-wrap gap-2 mt-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200 flex items-center gap-1">
                           <Wifi className="w-3 h-3" /> Free Wifi
                        </span>
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200 flex items-center gap-1">
                           <Coffee className="w-3 h-3" /> Breakfast Included
                        </span>
                        {hotel.amenities.slice(0, 2).map((am, i) => (
                           <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded border border-slate-200">
                              {am}
                           </span>
                        ))}
                     </div>
                  </div>

                  {/* Price Footer */}
                  <div className="mt-6 flex items-end justify-between border-t border-slate-100 pt-4">
                     <div>
                        <div className="inline-block px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded mb-1">
                           Limited Time Offer
                        </div>
                        <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                           <Check className="w-3 h-3" /> Free Cancellation
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="text-xs text-slate-400 line-through">
                           {/* Mock strikethrough price logic */}
                           {(parseInt(data.totalPrice.replace(/[^0-9]/g, '')) * 1.2).toLocaleString()} {data.currency}
                        </div>
                        <div className="text-2xl font-bold text-slate-900 leading-none">
                           {data.totalPrice}
                        </div>
                        <div className="text-xs text-slate-500 mb-2">Total price incl. taxes</div>
                        <button className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2">
                           Check Availability <ChevronRight className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         ))}
         
         <BrandFooter />
      </div>
    </div>
  );
};

// --- Standard Package View (Refined from Previous) ---

const PackageView: React.FC<{ data: TravelQuotation; id: string }> = ({ data, id }) => {
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

  return (
    <div 
      id={id}
      className="bg-slate-50 w-full min-h-screen relative font-sans text-slate-800 pb-20 overflow-hidden"
    >
      {/* 1. Immersive Hero Section (Inspired by Image 1) */}
      <div className="relative h-[85vh] w-full group">
         <img 
            src={heroBg} 
            alt={data.destination} 
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

         {/* Hero Content (Bottom Left) */}
         <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-10">
            <div className="max-w-4xl space-y-6">
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

                  <div className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold text-lg shadow-xl flex items-center transform transition-transform hover:scale-105 cursor-default">
                     {data.totalPrice} <span className="text-sm font-normal text-slate-500 ml-1">{data.currency}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* 2. Floating Stats Bar (Glassmorphism) */}
      <div className="relative z-20 px-6 -mt-8 mb-12">
        <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 flex flex-wrap justify-between gap-6">
           <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                 <Plane className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Flight Status</p>
                 <p className="font-bold text-slate-800">{data.flights && data.flights.length > 0 ? 'Included' : 'Not Included'}</p>
              </div>
           </div>
           <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                 <Hotel className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Accommodation</p>
                 <p className="font-bold text-slate-800">{data.hotels?.length || 0} Premium Stays</p>
              </div>
           </div>
           <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                 <Shield className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Trip Protection</p>
                 <p className="font-bold text-slate-800">Verified</p>
              </div>
           </div>
           <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                 <Star className="w-6 h-6" />
              </div>
              <div>
                 <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Experience Level</p>
                 <p className="font-bold text-slate-800">Luxury / Private</p>
              </div>
           </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 space-y-20">
         
         {/* 3. Summary & Inclusions (Inspired by Image 2 - Pills) */}
         <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
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
               <div className="flex flex-wrap gap-2">
                  {displayInclusions.map((item, i) => (
                     <span key={i} className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-200 transition-colors cursor-default">
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
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                           />
                           <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-slate-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                              {hotel.roomType}
                           </div>
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

         {/* 5. Itinerary Timeline */}
         <section>
            <h3 className="text-3xl font-serif font-bold text-slate-900 mb-10">Your Daily Itinerary</h3>
            <div className="relative border-l-2 border-slate-200 ml-4 md:ml-10 space-y-12 pb-12">
               {data.itinerary?.map((day, idx) => (
                  <div key={idx} className="relative pl-8 md:pl-12 group">
                     {/* Timeline Dot */}
                     <div className="absolute -left-[9px] top-0 w-5 h-5 rounded-full bg-white border-4 border-orange-500 shadow-sm group-hover:scale-125 transition-transform"></div>
                     
                     <div className="flex flex-col md:flex-row md:items-start gap-6">
                        {/* Date Badge */}
                        <div className="flex-shrink-0 w-20 text-center">
                           <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Day {day.day}</span>
                           <span className="block text-lg font-bold text-slate-800">{day.date.split(',')[0]}</span>
                        </div>

                        {/* Content Card */}
                        <div className="flex-1 bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-lg transition-shadow">
                           <div className="flex justify-between items-start mb-4">
                              <h4 className="text-xl font-bold text-slate-800">{day.title}</h4>
                              {day.activities?.[0]?.location && (
                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md font-medium">
                                   {day.activities[0].location}
                                </span>
                              )}
                           </div>
                           
                           <ul className="space-y-4">
                              {day.activities.map((act, actIdx) => (
                                 <li key={actIdx} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="flex-shrink-0 w-16 pt-1">
                                       <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md block text-center">
                                          {act.time}
                                       </span>
                                    </div>
                                    <div>
                                       <p className="text-slate-700 leading-snug">{act.description}</p>
                                    </div>
                                 </li>
                              ))}
                           </ul>
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
                <div className="flex overflow-x-auto pb-8 gap-6 no-scrollbar snap-x">
                   {data.restaurants.map((rest, idx) => (
                      <div key={idx} className="min-w-[300px] md:min-w-[350px] snap-center bg-white rounded-3xl overflow-hidden shadow-md border border-slate-100 flex flex-col">
                         <div className="h-48 relative">
                            <img 
                               src={rest.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80"} 
                               className="w-full h-full object-cover" 
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

         <BrandFooter />
      </div>
    </div>
  );
};

const BrandFooter = () => (
  <div className="mt-20 py-12 bg-white border-t border-slate-100 text-center">
     <div className="w-16 h-16 mx-auto mb-4">
        {/* Waya.AI Logo SVG */}
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
           <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="url(#paint0_linear_footer)" fillOpacity="0.2"/>
           <path d="M14 16L20 34L26 16M22 16L28 34L34 16" stroke="url(#paint1_linear_footer)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
           <defs>
              <linearGradient id="paint0_linear_footer" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                 <stop stopColor="#0EA5E9"/>
                 <stop offset="1" stopColor="#6366F1"/>
              </linearGradient>
              <linearGradient id="paint1_linear_footer" x1="14" y1="16" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                 <stop stopColor="#38BDF8"/>
                 <stop offset="1" stopColor="#818CF8"/>
              </linearGradient>
           </defs>
        </svg>
     </div>
     <h4 className="font-serif font-bold text-xl text-slate-900">Waya.AI</h4>
     <p className="text-slate-400 text-sm mt-2">Premium AI Travel Experiences</p>
  </div>
);

export default QuotationPreview;
