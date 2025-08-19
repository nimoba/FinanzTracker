import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  ArrowUpDown, 
  PieChart,
  Target,
  Settings,
  LogOut 
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const Layout: React.FC = () => {
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Dashboard' },
    { to: '/accounts', icon: CreditCard, label: 'Accounts' },
    { to: '/transactions', icon: ArrowUpDown, label: 'Transactions' },
    { to: '/analytics', icon: PieChart, label: 'Analytics' },
    { to: '/goals', icon: Target, label: 'Goals' },
  ];

  return (
    <div className="min-h-screen bg-dark-800 flex">
      {/* Sidebar */}
      <div className="w-64 bg-dark-secondary shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-dark-primary">FinanceFlow</h1>
        </div>
        
        <nav className="mt-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center px-6 py-3 text-dark-muted hover:text-dark-primary hover:bg-dark-accent transition-colors ${
                  isActive ? 'text-dark-primary bg-dark-accent border-r-2 border-blue-500' : ''
                }`
              }
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-6">
          <div className="space-y-2">
            <button className="flex items-center w-full px-3 py-2 text-dark-muted hover:text-dark-primary transition-colors">
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-2 text-dark-muted hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};