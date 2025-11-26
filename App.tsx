import React, { useState, useRef, useEffect } from 'react';
import { generateQuotation } from './services/geminiService';
import { TravelQuotation, FileUpload, Customer } from './types';
import QuotationPreview from './components/QuotationPreview';
import CustomerManager from './components/CustomerManager';
import LogoStudio from './components/LogoStudio';
import { Upload, FileText, Send, Download, RefreshCw, AlertCircle, FilePlus, Users, ChevronDown, Wand2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [quotation, setQuotation] = useState<TravelQuotation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation & Customer State
  const [view, setView] = useState<'quotation' | 'customers' | 'branding'>('quotation');
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('waya_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const previewRef = useRef<HTMLDivElement>(null);

  // Persist customers
  useEffect(() => {
    localStorage.setItem('waya_customers', JSON.stringify(customers));
  }, [customers]);

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

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      // Calculate height based on ratio to maintain aspect ratio
      const finalHeight = (imgHeight * pdfWidth) / imgWidth;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight);
      pdf.save(`${quotation?.customerName || 'Waya'}_Quotation.pdf`);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const downloadPNG = async () => {
    const element = document.getElementById('quotation-preview');
    if (!element) return;
    
    const canvas = await html2canvas(element, { scale: 2 });
    const link = document.createElement('a');
    link.download = `${quotation?.customerName || 'Waya'}_Quotation.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Navbar */}
      <nav className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 z-20 shrink-0">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView('quotation')}>
          <div className="w-10 h-10 flex items-center justify-center">
            {/* Waya.AI Logo SVG */}
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="url(#paint0_linear)" fillOpacity="0.2"/>
              <path d="M14 16L20 34L26 16M22 16L28 34L34 16" stroke="url(#paint1_linear)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="paint0_linear" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0EA5E9"/>
                  <stop offset="1" stopColor="#6366F1"/>
                </linearGradient>
                <linearGradient id="paint1_linear" x1="14" y1="16" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#38BDF8"/>
                  <stop offset="1" stopColor="#818CF8"/>
                </linearGradient>
              </defs>
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
            onClick={() => setView('branding')}
            className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-all ${view === 'branding' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Wand2 className="w-4 h-4" /> <span className="hidden md:inline">Branding</span>
          </button>
        </div>

        <div className="flex space-x-4 w-[160px] justify-end">
            {view === 'quotation' && quotation && (
                <>
                  <button onClick={downloadPNG} className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors" title="Download PNG">
                      <Download className="w-4 h-4" />
                  </button>
                  <button onClick={downloadPDF} className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded text-sm transition-colors border border-slate-700">
                      <FileText className="w-4 h-4" /> <span>PDF</span>
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
            onAdd={addCustomer}
            onEdit={editCustomer}
            onDelete={deleteCustomer}
          />
        ) : view === 'branding' ? (
          <LogoStudio />
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
                      placeholder="Paste flight details, hotel info, or write a rough plan here...&#10;e.g., 'Trip to Paris for John Doe, June 10-15. Flights with Air France. Staying at The Ritz.'"
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
                    
                    {/* File List */}
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
            <div className="flex-1 bg-slate-200 overflow-y-auto relative p-4 md:p-8 flex justify-center">
                <div className="w-full max-w-4xl transition-all duration-500 ease-in-out">
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