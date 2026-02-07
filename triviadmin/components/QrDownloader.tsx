'use client';

import { QrCode, Download } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useRef } from 'react';

interface QrDownloaderProps {
    machineId: string;
    machineName: string;
    className?: string;
}

export default function QrDownloader({ machineId, machineName, className }: QrDownloaderProps) {
    const svgRef = useRef<any>(null);

    const downloadQr = () => {
        const svg = svgRef.current;
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        // Add some margin and text
        const size = 500;
        const padding = 40;
        canvas.width = size;
        canvas.height = size + 60; // Extra space for text

        img.onload = () => {
            if (!ctx) return;

            // White background
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw QR
            ctx.drawImage(img, padding, padding, size - (padding * 2), size - (padding * 2));

            // Draw Text
            ctx.font = "bold 24px sans-serif";
            ctx.fillStyle = "black";
            ctx.textAlign = "center";
            ctx.fillText(machineName, size / 2, size - 15);
            ctx.font = "16px sans-serif";
            ctx.fillStyle = "#666";
            ctx.fillText(machineId, size / 2, size + 15);
            ctx.fillText("Escanea para Jugar", size / 2, size + 40);

            const pngFile = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.download = `QR_${machineName.replace(/\s+/g, '_')}_${machineId}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div className={className}>
            {/* Hidden QR for generation */}
            <div style={{ display: 'none' }}>
                <QRCode
                    ref={svgRef as any}
                    value={`${window.location.origin}/joystick/${machineId}`}
                    size={500}
                    viewBox={`0 0 256 256`}
                />
            </div>

            <button
                onClick={downloadQr}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
                title="Descargar QR para imprimir"
            >
                <QrCode className="w-4 h-4" />
                <Download className="w-3 h-3 ml-1" />
                <span className="hidden md:inline">QR</span>
            </button>
        </div>
    );
}
