import React, { useState, useEffect } from 'react';
import { FaBarcode, FaCamera, FaExclamationTriangle } from 'react-icons/fa';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';

export const BikeScanner = ({ onScan }) => {
  const [barcode, setBarcode] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState('');

  useEffect(() => {
    let scanner = null;

    if (showScanner) {
      setScannerError('');

      scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
          showTorchButtonIfSupported: true,
          formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], // All barcode formats
          videoConstraints: {
            facingMode: "environment"
          }
        },
        /* verbose= */ false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear().catch(err => console.error(err));
          setShowScanner(false);
          toast.success('Barcode scanned!');
          onScan(decodedText);
        },
        (error) => {
          // Convert error to string for checking
          const errorString = String(error);

          // Only handle critical camera errors, not scanning errors
          if (errorString.includes('NotAllowedError') ||
              errorString.includes('NotFoundError') ||
              errorString.includes('AbortError') ||
              errorString.includes('NotReadableError')) {
            console.error("Camera error:", error);

            let errorMessage = 'Failed to start camera. ';
            if (errorString.includes('NotAllowedError')) {
              errorMessage += 'Please allow camera permissions.';
            } else if (errorString.includes('NotFoundError')) {
              errorMessage += 'No camera found on this device.';
            } else if (errorString.includes('AbortError')) {
              errorMessage += 'Camera is in use by another app or timed out.';
            } else if (errorString.includes('NotReadableError')) {
              errorMessage += 'Camera is already in use.';
            }

            setScannerError(errorMessage);
            setShowScanner(false);
            toast.error(errorMessage);
          }
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => {
          console.error("Failed to clear html5-qrcode scanner. ", error);
        });
      }
    };
  }, [showScanner, onScan]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (barcode.trim()) {
      onScan(barcode.trim());
      setBarcode('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <FaBarcode className="text-4xl text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Scan Bike Barcode
          </h2>
          <p className="text-gray-500">
            Scan or enter the bike's barcode to start assembly
          </p>
        </div>

        {scannerError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-medium">Camera Error</p>
                <p className="text-xs text-red-700 mt-1">{scannerError}</p>
                <p className="text-xs text-red-600 mt-2">
                  • Check if camera permissions are granted<br />
                  • Try using manual entry below<br />
                  • Ensure no other app is using the camera
                </p>
              </div>
            </div>
          </div>
        )}

        {showScanner ? (
          <div className="mb-6">
            <div className="bg-gray-100 rounded-lg p-2">
              <div id="reader" className="w-full"></div>
            </div>
            <button
              onClick={() => {
                setShowScanner(false);
                setScannerError('');
              }}
              className="mt-4 w-full py-2 text-sm text-red-600 hover:text-red-700 font-medium border border-red-300 rounded-lg hover:bg-red-50"
            >
              Cancel Camera Scan
            </button>
            <p className="mt-3 text-xs text-center text-gray-600">
              Position the barcode within the camera view
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <button
              onClick={() => setShowScanner(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-4"
            >
              <FaCamera />
              Scan with Camera
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or enter manually</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="barcode"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Barcode / Serial Number
            </label>
            <input
              type="text"
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="Enter or scan barcode"
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus={!showScanner}
              autoComplete="off"
            />
          </div>

          <button
            type="submit"
            disabled={!barcode.trim()}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Start Assembly
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">📱 Scanning Tips:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Allow camera permissions when prompted</li>
            <li>• Ensure good lighting for best results</li>
            <li>• Hold the barcode steady in the camera view</li>
            <li>• Manual entry works for all barcode types</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
