import { QRCodeSVG } from 'qrcode.react';
import { useRef } from 'react';
import { useThemeStyles } from '../context/useThemeStyles';

interface QRCodeGeneratorProps {
  restaurantId: string;
  restaurantName: string;
}

export function QRCodeGenerator({
  restaurantId,
  restaurantName,
}: QRCodeGeneratorProps) {
  const themeStyles = useThemeStyles();
  const qrRef = useRef<HTMLDivElement>(null);

  const qrUrl = `${import.meta.env.VITE_APP_URL || 'https://menu-cards.vercel.app'}/r/${restaurantId}`;

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = function () {
      canvas.width = svg.clientWidth;
      canvas.height = svg.clientHeight;
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${restaurantId}-menu-qr.png`;
      link.click();
    };
    const svgData = new XMLSerializer().serializeToString(svg);
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const printQR = () => {
    const printWindow = window.open('', '', 'width=400,height=500');
    if (!printWindow) return;

    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);

    printWindow.document.write(`
      <html>
        <head>
          <title>${restaurantName} - Menu QR Code</title>
          <style>
            body { display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: Arial, sans-serif; }
            .container { text-align: center; }
            h1 { margin: 0 0 20px 0; }
            svg { border: 2px solid #ccc; padding: 10px; }
            p { color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${restaurantName}</h1>
            ${svgData}
            <p>Scan this code to view the menu</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 rounded-lg shadow-lg" style={{ backgroundColor: themeStyles.backgroundColor }}>
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {restaurantName}
        </h3>
        <p className="text-sm text-gray-600">Menu QR Code</p>
      </div>

      <div
        ref={qrRef}
        id="qr-code"
        className="p-6 border-2 rounded"
        style={{ backgroundColor: themeStyles.backgroundColor, borderColor: themeStyles.accentBg }}
      >
        <QRCodeSVG
          value={qrUrl}
          size={256}
          level="H"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      <div className="text-center max-w-md">
        <p className="text-xs text-gray-500 mb-4 break-all">
          {qrUrl}
        </p>
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={downloadQR}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          📥 Download QR
        </button>
        <button
          onClick={printQR}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          🖨️ Print QR
        </button>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-gray-700 max-w-md">
        <p className="font-semibold mb-2">How to use:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Download or print this QR code</li>
          <li>Display it at your restaurant entrance or table</li>
          <li>Customers scan with their phone camera</li>
          <li>Menu loads instantly</li>
        </ol>
      </div>
    </div>
  );
}
