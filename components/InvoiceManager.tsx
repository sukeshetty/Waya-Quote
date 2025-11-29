
import React, { useState, useEffect } from 'react';
import { Invoice, InvoiceItem, Customer } from '../types';
import { Plus, Search, FileText, Calendar, Trash2, Edit2, Download, ChevronLeft, Printer, CheckCircle, ArrowRight, ShoppingBag, Building2, Truck, CreditCard, Banknote, MapPin, Mail, Phone, Hash, Upload, Image as ImageIcon } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface InvoiceManagerProps {
  invoices: Invoice[];
  customers: Customer[];
  onAdd: (inv: Invoice) => void;
  onUpdate: (inv: Invoice) => void;
  onDelete: (id: string) => void;
}

// Number to Words Converter (Simplified for Indian Rupees)
const numberToWords = (price: number): string => {
  const sglDigit = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const dblDigit = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tensPlace = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const handle_tens = (d: number, trial: any) => {
    return tensPlace[d] + " " + trial;
  };
  const handle_ut = (d: number, trial: any) => {
    return sglDigit[d] + " " + trial;
  };
  let str = "";
  // Placeholder logic - production would use a library
  return `Indian Rupee ${price.toFixed(2)} Only`; 
};

// Helper for Status Colors
const getStatusColor = (status: string) => {
    switch (status) {
        case 'Paid': return 'bg-green-100 text-green-700';
        case 'Sent': return 'bg-blue-100 text-blue-700';
        default: return 'bg-slate-100 text-slate-600';
    }
};

