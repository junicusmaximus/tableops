import { Outlet } from 'react-router-dom';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNav from './MobileBottomNav';
import TopHeader from './TopHeader';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <DesktopSidebar />
      <div className="lg:pl-64">
        <TopHeader />
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default AppLayout;
