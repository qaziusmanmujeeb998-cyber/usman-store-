import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc, Timestamp, doc, updateDoc, increment, limit } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  Printer, 
  Share2,
  X,
  Package,
  ShoppingCart
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { handleFirestoreError, OperationType } from '../lib/error-handler';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode: string;
}

export default function POS({ userProfile }: { userProfile: any }) {
  const { t, i18n } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
  });

  const searchProducts = async (term: string) => {
    try {
      if (!term) {
        const q = query(collection(db, 'products'), limit(10));
        const snap = await getDocs(q);
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        return;
      }
      const q = query(
        collection(db, 'products'),
        where('name', '>=', term),
        where('name', '<=', term + '\uf8ff')
      );
      const snap = await getDocs(q);
      
      // Also check barcode
      const q2 = query(collection(db, 'products'), where('barcode', '==', term));
      const snap2 = await getDocs(q2);
      
      const combined = [...snap.docs, ...snap2.docs].map(d => ({ id: d.id, ...d.data() }));
      // filter duplicates
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setProducts(unique);

      // If barcode exact match found, add to cart automatically
      if (snap2.docs.length === 1) {
         const prod = { id: snap2.docs[0].id, ...snap2.docs[0].data() } as any;
         addToCart(prod);
         setSearchTerm('');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'products');
    }
  };

  useEffect(() => {
    searchProducts('');
  }, []);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: product.sellPrice, quantity: 1, barcode: product.barcode }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal - discount;

  const handleCheckout = async () => {
    if (cart.length === 0 || !userProfile) return;
    
    try {
      const saleData = {
        totalAmount: total,
        discount,
        paymentMethod,
        timestamp: Timestamp.now(),
        branchId: userProfile.branchId || 'main',
        cashierId: auth.currentUser?.uid,
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }))
      };

      const docRef = await addDoc(collection(db, 'sales'), saleData);
      
      // Update inventory
      for (const item of cart) {
        const prodRef = doc(db, 'products', item.id);
        await updateDoc(prodRef, {
          stockQuantity: increment(-item.quantity)
        });
      }

      setLastSaleId(docRef.id);
      setIsCheckoutModalOpen(true);
      setCart([]);
      setDiscount(0);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales');
      alert("Checkout failed. Check inventory levels.");
    }
  };

  const shareWhatsApp = () => {
    const text = `Sale Receipt from Asan Store\nID: ${lastSaleId}\nTotal: ${formatCurrency(total)}\nThank you!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Product Selection */}
      <div className="flex-1 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              searchProducts(e.target.value);
            }}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left flex flex-col h-full active:scale-95"
            >
              <div className="w-full aspect-square bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-gray-300">
                 <Package size={40} />
              </div>
              <div className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</div>
              <div className="mt-auto flex items-center justify-between">
                <div className="text-indigo-600 font-bold">{formatCurrency(product.sellPrice)}</div>
                <div className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500">Stock: {product.stockQuantity}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart sidebar */}
      <div className="w-full lg:w-[400px] bg-white rounded-3xl border border-gray-200 shadow-xl flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-xl flex items-center gap-2">
             <ShoppingCart className="text-indigo-600" />
             Cart
          </h3>
          <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
            {cart.reduce((a,b) => a + b.quantity, 0)} Items
          </span>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl group">
               <div className="flex-1">
                 <div className="font-semibold text-sm">{item.name}</div>
                 <div className="text-xs text-gray-500">{formatCurrency(item.price)}</div>
               </div>
               <div className="flex items-center gap-3 bg-white px-2 py-1 rounded-xl shadow-sm border border-gray-100">
                 <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-indigo-600"><Minus size={14} /></button>
                 <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                 <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-indigo-600"><Plus size={14} /></button>
               </div>
               <div className="font-bold text-sm min-w-[60px] text-right">
                 {formatCurrency(item.price * item.quantity)}
               </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
               <ShoppingCart size={48} className="mb-4 opacity-20" />
               <p>Cart is empty</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Discount</span>
            <input 
              type="number" 
              value={discount} 
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-20 text-right bg-white border border-gray-200 rounded px-2 outline-none focus:ring-1 ring-indigo-500"
            />
          </div>
          <div className="flex items-center justify-between text-xl font-bold pt-2 border-t border-gray-200">
            <span>Total</span>
            <span className="text-indigo-600">{formatCurrency(total)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <button 
              onClick={() => setPaymentMethod('cash')}
              className={cn(
                "py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all",
                paymentMethod === 'cash' ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
              )}
            >
              <Banknote size={20} />
              <span className="text-xs font-bold">Cash</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('card')}
              className={cn(
                "py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all",
                paymentMethod === 'card' ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
              )}
            >
              <CreditCard size={20} />
              <span className="text-xs font-bold">Card</span>
            </button>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={handleCheckout}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:opacity-50 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-100 transition-all active:scale-95"
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Checkout Success Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden animate-in zoom-in duration-300">
             <div className="p-6 text-center space-y-4">
               <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                 <Plus size={32} />
               </div>
               <h3 className="text-2xl font-bold">Sale Successful!</h3>
               <p className="text-gray-500">Transaction #{lastSaleId?.slice(-6)} has been recorded.</p>
               
               <div className="grid grid-cols-2 gap-4 pt-4">
                 <button 
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold transition-all"
                 >
                   <Printer size={18} /> Print
                 </button>
                 <button 
                  onClick={shareWhatsApp}
                  className="flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-semibold transition-all"
                 >
                   <Share2 size={18} /> Share
                 </button>
               </div>
               
               <button 
                onClick={() => setIsCheckoutModalOpen(false)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-100 transition-all mt-4"
               >
                 Close
               </button>
             </div>
             
             {/* Invisible Receipt for Printing */}
             <div className="hidden">
               <div ref={receiptRef} className="p-8 font-sans" dir={i18n.language === 'ur' ? 'rtl' : 'ltr'}>
                 <div className="text-center mb-6">
                   <h1 className="text-xl font-bold">Asan Store</h1>
                   <p className="text-sm">Main Branch, City Center</p>
                   <p className="text-xs">Phone: 0300-1234567</p>
                 </div>
                 <hr className="mb-4 border-dashed" />
                 <div className="flex justify-between text-xs mb-4">
                   <span>Date: {new Date().toLocaleString()}</span>
                   <span>Sale ID: {lastSaleId?.slice(-6)}</span>
                 </div>
                 <table className="w-full text-xs space-y-2">
                   <thead>
                     <tr className="border-b border-dashed">
                       <th className="text-left py-2">Item</th>
                       <th className="text-center py-2">Qty</th>
                       <th className="text-right py-2">Price</th>
                     </tr>
                   </thead>
                   <tbody>
                     {cart.map(item => (
                       <tr key={item.id}>
                         <td className="py-2">{item.name}</td>
                         <td className="text-center py-2">{item.quantity}</td>
                         <td className="text-right py-2">{formatCurrency(item.price * item.quantity)}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 <hr className="my-4 border-dashed" />
                 <div className="space-y-1 text-sm font-bold">
                   <div className="flex justify-between">
                     <span>Subtotal</span>
                     <span>{formatCurrency(subtotal)}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Discount</span>
                     <span>-{formatCurrency(discount)}</span>
                   </div>
                   <div className="flex justify-between text-lg border-t border-dashed mt-2 pt-2">
                     <span>Total</span>
                     <span>{formatCurrency(total)}</span>
                   </div>
                 </div>
                 <div className="text-center mt-8 space-y-2">
                   <p className="text-xs">Thank you for shopping with us!</p>
                   <p className="text-xs font-urdu">تشریف لانے کا شکریہ!</p>
                   <div className="flex justify-center mt-4">
                      {/* Barcode placeholder */}
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
