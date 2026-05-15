import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy, Timestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Plus, 
  Truck, 
  Calendar, 
  Search,
  Package,
  History,
  X
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

export default function Purchases({ userProfile }: { userProfile: any }) {
  const { t } = useTranslation();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    supplierId: '',
    productId: '',
    quantity: 0,
    buyPrice: 0,
    totalAmount: 0,
    dueAmount: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'purchases'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      setPurchases(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      const pSnap = await getDocs(collection(db, 'products'));
      setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'purchases');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || formData.quantity <= 0) return;

    try {
      // 1. Record Purchase
      await addDoc(collection(db, 'purchases'), {
        ...formData,
        timestamp: Timestamp.now(),
        branchId: userProfile?.branchId || 'main'
      });

      // 2. Update stock and buy price in products
      const prodRef = doc(db, 'products', formData.productId);
      await updateDoc(prodRef, {
        stockQuantity: increment(formData.quantity),
        buyPrice: formData.buyPrice
      });

      setIsModalOpen(false);
      setFormData({ supplierId: '', productId: '', quantity: 0, buyPrice: 0, totalAmount: 0, dueAmount: 0 });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'purchases');
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Purchase Management</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <Plus size={20} />
          New Purchase
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {purchases.map((purchase) => (
          <div key={purchase.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Truck size={24} />
            </div>
            <div className="flex-1">
              <div className="font-bold">Purchase #{purchase.id.slice(-6)}</div>
              <div className="text-xs text-gray-400">
                {purchase.timestamp?.toDate().toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">{formatCurrency(purchase.totalAmount)}</div>
              <div className="text-[10px] text-gray-400 uppercase font-bold">Total Bill</div>
            </div>
          </div>
        ))}
        {purchases.length === 0 && <div className="text-center py-20 text-gray-400 border border-dashed rounded-3xl">No purchases recorded.</div>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold">Stock Purchase</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Product</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  value={formData.productId}
                  onChange={(e) => {
                    const p = products.find(prod => prod.id === e.target.value);
                    setFormData({ ...formData, productId: e.target.value, buyPrice: p?.buyPrice || 0 });
                  }}
                >
                  <option value="">Select Product...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</label>
                  <input 
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value), totalAmount: Number(e.target.value) * formData.buyPrice })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Buy Price (Unit)</label>
                  <input 
                    type="number"
                    value={formData.buyPrice}
                    onChange={(e) => setFormData({ ...formData, buyPrice: Number(e.target.value), totalAmount: formData.quantity * Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl flex justify-between items-center">
                 <div className="text-sm font-bold text-indigo-600">Total Amount:</div>
                 <div className="text-xl font-black text-indigo-700">{formatCurrency(formData.totalAmount)}</div>
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-100">
                Confirm Purchase
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
