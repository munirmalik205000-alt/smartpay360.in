
import React, { useState } from 'react';
import { User, Product, Order } from '../types';
import { ShoppingBag, Package, TrendingUp, Plus, CheckCircle2, Truck, AlertCircle, ShoppingCart, IndianRupee } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../services/utils';

interface VendorProps {
  user: User;
  products: Product[];
  orders: Order[];
  onAddProduct: (p: Product) => void;
}

const VendorPanel: React.FC<VendorProps> = ({ user, products, orders, onAddProduct }) => {
  const vendorProducts = products.filter(p => p.vendorId === user.id || p.vendorName === user.name);
  const vendorOrders = orders.filter(o => o.vendorId === user.id);
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    category: 'Electronics',
    image: '📦',
    stock: 100,
    mrp: 0,
    price: 0,
    mlmPoints: 10,
    name: '',
    description: ''
  });

  const stats = [
    { label: 'Merchant wallet', val: `₹${(user.wallets.vendor || 0).toFixed(2)}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Catalog Assets', val: vendorProducts.length.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Assigned orders', val: vendorOrders.length.toString(), icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Vendor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Merchant Workspace</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Multi-Vendor Products & Delivery Pipeline</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-1">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", s.bg)}>
              <s.icon size={24} className={s.color} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className={cn("text-2xl font-black tracking-tight", s.color)}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Product Form */}
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
              <Plus size={20} />
            </div>
            Publish Store Product
          </h3>
          <form className="space-y-4 text-xs font-semibold" onSubmit={(e) => {
            e.preventDefault();
            const price = parseFloat(newProduct.price as any) || 0;
            const mrp = parseFloat(newProduct.mrp as any) || price * 1.25;
            onAddProduct({ 
              ...newProduct, 
              id: `PRD${Date.now()}`, 
              vendorId: user.id,
              vendorName: user.name,
              price,
              mrp,
              stock: parseInt(newProduct.stock as any) || 10,
              mlmPoints: parseInt(newProduct.mlmPoints as any) || 10
            } as Product);
            alert('Product listed successfully to SMARTPAY360 catalog!');
          }}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Product Name</label>
                 <input type="text" placeholder="e.g. Realme Smartwatch" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
               </div>
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Central Category</label>
                 <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl bg-white text-slate-800" onChange={e => setNewProduct({...newProduct, category: e.target.value as any})} required>
                     {['Electronics', 'Mobile', 'Fashion', 'Grocery', 'Healthcare', 'Home Appliances', 'Beauty', 'Books'].map(cat => (
                       <option key={cat} value={cat}>{cat}</option>
                     ))}
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deal Price (₹)</label>
                 <input type="number" placeholder="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} required />
               </div>
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Original MRP (₹)</label>
                 <input type="number" placeholder="0" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" onChange={e => setNewProduct({...newProduct, mrp: parseFloat(e.target.value)})} required />
               </div>
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MLM Reward BV Points</label>
                 <input type="number" placeholder="10" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" onChange={e => setNewProduct({...newProduct, mlmPoints: parseInt(e.target.value)})} required />
               </div>
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Inventory stock</label>
                 <input type="number" placeholder="100" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} required />
               </div>
             </div>
             <div className="space-y-1">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ecom Description</label>
               <textarea placeholder="Product warranty and detail parameters..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl h-24" onChange={e => setNewProduct({...newProduct, description: e.target.value})} required></textarea>
             </div>
             <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">
                Publish Asset
              </button>
          </form>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex flex-col">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white">
              <Truck size={20} />
            </div>
            Pending Deliveries
          </h3>
          <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
            {vendorOrders.length > 0 ? vendorOrders.map(o => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                key={o.id} 
                className="p-4 bg-slate-50 border border-slate-100 rounded-[2rem] flex justify-between items-center group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                      {products.find(p => p.id === o.productId)?.image || '📦'}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 text-sm">Order #{o.id.toUpperCase()}</p>
                      <p className="text-[10px] text-[#0077C0] font-bold uppercase tracking-widest">Received value: ₹{o.amount}</p>
                    </div>
                 </div>
                 <button className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-black text-[10px] uppercase tracking-widest">
                    Dispatched
                 </button>
              </motion.div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30 my-auto py-10">
                <ShoppingBag size={48} className="text-slate-200 mb-2" />
                <p className="text-xs font-black text-slate-450 uppercase tracking-widest leading-none">All orders completed</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-[2.5rem] border shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">S360 Inventory Registry</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4">Item Asset</th>
                <th className="px-8 py-4">Sponsor Tag</th>
                <th className="px-8 py-4">Price Value</th>
                <th className="px-8 py-4">S360 Stock</th>
                <th className="px-8 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
              {vendorProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                       <span className="text-3xl">{p.image}</span>
                       <p className="font-black text-slate-800">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">{p.category}</span>
                  </td>
                  <td className="px-8 py-4">
                    <p className="font-black text-slate-900">₹{p.price}</p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="font-black text-slate-500">{p.stock} Units</p>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-green-600 font-black text-[10px] uppercase">
                      <CheckCircle2 size={12} /> Live
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorPanel;
