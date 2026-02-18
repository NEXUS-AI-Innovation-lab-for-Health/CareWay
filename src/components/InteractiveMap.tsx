import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface InteractiveMapProps {
  center: { lat: number; lon: number };
  onLocationSelect: (lat: number, lon: number) => void;
}

export function InteractiveMap({ center, onLocationSelect }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(13);
  const [mapCenter, setMapCenter] = useState(center);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setMapCenter(center);
  }, [center]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Convertir les pixels en degrés (approximation)
    const latChange = (deltaY / 100) * (180 / Math.pow(2, zoom));
    const lonChange = -(deltaX / 100) * (360 / Math.pow(2, zoom));

    setMapCenter({
      lat: mapCenter.lat + latChange,
      lon: mapCenter.lon + lonChange,
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMarkerPos({ x, y });

    // Convertir la position du clic en coordonnées lat/lon (approximation)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const deltaX = x - centerX;
    const deltaY = y - centerY;
    
    const latChange = -(deltaY / 100) * (180 / Math.pow(2, zoom));
    const lonChange = (deltaX / 100) * (360 / Math.pow(2, zoom));

    const newLat = mapCenter.lat + latChange;
    const newLon = mapCenter.lon + lonChange;

    onLocationSelect(newLat, newLon);
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 1, 18));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 1, 3));
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <div className="relative w-full h-full bg-gray-200 rounded-lg overflow-hidden">
      {/* Carte OpenStreetMap via iframe avec overlay pour interactions */}
      <div className="absolute inset-0">
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lon - 0.01},${mapCenter.lat - 0.01},${mapCenter.lon + 0.01},${mapCenter.lat + 0.01}&layer=mapnik`}
          className="w-full h-full border-none"
          style={{ pointerEvents: 'none' }}
          title="Carte"
        />
      </div>

      {/* Overlay interactif transparent */}
      <div
        ref={mapRef}
        className={`absolute inset-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      >
        {/* Marqueur au centre */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-10">
          <MapPin className="h-8 w-8 text-red-600 drop-shadow-lg" fill="currentColor" />
        </div>

        {/* Marqueur de clic */}
        {markerPos && (
          <div
            className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-20"
            style={{ left: markerPos.x, top: markerPos.y }}
          >
            <MapPin className="h-6 w-6 text-blue-600 drop-shadow-lg animate-bounce" fill="currentColor" />
          </div>
        )}
      </div>

      {/* Contrôles de zoom */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 z-30">
        <button
          onClick={handleZoomIn}
          className="bg-white hover:bg-gray-100 text-gray-700 w-8 h-8 rounded shadow-lg flex items-center justify-center transition-colors"
          title="Zoom avant"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white hover:bg-gray-100 text-gray-700 w-8 h-8 rounded shadow-lg flex items-center justify-center transition-colors"
          title="Zoom arrière"
        >
          −
        </button>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1.5 rounded shadow-lg text-xs text-gray-600 z-30">
        Cliquez pour sélectionner • Glissez pour déplacer • Molette pour zoomer
      </div>
    </div>
  );
}
