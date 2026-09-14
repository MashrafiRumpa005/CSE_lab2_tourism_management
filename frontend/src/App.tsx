import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/login.jsx'
import SignupPage from './pages/signup.jsx'
import TourismHomepage from './pages/homepage.jsx'
import DestinationsPage from './pages/destinations.jsx'
import PackagesPage from './pages/packages.jsx'
import ProfilePage from './pages/profile.jsx'
import BookingPage from './pages/booking.jsx'
import MyBookingsPage from './pages/myBookings.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<TourismHomepage />} />
      <Route path="/destinations" element={<DestinationsPage />} />
      <Route path="/packages" element={<PackagesPage />} />
      <Route path="/book" element={<BookingPage />} />
      <Route path="/book/:id" element={<BookingPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/booking/:id" element={<BookingPage />} />
      <Route path="/my-bookings" element={<MyBookingsPage />} />
      <Route path="/bookings" element={<MyBookingsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
