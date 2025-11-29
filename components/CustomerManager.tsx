
import React, { useState } from 'react';
import { Customer, Invoice } from '../types';
import { Plus, Edit2, Trash2, Mail, Phone, Search, X, User, LayoutGrid, List, FileText, Receipt } from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  invoices?: Invoice[]; // Optional to prevent breaking if not passed immediately
  onAdd: (c: Omit<Customer, 'id'>) => void;
  onEdit: (id: string, c: Partial<Customer>) => void;
  onDelete: (id: string) => void;
}

const COLORS = [
  'bg-purple-100 text-purple-600',
  'bg-blue-100 text-blue-600',
  'bg-emerald-100 text-emerald-600',
  'bg-orange-100 text-orange-600',
  'bg-pink-100 text-pink-600',
  'bg-indigo-100 text-indigo-600',
];

const getRandomColor = (id: string) => {
  const index = id.charCodeAt(id.length - 1) % COLORS.length;
  return COLORS[index];
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const CustomerManager: React.FC<CustomerManagerProps> = ({ customers, invoices = [], onAdd, onEdit, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferences: ''
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', preferences: '' });
    setEditingId(null);
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        preferences: customer.preferences
      });
      setEditingId(customer.id);
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEdit(editingId, formData);
    } else {
      onAdd(formData);
    }
    handleCloseModal();
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get invoices for the customer being edited
  const customerInvoices = editingId ? invoices.filter(inv => inv.customerId === editingId) : [];

  return (
    <div className="w-full h-full bg-slate-50/50 p-6 md:p-10 overflow-y-auto font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">Customers</h1>
            <p className="text-slate-500 mt-2 text-lg">Manage your VIP clients and travelers.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4">
             {/* View Toggle */}
             <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="List View"
                >
                  <List className="w-5 h-5" />
                </button>
             </div>

             {/* Search Bar */}
             <div className="relative group w-full md:w-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-waya-600 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search customers..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 w-full md:w-72 bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-waya-500/20 focus:border-waya-500 transition-all shadow-sm text-slate-900"
                />
             </div>
             
             {/* Add Button */}
             <button 
                onClick={() => handleOpenModal()}
                className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white p-3 md:px-6 md:py-3 rounded-full font-medium transition-all shadow-lg flex items-center justify-center gap-2"
             >
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">Add Customer</span>
             </button>
          </div>
        </div>

        {/* Content Area */}
        {filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">No customers found</h3>
            <p className="text-slate-400 mt-2 max-w-sm">We couldn't find anyone matching your search. Try adding a new customer.</p>
          </div>
        ) : viewMode === 'grid' ? (
          // GRID VIEW
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCustomers.map(customer => (
              <div key={customer.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center relative group">
                
                {/* Actions */}
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                      onClick={() => handleOpenModal(customer)}
                      className="p-2 bg-slate-50 text-slate-600 hover:bg-waya-50 hover:text-waya-600 rounded-full transition-colors border border-slate-200 shadow-sm"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onDelete(customer.id)}
                        className="p-2 bg-slate-50 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors border border-slate-200 shadow-sm"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                {/* Avatar */}
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-inner ${getRandomColor(customer.id)}`}>
                  {getInitials(customer.name)}
                </div>

                {/* Name */}
                <h3 className="font-serif font-bold text-slate-900 text-xl mb-6">{customer.name}</h3>

                {/* Contact Info Pill */}
                <div className="w-full space-y-3 mb-6">
                    <div className="flex items-center justify-center space-x-2 text-sm text-slate-600 bg-slate-50 py-2.5 rounded-xl border border-slate-100">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="truncate max-w-[180px] text-xs font-medium">{customer.email || 'No email'}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-slate-600 bg-slate-50 py-2.5 rounded-xl border border-slate-100">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium">{customer.phone || 'No phone'}</span>
                    </div>
                </div>

                {/* Preferences / Tags */}
                {customer.preferences && (
                  <div className="w-full text-left mt-auto">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Preferences</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {customer.preferences.split(',').slice(0, 3).map((pref, i) => (
                            <span key={i} className="px-3 py-1 bg-white text-slate-600 text-xs font-medium rounded-full border border-slate-200 shadow-sm">
                                {pref.trim()}
                            </span>
                        ))}
                         {customer.preferences.split(',').length > 3 && (
                            <span className="px-2 py-1 text-slate-400 text-xs font-medium">
                                +{customer.preferences.split(',').length - 3}
                            </span>
                        )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          // LIST VIEW
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                   <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-400 font-bold">
                         <th className="py-4 px-6">Customer</th>
                         <th className="py-4 px-6">Contact</th>
                         <th className="py-4 px-6">Preferences</th>
                         <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredCustomers.map(customer => (
                         <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="py-4 px-6">
                               <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${getRandomColor(customer.id)}`}>
                                     {getInitials(customer.name)}
                                  </div>
                                  <span className="font-bold text-slate-900">{customer.name}</span>
                               </div>
                            </td>
                            <td className="py-4 px-6">
                               <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                     <Mail className="w-3 h-3 text-slate-400" /> {customer.email}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-slate-600">
                                     <Phone className="w-3 h-3 text-slate-400" /> {customer.phone}
                                  </div>
                               </div>
                            </td>
                            <td className="py-4 px-6">
                               <div className="flex flex-wrap gap-1">
                                  {customer.preferences.split(',').slice(0, 2).map((pref, i) => (
                                     <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded border border-slate-200">
                                        {pref.trim()}
                                     </span>
                                  ))}
                                  {customer.preferences.split(',').length > 2 && (
                                     <span className="text-xs text-slate-400 pl-1">...</span>
                                  )}
                               </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                               <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleOpenModal(customer)} className="p-2 text-slate-400 hover:text-waya-600 hover:bg-waya-50 rounded-lg transition-colors">
                                     <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => onDelete(customer.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </div>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="relative h-32 bg-gradient-to-r from-waya-500 to-indigo-600 flex-shrink-0">
                <button 
                    onClick={handleCloseModal} 
                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-md transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                    <div className="w-20 h-20 bg-white rounded-full p-1 shadow-lg">
                        <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center">
                            <User className="w-8 h-8 text-slate-400" />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="pt-12 pb-8 px-8 overflow-y-auto">
                <h2 className="text-2xl font-serif font-bold text-slate-900 text-center mb-6">
                    {editingId ? 'Edit Customer' : 'New Customer'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-waya-500/20 focus:border-waya-500 outline-none transition-all font-medium text-slate-900"
                                placeholder="e.g. Jane Doe"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-waya-500/20 focus:border-waya-500 outline-none transition-all text-sm text-slate-900"
                                    placeholder="jane@example.com"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Phone</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-waya-500/20 focus:border-waya-500 outline-none transition-all text-sm text-slate-900"
                                    placeholder="+1 (555) ..."
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Preferences & Tags</label>
                        <textarea
                            value={formData.preferences}
                            onChange={(e) => setFormData({...formData, preferences: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-waya-500/20 focus:border-waya-500 outline-none transition-all min-h-[80px] text-sm resize-none text-slate-900"
                            placeholder="Separate with commas (e.g. Vegetarian, Aisle Seat, Luxury)"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full py-3.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-bold shadow-lg flex justify-center items-center"
                        >
                            {editingId ? 'Save Changes' : 'Create Customer'}
                        </button>
                    </div>
                </form>

                {/* INVOICE HISTORY SECTION */}
                {editingId && customerInvoices.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center">
                            <Receipt className="w-4 h-4 mr-2" /> Recent Invoices
                        </h3>
                        <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                            {customerInvoices.map(inv => {
                                const total = inv.items.reduce((acc, item) => {
                                    const line = item.qty * item.rate;
                                    // Calc based on Rate %
                                    const tax = line * ((item.igstRate||0) + (item.cgstRate||0) + (item.sgstRate||0)) / 100;
                                    return acc + line + tax;
                                }, 0);
                                return (
                                <div key={inv.id} className="flex justify-between items-center p-3 border-b border-slate-100 last:border-0 hover:bg-white transition-colors">
                                    <div>
                                        <div className="text-xs font-bold text-slate-700">{inv.invoiceNumber}</div>
                                        <div className="text-[10px] text-slate-500">{inv.date}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-slate-900">₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                        <div className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                                            {inv.status}
                                        </div>
                                    </div>
                                </div>
                            )})}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;
