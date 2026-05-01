'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useLayerManager, TextLayer } from '@/context/useLayerManager';
import { Button } from '@/components/ui/button';
import { UploadIcon, DownloadIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { removeBackground, Config } from "@imgly/background-removal";
import { getFontFamily } from "@/lib/fontLoader";
import { useDragToMove } from '@/hooks/use-drag-to-move';
import { usePinchToZoom } from '@/hooks/use-pinch-to-zoom';
import { getFilterCSSStringWithIntensity, applyFilter } from '@/lib/filters';

const TextLayerComponent = ({ textSet, handleAttributeChange, previewContainerRef, applyFilterToText, selectedFilter, filterIntensity }: { textSet: TextLayer, handleAttributeChange: (id: string, attribute: string, value: any) => void, previewContainerRef: React.RefObject<HTMLDivElement>, applyFilterToText: boolean, selectedFilter: string, filterIntensity: number }) => {
    const textRef = useRef<HTMLDivElement>(null);

    const handleDrag = useCallback((dx: number, dy: number) => {
        if (!previewContainerRef.current) return;
        const rect = previewContainerRef.current.getBoundingClientRect();
        const newLeft = textSet.left + (dx / rect.width) * 100;
        const newTop = textSet.top - (dy / rect.height) * 100;
        handleAttributeChange(textSet.id, 'left', Math.max(Math.min(newLeft, 50), -50));
        handleAttributeChange(textSet.id, 'top', Math.max(Math.min(newTop, 50), -50));
    }, [textSet.left, textSet.top, handleAttributeChange, textSet.id, previewContainerRef]);

    const handleZoom = useCallback((delta: number) => {
        const newSize = Math.max(10, Math.min(800, textSet.fontSize + delta));
        handleAttributeChange(textSet.id, 'fontSize', newSize);
    }, [textSet.fontSize, handleAttributeChange, textSet.id]);

    useDragToMove({ containerRef: textRef, onDrag: handleDrag });
    usePinchToZoom({ containerRef: textRef, onZoom: handleZoom });

    return (
        <div
            ref={textRef}
            style={{
                position: 'absolute',
                top: `${50 - textSet.top}%`,
                left: `${textSet.left + 50}%`,
                transform: `
            translate(-50%, -50%)
            rotate(${textSet.rotation}deg)
            perspective(1000px)
            rotateX(${textSet.tiltX}deg)
            rotateY(${textSet.tiltY}deg)
        `,
                color: textSet.color,
                textAlign: 'center',
                fontSize: `${textSet.fontSize}px`,
                fontWeight: textSet.fontWeight,
                fontFamily: getFontFamily(textSet.fontFamily),
                opacity: textSet.opacity,
                letterSpacing: `${textSet.letterSpacing}px`,
                transformStyle: 'preserve-3d',
                textShadow: textSet.shadowSize > 0 ? `0 ${textSet.shadowSize}px ${textSet.shadowSize * 2}px ${textSet.shadowColor}` : 'none',
                filter: applyFilterToText ? getFilterCSSStringWithIntensity(selectedFilter, filterIntensity) : 'none',
                cursor: 'grab',
                transition: 'all 0.2s ease-out'
            }}
            className="hover:scale-105 active:scale-95"
        >
            {textSet.text}
        </div>
    );
};

export const PreviewSection = () => {
    const { layers, handleAttributeChange, setLayers, selectedFilter, filterIntensity, setUploadedImageElement, backgroundBlur, applyFilterToText } = useLayerManager();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [subjectImageUrl, setSubjectImageUrl] = useState<string | null>(null);
    const [processingProgress, setProcessingProgress] = useState<number>(0);
    const [progressFading, setProgressFading] = useState<boolean>(false);
    const [imageBounds, setImageBounds] = useState<{ width: number; height: number; left: number; top: number } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const imageCache = useRef<Map<string, string>>(new Map());

    // Calculate actual image render bounds
    useEffect(() => {
        if (!selectedImage || !previewContainerRef.current) return;

        const img = new (window as any).Image();
        img.onload = () => {
            const container = previewContainerRef.current;
            if (!container) return;

            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const imageAspect = img.naturalWidth / img.naturalHeight;
            const containerAspect = containerWidth / containerHeight;

            let renderWidth, renderHeight, left, top;

            if (imageAspect > containerAspect) {
                // Image is wider - fit to width
                renderWidth = containerWidth;
                renderHeight = containerWidth / imageAspect;
                left = 0;
                top = (containerHeight - renderHeight) / 2;
            } else {
                // Image is taller - fit to height
                renderHeight = containerHeight;
                renderWidth = containerHeight * imageAspect;
                top = 0;
                left = (containerWidth - renderWidth) / 2;
            }

            setImageBounds({ width: renderWidth, height: renderHeight, left, top });
        };
        img.src = selectedImage;
    }, [selectedImage]);

    // Trickle progress forward while loading so the bar never looks stuck
    useEffect(() => {
        if (!isLoading) { setProgressFading(false); return; }
        const id = setInterval(() => {
            setProcessingProgress(prev => {
                if (prev >= 88) return prev;
                return Math.min(88, prev + Math.random() * 1.2 + 0.3);
            });
        }, 500);
        return () => clearInterval(id);
    }, [isLoading]);

    const handleUploadImage = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setError(null);
            setIsLoading(true);
            setSubjectImageUrl(null);
            setProgressFading(false);
            setProcessingProgress(0);
            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
            await setupImage(imageUrl, file);
        }
    };

    // Create HTMLImageElement for filter previews
    useEffect(() => {
        if (selectedImage) {
            const img = new (window as any).Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                setUploadedImageElement(img);
            };
            img.src = selectedImage;
        } else {
            setUploadedImageElement(null);
        }
    }, [selectedImage, setUploadedImageElement]);

    // Optimize image before processing if it's too large
    const optimizeImage = async (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const img = document.createElement('img');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1080;
                let width = img.width;
                let height = img.height;

                // Only resize if image is larger than max dimensions
                if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                    const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
                    width = width * ratio;
                    height = height * ratio;
                }

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to optimize image'));
                    }
                }, 'image/jpeg', 0.9);
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = URL.createObjectURL(file);
        });
    };

    const setupImage = async (imageUrl: string, file: File) => {
        try {
            // Check cache first
            const cacheKey = `${file.name}-${file.size}`;
            if (imageCache.current.has(cacheKey)) {
                const cachedUrl = imageCache.current.get(cacheKey)!;
                setSubjectImageUrl(cachedUrl);
                setIsLoading(false);
                return;
            }

            // Optimize image if needed
            setProcessingProgress(prev => Math.max(prev, 10));
            const optimizedBlob = await optimizeImage(file);
            const optimizedUrl = URL.createObjectURL(optimizedBlob);

            setProcessingProgress(prev => Math.max(prev, 20));

            // Configure background removal for better performance
            const config: Config = {
                progress: (key, current, total) => {
                    // Ratchet: only ever move forward (20% to 90%)
                    const percentage = 20 + Math.round((current / total) * 70);
                    setProcessingProgress(prev => Math.max(prev, percentage));
                },
                model: 'isnet_fp16', // Use fp16 model for better speed while maintaining quality
                output: {
                    format: 'image/png',
                    quality: 0.8,
                }
            };

            const imageBlob = await removeBackground(optimizedUrl, config);
            setProcessingProgress(prev => Math.max(prev, 95));

            const url = URL.createObjectURL(imageBlob);
            setSubjectImageUrl(url);

            // Cache the result
            imageCache.current.set(cacheKey, url);

            setProcessingProgress(prev => Math.max(prev, 100));
            // Fade out bar after 300ms, then fully reset after 800ms
            setTimeout(() => setProgressFading(true), 300);

            // Clean up optimized URL
            URL.revokeObjectURL(optimizedUrl);
        } catch (err) {
            console.error(err);
            setError("Sorry, we couldn't remove the background from this image.");
        } finally {
            setIsLoading(false);
        }
    };

    const saveCompositeImage = () => {
        if (!canvasRef.current || isLoading || !previewContainerRef.current) return;

        const container = previewContainerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const sortedLayers = [...layers].sort((a, b) => a.order - b.order);

        const bgImg = new (window as any).Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.onload = () => {
            const imageWidth = bgImg.naturalWidth;
            const imageHeight = bgImg.naturalHeight;

            canvas.width = imageWidth;
            canvas.height = imageHeight;

            const ratio = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
            const fontScale = 1 / ratio;

            const renderLayerOnCanvas = (layer: any) => {
                return new Promise<void>((resolve) => {
                    // Get color filter string
                    const colorFilter = (selectedFilter && selectedFilter !== 'original')
                        ? getFilterCSSStringWithIntensity(selectedFilter, filterIntensity)
                        : '';

                    if (layer.type === 'full') {
                        // Combine blur and color filter for background
                        let combinedFilter = '';

                        if (backgroundBlur > 0) {
                            const maxBlurRadius = 15;
                            const blurRadius = (backgroundBlur / 100) * maxBlurRadius * (canvas.width / 1000);
                            combinedFilter = `blur(${blurRadius}px)`;
                        }

                        if (colorFilter) {
                            combinedFilter = combinedFilter ? `${combinedFilter} ${colorFilter}` : colorFilter;
                        }

                        ctx.filter = combinedFilter || 'none';
                        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
                        ctx.filter = 'none';
                        resolve();
                    } else if (layer.type === 'subject' && subjectImageUrl) {
                        const subjectImg = new (window as any).Image();
                        subjectImg.crossOrigin = "anonymous";
                        subjectImg.onload = () => {
                            // Apply only color filter to subject, no blur
                            ctx.filter = colorFilter || 'none';
                            ctx.drawImage(subjectImg, 0, 0, canvas.width, canvas.height);
                            ctx.filter = 'none';
                            resolve();
                        };
                        subjectImg.src = subjectImageUrl;
                    } else if (layer.type === 'text') {
                        const textSet = layer as TextLayer;
                        ctx.save();

                        // Apply only color filter to text, no blur
                        if (colorFilter) {
                            ctx.filter = colorFilter;
                        }

                        const scaledFontSize = textSet.fontSize * fontScale;
                        ctx.font = `${textSet.fontWeight} ${scaledFontSize}px ${getFontFamily(textSet.fontFamily)}`;
                        ctx.fillStyle = textSet.color;
                        ctx.globalAlpha = textSet.opacity;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.letterSpacing = `${textSet.letterSpacing}px`;

                        // Apply shadow if shadowSize > 0
                        if (textSet.shadowSize > 0) {
                            ctx.shadowColor = textSet.shadowColor;
                            ctx.shadowBlur = textSet.shadowSize * 2;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = textSet.shadowSize;
                        }

                        const x = canvas.width * (textSet.left + 50) / 100;
                        const y = canvas.height * (50 - textSet.top) / 100;

                        ctx.translate(x, y);

                        const tiltXRad = (-textSet.tiltX * Math.PI) / 180;
                        const tiltYRad = (-textSet.tiltY * Math.PI) / 180;

                        ctx.transform(
                            Math.cos(tiltYRad),
                            Math.sin(0),
                            -Math.sin(0),
                            Math.cos(tiltXRad),
                            0,
                            0
                        );

                        ctx.rotate((textSet.rotation * Math.PI) / 180);

                        if (textSet.letterSpacing === 0) {
                            ctx.fillText(textSet.text, 0, 0);
                        } else {
                            const chars = textSet.text.split('');
                            let currentX = 0;
                            const totalWidth = chars.reduce((width, char, i) => {
                                const charWidth = ctx.measureText(char).width;
                                return width + charWidth + (i < chars.length - 1 ? textSet.letterSpacing : 0);
                            }, 0);

                            currentX = -totalWidth / 2;

                            chars.forEach((char, i) => {
                                const charWidth = ctx.measureText(char).width;
                                ctx.fillText(char, currentX + charWidth / 2, 0);
                                currentX += charWidth + textSet.letterSpacing;
                            });
                        }
                        ctx.restore();
                        resolve();
                    } else {
                        resolve();
                    }
                });
            };

            const processLayers = async () => {
                for (const layer of sortedLayers) {
                    if (layer.visible) {
                        await renderLayerOnCanvas(layer);
                    }
                }

                triggerDownload();
            };

            processLayers();
        };
        bgImg.src = selectedImage || '';

        function triggerDownload() {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'text-behind-image.png';
            link.href = dataUrl;
            link.click();
        }
    };

    return (
        <div className='h-full flex flex-col overflow-hidden'>

            {/* ── Hidden file input (always mounted) ── */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept=".jpg, .jpeg, .png"
            />

            {selectedImage ? (
                /* ═══════════════════════════════════════
                   EDITOR VIEW — header + canvas workspace
                   ═══════════════════════════════════════ */
                <>
                    {/* Slim header */}
                    <header className='flex-shrink-0 flex items-center justify-between px-4 sm:px-5 h-12 border-b border-white/[0.06]'
                        style={{ background: 'rgba(10,10,15,0.8)', backdropFilter: 'blur(20px)' }}>
                        <div className="flex items-center gap-2">
                            <img src="/img/logo.png" alt="Logo" className="h-6 w-6 rounded-md object-cover" />
                            <span className="text-sm font-semibold tracking-tight text-gradient-violet select-none">TextFX</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Change image */}
                            <button onClick={handleUploadImage}
                                className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-white/80 hover:border-white/20 transition-all"
                                title="Change image">
                                <UploadIcon className="h-3.5 w-3.5" />
                            </button>
                            {/* Export */}
                            <button onClick={saveCompositeImage}
                                className="btn-violet h-8 px-4 text-xs min-h-[44px] flex items-center gap-1.5">
                                <DownloadIcon className="h-3.5 w-3.5" />
                                Export
                            </button>
                        </div>
                    </header>

                    {/* Canvas workspace */}
                    <main className='flex-1 overflow-auto p-3 sm:p-5 flex items-start justify-center'>
                        <div className='w-full'>
                            <canvas ref={canvasRef} className="hidden" />
                            <div
                                ref={previewContainerRef}
                                className="aspect-video w-full max-w-full rounded-xl sm:rounded-2xl relative overflow-hidden flex items-center justify-center"
                                style={{
                                    touchAction: 'none',
                                    background: '#050507',
                                    boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 20px 60px rgba(0,0,0,0.7), 0 0 80px rgba(167,139,250,0.04)'
                                }}
                            >
                                {isLoading ? (
                                    /* Violet spinner + progress */
                                    <div className='flex flex-col items-center gap-5 p-6 rounded-2xl w-full max-w-[280px]'
                                        style={{ background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(24px)' }}>
                                        <div className="relative w-12 h-12">
                                            <div className="absolute inset-0 rounded-full border border-white/5" />
                                            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-400 animate-spin" style={{ animationDuration: '0.9s' }} />
                                            <div className="absolute inset-[5px] rounded-full border border-violet-500/20" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-semibold text-white/90">Removing background</p>
                                            <p className="text-xs text-white/35">AI is processing your image…</p>
                                        </div>
                                        <div className="w-full space-y-1.5">
                                            <div className="w-full bg-white/[0.06] rounded-full h-1 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${progressFading ? 'opacity-0' : 'opacity-100'}`}
                                                    style={{
                                                        width: `${processingProgress}%`,
                                                        background: 'linear-gradient(90deg, #a78bfa, #38bdf8)',
                                                        transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.5s ease',
                                                        boxShadow: '0 0 8px rgba(167,139,250,0.6)'
                                                    }}
                                                />
                                            </div>
                                            <p className="text-right text-[10px] text-white/25 tabular-nums">{Math.round(processingProgress)}%</p>
                                        </div>
                                    </div>
                                ) : error ? (
                                    <div className="flex flex-col items-center gap-3 text-center p-6 rounded-2xl mx-4"
                                        style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)' }}>
                                        <ExclamationTriangleIcon className="w-9 h-9 text-red-400" />
                                        <div>
                                            <h3 className="text-sm font-semibold text-red-400">Processing failed</h3>
                                            <p className="text-xs text-red-400/60 mt-0.5">{error}</p>
                                        </div>
                                        <button onClick={handleUploadImage}
                                            className="px-4 py-2 rounded-xl text-xs font-medium border border-red-500/25 text-red-400 hover:bg-red-500/10 transition-colors">
                                            Try another image
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        className="absolute overflow-hidden"
                                        style={imageBounds ? {
                                            width: `${imageBounds.width}px`,
                                            height: `${imageBounds.height}px`,
                                            left: `${imageBounds.left}px`,
                                            top: `${imageBounds.top}px`
                                        } : { inset: 0 }}
                                    >
                                        {[...layers].filter(l => l.visible).sort((a, b) => a.order - b.order).map(layer => {
                                            switch (layer.type) {
                                                case 'full':
                                                    return (
                                                        <Image key={layer.id} src={selectedImage} alt="Full Image"
                                                            layout="fill" objectFit="contain" objectPosition="center"
                                                            className="absolute inset-0 object-contain pointer-events-none"
                                                            draggable={false}
                                                            style={{
                                                                filter: [
                                                                    backgroundBlur > 0 ? `blur(${(backgroundBlur / 100) * 15}px)` : '',
                                                                    getFilterCSSStringWithIntensity(selectedFilter, filterIntensity)
                                                                ].filter(Boolean).join(' ') || 'none',
                                                                transition: 'filter 0.1s ease-out'
                                                            }}
                                                        />
                                                    );
                                                case 'subject':
                                                    return subjectImageUrl && (
                                                        <Image key={layer.id} src={subjectImageUrl} alt="Subject Only"
                                                            layout="fill" objectFit="contain" objectPosition="center"
                                                            className="absolute inset-0 object-contain pointer-events-none"
                                                            draggable={false}
                                                            style={{ filter: getFilterCSSStringWithIntensity(selectedFilter, filterIntensity) }}
                                                        />
                                                    );
                                                case 'text':
                                                    const textSet = layer as TextLayer;
                                                    return (
                                                        <TextLayerComponent key={textSet.id} textSet={textSet}
                                                            handleAttributeChange={handleAttributeChange}
                                                            previewContainerRef={previewContainerRef}
                                                            applyFilterToText={applyFilterToText}
                                                            selectedFilter={selectedFilter}
                                                            filterIntensity={filterIntensity}
                                                        />
                                                    );
                                                default: return null;
                                            }
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </>
            ) : (
                /* ═══════════════════════════════════════════════
                   LANDING VIEW — full-page upload + examples
                   ═══════════════════════════════════════════════ */
                <div className='flex-1 flex flex-col items-center justify-start overflow-auto px-5 pt-10 pb-16'>

                    {/* Logo */}
                    <div className="mb-6">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden ring-1 ring-white/10"
                            style={{ boxShadow: '0 12px 40px rgba(167,139,250,0.15)' }}>
                            <img src="/img/logo.png" alt="TextFX" className="w-full h-full object-cover" />
                        </div>
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-center mb-3 leading-[1.1]">
                        <span className="text-white">Text </span>
                        <span className="text-gradient-violet">Behind</span>
                        <span className="text-white"> Image</span>
                    </h1>
                    <p className="text-sm sm:text-base text-white/40 text-center max-w-sm mb-10 leading-relaxed">
                        Upload a photo — AI removes the background so your text appears <em className="not-italic text-violet-300">behind</em> the subject.
                    </p>

                    {/* Upload drop-zone */}
                    <button
                        onClick={handleUploadImage}
                        className="group w-full max-w-md mb-10 flex flex-col items-center gap-4 p-8 sm:p-10 rounded-2xl border-2 border-dashed border-white/15 hover:border-violet-500/60 transition-all duration-200 min-h-[180px] sm:min-h-[200px]"
                        style={{
                            background: 'rgba(255,255,255,0.02)',
                            boxShadow: '0 0 0 0 transparent'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 40px rgba(167,139,250,0.08)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 0 transparent')}
                    >
                        <div className="w-12 h-12 rounded-xl border border-violet-500/25 bg-violet-500/10 group-hover:bg-violet-500/18 flex items-center justify-center transition-colors">
                            <UploadIcon className="h-5 w-5 text-violet-400" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                                Drop your image here
                            </p>
                            <p className="text-xs text-white/30">or click to browse &middot; JPG or PNG</p>
                        </div>
                    </button>

                    {/* Before / After examples */}
                    <div className="w-full max-w-2xl space-y-5">
                        <p className="text-xs uppercase tracking-widest text-white/30 text-center">Examples</p>

                        {/* ── Landscape pair (bike) — 16:10 frames ── */}
                        <div>
                            <p className="text-[9px] uppercase tracking-widest text-white/20 mb-2 ml-0.5">Bike / vehicle</p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { src: '/img/example-before-2.webp', label: 'Before', ring: 'rgba(255,255,255,0.06)', labelCls: 'text-white/40 bg-black/50' },
                                    { src: '/img/example-after-2.webp',  label: 'After',  ring: 'rgba(167,139,250,0.25)', labelCls: 'text-violet-300/80 bg-violet-900/50' },
                                ].map(({ src, label, ring, labelCls }) => (
                                    <div key={label} className="relative rounded-xl overflow-hidden bg-[#050507]"
                                        style={{ aspectRatio: '16/10', boxShadow: `0 0 0 1px ${ring}` }}>
                                        <Image
                                            src={src}
                                            alt={`Bike ${label}`}
                                            fill
                                            sizes="(max-width: 640px) 45vw, 320px"
                                            className="object-contain"
                                            style={{ opacity: label === 'Before' ? 0.65 : 1 }}
                                        />
                                        <span className={`absolute top-2 left-2 text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded ${labelCls}`}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Portrait pair (person) — 2:3 frames ── */}
                        <div>
                            <p className="text-[9px] uppercase tracking-widest text-white/20 mb-2 ml-0.5">Portrait</p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { src: '/img/example-before-1.webp', label: 'Before', ring: 'rgba(255,255,255,0.06)', labelCls: 'text-white/40 bg-black/50' },
                                    { src: '/img/example-after-1.webp',  label: 'After',  ring: 'rgba(167,139,250,0.25)', labelCls: 'text-violet-300/80 bg-violet-900/50' },
                                ].map(({ src, label, ring, labelCls }) => (
                                    <div key={label} className="relative rounded-xl overflow-hidden bg-[#050507]"
                                        style={{ aspectRatio: '2/3', boxShadow: `0 0 0 1px ${ring}` }}>
                                        <Image
                                            src={src}
                                            alt={`Portrait ${label}`}
                                            fill
                                            sizes="(max-width: 640px) 45vw, 320px"
                                            className="object-contain"
                                            style={{ opacity: label === 'Before' ? 0.65 : 1 }}
                                        />
                                        <span className={`absolute top-2 left-2 text-[9px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded ${labelCls}`}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
