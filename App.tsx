
import React, { useState, useRef, useEffect } from 'react';
import { generateQuotation } from './services/geminiService';
import { TravelQuotation, FileUpload, Customer, Invoice } from './types';
import QuotationPreview from './components/QuotationPreview';
import CustomerManager from './components/CustomerManager';
import InvoiceManager from './components/InvoiceManager';
import { Upload, FileText, Send, Download, RefreshCw, AlertCircle, FilePlus, Users, ChevronDown, Wand2, Loader2, Receipt } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [quotation, setQuotation] = useState<TravelQuotation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Navigation & Data State
  const [view, setView] = useState<'quotation' | 'customers' | 'invoices'>('quotation');
  
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('waya_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('waya_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const previewRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('waya_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('waya_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Customer Actions
  const addCustomer = (c: Omit<Customer, 'id'>) => {
    const newCustomer = { ...c, id: Date.now().toString() };
    setCustomers(prev => [...prev, newCustomer]);
  };

  const editCustomer = (id: string, c: Partial<Customer>) => {
    setCustomers(prev => prev.map(cust => cust.id === id ? { ...cust, ...c } : cust));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  // Invoice Actions
  const addInvoice = (inv: Invoice) => {
    setInvoices(prev => [...prev, inv]);
  };

  const updateInvoice = (inv: Invoice) => {
    setInvoices(prev => prev.map(i => i.id === inv.id ? inv : i));
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  const handleSelectCustomer = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    if(!custId) return;
    
    const cust = customers.find(c => c.id === custId);
    if(cust) {
       const note = `\n\nCustomer Details:\nName: ${cust.name}\nEmail: ${cust.email}\nPhone: ${cust.phone}\nPreferences: ${cust.preferences}`;
       setInputText(prev => (prev + note).trim());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const newFiles: FileUpload[] = [];
      Array.from(fileList).forEach((item) => {
        const file = item as File;
        const reader = new FileReader();
        reader.onloadend = () => {
          newFiles.push({
            name: file.name,
            type: file.type,
            data: reader.result as string
          });
          if (newFiles.length === fileList.length) {
            setFiles(prev => [...prev, ...newFiles]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!inputText && files.length === 0) {
      setError("Please add some itinerary details or upload a file.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await generateQuotation(inputText, files);
      setQuotation(result);
    } catch (err: any) {
      setError(err.message || "Failed to generate quotation. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrice = (newPrice: string) => {
    setQuotation(prev => prev ? { ...prev, totalPrice: newPrice } : null);
  };

  const downloadPDF = async () => {
    const element = document.getElementById('quotation-preview');
    if (!element) return;
    
    setIsExporting(true);
    window.scrollTo(0, 0);

    setTimeout(async () => {
        try {
          const canvas = await html2canvas(element, { 
            scale: 3, 
            useCORS: true,
            logging: false,
            allowTaint: true,
            backgroundColor: '#f8fafc',
            scrollY: -window.scrollY,
            windowWidth: document.documentElement.offsetWidth,
            windowHeight: document.documentElement.offsetHeight
          });
          
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          
          const ratio = pdfWidth / imgWidth;
          const totalPdfHeight = imgHeight * ratio;

          let heightLeft = totalPdfHeight;
          let position = 0;

          pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalPdfHeight);
          heightLeft -= pdfHeight;

          while (heightLeft > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, totalPdfHeight);
            heightLeft -= pdfHeight;
          }

          pdf.save(`${quotation?.customerName || 'Waya'}_Quotation.pdf`);
        } catch (e) {
          console.error("Export failed", e);
          setError("Failed to generate PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    }, 500);
  };

  const downloadPNG = async () => {
    const element = document.getElementById('quotation-preview');
    if (!element) return;
    
    setIsExporting(true);
    window.scrollTo(0, 0);

    setTimeout(async () => {
        try {
            const canvas = await html2canvas(element, { 
                scale: 3,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#f8fafc',
                scrollY: -window.scrollY
            });
            const link = document.createElement('a');
            link.download = `${quotation?.customerName || 'Waya'}_Quotation.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (e) {
            console.error("PNG export failed", e);
            setError("Failed to download Image. Please try PDF.");
        } finally {
            setIsExporting(false);
        }
    }, 500);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('quotation')}>
          <div className="w-10 h-10 flex items-center justify-center">
            {/* New Waya 'V' Logo */}
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                <linearGradient id="logo_grad_1" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#4F46E5" />
                  <stop offset="1" stopColor="#7C3AED" />
                </linearGradient>
                <linearGradient id="logo_grad_2" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#EC4899" />
                  <stop offset="1" stopColor="#F472B6" />
                </linearGradient>
              </defs>
              <path d="M12 14 C12 14 28 50 28 50 L36 50 L20 14 Z" fill="url(#logo_grad_1)" />
              <path d="M52 14 C52 14 36 50 36 50 L44 50 L60 14 Z" fill="url(#logo_grad_2)" />
            </svg>
          </div>
          <span className="text-xl font-serif font-bold tracking-tight">Waya.AI</span>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          <button 
            onClick={() => setView('quotation')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-all ${view === 'quotation' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FilePlus className="w-4 h-4" /> <span className="hidden md:inline">Quotation</span>
          </button>
          <button 
            onClick={() => setView('customers')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-all ${view === 'customers' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Users className="w-4 h-4" /> <span className="hidden md:inline">Customers</span>
          </button>
          <button 
            onClick={() => setView('invoices')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-all ${view === 'invoices' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Receipt className="w-4 h-4" /> <span className="hidden md:inline">Invoices</span>
          </button>
        </div>

        <div className="flex space-x-4 w-[160px] justify-end">
            {view === 'quotation' && quotation && (
                <>
                  <button 
                    onClick={downloadPNG} 
                    disabled={isExporting}
                    className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50" 
                    title="Download PNG"
                  >
                      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={downloadPDF} 
                    disabled={isExporting}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors border border-slate-700 disabled:opacity-50"
                  >
                      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                      <span>{isExporting ? '...' : 'PDF'}</span>
                  </button>
                </>
            )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {view === 'customers' ? (
          <CustomerManager 
            customers={customers}
            invoices={invoices}
            onAdd={addCustomer}
            onEdit={editCustomer}
            onDelete={deleteCustomer}
          />
        ) : view === 'invoices' ? (
          <InvoiceManager 
            invoices={invoices}
            customers={customers}
            onAdd={addInvoice}
            onUpdate={updateInvoice}
            onDelete={deleteInvoice}
          />
        ) : (
          <>
            {/* Left Panel: Editor */}
            <div className="w-full md:w-1/3 lg:w-[400px] flex flex-col border-r border-slate-800 bg-slate-900 z-10 shadow-xl">
              <div className="p-6 flex-1 overflow-y-auto no-scrollbar">
                {/* Customer Selector */}
                <div className="mb-6">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">Load Customer Profile</h2>
                  <div className="relative">
                    <select 
                      onChange={handleSelectCustomer}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 pr-10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-waya-500 appearance-none cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>Select a customer...</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Text Input */}
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300 font-medium">Notes & Itinerary</label>
                    <textarea
                      className="w-full h-64 bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm focus:outline-none focus:ring-2 focus:ring-waya-500 text-slate-200 placeholder-slate-600 resize-none"
                      placeholder="Paste flight details, hotel info, or write a rough plan here..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                  </div>

                  {/* File Upload */}
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300 font-medium">Attachments</label>
                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-slate-800/50 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Upload className="w-8 h-8 text-waya-500 mb-2" />
                      <p className="text-sm text-slate-400">Drop itinerary images or PDFs here</p>
                    </div>
                    
                    {files.length > 0 && (
                      <div className="space-y-2 mt-4">
                        {files.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-800 p-2 rounded border border-slate-700">
                            <div className="flex items-center space-x-2 overflow-hidden">
                               <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                               <span className="text-xs text-slate-300 truncate">{file.name}</span>
                            </div>
                            <button onClick={() => removeFile(idx)} className="text-slate-500 hover:text-red-400">
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-200">{error}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-900">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all shadow-lg shadow-waya-500/20 ${
                    loading 
                      ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-waya-600 to-waya-500 hover:from-waya-500 hover:to-waya-400 text-white'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Designing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>{quotation ? 'Update Quotation' : 'Generate Quotation'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Panel: Preview */}
            <div className="flex-1 bg-slate-200 overflow-y-auto relative p-0">
                <div className="w-full min-h-screen transition-all duration-500 ease-in-out">
                    <QuotationPreview 
                      id="quotation-preview"
                      data={quotation} 
                      loading={loading}
                      onUpdatePrice={handleUpdatePrice}
                    />
                </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
