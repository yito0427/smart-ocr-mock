import { useState, useCallback, useMemo } from 'react';
import type { OcrField } from './types';
import { mockOcrResult } from './data/mockOcrData';
import { Header } from './components/Header';
import { ImageViewer } from './components/ImageViewer';
import { FieldList } from './components/FieldList';
import './App.css';

function App() {
  const [fields, setFields] = useState<OcrField[]>(mockOcrResult.fields);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [originalFields] = useState<OcrField[]>(mockOcrResult.fields);

  const handleFieldSelect = useCallback((fieldId: string) => {
    setSelectedFieldId((prev) => (prev === fieldId ? null : fieldId));
  }, []);

  const handleFieldValueChange = useCallback(
    (fieldId: string, newValue: string) => {
      setFields((prev) =>
        prev.map((field) => {
          if (field.id === fieldId) {
            const originalField = originalFields.find((f) => f.id === fieldId);
            return {
              ...field,
              value: newValue,
              isEdited: originalField?.value !== newValue,
            };
          }
          return field;
        })
      );
    },
    [originalFields]
  );

  const handleConfirm = useCallback(() => {
    const result = fields.map((field) => ({
      id: field.id,
      label: field.label,
      value: field.value,
      isEdited: field.isEdited || false,
    }));
    console.log('確定データ:', result);
    alert('データが確定されました。コンソールを確認してください。');
  }, [fields]);

  const handleReset = useCallback(() => {
    if (window.confirm('編集内容をリセットしますか？')) {
      setFields(originalFields.map((f) => ({ ...f, isEdited: false })));
      setSelectedFieldId(null);
    }
  }, [originalFields]);

  const stats = useMemo(() => {
    const lowConfidenceCount = fields.filter((f) => f.confidence < 75).length;
    const editedCount = fields.filter((f) => f.isEdited).length;
    return { lowConfidenceCount, editedCount };
  }, [fields]);

  return (
    <div className="app">
      <Header
        documentType={mockOcrResult.documentType}
        documentId={mockOcrResult.documentId}
        processedAt={mockOcrResult.processedAt}
        totalFields={fields.length}
        lowConfidenceCount={stats.lowConfidenceCount}
        editedCount={stats.editedCount}
        onConfirm={handleConfirm}
        onReset={handleReset}
      />
      <main className="main-content">
        <div className="panel image-panel">
          <div className="panel-header">
            <h2>原本画像</h2>
          </div>
          <ImageViewer
            imagePath={mockOcrResult.imagePath}
            imageWidth={mockOcrResult.imageWidth}
            imageHeight={mockOcrResult.imageHeight}
            fields={fields}
            selectedFieldId={selectedFieldId}
            onFieldClick={handleFieldSelect}
          />
        </div>
        <div className="panel fields-panel">
          <div className="panel-header">
            <h2>読取結果</h2>
            <span className="panel-hint">
              クリックで画像上の位置を確認、値を直接編集できます
            </span>
          </div>
          <FieldList
            fields={fields}
            selectedFieldId={selectedFieldId}
            onFieldSelect={handleFieldSelect}
            onFieldValueChange={handleFieldValueChange}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
