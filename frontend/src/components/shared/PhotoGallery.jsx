import { useState } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaExpand } from 'react-icons/fa';

export const PhotoGallery = ({ photos = [], title = 'Photos' }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  const openLightbox = (index) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e) => {
    if (selectedIndex === null) return;

    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') goToPrevious();
    if (e.key === 'ArrowRight') goToNext();
  };

  return (
    <>
      {/* Gallery Grid */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {photos.map((photo, index) => (
            <div
              key={index}
              onClick={() => openLightbox(index)}
              className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square border border-gray-300 hover:border-blue-500 transition-all"
            >
              <img
                src={photo.data || photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                <FaExpand className="text-white opacity-0 group-hover:opacity-100 text-xl" />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500">{photos.length} photo(s)</p>
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10"
          >
            <FaTimes />
          </button>

          {/* Previous Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 text-white text-4xl hover:text-gray-300 z-10"
            >
              <FaChevronLeft />
            </button>
          )}

          {/* Image */}
          <img
            src={photos[selectedIndex].data || photos[selectedIndex]}
            alt={`Photo ${selectedIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next Button */}
          {photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 text-white text-4xl hover:text-gray-300 z-10"
            >
              <FaChevronRight />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
            {selectedIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
};
