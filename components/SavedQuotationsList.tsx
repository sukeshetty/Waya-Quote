import React from 'react';
import { SavedQuotation } from '../types';
import { Calendar, Trash2, ArrowRight, MapPin, DollarSign, Clock } from 'lucide-react';

interface SavedQuotationsListProps {
  quotations: SavedQuotation[];
  onLoad: (q: SavedQuotation) => void;
  onDelete: (id: string) => void;
}

const SavedQuotationsList: React.FC<SavedQuotationsListProps> = ({ quotations, onLoad, onDelete }) => {
  if (quotations.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-12 text-slate-400">
        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-slate-600" />
        </div>
        <h3 className="text-xl font-medium text-slate-300 mb-2">No saved quotations</h3>
        <p className="max-w-md text-center">Generate a quotation and click "Save to Library" to build your collection of travel proposals.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-slate-50 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-800">Quotation Library</h1>
          <p className="text-slate-500 mt-1">Access and manage your previously generated travel proposals.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotations.map((quote) => (
            <div key={quote.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all group flex flex-col">
              {/* Hero Image */}
              <div className="h-48 relative overflow-hidden">
                <img 
                  src={quote.heroImage || "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80"} 
                  alt={quote.destination}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h3 className="font-bold text-lg leading-tight mb-1">{quote.tripTitle}</h3>
                  <div className="flex items-center text-xs opacity-90">
                    <MapPin className="w-3 h-3 mr-1" />
                    {quote.destination}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Customer</p>
                    <p className="font-medium text-slate-800">{quote.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Total Value</p>
                    <p className="font-bold text-waya-600">{quote.totalPrice}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm text-slate-600">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    <span>{quote.startDate} - {quote.endDate}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Clock className="w-4 h-4 mr-2 text-slate-400" />
                    <span>Created: {new Date(quote.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                   <button 
                     onClick={() => onDelete(quote.id)}
                     className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                     title="Delete Quotation"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={() => onLoad(quote)}
                     className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center group/btn"
                   >
                     View & Edit
                     <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SavedQuotationsList;