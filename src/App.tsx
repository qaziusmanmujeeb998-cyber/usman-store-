import { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  ReceiptPoundSterling, 
  BarChart3, 
  Settings, 
  Globe,
  Truck,
  Menu,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import './i18n';

// Screens
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Products from './components/Products';
import Customers from './components/Customers';
import Expenses from './components/Expenses';
import Reports from './components/Reports';
import Purchases from './components/Purchases';
import SettingsScreen from './components/Settings';

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Static profile to bypass login system
  const userProfile = {
    name: 'Admin User',
    email: 'admin@asanstore.com',
    role: 'Admin',
    branchId: 'main'
  };

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'en' ? 'ur' : 'en';
    i18n.changeLanguage(nextLng);
    document.body.dir = nextLng === 'ur' ? 'rtl' : 'ltr';
  };

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'pos', label: t('pos'), icon: ShoppingCart },
    { id: 'products', label: t('products'), icon: Package },
    { id: 'purchases', label: t('purchases'), icon: Truck },
    { id: 'customers', label: t('customers'), icon: Users },
    { id: 'expenses', label: t('expenses'), icon: ReceiptPoundSterling },
    { id: 'reports', label: t('reports'), icon: BarChart3 },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: i18n.language === 'ur' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: i18n.language === 'ur' ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 bottom-0 w-72 bg-white z-50 lg:hidden flex flex-col ${
                i18n.language === 'ur' ? 'right-0' : 'left-0'
              }`}
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <Package className="text-white w-5 h-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Asan Store</span>
                  </div>
                  <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>
                <nav className="space-y-1 flex-1 overflow-y-auto">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveScreen(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                        activeScreen === item.id 
                          ? 'bg-indigo-50 text-indigo-600 font-medium' 
                          : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-6 h-6" />
                      <span className="text-lg">{item.label}</span>
                    </button>
                  ))}
                </nav>
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <button 
                    onClick={toggleLanguage}
                    className="w-full flex items-center gap-3 px-4 py-4 text-gray-500 hover:bg-gray-50 rounded-xl transition-all text-lg"
                  >
                    <Globe className="w-6 h-6" />
                    {i18n.language === 'en' ? 'اردو (Urdu)' : 'English'}
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden lg:flex">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Package className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Asan Store</span>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveScreen(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeScreen === item.id 
                    ? 'bg-indigo-50 text-indigo-600 font-medium' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-gray-100">
          <button 
            onClick={toggleLanguage}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl transition-all"
          >
            <Globe className="w-5 h-5" />
            {i18n.language === 'en' ? 'اردو (Urdu)' : 'English'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
         {/* Top Header */}
         <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
               id="mobile-menu-toggle"
             >
               <Menu className="w-6 h-6 text-gray-600" />
             </button>
             <h2 className="text-lg font-semibold">{navItems.find(n => n.id === activeScreen)?.label}</h2>
           </div>
           <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <div className="text-sm font-medium">{userProfile.name}</div>
               <div className="text-xs text-gray-500">{userProfile.role}</div>
             </div>
             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
               {userProfile.name.charAt(0)}
             </div>
           </div>
         </header>

         {/* Screen Container */}
         <div className="flex-1 overflow-auto p-4 lg:p-6">
           {activeScreen === 'dashboard' && <Dashboard userProfile={userProfile} />}
           {activeScreen === 'pos' && <POS userProfile={userProfile} />}
           {activeScreen === 'products' && <Products userProfile={userProfile} />}
           {activeScreen === 'purchases' && <Purchases userProfile={userProfile} />}
           {activeScreen === 'customers' && <Customers userProfile={userProfile} />}
           {activeScreen === 'expenses' && <Expenses userProfile={userProfile} />}
           {activeScreen === 'reports' && <Reports userProfile={userProfile} />}
           {activeScreen === 'settings' && <SettingsScreen userProfile={userProfile} />}
         </div>
      </main>
    </div>
  );
}
