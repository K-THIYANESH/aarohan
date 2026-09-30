import React from 'react';

export default function GovernmentTopHeader({ userRole }) {
  return (
    <header className="sticky top-0 bg-[#102548] text-white border-b-2 border-[#C9A227] shadow-md z-30">
      {/* Topmost Official Utility Bar */}
      <div className="bg-[#0A172C] text-[#90B8D8] text-[11px] py-1 px-4 md:px-6 flex justify-between items-center border-b border-blue-950 font-medium">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#E8C547]">भारत सरकार | Government of India</span>
          <span className="text-gray-500">|</span>
          <span>गृह मंत्रालय / MHA & NDMA Guidelines Compliant</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[10px]">
          <span>Skip to Main Content</span>
          <span>|</span>
          <span className="font-bold text-white">English</span>
          <span>/</span>
          <span>हिन्दी</span>
        </div>
      </div>

      {/* Main Administrative Portal Header */}
      <div className="py-3 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Institutional Emblem Pillar Symbol */}
          <div className="w-9 h-9 rounded-sm bg-[#1A3A6B] border border-[#C9A227]/40 flex items-center justify-center font-serif font-black text-[#E8C547] text-lg shadow-2xs">
            🇮🇳
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg md:text-xl font-extrabold tracking-wide text-white m-0 font-sans">
                AAROHAN
              </h1>
              <span className="text-xs font-bold text-[#E8C547] font-devanagari">
                आरोहन आपदा पुनर्वास पोर्टल
              </span>
            </div>
            <p className="text-[11px] text-[#90B8D8] font-medium tracking-wide">
              Disaster Relocation Decision Support System • {userRole ? `${userRole} Portal` : 'Official Portal'}
            </p>
          </div>
        </div>

        {/* Security & Access Badge */}
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <span className="block text-[11px] font-bold text-[#E8C547]">DISASTER MANAGEMENT CELL</span>
            <span className="block text-[10px] text-gray-300">National Disaster Management Authority</span>
          </div>
          <div className="px-2.5 py-1 bg-[#1A3A6B] border border-[#CBD5E1]/30 rounded-xs text-[10px] font-bold text-white uppercase tracking-wider">
            RESTRICTED ACCESS
          </div>
        </div>
      </div>
    </header>
  );
}
