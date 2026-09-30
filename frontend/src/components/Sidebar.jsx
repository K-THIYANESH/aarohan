import React from 'react';
import { NavLink } from 'react-router-dom';
import { ClipboardList, Send, CheckSquare, Landmark, History, FileText, Activity, RefreshCw, Cpu } from 'lucide-react';

export default function Sidebar({ userRole, onSwitchRole }) {
  const fieldOfficerNav = [
    { path: '/', label: 'My Assigned Villages', hindi: 'आवंटित गाँव', icon: ClipboardList },
    { path: '/casefiles', label: 'Master Case Files', hindi: 'मास्टर केस फाइल', icon: FileText },
    { path: '/strategic', label: 'Strategic AI Suite', hindi: 'रणनीतिक एआई सूट', icon: Cpu },
    { path: '/field/submit', label: 'Submit Ground Report', hindi: 'ग्राउंड रिपोर्ट जमा करें', icon: Send },
    { path: '/field/reports', label: 'My Submitted Reports', hindi: 'प्रस्तुत रिपोर्ट', icon: CheckSquare },
    { path: '/audit', label: 'Activity Record', hindi: 'कार्रवाई रजिस्टर', icon: FileText },
  ];

  const revenueOfficerNav = [
    { path: '/', label: 'Operational Dashboard', hindi: 'परिचालन डैशबोर्ड', icon: Landmark },
    { path: '/casefiles', label: 'Master Case Files', hindi: 'मास्टर केस फाइल', icon: FileText },
    { path: '/strategic', label: 'Strategic AI Suite', hindi: 'रणनीतिक एआई सूट', icon: Cpu },
    { path: '/revenue/timeline', label: 'Application Timeline', hindi: 'आवेदन समयावधि', icon: Activity },
    { path: '/revenue/tasks', label: 'Land Verification Tasks', hindi: 'भूमि सत्यापन कार्य', icon: Landmark },
    { path: '/revenue/history', label: 'Verification History', hindi: 'सत्यापन इतिहास', icon: History },
    { path: '/audit', label: 'Activity Record', hindi: 'कार्रवाई रजिस्टर', icon: FileText },
  ];

  const navItems = userRole === 'Field Officer' ? fieldOfficerNav : revenueOfficerNav;

  return (
    <>
      {/* Desktop Sidebar (Left Fixed 240px with Government Navy Styling) */}
      <aside className="hidden md:flex w-[240px] bg-[#102548] text-white flex-col h-[calc(100vh-84px)] fixed left-0 top-[84px] border-r border-[#CBD5E1]/20 shadow-md z-20">
        {/* Brand/Role Sub-Header */}
        <div className="p-4 border-b border-[#CBD5E1]/20 bg-[#0E1F3B]">
          <button
            onClick={onSwitchRole}
            className="w-full text-left group cursor-pointer focus:outline-none"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#E8C547] uppercase tracking-wider">
                {userRole} Portal
              </span>
              <RefreshCw className="w-3.5 h-3.5 text-[#90B8D8] group-hover:text-[#E8C547] transition-colors" />
            </div>
            <p className="text-[11px] font-medium text-gray-300 mt-0.5">
              Click to switch officer role
            </p>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-3 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 text-xs font-semibold transition-all duration-150 rounded-xs mx-2 ${
                    isActive
                      ? 'border-l-4 border-[#C9A227] text-white bg-[#1A3A6B] font-bold shadow-2xs'
                      : 'text-gray-300 hover:bg-[#1A3A6B]/50 hover:text-white border-l-4 border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-[#90B8D8]" />
                <div className="flex flex-col">
                  <span className="text-xs">{item.label}</span>
                  <span className="text-[10px] text-[#90B8D8] font-normal font-devanagari">
                    {item.hindi}
                  </span>
                </div>
              </NavLink>
            );
          })}
        </nav>

        {/* Switch Role Footer Link */}
        <div className="p-3 bg-[#0A172C] border-t border-[#CBD5E1]/20 text-center">
          <button
            onClick={onSwitchRole}
            className="w-full py-1.5 px-3 bg-[#1A3A6B] hover:bg-[#2A4E8C] text-white text-[11px] font-bold rounded-xs flex items-center justify-center gap-1.5 transition-colors border border-[#C9A227]/30"
          >
            <RefreshCw className="w-3 h-3 text-[#E8C547]" />
            Switch Role / पोर्टल बदलें
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#102548] text-white border-t border-[#C9A227] z-40 flex justify-around items-center h-16 shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold w-full h-full ${
                  isActive ? 'text-[#E8C547] bg-[#1A3A6B]' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[75px]">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
