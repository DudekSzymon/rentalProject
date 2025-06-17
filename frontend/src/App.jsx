import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing/Landing";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Payments from './pages/Payments';

import './index.css';


export default function App() {
    return (
        <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/payments" element={<Payments />} />
        </Routes>
    );
}
