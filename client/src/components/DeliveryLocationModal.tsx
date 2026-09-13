import React, { useState } from 'react';
import { MapPin, X, Check, Search, Navigation, Building, ShieldCheck } from 'lucide-react';
import { useApp, DeliveryLocation } from '../context/AppContext';

interface DeliveryLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const popularCities = [
  { name: 'Bengaluru', areas: ['Indiranagar', 'Koramangala', 'HSR Layout', 'Whitefield', 'Jayanagar'] },
  { name: 'Delhi NCR', areas: ['Connaught Place', 'Gurugram Sec 29', 'Noida Sec 18', 'South Ext', 'Dwarka'] },
  { name: 'Mumbai', areas: ['Bandra West', 'Andheri East', 'Powai', 'Colaba', 'Juhu'] },
  { name: 'Hyderabad', areas: ['Banjara Hills', 'Hitec City', 'Gachibowli', 'Jubilee Hills', 'Kondapur'] },
  { name: 'Pune', areas: ['Kothrud', 'Viman Nagar', 'Baner', 'Hinjewadi', 'Koregaon Park'] },
];

export default function DeliveryLocationModal({ isOpen, onClose }: DeliveryLocationModalProps) {
  const { deliveryLocation, setDeliveryLocation } = useApp();
  const [selectedCity, setSelectedCity] = useState(deliveryLocation.city || 'Bengaluru');
  const [selectedArea, setSelectedArea] = useState(deliveryLocation.area || 'Koramangala 4th Block');
  const [pincode, setPincode] = useState(deliveryLocation.pincode || '560034');
  const [label, setLabel] = useState<string>(deliveryLocation.addressLabel || 'Home');
  const [pincodeValid, setPincodeValid] = useState<boolean | null>(true);

  if (!isOpen) return null;

  const currentCityData = popularCities.find(c => c.name === selectedCity) || popularCities[0];

  const handlePincodeChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    if (clean.length === 6) {
      setPincodeValid(true);
    } else if (clean.length > 0) {
      setPincodeValid(null);
    }
  };

  const handleSave = () => {
    const newLoc: DeliveryLocation = {
      city: selectedCity,
      area: selectedArea,
      pincode: pincode.length === 6 ? pincode : '560034',
      addressLabel: label,
    };
    setDeliveryLocation(newLoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-800">Select Delivery Location</h3>
              <p className="text-xs text-neutral-500">Fast delivery in 10-15 minutes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Pincode Search Box */}
          <div>
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
              Check Pincode
            </label>
            <div className="relative flex items-center">
              <Search size={16} className="absolute left-3.5 text-neutral-400" />
              <input
                type="text"
                value={pincode}
                onChange={(e) => handlePincodeChange(e.target.value)}
                placeholder="Enter 6-digit Pincode (e.g. 560034)"
                maxLength={6}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl pl-10 pr-24 py-3 text-sm font-semibold text-neutral-800 focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setPincodeValid(pincode.length === 6)}
                className="absolute right-2 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold"
              >
                Apply
              </button>
            </div>
            {pincodeValid && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                <Check size={14} className="stroke-[3]" />
                <span>Express 10-15 Min Delivery is available in your area!</span>
              </div>
            )}
          </div>

          {/* Select City */}
          <div>
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
              Select City
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {popularCities.map(c => {
                const isSelected = selectedCity === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setSelectedCity(c.name);
                      setSelectedArea(c.areas[0]);
                    }}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/70 text-primary-800 font-bold shadow-sm'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'
                    }`}
                  >
                    <Building size={16} className={isSelected ? 'text-primary-600' : 'text-neutral-400'} />
                    <span className="text-xs">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Popular Localities */}
          <div>
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
              Popular Localities in {selectedCity}
            </label>
            <div className="flex flex-wrap gap-2">
              {currentCityData.areas.map(area => {
                const isSelected = selectedArea === area;
                return (
                  <button
                    key={area}
                    type="button"
                    onClick={() => setSelectedArea(area)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-neutral-900 border-neutral-900 text-white shadow-sm'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {area}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Address Label */}
          <div>
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block mb-2">
              Save as
            </label>
            <div className="flex gap-2">
              {['Home', 'Office', 'Other'].map(lbl => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setLabel(lbl)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    label === lbl
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Trust Banner */}
          <div className="p-3.5 bg-neutral-50 rounded-2xl flex items-center gap-3 border border-neutral-100">
            <ShieldCheck size={24} className="text-primary-600 flex-shrink-0" />
            <p className="text-xs text-neutral-600 leading-relaxed">
              Real-time stock and prices update based on your selected delivery locality.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between gap-3">
          <div className="text-left">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">Deliver to</p>
            <p className="text-xs font-bold text-neutral-800 truncate max-w-[200px]">
              {selectedArea}, {selectedCity}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition-all"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}
