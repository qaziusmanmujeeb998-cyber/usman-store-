import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  Users, 
  DollarSign 
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    todaySales: 0,
    totalProducts: 0,
    lowStock: 0,
    totalProfit: 0,
    totalCustomers: 0
  });
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const productsData = productsSnap.docs.map(d => d.data());
        
        const lowStockCount = productsData.filter((p: any) => p.stockQuantity <= (p.lowStockThreshold || 5)).length;

        // Sales for today
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        const salesQuery = query(
          collection(db, 'sales'),
          where('timestamp', '>=', Timestamp.fromDate(startOfDay))
        );
        const salesSnap = await getDocs(salesQuery);
        let todayTotal = 0;
        salesSnap.forEach(d => {
          todayTotal += d.data().totalAmount;
        });

        const custSnap = await getDocs(collection(db, 'customers'));

        setStats({
          todaySales: todayTotal,
          totalProducts: productsSnap.size,
          lowStock: lowStockCount,
          totalProfit: todayTotal * 0.2, // Placeholder profit calc
          totalCustomers: custSnap.size
        });

        // Recent sales
        const recentQuery = query(collection(db, 'sales'), orderBy('timestamp', 'desc'), limit(5));
        const recentSnap = await getDocs(recentQuery);
        setRecentSales(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const data = [
    { name: 'Mon', sales: 4000 },
    { name: 'Tue', sales: 3000 },
    { name: 'Wed', sales: 2000 },
    { name: 'Thu', sales: 2780 },
    { name: 'Fri', sales: 1890 },
    { name: 'Sat', sales: 2390 },
    { name: 'Sun', sales: 3490 },
  ];

  if (loading) return <div className="h-64 flex items-center justify-center animate-pulse">Loading dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label={t('total_sales')} 
          value={formatCurrency(stats.todaySales)} 
          icon={TrendingUp} 
          color="bg-emerald-500" 
        />
        <StatCard 
          label={t('profit')} 
          value={formatCurrency(stats.totalProfit)} 
          icon={DollarSign} 
          color="bg-indigo-500" 
        />
        <StatCard 
          label={t('total_products')} 
          value={stats.totalProducts.toString()} 
          icon={Package} 
          color="bg-amber-500" 
        />
        <StatCard 
          label={t('low_stock')} 
          value={stats.lowStock.toString()} 
          icon={AlertTriangle} 
          color="bg-rose-500" 
          urgent={stats.lowStock > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg">Sales Analysis</h3>
            <select className="bg-gray-50 border-none text-sm rounded-lg px-3 py-1 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-6">{t('recent_sales')}</h3>
          <div className="space-y-6">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
                  <ShoppingCart size={18} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">Sale #{sale.id.slice(-4)}</div>
                  <div className="text-xs text-gray-500">
                    {sale.timestamp?.toDate().toLocaleTimeString()}
                  </div>
                </div>
                <div className="font-bold text-indigo-600">{formatCurrency(sale.totalAmount)}</div>
              </div>
            ))}
            {recentSales.length === 0 && <div className="text-center text-gray-400 py-12">No sales yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, urgent }: any) {
  return (
    <div className={`p-6 rounded-2xl bg-white border border-gray-100 shadow-sm relative overflow-hidden group`}>
      <div className={`absolute top-0 right-0 p-4 opacity-5 transform group-hover:scale-110 transition-transform`}>
        <Icon size={80} />
      </div>
      <div className="relative z-10">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-${color}/20 text-white`}>
          <Icon size={24} />
        </div>
        <div className="text-gray-500 text-sm font-medium mb-1 uppercase tracking-wider">{label}</div>
        <div className={`text-3xl font-bold ${urgent ? 'text-rose-600 animate-pulse' : 'text-gray-900'}`}>{value}</div>
      </div>
    </div>
  );
}

import { ShoppingCart } from 'lucide-react';
