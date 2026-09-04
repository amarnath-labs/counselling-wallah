import {
  Outlet,
} from 'react-router-dom';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BottomNavigation from '../components/BottomNavigation';
import BetaFeedback from '../components/BetaFeedback';

export default function AppLayout() {
  return (
    <>
      <Navbar />

      <main>
        <Outlet />
      </main>

      <BetaFeedback />

      <BottomNavigation />

      <Footer />
    </>
  );
}