import React from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';

export default function RoleSelectionModal({ onSelectRole }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102548]/80 backdrop-blur-xs p-4">
      {/* Central Government Institutional Card */}
      <div className="bg-white rounded-xs max-w-xl w-full border-2 border-[#1A3A6B] shadow-xl overflow-hidden">
        {/* Government Gold Top Line Header */}
        <div className="bg-[#102548] p-6 text-white border-b-4 border-[#C9A227] text-center space-y-2">
          <div className="w-12 h-12 bg-[#1A3A6B] border border-[#C9A227] mx-auto rounded-xs flex items-center justify-center text-xl font-serif">
            🇮🇳
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wide text-white font-sans uppercase">
              AAROHAN • आरोहन
            </h1>
            <p className="text-xs font-bold text-[#E8C547] uppercase tracking-wider mt-0.5 font-devanagari">
              आपदा पुनर्वास निर्णय सहायता पोर्टल
            </p>
            <p className="text-[11px] text-[#90B8D8] mt-1">
              Disaster Relocation Decision Support System • Government of India Digital Portal
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 text-center">
          <div>
            <h2 className="text-sm font-bold text-[#102548] uppercase tracking-wider">
              Select Authorized Officer Portal Role
            </h2>
            <p className="text-xs text-[#64748B] mt-1 font-medium">
              Please choose your designated administrative operational access role to proceed.
            </p>
          </div>

          {/* Role Selection Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Field Officer Card Button */}
            <button
              onClick={() => onSelectRole('Field Officer')}
              className="p-5 bg-white hover:bg-[#F0F4F9] border-2 border-[#1A3A6B] rounded-xs text-left transition-all group shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between h-40"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xs bg-[#1A3A6B] text-white flex items-center justify-center font-bold text-sm">
                  <UserCheck className="w-5 h-5 text-[#E8C547]" />
                </div>
                <span className="text-[10px] font-bold text-[#1A3A6B] bg-[#EBF5FB] px-2 py-0.5 rounded-xs border border-[#1A3A6B]/20">
                  Ground Access
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-[#1A3A6B] text-sm group-hover:text-[#102548]">
                  Field Officer
                </h3>
                <p className="text-[11px] font-bold text-[#C9A227] font-devanagari">
                  क्षेत्र अधिकारी पोर्टल
                </p>
                <p className="text-[10px] text-[#64748B] mt-1 leading-tight font-medium">
                  Mobile-first ground inspections, SHAP evidence review, GPS capture, offline sync reports.
                </p>
              </div>
            </button>

            {/* Revenue Officer Card Button */}
            <button
              onClick={() => onSelectRole('Revenue Officer')}
              className="p-5 bg-white hover:bg-[#F0F4F9] border-2 border-[#102548] rounded-xs text-left transition-all group shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between h-40"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xs bg-[#102548] text-white flex items-center justify-center font-bold text-sm">
                  <ShieldCheck className="w-5 h-5 text-[#E8C547]" />
                </div>
                <span className="text-[10px] font-bold text-[#102548] bg-[#FEF3E2] px-2 py-0.5 rounded-xs border border-[#C9A227]/30 text-[#E67E22]">
                  Verification Access
                </span>
              </div>
              <div>
                <h3 className="font-extrabold text-[#102548] text-sm group-hover:text-[#1A3A6B]">
                  Revenue Officer
                </h3>
                <p className="text-[11px] font-bold text-[#C9A227] font-devanagari">
                  राजस्व अधिकारी पोर्टल
                </p>
                <p className="text-[10px] text-[#64748B] mt-1 leading-tight font-medium">
                  Land survey verification, AHP suitability, manual ecosystem notifications, 12-stage pipeline.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer Audit Notice */}
        <div className="bg-[#F0F4F9] p-3 text-center border-t border-[#CBD5E1] text-[10px] text-[#64748B] font-semibold">
          Authorized personnel access only. Every action logged to official audit register.
        </div>
      </div>
    </div>
  );
}
