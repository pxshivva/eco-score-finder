import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, Loader2 } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isLoading?: boolean;
}

export default function BarcodeScanner({ onScan, isLoading }: BarcodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isCameraActive) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
        setError(null);
      } catch (err) {
        setError('Unable to access camera. Please check permissions.');
        setIsCameraActive(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraActive]);

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    // In a real app, you'd use a barcode detection library like jsQR or quagga
    // For now, we'll simulate barcode detection
    const imageData = canvasRef.current.toDataURL('image/jpeg');
    
    // Simulate barcode detection (in production, use a library like jsQR)
    console.log('Frame captured for barcode detection');
    
    // For demo purposes, show a message
    setError('Barcode detection requires a barcode scanning library. Please use the search bar instead.');
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
        disabled={isLoading}
      >
        <Camera className="w-4 h-4" />
        Scan Barcode
      </Button>
    );
  }

  return (
    <Card className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 rounded-none">
      <div className="w-full h-full flex flex-col items-center justify-center p-4">
        {!isCameraActive ? (
          <div className="text-center">
            <Camera className="w-16 h-16 text-white mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Scan Product Barcode</h2>
            <p className="text-gray-300 mb-8 max-w-md">
              Point your camera at a product barcode to search for it instantly.
            </p>
            <Button
              onClick={() => setIsCameraActive(true)}
              className="mb-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Scanning...
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Open Camera
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg mb-4"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 p-4 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={captureFrame}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Capture'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={stopCamera}
                className="flex-1"
              >
                Close Camera
              </Button>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            stopCamera();
            setIsOpen(false);
            setError(null);
          }}
          className="absolute top-4 right-4 text-white hover:bg-white/20"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>
    </Card>
  );
}
