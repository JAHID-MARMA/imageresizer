import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Settings, ImageIcon, Lock, Unlock, X, Maximize, FileType } from 'lucide-react';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function App() {
  const [originalName, setOriginalName] = useState<string>('');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [originalObj, setOriginalObj] = useState<HTMLImageElement | null>(null);
  const [origWidth, setOrigWidth] = useState(0);
  const [origHeight, setOrigHeight] = useState(0);

  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat] = useState('image/jpeg');
  const [quality, setQuality] = useState(85);

  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setOriginalSize(file.size);
    setOriginalName(file.name);
    
    // Auto-select format based on original if possible
    if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/webp') {
      setFormat(file.type);
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setOriginalObj(img);
      setOrigWidth(img.width);
      setOrigHeight(img.height);
      setWidth(img.width);
      setHeight(img.height);
    };
    img.src = url;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    const syntheticEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileChange(syntheticEvent);
  };

  const clearImage = () => {
    setOriginalObj(null);
    setResultBlob(null);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processImage = () => {
    if (!originalObj || typeof width !== 'number' || typeof height !== 'number' || width <= 0 || height <= 0) return;
    
    setIsProcessing(true);
    
    // Use timeout to allow UI to show processing state if needed
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // If we are exporting to JPEG and the image has transparency, give it a white background
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }
      
      ctx.drawImage(originalObj, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          if (resultUrl) URL.revokeObjectURL(resultUrl);
          setResultBlob(blob);
          setResultUrl(URL.createObjectURL(blob));
        }
        setIsProcessing(false);
      }, format, quality / 100);
    }, 50);
  };

  // Live preview effect
  useEffect(() => {
    if (!originalObj || !width || !height) return;
    const timer = setTimeout(() => {
      processImage();
    }, 300);
    return () => clearTimeout(timer);
  }, [width, height, format, quality, originalObj]);

  const handleWidthChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val)) {
      setWidth('');
      return;
    }
    setWidth(val);
    if (lockAspect && origWidth && origHeight) {
      setHeight(Math.max(1, Math.round(val * (origHeight / origWidth))));
    }
  };

  const handleHeightChange = (valStr: string) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val)) {
      setHeight('');
      return;
    }
    setHeight(val);
    if (lockAspect && origWidth && origHeight) {
      setWidth(Math.max(1, Math.round(val * (origWidth / origHeight))));
    }
  };

  const downloadImage = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    a.download = `Jahid_ImED_${baseName}_${width}x${height}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-slate-50 text-slate-900 font-sans flex flex-col min-h-screen">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-sm">
            <ImageIcon className="w-5 h-5 text-white stroke-2" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">Jahid ImED</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden">
        {!originalObj ? (
          <div className="flex-1 p-4 sm:p-8 flex items-center justify-center bg-slate-50 lg:overflow-y-auto w-full max-w-7xl mx-auto min-h-[calc(100vh-64px)] lg:min-h-0">
            <div 
              className="max-w-2xl w-full bg-slate-200 border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 hover:border-indigo-500 transition-colors shadow-sm"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <div className="bg-white border border-slate-200 text-indigo-600 p-4 rounded-full mb-4 shadow-sm">
                <Upload className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Upload an Image</h2>
              <p className="text-sm font-medium text-slate-500 mb-8 max-w-md">
                Drag and drop your image here, or click to browse. We support JPEG, PNG, WEBP, and more.
              </p>
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg border border-transparent font-semibold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all text-sm tracking-wide">
                SELECT FILE
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row flex-1 w-full max-w-[1600px] mx-auto lg:h-[calc(100vh-64px)] lg:overflow-hidden">
            
            {/* Left Column: Preview Area */}
            <section className="w-full lg:w-3/5 p-4 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col gap-6 overflow-y-auto">
              <div className="flex items-center justify-between shrink-0">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Source Preview</h2>
                <button 
                  onClick={clearImage}
                  className="text-xs text-indigo-600 font-semibold flex items-center hover:text-indigo-700 transition-colors bg-indigo-50 px-3 py-1.5 rounded-md"
                >
                  Replace File
                </button>
              </div>
              
              <div className="flex-1 bg-slate-200 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden group min-h-[300px] lg:min-h-0">
                <style dangerouslySetInnerHTML={{__html: `
                  .checkerboard-bg {
                    background-image: linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%);
                    background-size: 20px 20px;
                    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
                  }
                `}} />
                <div className="absolute inset-0 checkerboard-bg opacity-40"></div>
                
                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center z-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent shadow-md"></div>
                  </div>
                )}
                {resultUrl && (
                  <img 
                    src={resultUrl} 
                    alt="Resized preview" 
                    className="max-w-full max-h-full object-contain relative z-10 p-4 transition-all"
                  />
                )}
                
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg flex items-center justify-between border border-white/20 z-20 shadow-sm">
                  <div className="overflow-hidden pr-4">
                    <p className="text-xs font-bold text-slate-900 truncate">{originalName}</p>
                    <p className="text-[10px] text-slate-500 uppercase mt-0.5">{origWidth} × {origHeight} • {formatBytes(originalSize)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 shrink-0">
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-center shadow-sm">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Output</span>
                  <span className="text-lg font-light text-slate-900">{resultBlob ? formatBytes(resultBlob.size) : '...'}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-center shadow-sm">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Export Format</span>
                  <span className="text-lg font-light text-slate-900">{format.split('/')[1]?.toUpperCase()}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col justify-center shadow-sm col-span-2 lg:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Resolution</span>
                  <span className="text-lg font-light text-slate-900">{width || 0} <span className="text-slate-400 font-normal">×</span> {height || 0}</span>
                </div>
              </div>
            </section>

            {/* Right Column: Controls */}
            <section className="w-full lg:w-2/5 bg-white p-4 sm:p-8 lg:overflow-y-auto flex flex-col lg:h-full shrink-0 shadow-[-4px_0_12px_rgba(0,0,0,0.02)] z-10">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 shrink-0">Resizing Parameters</h2>
              
              <div className="space-y-6 flex-1">
                {/* Dimension Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-600">Width (px)</label>
                    <input 
                      type="number" 
                      value={width}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 bg-white no-spinners transition-shadow"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-slate-600 flex justify-between items-center">
                      Height (px)
                      <button 
                        onClick={() => setLockAspect(!lockAspect)}
                        className={`text-[10px] flex items-center gap-1 ${lockAspect ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        {lockAspect ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </label>
                    <input 
                      type="number" 
                      value={height}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800 bg-white no-spinners transition-shadow"
                    />
                  </div>
                </div>

                {/* Format Options */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600">Export Format</label>
                  <div className="flex gap-2">
                    {['image/jpeg', 'image/png', 'image/webp'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setFormat(fmt)}
                        className={`flex-1 py-2 text-xs font-medium border rounded-lg transition-colors ${
                          format === fmt 
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                            : 'border-slate-200 text-slate-600 hover:border-indigo-500 bg-white'
                        }`}
                      >
                        {fmt.split('/')[1].toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Advanced Settings Block */}
                <div className="border-t border-slate-100 pt-6 mt-4">
                  <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center justify-between">
                    <span>Advanced Settings</span>
                    <span className="bg-indigo-600 w-2 h-2 rounded-full"></span>
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Quality (Only for JPEG/WEBP) */}
                    {(format === 'image/jpeg' || format === 'image/webp') && (
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-slate-600 shrink-0">Quality Layer</label>
                        <div className="flex items-center gap-3 w-3/5">
                          <input 
                            type="range" 
                            min="1" 
                            max="100" 
                            value={quality} 
                            onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                            className="w-full accent-indigo-600"
                          />
                          <span className="text-xs font-bold text-slate-800 w-10 text-right">{quality}%</span>
                        </div>
                      </div>
                    )}
                    {!(format === 'image/jpeg' || format === 'image/webp') && (
                      <div className="text-xs text-slate-400 italic">No advanced settings available for PNG format.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-8 pt-8 border-t border-slate-100 shrink-0">
                <button 
                  onClick={downloadImage}
                  disabled={!resultUrl || isProcessing}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  INITIALIZE RESIZE & EXPORT
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-4 uppercase">Engine v2.4.2 • Powered by Jahid ImED</p>
              </div>
            </section>
          </div>
        )}
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        .no-spinners {
          -moz-appearance: textfield;
        }
      `}} />
    </div>
  );
}
