import React, { useState } from 'react';
import { enhanceLogo } from '../services/geminiService';
import { Upload, Wand2, Download, Image as ImageIcon, RefreshCw, AlertCircle } from 'lucide-react';

const LogoStudio: React.FC = () => {
  const [baseImage, setBaseImage] = useState<{data: string, type: string} | null>(null);
  const [prompt, setPrompt] = useState('Make it look like a premium, 3D metallic logo for a luxury travel brand. High resolution, minimalist, sophisticated.');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBaseImage({
          data: reader.result as string,
          type: file.type
        });
        setGeneratedImage(null); // Reset generated image when new base is uploaded
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnhance = async () => {
    if (!baseImage) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await enhanceLogo(baseImage.data, baseImage.type, prompt);
      setGeneratedImage(result);
    } catch (err: any) {
      setError(err.message || "Failed to enhance logo");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = 'Waya_Enhanced_Logo.png';
      link.click();
    }
  };

  return (
    <div className="w-full h-full bg-slate-50 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-800 flex items-center">
            <Wand2 className="w-8 h-8 mr-3 text-waya-600" />
            Waya Brand Studio
          </h1>
          <p className="text-slate-500 mt-1">Enhance your brand identity using Nano Banana AI models.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Controls Panel */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-6">1. Upload Base Logo</h2>
            
            {/* Upload Area */}
            <div className="mb-8">
              <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {baseImage ? (
                  <div className="relative z-0">
                    <img src={baseImage.data} alt="Original" className="h-32 object-contain mx-auto mb-4" />
                    <p className="text-xs text-green-600 font-medium">Image Loaded</p>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Click to upload your logo</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
            </div>

            <h2 className="text-lg font-bold text-slate-800 mb-4">2. Enhancement Instructions</h2>
            <div className="mb-8">
              <label className="block text-sm text-slate-500 mb-2">How should the AI improve this logo?</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-sm focus:ring-2 focus:ring-waya-500 outline-none resize-none"
                placeholder="e.g. Make it minimalist, flat design, white background..."
              />
            </div>

            <button
              onClick={handleEnhance}
              disabled={!baseImage || loading}
              className={`w-full py-4 rounded-lg font-bold text-white flex items-center justify-center space-x-2 transition-all shadow-lg ${
                !baseImage || loading
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-waya-600 to-indigo-600 hover:from-waya-500 hover:to-indigo-500 shadow-waya-500/20'
              }`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Generating with Nano Banana...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  <span>Enhance Logo</span>
                </>
              )}
            </button>
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Result Panel */}
          <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden flex flex-col relative min-h-[500px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-waya-500 via-purple-500 to-indigo-500"></div>
            
            <div className="p-6 border-b border-slate-800">
               <h2 className="text-lg font-bold text-white">Preview</h2>
            </div>

            <div className="flex-1 flex items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-slate-800 relative">
               {loading ? (
                 <div className="flex flex-col items-center justify-center z-10">
                    <div className="relative w-24 h-24 mb-6">
                      <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-waya-500 rounded-full animate-spin"></div>
                      <Wand2 className="absolute inset-0 m-auto w-10 h-10 text-waya-500 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 animate-pulse">Designing...</h3>
                    <p className="text-slate-400 text-sm">Applying Nano Banana Magic</p>
                 </div>
               ) : generatedImage ? (
                 <img src={generatedImage} alt="Enhanced Logo" className="max-w-full max-h-[400px] object-contain drop-shadow-2xl animate-in zoom-in duration-500" />
               ) : (
                 <div className="text-center opacity-30">
                    <Wand2 className="w-24 h-24 mx-auto mb-4 text-white" />
                    <p className="text-slate-300 font-light">AI generated result will appear here</p>
                 </div>
               )}
            </div>

            {generatedImage && !loading && (
              <div className="p-6 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
                 <span className="text-slate-400 text-sm">Generated by gemini-2.5-flash-image</span>
                 <button 
                   onClick={handleDownload}
                   className="px-6 py-2 bg-white text-slate-900 rounded-lg font-medium hover:bg-slate-100 transition-colors flex items-center space-x-2"
                 >
                   <Download className="w-4 h-4" />
                   <span>Download Asset</span>
                 </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default LogoStudio;