import { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, Loader2, CheckCircle } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isLoading?: boolean;
}

export default function BarcodeScanner({ onScan, isLoading }: BarcodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isCameraActive) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setError(null);
          // Start scanning once video is ready
          videoRef.current.onloadedmetadata = () => {
            startScanning();
          };
        }
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
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isCameraActive]);

  const startScanning = () => {
    const scan = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) {
          animationFrameRef.current = requestAnimationFrame(scan);
          return;
        }

        // Set canvas dimensions to match video
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;

        // Draw video frame to canvas
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // Scan for QR code
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code) {
          // Found a QR code
          setDetectedCode(code.data);
          setIsProcessing(true);
          
          // Draw detection box
          drawDetectionBox(context, code);
          
          // Trigger callback after a short delay to show the detection
          setTimeout(() => {
            onScan(code.data);
            setIsOpen(false);
            setIsCameraActive(false);
            setDetectedCode(null);
            setIsProcessing(false);
          }, 500);
          
          return;
        }

        // Continue scanning
        animationFrameRef.current = requestAnimationFrame(scan);
      } else {
        animationFrameRef.current = requestAnimationFrame(scan);
      }
    };

    animationFrameRef.current = requestAnimationFrame(scan);
  };

  const drawDetectionBox = (context: CanvasRenderingContext2D, code: any) => {
    // Draw a box around detected QR code
    const points = code.location.topLeftCorner;
    const topRight = code.location.topRightCorner;
    const bottomRight = code.location.bottomRightCorner;
    const bottomLeft = code.location.bottomLeftCorner;

    context.strokeStyle = '#00ff00';
    context.lineWidth = 3;
    context.beginPath();
    context.moveTo(points.x, points.y);
    context.lineTo(topRight.x, topRight.y);
    context.lineTo(bottomRight.x, bottomRight.y);
    context.lineTo(bottomLeft.x, bottomLeft.y);
    context.lineTo(points.x, points.y);
    context.stroke();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsCameraActive(false);
    setDetectedCode(null);
    setError(null);
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
              Point your camera at a product barcode or QR code to search for it instantly. The app will automatically detect and decode the code.
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
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg mb-4"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Scanning indicator */}
              <div className="absolute inset-0 rounded-lg border-2 border-green-400 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-400 rounded-br-lg" />
              </div>

              {/* Scanning line animation */}
              <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-b from-transparent via-green-400 to-transparent animate-pulse" style={{
                  top: '50%',
                  animation: 'scan 2s infinite'
                }} />
              </div>
            </div>

            {detectedCode && (
              <div className="bg-green-500/20 border border-green-500 text-green-100 p-4 rounded-lg mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Barcode Detected!</p>
                  <p className="text-sm">{detectedCode}</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-100 p-4 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={stopCamera}
                variant="outline"
                className="flex-1 text-white border-white hover:bg-white/10"
              >
                Close Camera
              </Button>
            </div>

            <p className="text-gray-400 text-sm text-center mt-4">
              {detectedCode ? 'Barcode detected! Processing...' : 'Point camera at a barcode or QR code'}
            </p>
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

      <style>{`
        @keyframes scan {
          0% {
            top: 0%;
          }
          50% {
            top: 50%;
          }
          100% {
            top: 100%;
          }
        }
      `}</style>
    </Card>
  );
}
