import { useState } from 'react';
import { FaCamera, FaTrash, FaImage } from 'react-icons/fa';
import toast from 'react-hot-toast';

export const PhotoUpload = ({ photos = [], onPhotosChange, maxPhotos = 5, disabled = false }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);

    if (files.length + photos.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setUploading(true);

    try {
      const newPhotos = await Promise.all(
        files.map((file) => {
          return new Promise((resolve, reject) => {
            // Validate file type
            if (!file.type.startsWith('image/')) {
              reject(new Error('Only image files are allowed'));
              return;
            }

            // Validate file size (max 5MB)
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
                data: event.target.result, // Base64 string
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
      toast.success(`${newPhotos.length} photo(s) uploaded`);
    } catch (error) {
      toast.error(error.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleRemovePhoto = (index) => {
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
    toast.success('Photo removed');
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {photos.length < maxPhotos && !disabled && (
        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
          <FaCamera className="text-blue-600 text-xl" />
          <span className="font-medium text-blue-600">
            {uploading ? 'Uploading...' : 'Add Photos'}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading || disabled}
            className="hidden"
          />
        </label>
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
        {photos.length} / {maxPhotos} photos • Max 5MB per photo
      </div>
    </div>
  );
};
