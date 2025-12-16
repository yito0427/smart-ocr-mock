interface HeaderProps {
  documentType: string;
  documentId: string;
  processedAt: string;
  totalFields: number;
  lowConfidenceCount: number;
  editedCount: number;
  onConfirm: () => void;
  onReset: () => void;
}

export function Header({
  documentType,
  documentId,
  processedAt,
  totalFields,
  lowConfidenceCount,
  editedCount,
  onConfirm,
  onReset,
}: HeaderProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1 className="app-title">OCR確認・訂正</h1>
        <div className="document-info">
          <span className="document-type">{documentType}</span>
          <span className="document-id">{documentId}</span>
          <span className="processed-at">処理日時: {formatDate(processedAt)}</span>
        </div>
      </div>
      <div className="header-center">
        <div className="stats">
          <div className="stat-item">
            <span className="stat-value">{totalFields}</span>
            <span className="stat-label">項目数</span>
          </div>
          <div className="stat-item warning">
            <span className="stat-value">{lowConfidenceCount}</span>
            <span className="stat-label">要確認</span>
          </div>
          <div className="stat-item info">
            <span className="stat-value">{editedCount}</span>
            <span className="stat-label">編集済</span>
          </div>
        </div>
      </div>
      <div className="header-right">
        <button className="btn btn-secondary" onClick={onReset}>
          リセット
        </button>
        <button className="btn btn-primary" onClick={onConfirm}>
          確定する
        </button>
      </div>
    </header>
  );
}
