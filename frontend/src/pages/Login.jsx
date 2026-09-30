import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, UserCheck, Landmark, Compass, Award } from 'lucide-react';

export default function Login({ showBanner }) {
  const { login, loginAsRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const user = await login(email, password);
      showBanner(`Welcome back, ${user.name} (${user.role})`);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your official credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#0A192F] font-sans text-slate-100 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-900/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Official Header Strip */}
      <header className="bg-[#050E1E]/80 backdrop-blur-md border-b border-slate-800 px-6 py-3.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#102548] border border-[#C9A227] flex items-center justify-center text-base shadow-sm">
            🇮🇳
          </div>
          <div>
            <h1 className="font-serif font-extrabold text-sm tracking-wide text-white">AAROHAN • आरोहण</h1>
            <p className="text-[10px] text-amber-400/90 font-medium">Government of India • Disaster Relocation & Governance Portal</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-400 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> NDMA / MHA Compliant</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-300 font-bold">NIC Secured SSO v2.4</span>
        </div>
      </header>

      {/* Main Form Center Shell */}
      <div className="flex-1 flex items-center justify-center p-4 my-8">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-[#102548]/90 backdrop-blur-xl rounded-xs border border-slate-700/80 shadow-2xl overflow-hidden">
          
          {/* Left Side Info Panel */}
          <div className="md:col-span-5 bg-gradient-to-br from-[#102548] to-[#0A192F] p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-700/80 text-white relative">
            <div className="space-y-6 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-300 rounded-full text-[11px] font-bold">
                <Award className="w-3.5 h-3.5" /> Official Officer Portal
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-serif font-extrabold text-white leading-tight">
                  National Disaster Relocation Decision Support System
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  Integrated platform empowering District Collectors, Revenue Officers, and Field Inspectors to execute data-backed landslide and flood relocations.
                </p>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex items-start gap-2.5 text-slate-200">
                  <div className="p-1 bg-[#1A3A6B] rounded text-emerald-400 mt-0.5"><ShieldCheck className="w-3.5 h-3.5" /></div>
                  <div>
                    <span className="font-bold text-white block">AI Hazard & SHAP Scoring</span>
                    <span className="text-[11px] text-slate-400">Downscaled 5km satellite & rainfall risk assessment.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-slate-200">
                  <div className="p-1 bg-[#1A3A6B] rounded text-amber-400 mt-0.5"><Landmark className="w-3.5 h-3.5" /></div>
                  <div>
                    <span className="font-bold text-white block">Forest & Land Legal Title Clearance</span>
                    <span className="text-[11px] text-slate-400">Automated pre-clearance under FRA 2006.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 text-slate-200">
                  <div className="p-1 bg-[#1A3A6B] rounded text-sky-400 mt-0.5"><ShieldCheck className="w-3.5 h-3.5" /></div>
                  <div>
                    <span className="font-bold text-white block">Bay of Bengal Cyclone Risk Engine</span>
                    <span className="text-[11px] text-slate-400">GEE satellite + Gemini 3.7 Flash anticipatory action.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-700/60 text-[10px] text-slate-400 font-medium z-10">
              Emergency Operational Contact: <strong className="text-slate-200">1070 (Disaster Cell)</strong>
            </div>
          </div>

          {/* Right Side Login Form */}
          <div className="md:col-span-7 p-8 bg-slate-900/60 flex flex-col justify-between space-y-6">
            <div>
              <div className="space-y-1 mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#C9A227]" /> Official Sign-In
                </h3>
                <p className="text-xs text-slate-400">
                  Enter your assigned NIC / District email credentials to access the system.
                </p>
              </div>

              {error && (
                <div className="bg-rose-950/80 border-l-4 border-rose-500 p-3.5 rounded-xs text-xs text-rose-200 mb-5 space-y-0.5">
                  <p className="font-bold">Authentication Failed</p>
                  <p className="text-slate-300">{error}</p>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Official Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="officer@aarohan.gov.in"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xs focus:outline-none focus:border-[#C9A227] text-xs font-medium text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xs focus:outline-none focus:border-[#C9A227] text-xs font-medium text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-[#102548] hover:bg-[#1A3A6B] text-[#E8C547] border border-[#C9A227] font-bold rounded-xs shadow-md text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                >
                  <span>{submitting ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
                  <ArrowRight className="w-4 h-4 text-[#E8C547]" />
                </button>
              </form>
            </div>

            {/* Direct Instant Access Buttons */}
            <div className="pt-5 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 block">
                  ⚡ Direct Portal Bypass (Instant Entry):
                </span>
                <span className="text-[10px] text-slate-400 font-medium">No Backend Auth Required</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const u = loginAsRole('field_officer');
                    showBanner(`Entered as ${u.name} (${u.role})`);
                  }}
                  className="px-3.5 py-2.5 bg-emerald-950/70 hover:bg-emerald-900/90 border border-emerald-500/50 text-left rounded-xs text-xs font-bold text-emerald-200 flex flex-col justify-between gap-1 shadow-md transition-all group"
                >
                  <span className="flex items-center gap-1.5 text-emerald-300 font-extrabold">
                    <Compass className="w-4 h-4 text-emerald-400" /> Field Inspector
                  </span>
                  <span className="text-[10px] text-emerald-400/90 font-medium">Ground Verification Portal &rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const u = loginAsRole('revenue_officer');
                    showBanner(`Entered as ${u.name} (${u.role})`);
                  }}
                  className="px-3.5 py-2.5 bg-amber-950/70 hover:bg-amber-900/90 border border-amber-500/50 text-left rounded-xs text-xs font-bold text-amber-200 flex flex-col justify-between gap-1 shadow-md transition-all group"
                >
                  <span className="flex items-center gap-1.5 text-amber-300 font-extrabold">
                    <UserCheck className="w-4 h-4 text-amber-400" /> Revenue Officer
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-medium">Land & Title Approval Portal &rarr;</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const u = loginAsRole('disaster_control');
                    showBanner(`Entered as ${u.name} (${u.role})`);
                  }}
                  className="px-3.5 py-2.5 bg-sky-950/70 hover:bg-sky-900/90 border border-sky-500/50 text-left rounded-xs text-xs font-bold text-sky-200 flex flex-col justify-between gap-1 shadow-md transition-all group"
                >
                  <span className="flex items-center gap-1.5 text-sky-300 font-extrabold">
                    <ShieldCheck className="w-4 h-4 text-sky-400" /> Disaster Officer
                  </span>
                  <span className="text-[10px] text-sky-400/90 font-medium">Bay of Bengal & APAC Hub &rarr;</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Government Footer Bar */}
      <footer className="bg-[#050E1E] border-t border-slate-800 py-3 px-6 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span>© 2026 National Disaster Management Authority (NDMA) & Revenue Department.</span>
        <span className="font-semibold text-slate-400">Designed for State Disaster Risk Governance</span>
      </footer>
    </div>
  );
}
