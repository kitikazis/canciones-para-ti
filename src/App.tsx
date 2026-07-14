import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './components/Admin';
import ThemeToggle from './components/ThemeToggle';
import Ambiance from './components/Ambiance';

export default function App() {
  return (
    <BrowserRouter>
      <Ambiance />
      <ThemeToggle />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} />
        {/* Cualquier otra URL vuelve al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
