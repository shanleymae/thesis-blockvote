import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import VoterDashboard from './pages/voter/VoterDashboard';
import ElectionsPage from './pages/voter/ElectionsPage';
import VotePage from './pages/voter/VotePage';
import PublishedResultsPage from './pages/voter/PublishedResultsPage';
import ReceiptPage from './pages/voter/ReceiptPage';
import VerifyPage from './pages/voter/VerifyPage';
import ProfilePage from './pages/voter/ProfilePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageElectionsPage from './pages/admin/ManageElectionsPage';
import ManageVotersPage from './pages/admin/ManageVotersPage';
import BlockchainLogsPage from './pages/admin/BlockchainLogsPage';
import ElectionDetailPage from './pages/admin/ElectionDetailPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import SuperAdminPage from './pages/admin/SuperAdminPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminSecurityPage from './pages/admin/AdminSecurityPage';
import PublicElectionsPage from './pages/public/PublicElectionsPage';
import PublishedElectionsPage from './pages/public/PublishedElectionsPage';
import CandidateProfilePage from './pages/public/CandidateProfilePage';
import PublicElectionDetailPage from './pages/public/PublicElectionDetailPage';
import PublicVerifyPage from './pages/public/PublicVerifyPage';
import LegalPage from './pages/public/LegalPage';
import HelpPage from './pages/public/HelpPage';
import RequireRole from './components/routing/RequireRole';

function App() {
  return (
    <BrowserRouter>
      <>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/elections" element={<PublicElectionsPage />} />
          <Route path="/published-elections" element={<PublishedElectionsPage />} />
          <Route path="/elections/:id" element={<PublicElectionDetailPage />} />
          <Route path="/elections/:electionId/candidates/:candidateId" element={<CandidateProfilePage />} />
          <Route path="/verify" element={<PublicVerifyPage />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />
          <Route path="/help" element={<HelpPage />} />

          {/* Voter */}
          <Route element={<RequireRole role="VOTER" />}>
            <Route path="/voter/dashboard" element={<VoterDashboard />} />
            <Route path="/voter/elections" element={<ElectionsPage />} />
            <Route path="/voter/published-results" element={<PublishedResultsPage />} />
            <Route path="/voter/elections/:id" element={<VotePage />} />
            <Route path="/voter/elections/:id/vote" element={<VotePage />} />
            <Route path="/voter/receipt" element={<ReceiptPage />} />
            <Route path="/voter/verify" element={<VerifyPage />} />
            <Route path="/voter/profile" element={<ProfilePage />} />
          </Route>

          {/* Admin */}
          <Route element={<RequireRole role="ADMIN" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/elections" element={<ManageElectionsPage />} />
            <Route path="/admin/elections/:id" element={<ElectionDetailPage />} />
            <Route path="/admin/voters" element={<ManageVotersPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
            <Route path="/admin/logs" element={<BlockchainLogsPage />} />
            <Route path="/admin/security" element={<AdminSecurityPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
          <Route element={<RequireRole role="SUPERADMIN" />}>
            <Route path="/admin/superadmin" element={<SuperAdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3500}
          newestOnTop
          closeOnClick
          pauseOnHover
          draggable
          theme="dark"
          toastClassName="bv-toast"
          progressClassName="bv-toast__progress"
        />
      </>
    </BrowserRouter>
  );
}

export default App;
