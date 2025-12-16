import type { OcrField } from '../types';

interface FieldListProps {
  fields: OcrField[];
  selectedFieldId: string | null;
  onFieldSelect: (fieldId: string) => void;
  onFieldValueChange: (fieldId: string, newValue: string) => void;
}

export function FieldList({
  fields,
  selectedFieldId,
  onFieldSelect,
  onFieldValueChange,
}: FieldListProps) {
  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 90) return 'confidence-high';
    if (confidence >= 75) return 'confidence-medium';
    return 'confidence-low';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 90) return '✓';
    if (confidence >= 75) return '!';
    return '✗';
  };

  // フィールドをグループ分け
  const groupedFields = {
    basic: fields.filter((f) =>
      ['company_name', 'invoice_number', 'invoice_date', 'due_date', 'customer_name', 'customer_address'].includes(f.id)
    ),
    items: fields.filter((f) => f.id.startsWith('item_')),
    totals: fields.filter((f) => ['subtotal', 'tax', 'total'].includes(f.id)),
    bank: fields.filter((f) =>
      ['bank_name', 'branch_name', 'account_type', 'account_number', 'account_holder'].includes(f.id)
    ),
  };

  const renderFieldGroup = (title: string, groupFields: OcrField[]) => (
    <div className="field-group">
      <h3 className="field-group-title">{title}</h3>
      {groupFields.map((field) => (
        <div
          key={field.id}
          className={`field-item ${selectedFieldId === field.id ? 'selected' : ''} ${field.isEdited ? 'edited' : ''}`}
          onClick={() => onFieldSelect(field.id)}
        >
          <div className="field-header">
            <span className="field-label">{field.label}</span>
            <span className={`confidence-badge ${getConfidenceClass(field.confidence)}`}>
              <span className="confidence-icon">{getConfidenceIcon(field.confidence)}</span>
              {field.confidence}%
            </span>
          </div>
          <div className="field-value-container">
            <input
              type="text"
              className="field-value-input"
              value={field.value}
              onChange={(e) => onFieldValueChange(field.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {field.isEdited && <span className="edited-indicator">編集済</span>}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="field-list">
      {renderFieldGroup('基本情報', groupedFields.basic)}
      {renderFieldGroup('明細', groupedFields.items)}
      {renderFieldGroup('金額', groupedFields.totals)}
      {renderFieldGroup('振込先', groupedFields.bank)}
    </div>
  );
}
