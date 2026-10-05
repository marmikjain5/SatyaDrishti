/**
 * ShopSearchInput  -  Google Maps Places Autocomplete (Mock)
 *
 * This component simulates the Google Maps Places Autocomplete API using
 * a curated set of Indian retail stores for demo purposes.
 *
 * TO UPGRADE TO THE REAL API:
 * 1. Add your Google Maps API key to .env:  VITE_GOOGLE_MAPS_API_KEY=...
 * 2. Load the Maps JS SDK in index.html:
 *    <script src="https://maps.googleapis.com/maps/api/js?key=...&libraries=places"></script>
 * 3. Replace `getMockSuggestions(query)` with:
 *    const svc = new window.google.maps.places.AutocompleteService();
 *    svc.getPlacePredictions({ input: query, componentRestrictions: { country: "in" } }, callback)
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, X, ExternalLink, Search, Store, CheckCircle2 } from "lucide-react";
import type { ShopLocation } from "../../types/compliance";

interface ShopSearchInputProps {
  value: ShopLocation | null;
  onChange: (shop: ShopLocation | null) => void;
  required?: boolean;
}

const MOCK_SHOPS: Omit<ShopLocation, "googleMapsUrl">[] = [
  { name: "D-Mart, Andheri West", address: "Shastri Nagar, Andheri West, Mumbai, Maharashtra 400053", coordinates: { lat: 19.1336, lng: 72.8267 } },
  { name: "Reliance Fresh, Koramangala", address: "80 Feet Rd, Koramangala 4th Block, Bengaluru, Karnataka 560034", coordinates: { lat: 12.9344, lng: 77.6262 } },
  { name: "Big Bazaar, Malad West", address: "Infinity Mall, New Link Rd, Malad West, Mumbai, Maharashtra 400064", coordinates: { lat: 19.1818, lng: 72.8479 } },
  { name: "Spencer Retail, Salt Lake", address: "Sector V, Salt Lake City, Kolkata, West Bengal 700091", coordinates: { lat: 22.5729, lng: 88.4346 } },
  { name: "More Supermarket, Velachery", address: "100 Feet Rd, Velachery, Chennai, Tamil Nadu 600042", coordinates: { lat: 12.9791, lng: 80.2207 } },
  { name: "Star Bazaar, Thane", address: "Viviana Mall, Pokhran Rd No 2, Thane West, Maharashtra 400601", coordinates: { lat: 19.2183, lng: 72.9781 } },
  { name: "Vishal Mega Mart, Lajpat Nagar", address: "Ring Rd, Lajpat Nagar II, New Delhi, Delhi 110024", coordinates: { lat: 28.5665, lng: 77.2433 } },
  { name: "Metro Cash and Carry, Vashi", address: "Plot 12, Sector 19A, Vashi, Navi Mumbai, Maharashtra 400703", coordinates: { lat: 19.0771, lng: 73.0064 } },
  { name: "Hypermarket, HSR Layout", address: "27th Main Rd, Sector 1, HSR Layout, Bengaluru, Karnataka 560102", coordinates: { lat: 12.9121, lng: 77.6446 } },
  { name: "Nilgiris Supermarket, Basavanagudi", address: "Bull Temple Rd, Basavanagudi, Bengaluru, Karnataka 560004", coordinates: { lat: 12.9415, lng: 77.5676 } },
  { name: "Jio Mart, Powai", address: "Hiranandani Gardens, Powai, Mumbai, Maharashtra 400076", coordinates: { lat: 19.1176, lng: 72.9060 } },
  { name: "Le Marche, Banjara Hills", address: "Road No 12, Banjara Hills, Hyderabad, Telangana 500034", coordinates: { lat: 17.4165, lng: 78.4416 } },
  { name: "Spar Hypermarket, Gurgaon", address: "DLF Mall of India, Sector 18, Gurugram, Haryana 122002", coordinates: { lat: 28.4952, lng: 77.0720 } },
  { name: "V-Mart, Patna", address: "Boring Canal Rd, Patna, Bihar 800001", coordinates: { lat: 25.6093, lng: 85.1376 } },
  { name: "Easyday, Rohini", address: "Sector 7, Rohini, New Delhi, Delhi 110085", coordinates: { lat: 28.7030, lng: 77.1118 } },
  { name: "Foodhall, Lower Parel", address: "High Street Phoenix, Senapati Bapat Marg, Lower Parel, Mumbai, Maharashtra 400013", coordinates: { lat: 18.9933, lng: 72.8286 } },
  { name: "Ratnadeep, Jubilee Hills", address: "Road No 36, Jubilee Hills, Hyderabad, Telangana 500033", coordinates: { lat: 17.4321, lng: 78.4071 } },
  { name: "Lulu Hypermarket, Kochi", address: "Edapally - Pulinchodu Rd, Ernakulam, Kochi, Kerala 682024", coordinates: { lat: 10.0271, lng: 76.3088 } },
  { name: "Walmart Best Price, Amritsar", address: "G.T. Road, Near Bus Stand, Amritsar, Punjab 143001", coordinates: { lat: 31.6340, lng: 74.8723 } },
  { name: "DMart, Thane", address: "Wagle Estate, Thane, Maharashtra 400604", coordinates: { lat: 19.1730, lng: 72.9680 } },
  { name: "Reliance Smart, Whitefield", address: "ITPL Main Road, Whitefield, Bengaluru, Karnataka 560066", coordinates: { lat: 12.9698, lng: 77.7499 } },
  { name: "Big Bazaar, Elante Mall", address: "Industrial Area Phase 1, Chandigarh 160002", coordinates: { lat: 30.7046, lng: 76.8019 } },
  { name: "Triveni Supermarket, Ahmedabad", address: "Bopal, Ahmedabad, Gujarat 380058", coordinates: { lat: 23.0225, lng: 72.4714 } },
  { name: "Heritage Fresh, Ameerpet", address: "Punjagutta, Hyderabad, Telangana 500082", coordinates: { lat: 17.4373, lng: 78.4485 } },
];

function getMockSuggestions(query: string): Omit<ShopLocation, "googleMapsUrl">[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase();
  return MOCK_SHOPS.filter(
    (s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q)
  ).slice(0, 6);
}

function buildMapsUrl(name: string, coords: { lat: number; lng: number }): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " " + coords.lat + "," + coords.lng)}`;
}

export const ShopSearchInput: React.FC<ShopSearchInputProps> = ({ value, onChange, required }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Omit<ShopLocation, "googleMapsUrl">[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined as unknown as ReturnType<typeof setTimeout>);

  const search = useCallback((q: string) => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(() => {
      setSuggestions(getMockSuggestions(q));
      setIsOpen(true);
      setIsSearching(false);
    }, 280);
  }, []);

  useEffect(() => {
    search(query);
    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (shop: Omit<ShopLocation, "googleMapsUrl">) => {
    const googleMapsUrl = buildMapsUrl(shop.name, shop.coordinates);
    onChange({ ...shop, googleMapsUrl });
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    setActiveSuggestion(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeSuggestion >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeSuggestion]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  if (value) {
    return (
      <div className="rounded-xl border-2 border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/30 p-3.5 flex items-start gap-3 shadow-sm">
        <div className="mt-0.5 h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm leading-tight block truncate">
            {value.name}
          </span>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400/80 font-medium mt-0.5 leading-tight line-clamp-2">
            {value.address}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <a
              href={value.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              <MapPin className="h-3 w-3" />
              View on Google Maps
              <ExternalLink className="h-3 w-3 ml-0.5" />
            </a>
            <span className="text-[10px] text-slate-400 font-mono">
              {value.coordinates.lat.toFixed(4)}, {value.coordinates.lng.toFixed(4)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
          aria-label="Remove selected shop"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isSearching ? (
            <svg className="h-4 w-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <MapPin className="h-4 w-4 text-blue-500" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder='Search shop name, locality or city... (e.g. "D-Mart Andheri", "Reliance Fresh")'
          className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-10 pr-9 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          required={required && !value}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(""); setSuggestions([]); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
            <Search className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {suggestions.length} shop{suggestions.length !== 1 ? "s" : ""} found  -  powered by Google Maps Places
            </span>
          </div>
          {suggestions.map((shop, idx) => (
            <button
              key={shop.name + idx}
              type="button"
              onClick={() => handleSelect(shop)}
              onMouseEnter={() => setActiveSuggestion(idx)}
              className={`w-full text-left px-3 py-2.5 flex items-start gap-3 transition-colors border-b border-slate-50 dark:border-slate-800/50 last:border-0 ${
                activeSuggestion === idx
                  ? "bg-blue-50 dark:bg-blue-950/30"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="mt-0.5 h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                <Store className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 dark:text-white text-xs leading-tight truncate">
                  {shop.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight line-clamp-1">
                  {shop.address}
                </div>
              </div>
              <MapPin className="h-3.5 w-3.5 text-blue-400 mt-0.5 shrink-0" />
            </button>
          ))}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Demo mode  -  showing sample data. Google Maps Places API active in production.
            </p>
          </div>
        </div>
      )}

      {isOpen && !isSearching && query.trim().length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-4 text-center">
          <Store className="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs text-slate-500 dark:text-slate-400">No shops found for "{query}"</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Try a different name, area, or city</p>
        </div>
      )}
    </div>
  );
};
