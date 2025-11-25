import React, { useState } from 'react';
import { Customer } from '../types';
import { Plus, Edit2, Trash2, Mail, Phone, User, Save, X, Search, MapPin } from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  onAdd: (c: Omit<Customer, 'id'>) => void;
  onEdit: (id: string, c: Partial<Customer>) => void;
  onDelete: (id: string) => void;
}

const CustomerManager: React.FC<CustomerManagerProps> = ({ customers, onAdd, onEdit, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="w-full h-full bg-slate-50 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-800">Customer Management</h1>
            <p className="text-slate-500 mt-1">Manage your client profiles and travel preferences</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center space-x-2 bg-waya-600 hover:bg-waya-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg shadow-waya-500/20"
          >
            <Plus className="w-5 h-5" />
            <span>Add Customer</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search customers by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-waya-500 text-slate-700 shadow-sm"
          />
        </div>

        {/* Customer Grid */}
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">No customers found</h3>
            <p className="text-slate-400">Try adjusting your search or add a new customer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.map(customer => (
              <div key={customer.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-waya-400 to-waya-600"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-waya-50 rounded-full flex items-center justify-center text-waya-600 font-bold text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight">{customer.name}</h3>
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Client ID: {customer.id.slice(0,6)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(customer)}
                      className="p-2 text-slate-400 hover:text-waya-600 hover:bg-waya-50 rounded-full transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(customer.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-slate-600">
                    <Mail className="w-4 h-4 mr-3 text-slate-400" />
                    <span className="truncate">{customer.email || 'No email'}</span>
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <Phone className="w-4 h-4 mr-3 text-slate-400" />
                    <span>{customer.phone || 'No phone'}</span>
                  </div>
                </div>

                {customer.preferences && (
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" /> Preferences
                    </p>
                    <p className="text-sm text-slate-700 line-clamp-3 italic">"{customer.preferences}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Customer' : 'Add New Customer'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-waya-500 focus:border-waya-500 outline-none transition-all"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-waya-500 focus:border-waya-500 outline-none transition-all"
                    placeholder="jane@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-waya-500 focus:border-waya-500 outline-none transition-all"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Travel Preferences</label>
                <textarea
                  value={formData.preferences}
                  onChange={(e) => setFormData({...formData, preferences: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-waya-500 focus:border-waya-500 outline-none transition-all min-h-[120px]"
                  placeholder="Vegetarian meal, aisle seat, loves history museums, prefers 5-star hotels..."
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-waya-600 text-white rounded-lg hover:bg-waya-700 transition-colors font-medium flex justify-center items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;