const InvoiceManager: React.FC<InvoiceManagerProps> = ({ invoices, customers, onAdd, onUpdate, onDelete }) => {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // Default Seller Info
  const DEFAULT_SELLER = {
    name: "Go Waya Tech Private Limited",
    address: "Karnataka, India",
    gstin: "29AAMCG2995H1ZY",
    contact: "91-9820545272",
    email: "supply@waya.to"
  };

  const createNewInvoice = () => {
    const newInv: Invoice = {
      id: Date.now().toString(),
      invoiceNumber: `INV-${String(invoices.length + 1).padStart(6, '0')}`,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date().toISOString().split('T')[0],
      customerId: '',
      customerName: '',
      customerAddress: '',
      customerGstin: '',
      sellerName: DEFAULT_SELLER.name,
      sellerAddress: DEFAULT_SELLER.address,
      sellerGstin: DEFAULT_SELLER.gstin,
      sellerContact: DEFAULT_SELLER.contact,
      sellerEmail: DEFAULT_SELLER.email,
      placeOfSupply: 'Karnataka (29)',
      items: [
        { id: '1', description: 'Flight Ticket + Visa Booking', particulars: '', hsnSac: '998552', qty: 1, rate: 0, igstRate: 0, cgstRate: 0, sgstRate: 0 }
      ],
      notes: 'Thanks for your business.',
      status: 'Draft'
    };
    setActiveInvoice(newInv);
    setView('editor');
  };

  const handleEdit = (inv: Invoice) => {
    // Ensure data compatibility if switching from old structure
    const updatedItems = inv.items.map(item => ({
        ...item,
        igstRate: item.igstRate ?? 0,
        cgstRate: item.cgstRate ?? 0,
        sgstRate: item.sgstRate ?? 0
    }));
    setActiveInvoice({ ...inv, items: updatedItems });
    setView('editor');
  };

  const handleSave = () => {
    if (!activeInvoice) return;
    
    // Check if exists
    const exists = invoices.find(i => i.id === activeInvoice.id);
    if (exists) {
      onUpdate(activeInvoice);
    } else {
      onAdd(activeInvoice);
    }
    setView('list');
    setActiveInvoice(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm("Are you sure you want to delete this invoice?")) {
        onDelete(id);
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!activeInvoice) return;
    const cust = customers.find(c => c.id === e.target.value);
    if (cust) {
      setActiveInvoice({
        ...activeInvoice,
        customerId: cust.id,
        customerName: cust.name,
        customerAddress: cust.address || '',
        customerGstin: cust.gstin || ''
      });
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    if (!activeInvoice) return;
    const newItems = [...activeInvoice.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setActiveInvoice({ ...activeInvoice, items: newItems });
  };

  const addItem = () => {
    if (!activeInvoice) return;
    setActiveInvoice({
      ...activeInvoice,
      items: [...activeInvoice.items, { id: Date.now().toString(), description: '', particulars: '', hsnSac: '', qty: 1, rate: 0, igstRate: 0, cgstRate: 0, sgstRate: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (!activeInvoice) return;
    const newItems = activeInvoice.items.filter((_, i) => i !== index);
    setActiveInvoice({ ...activeInvoice, items: newItems });
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeInvoice) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setActiveInvoice({ ...activeInvoice, signatureImage: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const calculateTotals = (items: InvoiceItem[]) => {
    let subTotal = 0;
    let totalIGST = 0;
    let totalCGST = 0;
    let totalSGST = 0;

    items.forEach(item => {
      const lineTotal = item.qty * item.rate;
      subTotal += lineTotal;
      // Calculate Tax based on Percentage
      totalIGST += lineTotal * (item.igstRate / 100);
      totalCGST += lineTotal * (item.cgstRate / 100);
      totalSGST += lineTotal * (item.sgstRate / 100);
    });

    const totalTax = totalIGST + totalCGST + totalSGST;
    return { subTotal, totalIGST, totalCGST, totalSGST, totalTax, grandTotal: subTotal + totalTax };
  };

  const downloadInvoicePDF = async () => {
    const element = document.getElementById('invoice-preview-capture');
    if (!element) return;

    try {
        const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${activeInvoice?.invoiceNumber}.pdf`);
    } catch (e) {
        console.error("PDF Gen Error", e);
    }
  };

  // --- VIEWS ---

  if (view === 'list') {
    return (
      <div className="w-full h-full bg-slate-50/50 p-6 md:p-10 overflow-y-auto font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
            <div>
              <h1 className="text-4xl font-serif font-bold text-slate-900 tracking-tight">Invoices</h1>
              <p className="text-slate-500 mt-2 text-lg">Create and manage billing documents.</p>
            </div>
            <button 
                onClick={createNewInvoice}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-full font-medium transition-all shadow-lg flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" />
                <span>New Invoice</span>
            </button>
          </div>

          {/* List Table */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
             {invoices.length === 0 ? (
                 <div className="p-12 text-center text-slate-400">
                     <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                     <p>No invoices created yet.</p>
                 </div>
             ) : (
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-slate-100 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-400 font-bold">
                          <th className="py-4 px-6">Invoice #</th>
                          <th className="py-4 px-6">Date</th>
                          <th className="py-4 px-6">Customer</th>
                          <th className="py-4 px-6 text-right">Amount</th>
                          <th className="py-4 px-6 text-center">Status</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {invoices.map(inv => {
                           const totals = calculateTotals(inv.items);
                           return (
                               <tr key={inv.id} onClick={() => handleEdit(inv)} className="hover:bg-slate-50/80 transition-colors cursor-pointer group">
                                   <td className="py-4 px-6 font-bold text-slate-700">{inv.invoiceNumber}</td>
                                   <td className="py-4 px-6 text-slate-600 text-sm">{inv.date}</td>
                                   <td className="py-4 px-6 text-slate-800 font-medium">{inv.customerName || 'Unknown'}</td>
                                   <td className="py-4 px-6 text-right font-bold text-slate-900">₹{totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                   <td className="py-4 px-6 text-center">
                                       <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(inv.status)}`}>
                                           {inv.status}
                                       </span>
                                   </td>
                                   <td className="py-4 px-6 text-right">
                                       <button onClick={(e) => handleDelete(inv.id, e)} className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                       </button>
                                   </td>
                               </tr>
                           );
                       })}
                    </tbody>
                 </table>
             )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'editor' && activeInvoice) {
    const { subTotal, totalIGST, totalCGST, totalSGST, totalTax, grandTotal } = calculateTotals(activeInvoice.items);
    
    // Determine displayed tax rates for summary labels (take first non-zero or 0)
    const igstRateLabel = activeInvoice.items.find(i => i.igstRate > 0)?.igstRate || 0;
    const cgstRateLabel = activeInvoice.items.find(i => i.cgstRate > 0)?.cgstRate || 0;
    const sgstRateLabel = activeInvoice.items.find(i => i.sgstRate > 0)?.sgstRate || 0;

    return (
        <div className="w-full h-full bg-slate-100 flex">
            {/* Editor Panel */}
            <div className="w-1/2 md:w-5/12 h-full flex flex-col border-r border-slate-200 bg-white overflow-y-auto">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
                    <button onClick={() => setView('list')} className="flex items-center text-slate-500 hover:text-slate-800 text-sm font-medium">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </button>
                    <div className="flex gap-2">
                         {/* Enhanced PDF Download Button */}
                         <button onClick={downloadInvoicePDF} className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors">
                             <Download className="w-4 h-4" />
                             <span className="text-xs font-bold">Download PDF</span>
                         </button>
                         <button onClick={handleSave} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm">
                             Save Invoice
                         </button>
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Header Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Invoice #</label>
                            <input 
                                type="text" 
                                value={activeInvoice.invoiceNumber} 
                                onChange={(e) => setActiveInvoice({...activeInvoice, invoiceNumber: e.target.value})}
                                className="w-full p-2 bg-white border border-slate-200 rounded font-mono text-sm text-slate-900 placeholder-slate-400"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase">Date</label>
                            <input 
                                type="date" 
                                value={activeInvoice.date} 
                                onChange={(e) => setActiveInvoice({...activeInvoice, date: e.target.value})}
                                className="w-full p-2 bg-white border border-slate-200 rounded text-sm text-slate-900 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    {/* Customer Selection */}
                    <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center">
                            <Search className="w-4 h-4 mr-2" /> Bill To
                        </h3>
                        <select 
                            value={activeInvoice.customerId} 
                            onChange={handleCustomerChange}
                            className="w-full p-2 bg-white border border-slate-200 rounded text-sm text-slate-900 placeholder-slate-400"
                        >
                            <option value="">Select Customer...</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <input 
                                placeholder="Customer Name"
                                value={activeInvoice.customerName}
                                onChange={(e) => setActiveInvoice({...activeInvoice, customerName: e.target.value})}
                                className="p-2 bg-white border border-slate-200 rounded text-sm text-slate-900 placeholder-slate-400"
                            />
                            <input 
                                placeholder="GSTIN"
                                value={activeInvoice.customerGstin}
                                onChange={(e) => setActiveInvoice({...activeInvoice, customerGstin: e.target.value})}
                                className="p-2 bg-white border border-slate-200 rounded text-sm text-slate-900 placeholder-slate-400"
                            />
                        </div>
                        <textarea 
                            placeholder="Address"
                            value={activeInvoice.customerAddress}
                            onChange={(e) => setActiveInvoice({...activeInvoice, customerAddress: e.target.value})}
                            className="w-full p-2 bg-white border border-slate-200 rounded text-sm h-20 resize-none text-slate-900 placeholder-slate-400"
                        />
                    </div>

                    {/* Place of Supply */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Place of Supply</label>
                        <input 
                            type="text" 
                            value={activeInvoice.placeOfSupply} 
                            onChange={(e) => setActiveInvoice({...activeInvoice, placeOfSupply: e.target.value})}
                            className="w-full p-2 bg-white border border-slate-200 rounded text-sm text-slate-900 placeholder-slate-400"
                        />
                    </div>

                    {/* Line Items */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                             <h3 className="text-sm font-bold text-slate-800">Items</h3>
                             <button onClick={addItem} className="text-blue-600 text-xs font-bold hover:underline">+ Add Item</button>
                        </div>
                        {activeInvoice.items.map((item, idx) => (
                            <div key={item.id} className="p-4 border border-slate-200 rounded-xl relative group bg-white">
                                <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="grid grid-cols-12 gap-2 mb-2">
                                    <div className="col-span-8">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">Description</label>
                                        <input 
                                            value={item.description}
                                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                            className="w-full p-1 bg-white border-b border-slate-200 focus:border-blue-500 outline-none text-sm font-medium text-slate-900 placeholder-slate-400"
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">HSN/SAC</label>
                                        <input 
                                            value={item.hsnSac}
                                            onChange={(e) => updateItem(idx, 'hsnSac', e.target.value)}
                                            className="w-full p-1 bg-white border-b border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-900 placeholder-slate-400"
                                        />
                                    </div>
                                </div>
                                
                                <div className="mb-2">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase">Particulars / Details</label>
                                    <input 
                                        value={item.particulars || ''}
                                        onChange={(e) => updateItem(idx, 'particulars', e.target.value)}
                                        placeholder="e.g. Qty: 1 x ₹220000"
                                        className="w-full p-1 bg-white border-b border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-900 placeholder-slate-400"
                                    />
                                </div>

                                <div className="grid grid-cols-5 gap-3">
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">Qty</label>
                                        <input 
                                            type="number"
                                            value={item.qty}
                                            onChange={(e) => updateItem(idx, 'qty', Number(e.target.value))}
                                            className="w-full p-1 bg-white border-b border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-900 placeholder-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">Rate</label>
                                        <input 
                                            type="number"
                                            value={item.rate}
                                            onChange={(e) => updateItem(idx, 'rate', Number(e.target.value))}
                                            className="w-full p-1 bg-white border-b border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-900 placeholder-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">IGST %</label>
                                        <input 
                                            type="number"
                                            value={item.igstRate}
                                            onChange={(e) => updateItem(idx, 'igstRate', Number(e.target.value))}
                                            className="w-full p-1 bg-white border-b border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-900 placeholder-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">CGST %</label>
                                        <input 
                                            type="number"
                                            value={item.cgstRate}
                                            onChange={(e) => updateItem(idx, 'cgstRate', Number(e.target.value))}
                                            className="w-full p-1 bg-white border-b border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-900 placeholder-slate-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">SGST %</label>
                                        <input 
                                            type="number"
                                            value={item.sgstRate}
                                            onChange={(e) => updateItem(idx, 'sgstRate', Number(e.target.value))}
                                            className="w-full p-1 bg-white border-b border-slate-200 focus:border-blue-500 outline-none text-sm text-slate-900 placeholder-slate-400"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Signature Upload */}
                    <div className="pt-4 border-t border-slate-200">
                        <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Authorized Signature</label>
                        <div className="flex items-center gap-4">
                            <div className="relative border border-slate-300 rounded-lg p-2 bg-white hover:bg-slate-50 cursor-pointer w-full">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleSignatureUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                                    <Upload className="w-4 h-4" />
                                    <span>{activeInvoice.signatureImage ? 'Change Signature' : 'Upload Signature Image'}</span>
                                </div>
                            </div>
                            {activeInvoice.signatureImage && (
                                <img src={activeInvoice.signatureImage} alt="Sig" className="h-10 border border-slate-200 rounded object-contain" />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Panel - "Zomato Bill" Style Card */}
            <div className="flex-1 bg-slate-200 overflow-y-auto p-4 md:p-8 flex justify-center items-start">
                <div 
                    id="invoice-preview-capture" 
                    className="w-[480px] bg-white rounded-3xl shadow-2xl overflow-hidden relative"
                >
                    {/* Brand / Header */}
                    <div className="p-8 pb-4">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight uppercase">TAX INVOICE</h1>
                                <p className="text-slate-500 text-sm mt-1 flex items-center font-mono">
                                    <Hash className="w-3 h-3 mr-1" />
                                    {activeInvoice.invoiceNumber}
                                </p>
                                <p className="text-sm font-semibold text-slate-800 mt-1">
                                    Date: {activeInvoice.date}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                                {/* Waya V Logo - Invoice */}
                                <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                                    <defs>
                                        <linearGradient id="inv_logo_1" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                                          <stop stopColor="#4F46E5" />
                                          <stop offset="1" stopColor="#7C3AED" />
                                        </linearGradient>
                                        <linearGradient id="inv_logo_2" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                                          <stop stopColor="#EC4899" />
                                          <stop offset="1" stopColor="#F472B6" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M12 14 C12 14 28 50 28 50 L36 50 L20 14 Z" fill="url(#inv_logo_1)" />
                                    <path d="M52 14 C52 14 36 50 36 50 L44 50 L60 14 Z" fill="url(#inv_logo_2)" />
                                </svg>
                            </div>
                        </div>

                        {/* Seller Info (Compact) */}
                        <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                             <div className="flex items-center mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Billed By</p>
                             </div>
                             <h3 className="font-bold text-slate-900 text-sm">{activeInvoice.sellerName}</h3>
                             <p className="text-xs text-slate-500 mt-1">{activeInvoice.sellerAddress}</p>
                             <div className="flex gap-3 mt-2">
                                 <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600">GST: {activeInvoice.sellerGstin}</span>
                             </div>
                        </div>

                        {/* Customer Info (Compact) */}
                        <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                             <div className="flex items-center mb-2">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                                <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Bill To</p>
                             </div>
                             <h3 className="font-bold text-slate-900 text-sm">{activeInvoice.customerName}</h3>
                             <p className="text-xs text-slate-500 mt-1">{activeInvoice.customerAddress}</p>
                             {activeInvoice.customerGstin && (
                                <div className="mt-2">
                                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600">GST: {activeInvoice.customerGstin}</span>
                                </div>
                             )}
                        </div>
                    </div>

                    {/* Place of Supply Section */}
                    <div className="px-8 pb-6">
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Place of Supply</span>
                            <span className="text-sm font-bold text-blue-900">{activeInvoice.placeOfSupply}</span>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="px-8 pb-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-dashed border-slate-200 pb-2">Booking Details</h4>
                        <div className="space-y-4">
                            {activeInvoice.items.map((item, i) => (
                                <div key={i} className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="mt-0.5">
                                           <ShoppingBag className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">
                                                {item.description}
                                                {item.hsnSac && (
                                                    <span className="ml-2 text-[10px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded border border-slate-200 font-mono">
                                                        HSN: {item.hsnSac}
                                                    </span>
                                                )}
                                            </p>
                                            {item.particulars && (
                                                <p className="text-[10px] text-slate-400 mt-0.5">{item.particulars}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium text-slate-900">
                                        ₹{item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bill Summary Section */}
                    <div className="p-8 pt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-dashed border-slate-200 pb-2">Payment Breakdown</h4>
                        
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-slate-600">
                                <div className="flex items-center gap-3">
                                    <ShoppingBag className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm">Item Total</span>
                                </div>
                                <span className="text-sm font-medium">₹{subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>

                            {/* Detailed Tax Breakdown with % */}
                            {totalIGST > 0 && (
                                <div className="flex justify-between items-center text-slate-600">
                                    <div className="flex items-center gap-3">
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm">IGST ({igstRateLabel}%)</span>
                                    </div>
                                    <span className="text-sm font-medium">₹{totalIGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}

                            {(totalCGST > 0 || totalSGST > 0) && (
                                <>
                                    {totalCGST > 0 && (
                                        <div className="flex justify-between items-center text-slate-600">
                                            <div className="flex items-center gap-3">
                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm">CGST ({cgstRateLabel}%)</span>
                                            </div>
                                            <span className="text-sm font-medium">₹{totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                    {totalSGST > 0 && (
                                        <div className="flex justify-between items-center text-slate-600">
                                            <div className="flex items-center gap-3">
                                                <Building2 className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm">SGST ({sgstRateLabel}%)</span>
                                            </div>
                                            <span className="text-sm font-medium">₹{totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Dashed Separator */}
                        <div className="my-6 border-t border-slate-200 border-dashed"></div>

                        {/* Grand Total */}
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-lg font-bold text-slate-900">Grand Total</span>
                            <span className="text-lg font-bold text-slate-900">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* Bottom "Savings" Style Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-t border-blue-100">
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                                <Banknote className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-800 uppercase mb-1">Total in Words</p>
                                <p className="text-sm text-blue-700 font-medium leading-tight">
                                    {numberToWords(grandTotal)}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Authorized Signature (Visual) */}
                    <div className="p-8 pt-6 border-t border-slate-100 flex justify-between items-end">
                        <div className="text-xs text-slate-400">
                            <p className="font-bold uppercase mb-1">Notes</p>
                            <p>{activeInvoice.notes}</p>
                        </div>
                        <div className="text-right">
                             {activeInvoice.signatureImage && (
                                 <img 
                                    src={activeInvoice.signatureImage} 
                                    alt="Authorized Signature" 
                                    className="max-h-24 w-40 object-contain mb-2 ml-auto block" 
                                 />
                             )}
                             <div className="h-px w-24 mb-1 bg-slate-300 ml-auto"></div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Authorized Signature</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
  }

  return null;
};

export default InvoiceManager;
