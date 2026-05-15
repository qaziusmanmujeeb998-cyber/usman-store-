import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy, Timestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Plus, 
  Receipt, 
  Calendar, 
  Tag, 
  DollarSign,
  Search,
  Filter,
  X
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export default function Expenses({ userProfile }: { userProfile: any }) {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    amount: 0,
    description: '',
    category: 'Utilities',
    branchId: userProfile?.branchId || 'main'
  });

  const fetchExpenses = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      let q;
      if (userProfile.role === 'Admin') {
        q = query(collection(db, 'expenses'), orderBy('timestamp', 'desc'));
      } else {
        q = query(collection(db, 'expenses'), where('branchId', '==', userProfile.branchId), orderBy('timestamp', 'desc'));
      }
      const snap = await getDocs(q);
      setExpenses(snap.docs.map(d => ({ id: d.id, ...(d.data() as object) })));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'expenses');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'expenses'), {
        ...formData,
        timestamp: Timestamp.now()
      });
      setIsModalOpen(false);
      setFormData({ amount: 0, description: '', category: 'Utilities', branchId: userProfile?.branchId || 'main' });
      fetchExpenses();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
    }
  };

  const categories = ['Utilities', 'Rent', 'Salary', 'Maintenance', 'Marketing', 'Taxes', 'Others'];

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
           <h2 className="text-2xl font-bold">Expense Control</h2>
           <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-xs font-bold">
             Monthly: {formatCurrency(expenses.reduce((a, b) => a + b.amount, 0))}
           </span>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          Record Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Active Filters */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Categories</label>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button key={cat} className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-between group">
                    <span>{cat}</span>
                    <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100">View</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Expense List */}
        <div className="lg:col-span-3 space-y-4">
          {expenses.map((expense) => (
            <div key={expense.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-all">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                <Receipt size={28} />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex items-center gap-2 mb-1">
                   <h3 className="font-bold text-lg truncate">{expense.description}</h3>
                   <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                     {expense.category}
                   </span>
                 </div>
                 <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {expense.timestamp?.toDate().toLocaleDateString()}
                    </div>
                    <div>ID: {expense.id.slice(-6)}</div>
                 </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-rose-600">{formatCurrency(expense.amount)}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase">Debited</div>
              </div>
            </div>
          ))}

          {expenses.length === 0 && (
            <div className="bg-white p-20 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
               <DollarSign size={48} className="mx-auto mb-4 opacity-10" />
               <p>No expenses recorded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xl font-bold">New Expense Record</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Amount (PKR)</label>
                <div className="relative">
                   <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                   <input 
                    required
                    type="number" 
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-lg"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                <input 
                  required
                  type="text" 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. Electricity Bill August"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="pt-6">
                <button 
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
