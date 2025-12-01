import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { RestaurantMenuPage } from './pages/RestaurantMenuPage';
import { LandingPage } from './pages/LandingPage';
import { QuickUploadPage } from './pages/QuickUploadPage';
import { AdminDashboard } from './pages/AdminDashboard';

export function AppRouter() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/r/:restaurantId" element={<RestaurantMenuPage />} />
        <Route path="/upload" element={<QuickUploadPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
