import { useState, useRef, useCallback, useEffect } from 'react';
import { FaCamera, FaTrash, FaImage, FaFolderOpen, FaTimes, FaSync } from 'react-icons/fa';
import toast from 'react-hot-toast';

// Live camera capture modal
const CameraModal = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');

  const startCamera = useCallback(async (facing) => {
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    setReady(false);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError('Could not access camera. Try using Gallery instead.');
      }
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [facingMode, startCamera]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onCapture({
      name: `photo_${Date.now()}.jpg`,
      type: 'image/jpeg',
      size: Math.round(dataUrl.length * 0.75),
      data: dataUrl,
      timestamp: new Date().toISOString()
    });
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <button onClick={onClose} className="text-white p-2">
          <FaTimes className="text-xl" />
        </button>
        <span className="text-white text-sm font-medium">Take Photo</span>
        <button onClick={toggleCamera} className="text-white p-2">
          <FaSync className="text-lg" />
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
        {error ? (
          <div className="text-center px-8">
            <FaCamera className="text-4xl text-gray-500 mx-auto mb-3" />
            <p className="text-white text-sm">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-white text-black rounded-lg text-sm font-medium"
            >
              Go Back
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Capture button */}
      {!error && (
        <div className="flex items-center justify-center py-6 bg-black/80">
          <button
            onClick={handleCapture}
            disabled={!ready}
            className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-all ${
              ready ? 'bg-white/20 active:bg-white/50 active:scale-90' : 'bg-gray-800 opacity-50'
            }`}
          >
            <div className="w-14 h-14 rounded-full bg-white" />
          </button>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export const PhotoUpload = ({ photos = [], onPhotosChange, maxPhotos = 5, disabled = false }) => {
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const galleryInputRef = useRef(null);

  const processFiles = async (files) => {
    if (files.length + photos.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setUploading(true);

    try {
      const newPhotos = await Promise.all(
        files.map((file) => {
          return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
              reject(new Error('Only image files are allowed'));
              return;
            }

            if (file.size > 5 * 1024 * 1024) {
              reject(new Error('Image size must be less than 5MB'));
              return;
            }

            const reader = new FileReader();

            reader.onload = (event) => {
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: event.target.result,
                timestamp: new Date().toISOString()
              });
            };

            reader.onerror = () => {
              reject(new Error('Failed to read file'));
            };

            reader.readAsDataURL(file);
          });
        })
      );

      onPhotosChange([...photos, ...newPhotos]);
      toast.success(`${newPhotos.length} photo(s) added`);
    } catch (error) {
      toast.error(error.message || 'Failed to process photos');
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = (photo) => {
    if (photos.length >= maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      setShowCamera(false);
      return;
    }
    onPhotosChange([...photos, photo]);
    toast.success('Photo captured');
    setShowCamera(false);
  };

  const handleGallerySelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      await processFiles(files);
    }
    e.target.value = '';
  };

  const handleRemovePhoto = (index) => {
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
    toast.success('Photo removed');
  };

  const canAddMore = photos.length < maxPhotos && !disabled;

  return (
    <div className="space-y-4">
      {/* Upload Buttons */}
      {canAddMore && (
        <div className="flex gap-2">
          {/* Take Photo - opens live camera */}
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            disabled={uploading || disabled}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 active:bg-blue-200 transition-colors"
          >
            <FaCamera className="text-blue-600 text-lg" />
            <span className="font-medium text-blue-600 text-sm">Take Photo</span>
          </button>

          {/* Choose from Gallery */}
          <label className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-colors">
            <FaFolderOpen className="text-gray-600 text-lg" />
            <span className="font-medium text-gray-600 text-sm">
              {uploading ? 'Processing...' : 'Gallery'}
            </span>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGallerySelect}
              disabled={uploading || disabled}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo.data || photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-300"
              />

              {!disabled && (
                <button
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                  title="Remove photo"
                >
                  <FaTrash className="text-sm" />
                </button>
              )}

              <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {photo.name || `Photo ${index + 1}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500">
        <FaImage className="inline mr-1" />
        {photos.length} / {maxPhotos} photos
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};
