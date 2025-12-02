import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RestaurantMenuPage } from './pages/RestaurantMenuPage';
import { LandingPage } from './pages/LandingPage';
import { QuickUploadPage } from './pages/QuickUploadPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminAuthPage } from './pages/AdminAuthPage';
import { RestaurantRegistrationPage } from './pages/RestaurantRegistrationPage';
import { ThemeSelectionPage } from './pages/ThemeSelectionPage';
import { LogoUploadPage } from './pages/LogoUploadPage';

export function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/r/:restaurantId" element={<RestaurantMenuPage />} />
        <Route path="/upload" element={<QuickUploadPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin/auth" element={<AdminAuthPage />} />
        <Route path="/admin/register-restaurant" element={<RestaurantRegistrationPage />} />
        <Route path="/admin/theme-selection" element={<ThemeSelectionPage />} />
        <Route path="/admin/logo-upload" element={<LogoUploadPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin" element={<Navigate to="/admin/auth" replace />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
