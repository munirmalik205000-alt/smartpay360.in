
import React, { useState } from 'react';
import { User, Product, Order } from '../types';

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Vendor Wallet</p>
          <p className="text-3xl font-black text-slate-900">₹{(user.wallets.vendor || 0).toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Active Products</p>
          <p className="text-3xl font-black text-slate-900">{vendorProducts.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border shadow-sm text-center">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total Orders</p>
          <p className="text-3xl font-black text-indigo-600">{vendorOrders.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h3 className="font-bold mb-4">Add New Product</h3>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            onAddProduct({ ...newProduct, id: `PRD${Date.now()}`, vendorId: user.id } as Product);
            alert('Product listed successfully!');
          }}>
             <div className="grid grid-cols-2 gap-4">
               <input type="text" placeholder="Product Name" className="p-2 border rounded-lg text-sm" onChange={e => setNewProduct({...newProduct, name: e.target.value})} required />
               <input type="number" placeholder="Price (₹)" className="p-2 border rounded-lg text-sm" onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} required />
               <input type="number" placeholder="MRP (₹)" className="p-2 border rounded-lg text-sm" onChange={e => setNewProduct({...newProduct, mrp: parseFloat(e.target.value)})} required />
               <input type="number" placeholder="MLM Points (BV)" className="p-2 border rounded-lg text-sm" onChange={e => setNewProduct({...newProduct, mlmPoints: parseInt(e.target.value)})} required />
             </div>
             <textarea placeholder="Description" className="w-full p-2 border rounded-lg text-sm h-24" onChange={e => setNewProduct({...newProduct, description: e.target.value})} required></textarea>
             <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold">List Product</button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm overflow-hidden">
          <h3 className="font-bold mb-4">Pending Deliveries</h3>
          <div className="space-y-3">
            {vendorOrders.length > 0 ? vendorOrders.map(o => (
              <div key={o.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center text-sm">
                 <div>
                   <p className="font-bold">Order #{o.id}</p>
                   <p className="text-xs text-slate-500">Amount: ₹{o.amount}</p>
                 </div>
                 <button className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded font-bold text-xs">MARK SHIPPED</button>
              </div>
            )) : <p className="text-center py-12 text-slate-400">No orders yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPanel;
