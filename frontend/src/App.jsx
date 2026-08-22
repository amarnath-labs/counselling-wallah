import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppStateProvider } from './hooks/useAppState';
import AppLayout from './layouts/AppLayout';
import Home from './pages/Home';
import Exams from './pages/Exams';
import Profile from './pages/Profile';
import Results from './pages/Results';
import CollegeDetail from './pages/CollegeDetail';
import Compare from './pages/Compare';
import ChoiceList from './pages/ChoiceList';
import Pricing from './pages/Pricing';
import Dashboard from './pages/Dashboard';
import CounsellingCalendar from './pages/CounsellingCalendar';
import Documents from './pages/Documents';
import Login from './pages/Login';
import Register from './pages/Register';
import Account from './pages/Account';
import './styles/global.css';

export default function App() {
  return (
    <AppStateProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/results" element={<Results />} />
            <Route path="/colleges/:id" element={<CollegeDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/choice-list" element={<ChoiceList />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/counselling" element={<CounsellingCalendar />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/account" element={<Account />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppStateProvider>
  );
}
