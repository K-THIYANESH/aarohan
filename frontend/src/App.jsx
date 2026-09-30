import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import GovernmentTopHeader from './components/GovernmentTopHeader';
import GovernmentFooter from './components/GovernmentFooter';
import Sidebar from './components/Sidebar';
import SuccessBanner from './components/SuccessBanner';
import Login from './pages/Login';

// Field Officer Pages
import MyAssignedVillages from './pages/field/MyAssignedVillages';
import VillageEvidence from './pages/field/VillageEvidence';
import SubmitGroundReport from './pages/field/SubmitGroundReport';
import MySubmittedReports from './pages/field/MySubmittedReports';

// Revenue Officer Pages
import RevenueHome from './pages/revenue/RevenueHome';
import LandVerificationTasks from './pages/revenue/LandVerificationTasks';
import SiteLandRecords from './pages/revenue/SiteLandRecords';
import SendNotifications from './pages/revenue/SendNotifications';
import ApplicationTimeline from './pages/revenue/ApplicationTimeline';
import VerificationHistory from './pages/revenue/VerificationHistory';

// Shared Pages
import AuditRecord from './pages/AuditRecord';
import StrategicPlanningHub from './pages/StrategicPlanningHub';
import MasterCaseFile from './pages/MasterCaseFile';
import MasterCaseFilesList from './pages/MasterCaseFilesList';

function MainPortal() {
  const { user, logout, loading } = useAuth();
  const [banner, setBanner] = useState({ message: '', type: 'success' });

  const showBanner = (message, type = 'success') => {
    setBanner({ message, type });
    setTimeout(() => {
      setBanner({ message: '', type: 'success' });
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F9]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#002B49] mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading AAROHAN Portal...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login showBanner={showBanner} />;
  }

  const userRole = user.role === 'FIELD_OFFICER' ? 'Field Officer' : 'Revenue Officer';

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F4F9] text-[#1A1A1A] font-sans antialiased">
      {/* Government Top Header */}
      <GovernmentTopHeader userRole={userRole} userName={user.name} onLogout={logout} />

      <div className="flex flex-1 relative">
        {/* Notification Banner */}
        <SuccessBanner
          message={banner.message}
          type={banner.type}
          onClose={() => setBanner({ message: '', type: 'success' })}
        />

        {/* Sidebar Navigation */}
        <Sidebar userRole={userRole} onSwitchRole={logout} />

        {/* Main Portal View Content Area */}
        <main className="flex-1 p-4 md:p-6 min-h-[calc(100vh-140px)] overflow-x-hidden md:ml-[240px]">
          {user.role === 'FIELD_OFFICER' && (
            <Routes>
              <Route path="/" element={<MyAssignedVillages showBanner={showBanner} />} />
              <Route path="/field/evidence/:villageId" element={<VillageEvidence showBanner={showBanner} />} />
              <Route path="/field/submit" element={<SubmitGroundReport showBanner={showBanner} />} />
              <Route path="/field/reports" element={<MySubmittedReports showBanner={showBanner} />} />
              <Route path="/casefiles" element={<MasterCaseFilesList showBanner={showBanner} />} />
              <Route path="/casefile/:villageId" element={<MasterCaseFile showBanner={showBanner} />} />
              <Route path="/strategic" element={<StrategicPlanningHub />} />
              <Route path="/audit" element={<AuditRecord showBanner={showBanner} userRole="Field Officer" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}

          {user.role === 'REVENUE_OFFICER' && (
            <Routes>
              <Route path="/" element={<RevenueHome showBanner={showBanner} />} />
              <Route path="/revenue/timeline" element={<ApplicationTimeline showBanner={showBanner} />} />
              <Route path="/revenue/tasks" element={<LandVerificationTasks showBanner={showBanner} />} />
              <Route path="/revenue/sites/:siteId" element={<SiteLandRecords showBanner={showBanner} />} />
              <Route path="/revenue/notifications/:villageId" element={<SendNotifications showBanner={showBanner} />} />
              <Route path="/revenue/history" element={<VerificationHistory showBanner={showBanner} />} />
              <Route path="/casefiles" element={<MasterCaseFilesList showBanner={showBanner} />} />
              <Route path="/casefile/:villageId" element={<MasterCaseFile showBanner={showBanner} />} />
              <Route path="/strategic" element={<StrategicPlanningHub />} />
              <Route path="/audit" element={<AuditRecord showBanner={showBanner} userRole="Revenue Officer" />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </main>
      </div>

      {/* Institutional Government Footer */}
      <GovernmentFooter />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <MainPortal />
      </AuthProvider>
    </Router>
  );
}
