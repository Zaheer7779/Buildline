import React, { useState } from 'react';
import { assemblyApi } from '../../services/api';
import { FaBarcode, FaCheckCircle, FaTimesCircle, FaLock } from 'react-icons/fa';
import toast from 'react-hot-toast';

/**
 * Sales Lock Checker Component
 * Use this component in your POS/Invoice system to verify bikes can be sold
 */
export const SalesLockChecker = ({ onBarcodeVerified }) => {
  const [barcode, setBarcode] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const handleCheck = async (e) => {
    e.preventDefault();

    if (!barcode.trim()) {
      toast.error('Please enter a barcode');
      return;
    }

    try {
      setChecking(true);
      setResult(null);

      const response = await assemblyApi.canInvoice(barcode.trim());
      const data = response.data.data;

      setResult(data);

      if (data.can_invoice) {
        toast.success('Bike is ready for sale!');
        if (onBarcodeVerified) {
          onBarcodeVerified(data);
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Check error:', error);
      toast.error('Failed to check bike status');
      setResult({
        can_invoice: false,
        message: 'Failed to verify bike status',
        barcode: barcode
      });
    } finally {
      setChecking(false);
    }
  };

  const handleReset = () => {
    setBarcode('');
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FaLock className="text-2xl text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Sales Lock Verification
            </h2>
            <p className="text-sm text-gray-500">
              Verify bike has passed QC before creating invoice
            </p>
          </div>
        </div>

        {/* Input Form */}
        {!result && (
          <form onSubmit={handleCheck} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bike Barcode / Serial Number
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan or enter barcode"
                className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                disabled={checking}
              />
            </div>

            <button
              type="submit"
              disabled={checking || !barcode.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {checking ? 'Checking...' : 'Verify Bike Status'}
            </button>
          </form>
        )}

        {/* Result Display */}
        {result && (
          <div className="space-y-4">
            {/* Status Banner */}
            <div
              className={`p-6 rounded-lg border-2 ${
                result.can_invoice
                  ? 'bg-green-50 border-green-500'
                  : 'bg-red-50 border-red-500'
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                {result.can_invoice ? (
                  <FaCheckCircle className="text-5xl text-green-600" />
                ) : (
                  <FaTimesCircle className="text-5xl text-red-600" />
                )}
                <div>
                  <h3
                    className={`text-2xl font-bold ${
                      result.can_invoice ? 'text-green-900' : 'text-red-900'
                    }`}
                  >
                    {result.can_invoice ? 'CAN INVOICE' : 'CANNOT INVOICE'}
                  </h3>
                  <p
                    className={`text-sm ${
                      result.can_invoice ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {result.message}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Barcode:</span> {result.barcode}
                </div>
                {result.sku && (
                  <div>
                    <span className="font-medium">Model:</span> {result.sku}
                  </div>
                )}
                {result.status && (
                  <div>
                    <span className="font-medium">Assembly Status:</span>{' '}
                    <span className="uppercase">{result.status}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {result.can_invoice && onBarcodeVerified && (
                <button
                  onClick={() => onBarcodeVerified(result)}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-green-700 transition-colors"
                >
                  Proceed to Invoice
                </button>
              )}
              <button
                onClick={handleReset}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Check Another Bike
              </button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 text-sm">
            How Sales Lock Works:
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>✓ Only bikes with "Ready for Sale" status can be invoiced</li>
            <li>✓ QC must have passed the bike</li>
            <li>✓ All assembly checklist items completed</li>
            <li>✗ Bikes still in assembly cannot be sold</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
