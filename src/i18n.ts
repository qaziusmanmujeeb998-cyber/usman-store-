import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      dashboard: 'Dashboard',
      products: 'Products',
      sales: 'Sales',
      inventory: 'Inventory',
      customers: 'Customers',
      reports: 'Reports',
      settings: 'Settings',
      pos: 'POS',
      add_product: 'Add Product',
      stock: 'Stock',
      price: 'Price',
      total_sales: "Today's Sales",
      profit: 'Profit',
      low_stock: 'Low Stock',
      recent_sales: 'Recent Sales',
      search: 'Search...',
      checkout: 'Checkout',
      customer: 'Customer',
      payment: 'Payment',
      cash: 'Cash',
      card: 'Card',
      discount: 'Discount',
      tax: 'Tax',
      total: 'Total',
      print: 'Print Receipt',
      language: 'Language',
      expenses: 'Expenses',
      purchases: 'Purchases',
      urdu: 'Urdu',
      english: 'English',
      logout: 'Logout'
    }
  },
  ur: {
    translation: {
      dashboard: 'ڈیش بورڈ',
      products: 'پراڈکٹس',
      sales: 'فروخت',
      inventory: 'انوینٹری',
      customers: 'کسٹمرز',
      reports: 'رپورٹس',
      settings: 'سیٹنگز',
      pos: 'پوائنٹ آف سیل',
      add_product: 'پراڈکٹ شامل کریں',
      stock: 'سٹاک',
      price: 'قیمت',
      total_sales: 'آج کی فروخت',
      profit: 'منافع',
      low_stock: 'کم سٹاک',
      recent_sales: 'حالیہ فروخت',
      search: 'تلاش کریں...',
      checkout: 'چیک آؤٹ',
      customer: 'گاہک',
      payment: 'ادائیگی',
      cash: 'نقد',
      card: 'کارڈ',
      discount: 'رعایت',
      tax: 'ٹیکس',
      total: 'کل',
      print: 'رسید پرنٹ کریں',
      language: 'زبان',
      expenses: 'اخراجات',
      purchases: 'خریداری',
      urdu: 'اردو',
      english: 'انگریزی',
      logout: 'لاگ آؤٹ'
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
