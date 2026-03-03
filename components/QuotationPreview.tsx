import React, { useState, useRef } from 'react';
import { TravelQuotation } from '../types';
import { Plane, Hotel, Calendar, CheckCircle, Info, MapPin, Utensils, Check, Clock, Globe, ArrowRight, Star, Shield, ThumbsUp, Quote, Edit2, Upload, Image as ImageIcon, X } from 'lucide-react';

interface QuotationPreviewProps {
  data: TravelQuotation | null;
  loading: boolean;
  id: string;
  onUpdatePrice?: (newPrice: string) => void;
  onUpdateImage?: (type: 'hero' | 'hotel' | 'restaurant' | 'itinerary', index: number, imageData: string) => void;
}

// Curated list of high-quality food images for fallbacks
const FALABECK_FOOD_IMAGES = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1555939594-58d7cb561ad1/?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80",
];

