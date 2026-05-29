
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
  const vendorProducts = products.filter(p => p.vendorId === user.id);
  const vendorOrders = orders.filter(o => o.vendorId === user.id);
  
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    category: 'Herbal',
    image: '📦',
    stock: 10
  });

  const stats = [
    { label: 'Vendor Wallet', val: `₹${(user.wallets.vendor || 0).toFixed(2)}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Active Products', val: vendorProducts.length.toString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Orders', val: vendorOrders.length.toString(), icon: ShoppingCart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Vendor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Vendor Dashboard</h2>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Manage your products & sales</p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-3 bg-slate-900 text-white text-[10px] font-black rounded-2xl uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center gap-2">
            <TrendingUp size={14} />
            Analytics
          </button>
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
            <p className={cn("text-3xl font-black tracking-tight", s.color)}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Product Form */}
        <div className="bg-white p-10 rounded-[3rem] border shadow-sm">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
              <Plus size={20} />
            </div>
            List New Product
          </h3>
          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault();
            onAddProduct({ ...newProduct, id: `PRD${Date.now()}`, vendorId: user.id } as Product);
            alert('Product listed successfully!');
          }}>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                 <input type="text" placeholder="e.g. Smart Watch" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:border-indigo-600" onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
               </div>
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                 <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:outline-none focus:border-indigo-600" onChange={e => setNewProduct({...newProduct, category: e.target.value})} required>
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Health">Health</option>
                    <option value="Home">Home</option>
                    <option value="Herbal">Herbal</option>
                 </select>
               </div>
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₹)</label>
                 <input type="number" placeholder="0.00" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm focus:outline-none focus:border-indigo-600" onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} required />
               </div>
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MRP (₹)</label>
                 <input type="number" placeholder="0.00" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm focus:outline-none focus:border-indigo-600" onChange={e => setNewProduct({...newProduct, mrp: parseFloat(e.target.value)})} required />
               </div>
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">MLM Points (BV)</label>
                 <input type="number" placeholder="0" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm focus:outline-none focus:border-indigo-600" onChange={e => setNewProduct({...newProduct, mlmPoints: parseInt(e.target.value)})} required />
               </div>
               <div className="space-y-1">
                 <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Quantity</label>
                 <input type="number" placeholder="10" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm focus:outline-none focus:border-indigo-600" onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} required />
               </div>
             </div>
             <div className="space-y-1">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Description</label>
               <textarea placeholder="Describe your product features..." className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-medium text-sm h-32 focus:outline-none focus:border-indigo-600" onChange={e => setNewProduct({...newProduct, description: e.target.value})} required></textarea>
             </div>
             <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-[2rem] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all uppercase tracking-widest text-sm">
                List Product Now
             </button>
          </form>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-10 rounded-[3rem] border shadow-sm flex flex-col">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3">
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
                className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex justify-between items-center group hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all"
              >
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                     {products.find(p => p.id === o.productId)?.image || '📦'}
                   </div>
                   <div>
                     <p className="font-black text-slate-800">Order #{o.id.slice(-6)}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Amount: ₹{o.amount}</p>
                   </div>
                 </div>
                 <button className="px-5 py-2.5 bg-emerald-100 text-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                    Ship Now
                 </button>
              </motion.div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                <ShoppingBag size={64} className="text-slate-200 mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No pending orders</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-[3rem] border shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Your Listed Products</h3>
          <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-400 font-black text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">Product</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Price</th>
                <th className="px-8 py-5">Stock</th>
                <th className="px-8 py-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {vendorProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{p.image}</span>
                      <p className="font-black text-slate-800">{p.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest">{p.category}</span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-black text-slate-900">₹{p.price}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-black text-slate-500">{p.stock} units</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-green-600 font-black text-[10px] uppercase">
                      <CheckCircle2 size={12} /> Active
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
