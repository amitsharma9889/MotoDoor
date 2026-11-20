import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import { Login, Signup, ForgotPassword, ResetPassword } from './pages/Auth';
import BookService from './pages/BookService';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import MechanicDashboard from './pages/MechanicDashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/book" element={<ProtectedRoute roles={['customer']}><BookService /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute roles={['customer']}><MyBookings /></ProtectedRoute>} />
        <Route path="/bookings/:id" element={<ProtectedRoute roles={['customer', 'admin']}><BookingDetail /></ProtectedRoute>} />
        <Route path="/mechanic" element={<ProtectedRoute roles={['mechanic']}><MechanicDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="*" element={<p className="p-10 text-center">Page not found.</p>} />
      </Routes>
    </>
  );
}
