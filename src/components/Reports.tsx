import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  FileText, 
  Download, 
  BarChart, 
  PieChart, 
  TrendingDown, 
  TrendingUp,
  Calendar
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie
} from 'recharts';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export default function Reports({ userProfile }: { userProfile: any }) {
  const { t } = useTranslation();
  const [salesData, setSalesData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!userProfile) return;
      try {
        let salesQ;
        let expenseQ;
        
        if (userProfile.role === 'Admin') {
          salesQ = query(collection(db, 'sales'), orderBy('timestamp', 'desc'));
          expenseQ = query(collection(db, 'expenses'), orderBy('timestamp', 'desc'));
        } else {
          salesQ = query(collection(db, 'sales'), where('branchId', '==', userProfile.branchId), orderBy('timestamp', 'desc'));
          expenseQ = query(collection(db, 'expenses'), where('branchId', '==', userProfile.branchId), orderBy('timestamp', 'desc'));
        }

        const salesSnap = await getDocs(salesQ);
        const expensesSnap = await getDocs(expenseQ);
        
        setSalesData(salesSnap.docs.map(d => ({ id: d.id, ...(d.data() as object) })));
        setExpenseData(expensesSnap.docs.map(d => ({ id: d.id, ...(d.data() as object) })));
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'reports');
        setLoading(false);
      }
    }
    fetchData();
  }, [userProfile]);

  const totalSales = salesData.reduce((a, b) => a + b.totalAmount, 0);
  const totalExpenses = expenseData.reduce((a, b) => a + b.amount, 0);
  const netProfit = totalSales - totalExpenses - (totalSales * 0.6); // Simplified COGS

  const chartData = [
    { name: 'Revenue', value: totalSales, fill: '#6366f1' },
    { name: 'Expenses', value: totalExpenses, fill: '#f43f5e' },
    { name: 'Net Profit', value: netProfit, fill: '#10b981' },
  ];

  const categoryData = [
    { name: 'Grocery', value: 400 },
    { name: 'Dairy', value: 300 },
    { name: 'Cosmetics', value: 300 },
    { name: 'Utilities', value: 200 },
  ];

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Business Intelligence</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
            <Download size={16} /> Export PDF
          </button>
          <button className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
           <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total revenue</div>
           <div className="text-3xl font-black text-gray-900 mb-4">{formatCurrency(totalSales)}</div>
           <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold">
             <TrendingUp size={14} /> +12% from last month
           </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
           <div className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total Expenses</div>
           <div className="text-3xl font-black text-rose-600 mb-4">{formatCurrency(totalExpenses)}</div>
           <div className="flex items-center gap-1 text-rose-500 text-xs font-bold">
             <TrendingDown size={14} /> +5% from last month
           </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-indigo-100 bg-indigo-50/30 shadow-sm">
           <div className="text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2">Estimated Net Profit</div>
           <div className="text-3xl font-black text-indigo-700 mb-4">{formatCurrency(netProfit)}</div>
           <div className="flex items-center gap-1 text-indigo-500 text-xs font-bold">
             <TrendingUp size={14} /> Growing steadily
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Performance Chart */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-xl">Financial Overview</h3>
            <BarChart className="text-gray-400" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Share */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-xl">Sales by Category</h3>
            <PieChart className="text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-[300px]">
             <div className="h-full w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <RePieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                 </RePieChart>
               </ResponsiveContainer>
             </div>
             <div className="space-y-4">
                {categoryData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-sm font-medium text-gray-600">{entry.name}</span>
                     </div>
                     <span className="text-sm font-bold">{entry.value} Sales</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Detailed Stock Report Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-bold text-xl">Inventory Status Report</h3>
            <span className="text-xs text-gray-400">Automatic Backup: ON</span>
         </div>
         <div className="overflow-x-auto">
           <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                   <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Report Type</th>
                   <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date Generated</th>
                   <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                   <th className="px-8 py-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                <ReportRow type="Full Stock Report" date="2024-05-10" status="Ready" />
                <ReportRow type="Supplier Due List" date="2024-05-09" status="Ready" />
                <ReportRow type="Expiry Date Alert" date="2024-05-08" status="Needs Action" warning />
                <ReportRow type="Daily Summary" date="2024-05-07" status="Ready" />
              </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}

function ReportRow({ type, date, status, warning }: any) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
       <td className="px-8 py-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <FileText size={20} />
             </div>
             <span className="font-bold text-gray-900">{type}</span>
          </div>
       </td>
       <td className="px-8 py-6 text-gray-500 font-medium">{date}</td>
       <td className="px-8 py-6">
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
            warning ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
          )}>
            {status}
          </span>
       </td>
       <td className="px-8 py-6 text-right">
          <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-gray-100 shadow-none hover:shadow-sm transition-all">
             <Download size={18} />
          </button>
       </td>
    </tr>
  );
}
