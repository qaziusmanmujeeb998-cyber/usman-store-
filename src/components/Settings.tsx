import React, { useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export default function Settings({ userProfile }: { userProfile: any }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const seedData = async () => {
    if (!confirm('This will add sample products and categories. Continue?')) return;
    setLoading(true);
    setStatus(null);
    
    try {
      const products = [
        { name: 'Fresh Milk 1L', buyPrice: 120, sellPrice: 150, stockQuantity: 50, category: 'Dairy', barcode: '890123456701', branchId: 'main' },
        { name: 'White Bread', buyPrice: 40, sellPrice: 60, stockQuantity: 30, category: 'Bakery', barcode: '890123456702', branchId: 'main' },
        { name: 'Brown Eggs (12pk)', buyPrice: 180, sellPrice: 220, stockQuantity: 20, category: 'Eggs', barcode: '890123456703', branchId: 'main' },
        { name: 'Organic Yogurt', buyPrice: 80, sellPrice: 110, stockQuantity: 15, category: 'Dairy', barcode: '890123456704', branchId: 'main' },
        { name: 'Apple Juice 500ml', buyPrice: 90, sellPrice: 130, stockQuantity: 40, category: 'Beverages', barcode: '890123456705', branchId: 'main' },
      ];

      const batch = writeBatch(db);
      for (const p of products) {
        const docRef = doc(collection(db, 'products'));
        batch.set(docRef, p);
      }
      
      await batch.commit();
      setStatus({ type: 'success', message: 'Sample data added successfully!' });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'products');
      setStatus({ type: 'error', message: 'Failed to seed data. Check permissions.' });
    }
    setLoading(false);
  };

  const clearData = async () => {
    if (!confirm('WARNING: This will delete ALL products! Are you sure?')) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setStatus({ type: 'success', message: 'All products cleared.' });
    } catch (e) {
      console.error(e);
      setStatus({ type: 'error', message: 'Failed to clear data.' });
    }
    setLoading(false);
  };

  if (userProfile?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
        <AlertCircle size={48} className="text-amber-500" />
        <p className="text-xl font-bold">Access Restricted</p>
        <p>Only Administrators can access system settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
          <SettingsIcon size={24} />
        </div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">System Settings</h2>
      </div>

      {status && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
          status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-bold">{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Management Card */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Database size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Database Tools</h3>
              <p className="text-sm text-gray-400">Initialize or reset your store data</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={seedData}
              disabled={loading}
              className="w-full flex items-center justify-between p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50 group"
            >
              <div className="flex items-center gap-3">
                <RefreshCw size={20} className={loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                <span>Seed Sample Products</span>
              </div>
            </button>

            <button
              onClick={clearData}
              disabled={loading}
              className="w-full flex items-center justify-between p-4 bg-white border-2 border-red-100 text-red-600 hover:bg-red-50 rounded-2xl font-bold transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <Trash2 size={20} />
                <span>Clear All Products</span>
              </div>
            </button>
          </div>
        </div>

        {/* Branch Info Card */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <RefreshCw size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Branch Info</h3>
              <p className="text-sm text-gray-400">Current configuration</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-50">
              <span className="text-gray-500">Current Branch</span>
              <span className="font-bold text-indigo-600">{userProfile?.branchId || 'main'}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-50">
              <span className="text-gray-500">Your Role</span>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-wider">
                {userProfile?.role}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
