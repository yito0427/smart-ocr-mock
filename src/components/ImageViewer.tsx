import { useRef, useEffect, useState } from 'react';
import type { OcrField } from '../types';

interface ImageViewerProps {
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  fields: OcrField[];
  selectedFieldId: string | null;
  onFieldClick: (fieldId: string) => void;
}

export function ImageViewer({
  imagePath,
  imageWidth,
  imageHeight,
  fields,
  selectedFieldId,
  onFieldClick,
}: ImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setContainerWidth(width);
        setScale(width / imageWidth);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [imageWidth]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'rgba(76, 175, 80, 0.3)';
    if (confidence >= 75) return 'rgba(255, 193, 7, 0.3)';
    return 'rgba(244, 67, 54, 0.3)';
  };

  const getConfidenceBorderColor = (confidence: number) => {
    if (confidence >= 90) return '#4CAF50';
    if (confidence >= 75) return '#FFC107';
    return '#F44336';
  };

  return (
    <div className="image-viewer" ref={containerRef}>
      <div
        className="image-container"
        style={{
          width: containerWidth,
          height: imageHeight * scale,
          position: 'relative',
        }}
      >
        <img
          src={imagePath}
          alt="OCR対象画像"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
        {/* バウンディングボックスのオーバーレイ */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
          viewBox={`0 0 ${imageWidth} ${imageHeight}`}
        >
          {fields.map((field) => (
            <g key={field.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
              <rect
                x={field.boundingBox.x}
                y={field.boundingBox.y}
                width={field.boundingBox.width}
                height={field.boundingBox.height}
                fill={
                  selectedFieldId === field.id
                    ? 'rgba(33, 150, 243, 0.4)'
                    : getConfidenceColor(field.confidence)
                }
                stroke={
                  selectedFieldId === field.id
                    ? '#2196F3'
                    : getConfidenceBorderColor(field.confidence)
                }
                strokeWidth={selectedFieldId === field.id ? 3 : 2}
                rx={2}
                onClick={() => onFieldClick(field.id)}
              />
              {selectedFieldId === field.id && (
                <text
                  x={field.boundingBox.x}
                  y={field.boundingBox.y - 5}
                  fill="#2196F3"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {field.label}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <div className="image-controls">
        <span className="legend">
          <span className="legend-item">
            <span className="legend-color high"></span>
            高信頼度 (90%以上)
          </span>
          <span className="legend-item">
            <span className="legend-color medium"></span>
            中信頼度 (75-89%)
          </span>
          <span className="legend-item">
            <span className="legend-color low"></span>
            低信頼度 (75%未満)
          </span>
        </span>
      </div>
    </div>
  );
}
