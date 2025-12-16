// OCRフィールドの型定義
export interface OcrField {
  id: string;
  label: string;
  value: string;
  confidence: number; // 0-100の信頼度
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isEdited?: boolean;
}

// OCR結果全体の型定義
export interface OcrResult {
  documentId: string;
  documentType: string;
  imagePath: string;
  imageWidth: number;
  imageHeight: number;
  fields: OcrField[];
  processedAt: string;
}
