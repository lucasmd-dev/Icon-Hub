import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Copy, Download, Check, Code2, Pipette } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { IconData } from '../../types';
import { fetchIconSvg } from '../../services/iconifyService';
import { cn } from '../../utils/cn';

interface IconDetailModalProps {
  icon: IconData;
  onClose: () => void;
}

const PRESET_SIZES = [16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 256, 512];

const PRESET_COLORS = [
  '#ffffff',
  '#94a3b8',
  '#3b82f6',
  '#ef4444',
  '#22c55e',
  '#eab308',
  '#a855f7',
  '#ec4899',
  '#f97316',
  '#06b6d4',
];

export const IconDetailModal: React.FC<IconDetailModalProps> = ({ icon, onClose }) => {
  const [svgContent, setSvgContent] = useState<string>('');
  const [color, setColor] = useState<string>('#ffffff');
  const [sizeIndex, setSizeIndex] = useState<number>(2);
  const [copied, setCopied] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);

  const currentSize = PRESET_SIZES[sizeIndex];

  useEffect(() => {
    setLoading(true);
    fetchIconSvg(icon.prefix, icon.name).then(raw => {
      setSvgContent(raw);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [icon]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processedSvg = useMemo(() => {
    if (!svgContent) return '';
    
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = doc.documentElement;
      
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        console.error('SVG parsing error:', parserError.textContent);
        return '';
      }
      
      const sizeStr = currentSize.toString();
      svgElement.setAttribute('width', sizeStr);
      svgElement.setAttribute('height', sizeStr);
      
      if (!svgElement.getAttribute('viewBox')) {
        svgElement.setAttribute('viewBox', '0 0 24 24');
      }
      
      svgElement.style.color = color;
      
      if (svgElement.getAttribute('fill') !== 'none') {
          svgElement.setAttribute('fill', color);
      }
      
      const hasStroke = svgElement.getAttribute('stroke') && svgElement.getAttribute('stroke') !== 'none';
      if (hasStroke) {
          svgElement.setAttribute('stroke', color);
      }

      let html = svgElement.outerHTML.replace(/currentColor/g, color);
      
      return html;
    } catch (error) {
      console.error('Error processing SVG:', error);
      return '';
    }
  }, [svgContent, color, currentSize]);

  const handleDownload = (format: 'svg' | 'png') => {
    if (!processedSvg) return;

    if (format === 'svg') {
      const blob = new Blob([processedSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${icon.name}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      const svgBlob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = currentSize;
        canvas.height = currentSize;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, currentSize, currentSize);
        
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `${icon.name}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        colorButtonRef.current &&
        !colorPickerRef.current.contains(event.target as Node) &&
        !colorButtonRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showColorPicker]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-4xl bg-card rounded-2xl border border-slate-700 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="w-full md:w-5/12 bg-slate-950 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-slate-700 relative min-h-[300px]">
             <h2 className="absolute top-6 left-6 text-lg font-bold text-white tracking-tight">{icon.name}</h2>
             <span className="absolute top-7 right-6 text-xs text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded">{icon.prefix}</span>
            
             <div 
                className="transition-all duration-300 flex items-center justify-center relative"
                style={{ width: '200px', height: '200px' }}
             >
                <div className="absolute inset-0 opacity-20" 
                     style={{ 
                         backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', 
                         backgroundSize: '20px 20px' 
                     }} 
                />
                
                {loading ? (
                  <div className="z-10 flex items-center justify-center">
                    <div className="w-12 h-12 border-2 border-slate-600 border-t-primary rounded-full animate-spin" />
                  </div>
                ) : processedSvg ? (
                  <div 
                      className="z-10 transition-all duration-300 drop-shadow-2xl"
                      dangerouslySetInnerHTML={{ 
                          __html: processedSvg.replace(/width="\d+"/, 'width="100%"').replace(/height="\d+"/, 'height="100%"') 
                      }} 
                  />
                ) : null}
             </div>
             
             <div className="absolute bottom-6 text-slate-500 text-xs font-mono">
                {currentSize}x{currentSize}px
             </div>
        </div>

        <div className="w-full md:w-7/12 flex flex-col max-h-[90vh] md:h-auto bg-card relative">
            <div className="flex justify-end p-4 border-b border-slate-800/50">
                <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar relative">
                
                <div className="mb-8 mt-2">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Color</label>
                        <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-700">
                             <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                             <input 
                                type="text" 
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="bg-transparent text-xs font-mono text-slate-300 w-16 focus:outline-none uppercase"
                             />
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={cn(
                                    "w-6 h-6 rounded-full border-2 transition-all duration-200 focus:outline-none relative overflow-hidden",
                                    color === c ? "border-white scale-110" : "border-transparent hover:scale-105"
                                )}
                                style={{ backgroundColor: c }}
                                title={c}
                            >
                                {color === c && (
                                    <div className="absolute inset-0 bg-white/30 rounded-full blur-sm" />
                                )}
                            </button>
                        ))}
                        
                        <div className="relative">
                            <button 
                                ref={colorButtonRef}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowColorPicker(!showColorPicker);
                                }}
                                className={cn(
                                    "w-6 h-6 rounded-full border-2 transition-all duration-200 focus:outline-none flex items-center justify-center bg-slate-800 hover:bg-slate-700 hover:scale-105 relative overflow-hidden",
                                    !PRESET_COLORS.includes(color) ? "border-white scale-110" : "border-slate-600",
                                    showColorPicker && "border-primary ring-2 ring-primary/50"
                                )}
                                title="Custom Color"
                            >
                                {!PRESET_COLORS.includes(color) && (
                                    <div className="absolute inset-0 rounded-full" style={{ backgroundColor: color }} />
                                )}
                                <Pipette className={cn(
                                    "w-3 h-3 relative z-10 transition-colors",
                                    !PRESET_COLORS.includes(color) ? "text-white" : "text-slate-300"
                                )} />
                                {!PRESET_COLORS.includes(color) && (
                                    <div className="absolute inset-0 bg-white/30 rounded-full blur-sm" />
                                )}
                            </button>
                            
                            {showColorPicker && (
                                <div
                                    ref={colorPickerRef}
                                    className="absolute top-8 z-50 bg-slate-900 border border-slate-700 rounded-xl p-4 shadow-2xl"
                                    style={{ minWidth: '200px', right: '0', transform: 'translateX(calc(-100% + 200px))' }}
                                >
                                    <HexColorPicker 
                                        color={color} 
                                        onChange={setColor}
                                        style={{ width: '100%', height: '150px' }}
                                    />
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="flex-1 flex items-center gap-2 bg-slate-800 rounded-lg p-1.5 border border-slate-700">
                                            <div className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                                            <input 
                                                type="text" 
                                                value={color}
                                                onChange={(e) => setColor(e.target.value)}
                                                className="bg-transparent text-xs font-mono text-slate-300 flex-1 focus:outline-none uppercase"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Size</label>
                        <span className="text-xs font-bold text-primary bg-primary/20 px-3 py-1.5 rounded-lg border border-primary/30 shadow-sm">
                            {currentSize}px
                        </span>
                    </div>
                    
                    <div className="relative h-14 flex items-center select-none px-1">
                        <div className="absolute left-0 right-0 top-1/2 pointer-events-none -translate-y-1/2">
                            {PRESET_SIZES.map((s, idx) => {
                                const tickPosition = idx === 0 ? '0%' : idx === PRESET_SIZES.length - 1 ? '100%' : `${(idx / (PRESET_SIZES.length - 1)) * 100}%`;
                                return (
                                    <div 
                                        key={s} 
                                        className="absolute flex flex-col items-center"
                                        style={{ left: tickPosition, transform: 'translateX(-50%)', top: '0' }}
                                    >
                                        <div className={cn(
                                            "rounded-full",
                                            !isDragging && "transition-all duration-150",
                                            idx <= sizeIndex 
                                                ? "w-2 h-2 bg-primary shadow-sm shadow-primary/50 ring-2 ring-primary/30 z-20" 
                                                : "w-1.5 h-1.5 bg-slate-600 z-20"
                                        )} />
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="absolute left-0 right-0 top-1/2 h-1.5 bg-slate-800/50 rounded-full -translate-y-1/2 translate-y-[2px] z-10" />
                        
                        <div 
                            className={cn(
                                "absolute left-0 top-1/2 h-1.5 bg-gradient-to-r from-primary via-blue-500 to-primary rounded-full shadow-sm shadow-primary/30 -translate-y-1/2 translate-y-[1px] z-10",
                                !isDragging && "transition-all duration-150 ease-out"
                            )}
                            style={{ 
                                width: `${(sizeIndex / (PRESET_SIZES.length - 1)) * 100}%` 
                            }}
                        />

                        <input 
                            type="range" 
                            min="0" 
                            max={PRESET_SIZES.length - 1}
                            step="1"
                            value={sizeIndex}
                            onMouseDown={() => setIsDragging(true)}
                            onMouseUp={() => setIsDragging(false)}
                            onTouchStart={() => setIsDragging(true)}
                            onTouchEnd={() => setIsDragging(false)}
                            onChange={(e) => setSizeIndex(parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
                        />
                        
                        <div 
                            className={cn(
                                "absolute h-6 w-6 pointer-events-none z-30",
                                !isDragging && "transition-all duration-150 ease-out"
                            )}
                            style={{ 
                                left: `${(sizeIndex / (PRESET_SIZES.length - 1)) * 100}%`,
                                top: 'calc(50% + 2px)',
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-md" />
                            
                            <div className="relative h-6 w-6 bg-gradient-to-br from-primary to-blue-600 rounded-full shadow-lg shadow-primary/40 border-2 border-white/20 ring-2 ring-primary/30" />
                        </div>
                    </div>
                    
                    <div className="relative mt-1 px-1">
                        {PRESET_SIZES.map((s, idx) => {
                            const labelPosition = idx === 0 ? '0%' : idx === PRESET_SIZES.length - 1 ? '100%' : `${(idx / (PRESET_SIZES.length - 1)) * 100}%`;
                            return (
                                <span 
                                    key={s}
                                    className="absolute text-[10px] text-slate-500 font-mono font-semibold"
                                    style={{ left: labelPosition, transform: 'translateX(-50%)' }}
                                >
                                    {s}
                                </span>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-900/50 border-b border-slate-800">
                             <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Code2 className="w-3 h-3" />
                                <span className="font-semibold">SVG Code</span>
                             </div>
                             <button 
                                onClick={() => copyToClipboard(processedSvg)}
                                className={cn(
                                    "text-xs flex items-center gap-1 transition-colors font-medium px-2 py-1 rounded hover:bg-slate-800",
                                    copied ? "text-green-400" : "text-primary hover:text-blue-400"
                                )}
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <pre className="p-4 text-[11px] leading-relaxed font-mono text-slate-300 whitespace-pre-wrap break-all h-24 overflow-y-auto custom-scrollbar bg-transparent">
                            {processedSvg}
                        </pre>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button 
                            onClick={() => handleDownload('svg')}
                            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl transition-colors duration-200 font-medium text-sm border border-slate-700 hover:border-slate-600"
                        >
                            <Download className="w-4 h-4" /> 
                            <span>Download SVG</span>
                        </button>
                        <button 
                            onClick={() => handleDownload('png')}
                            className="flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white py-3 rounded-xl transition-colors duration-200 font-medium text-sm shadow-lg shadow-primary/20"
                        >
                            <Download className="w-4 h-4" /> 
                            <span>Download PNG</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};