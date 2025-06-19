import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Landing from "./pages/Landing/Landing";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Payments from './pages/Payments'; // Stara testowa strona
import Equipment from './pages/Equipment/Equipment';
import RentalForm from './pages/Rental/RentalForm';
import PaymentPage from './pages/Payment/PaymentPage';
import MyRentals from './pages/MyRentals/MyRentals';
import AdminDashboard from './pages/admin/AdminDashboard';

import './index.css';

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/equipment" element={<Equipment />} />
                <Route path="/rent/:equipmentId" element={<RentalForm />} />
                <Route path="/payment" element={<PaymentPage />} />
                <Route path="/my-rentals" element={<MyRentals />} />
                <Route path="/admin" element={<AdminDashboard />} />
                
                {/* Stara testowa strona płatności - można usunąć */}
                <Route path="/payments-test" element={<Payments />} />
            </Routes>
        </AuthProvider>
    );
}