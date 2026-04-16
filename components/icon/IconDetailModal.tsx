import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { Check, Code2, Copy, Download, Pipette, X } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { fetchIconSvg } from '../../services/iconifyService';
import type { IconData } from '../../types';
import { cn } from '../../utils/cn';

interface IconDetailModalProps {
  icon: IconData;
  onClose: () => void;
}

type CopyStatus = 'idle' | 'success' | 'error';

const PRESET_SIZES = [16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 256, 512];

const PRESET_COLORS = [
  '#f8fafc',
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

export function IconDetailModal({ icon, onClose }: IconDetailModalProps) {
  const [svgContent, setSvgContent] = useState('');
  const [color, setColor] = useState('#f8fafc');
  const [sizeIndex, setSizeIndex] = useState(2);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const colorButtonRef = useRef<HTMLButtonElement>(null);
  const copyFeedbackTimerRef = useRef<number | null>(null);

  const currentSize = PRESET_SIZES[sizeIndex];

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setCopyStatus('idle');

    void fetchIconSvg(icon.prefix, icon.name)
      .then((rawSvg) => {
        if (!isActive) {
          return;
        }

        setSvgContent(rawSvg);
        setLoading(false);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setSvgContent('');
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [icon]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (copyFeedbackTimerRef.current !== null) {
        window.clearTimeout(copyFeedbackTimerRef.current);
      }
    };
  }, []);

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

    if (!showColorPicker) {
      return;
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  const processedSvg = useMemo(() => {
    if (!svgContent) {
      return '';
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const parserError = doc.querySelector('parsererror');

      if (parserError) {
        return '';
      }

      const svgElement = doc.documentElement;
      const sizeValue = currentSize.toString();

      svgElement.setAttribute('width', sizeValue);
      svgElement.setAttribute('height', sizeValue);

      if (!svgElement.getAttribute('viewBox')) {
        svgElement.setAttribute('viewBox', '0 0 24 24');
      }

      svgElement.style.color = color;

      if (svgElement.getAttribute('fill') !== 'none') {
        svgElement.setAttribute('fill', color);
      }

      const strokeValue = svgElement.getAttribute('stroke');
      if (strokeValue && strokeValue !== 'none') {
        svgElement.setAttribute('stroke', color);
      }

      return svgElement.outerHTML.replace(/currentColor/g, color);
    } catch {
      return '';
    }
  }, [color, currentSize, svgContent]);

  const previewSvg = useMemo(() => {
    if (!processedSvg) {
      return '';
    }

    return processedSvg
      .replace(/width="[^"]+"/, 'width="100%"')
      .replace(/height="[^"]+"/, 'height="100%"');
  }, [processedSvg]);

  const copyButtonLabel =
    copyStatus === 'success' ? 'Copiado' : copyStatus === 'error' ? 'Falha ao copiar' : 'Copiar';

  const copyToClipboard = async (text: string) => {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('success');
    } catch {
      setCopyStatus('error');
    }

    if (copyFeedbackTimerRef.current !== null) {
      window.clearTimeout(copyFeedbackTimerRef.current);
    }

    copyFeedbackTimerRef.current = window.setTimeout(() => {
      setCopyStatus('idle');
    }, 2000);
  };

  const handleDownload = (format: 'svg' | 'png') => {
    if (!processedSvg) {
      return;
    }

    if (format === 'svg') {
      const blob = new Blob([processedSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${icon.name}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const image = new Image();
    const svgBlob = new Blob([processedSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    image.onload = () => {
      canvas.width = currentSize;
      canvas.height = currentSize;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, currentSize, currentSize);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `${icon.name}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
    };

    image.src = url;
  };

  const handleBackdropClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="icon-detail-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-card shadow-2xl md:flex-row">
        <div className="relative flex min-h-[300px] w-full flex-col items-center justify-center border-b border-slate-700 bg-slate-950 p-8 md:w-5/12 md:border-b-0 md:border-r">
          <h2 id="icon-detail-title" className="absolute left-6 top-6 text-lg font-bold tracking-tight text-white">
            {icon.name}
          </h2>
          <span className="absolute right-6 top-7 rounded bg-slate-900 px-2 py-1 font-mono text-xs text-slate-500">
            {icon.prefix}
          </span>

          <div className="relative flex h-[200px] w-[200px] items-center justify-center transition-all duration-300">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {loading ? (
              <div className="z-10 flex items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-600 border-t-primary" />
              </div>
            ) : processedSvg ? (
              <div
                className="z-10 transition-all duration-300 drop-shadow-2xl"
                dangerouslySetInnerHTML={{ __html: previewSvg }}
              />
            ) : (
              <p className="z-10 max-w-[180px] text-center text-sm text-slate-500">
                Nao foi possivel preparar a visualizacao deste icone.
              </p>
            )}
          </div>

          <div className="absolute bottom-6 font-mono text-xs text-slate-500">
            {currentSize}x{currentSize}px
          </div>
        </div>

        <div className="relative flex w-full flex-col bg-card md:w-7/12">
          <div className="flex justify-end border-b border-slate-800/50 p-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
              aria-label="Fechar modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="custom-scrollbar relative flex-1 overflow-y-auto px-8 pb-8">
            <div className="mb-8 mt-6">
              <div className="mb-4 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Cor</label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 p-1">
                  <div className="h-4 w-4 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                  <input
                    type="text"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                    className="w-20 bg-transparent text-xs uppercase text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => setColor(presetColor)}
                    className={cn(
                      'relative h-6 w-6 overflow-hidden rounded-full border-2 transition-all duration-200 focus:outline-none',
                      color === presetColor ? 'scale-110 border-white' : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: presetColor }}
                    title={presetColor}
                  >
                    {color === presetColor && (
                      <div className="absolute inset-0 rounded-full bg-white/30 blur-sm" />
                    )}
                  </button>
                ))}

                <div className="relative">
                  <button
                    ref={colorButtonRef}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setShowColorPicker((currentValue) => !currentValue);
                    }}
                    className={cn(
                      'relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 bg-slate-800 transition-all duration-200 hover:scale-105 hover:bg-slate-700',
                      PRESET_COLORS.includes(color) ? 'border-slate-600' : 'scale-110 border-white',
                      showColorPicker && 'border-primary ring-2 ring-primary/50'
                    )}
                    title="Cor personalizada"
                  >
                    {!PRESET_COLORS.includes(color) && (
                      <div className="absolute inset-0 rounded-full" style={{ backgroundColor: color }} />
                    )}
                    <Pipette
                      className={cn(
                        'relative z-10 h-3 w-3 transition-colors',
                        PRESET_COLORS.includes(color) ? 'text-slate-300' : 'text-white'
                      )}
                    />
                    {!PRESET_COLORS.includes(color) && (
                      <div className="absolute inset-0 rounded-full bg-white/30 blur-sm" />
                    )}
                  </button>

                  {showColorPicker && (
                    <div
                      ref={colorPickerRef}
                      className="absolute right-0 top-8 z-50 min-w-[200px] rounded-xl border border-slate-700 bg-slate-900 p-4 shadow-2xl"
                    >
                      <HexColorPicker color={color} onChange={setColor} style={{ width: '100%', height: '150px' }} />

                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 p-1.5">
                        <div className="h-4 w-4 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                        <input
                          type="text"
                          value={color}
                          onChange={(event) => setColor(event.target.value)}
                          className="flex-1 bg-transparent text-xs uppercase text-slate-300 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="mb-5 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Tamanho</label>
                <span className="rounded-lg border border-primary/30 bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary shadow-sm">
                  {currentSize}px
                </span>
              </div>

              <div className="relative flex h-14 select-none items-center px-1">
                <div className="pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2">
                  {PRESET_SIZES.map((size, index) => {
                    const tickPosition =
                      index === 0
                        ? '0%'
                        : index === PRESET_SIZES.length - 1
                          ? '100%'
                          : `${(index / (PRESET_SIZES.length - 1)) * 100}%`;

                    return (
                      <div
                        key={size}
                        className="absolute flex flex-col items-center"
                        style={{ left: tickPosition, top: '0', transform: 'translateX(-50%)' }}
                      >
                        <div
                          className={cn(
                            'rounded-full',
                            !isDragging && 'transition-all duration-150',
                            index <= sizeIndex
                              ? 'h-2 w-2 z-20 bg-primary shadow-sm shadow-primary/50 ring-2 ring-primary/30'
                              : 'h-1.5 w-1.5 z-20 bg-slate-600'
                          )}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="absolute left-0 right-0 top-1/2 z-10 h-1.5 -translate-y-1/2 translate-y-[2px] rounded-full bg-slate-800/50" />

                <div
                  className={cn(
                    'absolute left-0 top-1/2 z-10 h-1.5 -translate-y-1/2 translate-y-[1px] rounded-full bg-gradient-to-r from-primary via-blue-500 to-primary shadow-sm shadow-primary/30',
                    !isDragging && 'transition-all duration-150 ease-out'
                  )}
                  style={{ width: `${(sizeIndex / (PRESET_SIZES.length - 1)) * 100}%` }}
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
                  onChange={(event) => setSizeIndex(Number.parseInt(event.target.value, 10))}
                  className="absolute inset-0 z-30 h-full w-full cursor-pointer opacity-0"
                />

                <div
                  className={cn(
                    'pointer-events-none absolute z-30 h-6 w-6',
                    !isDragging && 'transition-all duration-150 ease-out'
                  )}
                  style={{
                    left: `${(sizeIndex / (PRESET_SIZES.length - 1)) * 100}%`,
                    top: 'calc(50% + 2px)',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="absolute inset-0 rounded-full bg-primary/20 blur-md" />
                  <div className="relative h-6 w-6 rounded-full border-2 border-white/20 bg-gradient-to-br from-primary to-blue-600 ring-2 ring-primary/30 shadow-lg shadow-primary/40" />
                </div>
              </div>

              <div className="relative mt-1 px-1">
                {PRESET_SIZES.map((size, index) => {
                  const labelPosition =
                    index === 0
                      ? '0%'
                      : index === PRESET_SIZES.length - 1
                        ? '100%'
                        : `${(index / (PRESET_SIZES.length - 1)) * 100}%`;

                  return (
                    <span
                      key={size}
                      className="absolute text-[10px] font-semibold text-slate-500"
                      style={{ left: labelPosition, transform: 'translateX(-50%)' }}
                    >
                      {size}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/50 px-3 py-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Code2 className="h-3 w-3" />
                    <span className="font-semibold">Codigo SVG</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => void copyToClipboard(processedSvg)}
                    className={cn(
                      'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-slate-800',
                      copyStatus === 'success'
                        ? 'text-green-400'
                        : copyStatus === 'error'
                          ? 'text-red-400'
                          : 'text-primary hover:text-blue-400'
                    )}
                  >
                    {copyStatus === 'success' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copyButtonLabel}
                  </button>
                </div>

                <pre className="custom-scrollbar h-24 overflow-y-auto whitespace-pre-wrap break-all bg-transparent p-4 font-mono text-[11px] leading-relaxed text-slate-300">
                  {processedSvg}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDownload('svg')}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-3 text-sm font-medium text-white transition-colors duration-200 hover:border-slate-600 hover:bg-slate-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar SVG</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload('png')}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-white shadow-lg shadow-primary/20 transition-colors duration-200 hover:bg-blue-600"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar PNG</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}
