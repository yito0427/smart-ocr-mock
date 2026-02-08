# document-manager-v2.html → v3.html 変換プロンプト

以下の指示に従って `document-manager-v2.html` をコピーして `document-manager-v3.html` を作成し、修正してください。v2は変更しないでください。

---

## 1. 明細テーブルのデータ変更

### 1-1. P009とP010の行統合
明細テーブルの `detailRows` 配列で、P009（ヘッドセット）とP010（外付けSSD）の2行を1行に統合してください。各セルの値は `\n` で区切って1つのセルに入れます。`pdfRowIndex` はP009の値（8）を使用します。

```javascript
// 変更前（2行）
{ productName: 'ヘッドセット（ノイズキャンセリング）', productCode: 'P009', unitPrice: '12000', quantity: '2', amount: '24000', page: 1, pdfRowIndex: 8, ... },
{ productName: '外付けSSD 1TB USB3.2対応', productCode: 'P010', unitPrice: '15000', quantity: '2', amount: '30000', page: 1, pdfRowIndex: 9, ... },

// 変更後（1行に統合、各値を\nで連結）
{ productName: 'ヘッドセット（ノイズキャンセリング）\n外付けSSD 1TB USB3.2対応', productCode: 'P009\nP010', unitPrice: '12000\n15000', quantity: '2\n2', amount: '24000\n30000', page: 1, pdfRowIndex: 8, ... },
```

### 1-2. P007の行削除
P007（ノートPCスタンド折りたたみ式）の行を `detailRows` から削除してください。OCRが読み取れなかった想定のデモ用です。PDFプレビュー側のデータ（`drawInvoice` 内の `items` 配列）は変更しないでください。

---

## 2. マルチラインセルの表示対応

### 2-1. CSS修正
`.cell-content` のスタイルで、`height: 26px; max-height: 26px;` を `min-height: 26px;` に変更して、セルの高さが内容に応じて伸びるようにしてください。

以下のCSSクラスを追加してください：
```css
.cell-content.multiline {
  white-space: pre-line;
  height: auto;
  overflow: visible;
}
```

### 2-2. renderDetailTable修正
`renderDetailTable()` 内のセル描画で、値に `\n` が含まれる場合の処理を追加：
- `rawValue.includes('\n')` で判定
- 表示用に `\n` を `<br>` に変換
- `<div>` に `multiline` クラスを付与

```javascript
const rawValue = row[col.id] || '';
const isMultiline = rawValue.includes('\n');
const value = isMultiline ? rawValue.replace(/\n/g, '<br>') : rawValue;
const multilineClass = isMultiline ? ' multiline' : '';
// cell-contentのdivに ${multilineClass} を追加
```

### 2-3. calculateFormulas修正
マルチライン値を含む行では `parseFloat()` が先頭値のみ取得してしまうため、計算をスキップ：
```javascript
function calculateFormulas(row) {
  const hasMultilineValue = detailColumns.some(c => (detailRows[row]?.[c.id] || '').includes('\n'));
  if (hasMultilineValue) return;
  // ... 既存の計算ロジック
}
```

---

## 3. セル内テキスト編集の改善

### 3-1. セル内のテキスト選択を可能にする
`handleCellClick` で、同じセルの再クリック時は `renderDetailTable()` を呼ばずに早期リターンしてください。再描画するとDOMが再構築されてブラウザのテキスト選択が破壊されます。

```javascript
function handleCellClick(e, row, col) {
  e.stopPropagation();
  // 同じセルの再クリック: テキスト編集モード（再描画せずハイライトのみ）
  if (!clickIsNewCell && !e.ctrlKey && !e.shiftKey) {
    highlightPdfCell(row, col);
    return;
  }
  // ... 以降の既存ロジック
}
```

### 3-2. handleCellMouseDownにclickIsNewCellフラグ追加
mousedownはclickより先に発火するため、mousedownで「新しいセルへの移動か」を判定するフラグが必要です。同じセル内のクリックではドラッグ選択を開始せず、テキスト選択を優先します。

```javascript
let clickIsNewCell = false;

function handleCellMouseDown(e, row, col) {
  // セル内contenteditable内でのクリックはテキスト選択を優先
  if (e.target.classList.contains('cell-content') || e.target.closest('.cell-content')) {
    if (selectedCells.length === 1 && selectedCells[0].row === row && selectedCells[0].col === col) {
      clickIsNewCell = false;
      return; // テキスト選択を妨げない
    }
  }
  clickIsNewCell = !(selectedCells.length === 1 && selectedCells[0].row === row && selectedCells[0].col === col);
  // ... 以降の既存ロジック
}
```

### 3-3. handleCellMouseOverでもテキスト選択を保護
ドラッグ中に同じセル内にいる場合はセル範囲選択をスキップ：
```javascript
function handleCellMouseOver(e, row, col) {
  if (isDragging && dragStart) {
    if (e.target.classList.contains('cell-content') || e.target.closest('.cell-content')) {
      if (selectedCells.length === 1 && selectedCells[0].row === row && selectedCells[0].col === col) {
        return;
      }
    }
    // ... 既存ロジック
  }
}
```

### 3-4. handleCellInputのinnerHTML解析
`e.target.textContent` ではなく `e.target.innerHTML` を使い、`<br>` や `<div>` を `\n` に正しく変換：
```javascript
function handleCellInput(e, row, colId) {
  const html = e.target.innerHTML;
  const value = html
    .replace(/<div>/gi, '\n')
    .replace(/<\/div>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .trim();
  // ... データ更新ロジック
}
```

`handleCellBlur` も同様に `innerHTML` からの変換に修正してください。

---

## 4. キーボードショートカットの改善

### 4-1. セル編集中はブラウザのネイティブ動作を優先
`setupKeyboardShortcuts()` で、`cell-content` にフォーカスがある場合（セル内テキスト編集中）は、Ctrl+A/C/X/V/Z/Y のカスタム処理をスキップしてブラウザのネイティブ動作に任せてください。

```javascript
const isEditingCell = document.activeElement.classList.contains('cell-content');

// 各ショートカットに if (!isEditingCell) ガードを追加
if (e.key === 'c') { if (!isEditingCell) { copyCells(); } }
if (e.key === 'x') { if (!isEditingCell) { cutCells(); } }
if (e.key === 'v') { if (!isEditingCell) { pasteCells(); } }
if (e.key === 'z') { if (!isEditingCell) { e.preventDefault(); undo(); } }
if (e.key === 'y') { if (!isEditingCell) { e.preventDefault(); redo(); } }
```

### 4-2. Shift+←/→でページ遷移時に左上セルを選択
ページ遷移後、遷移先ページの明細テーブル先頭行・左端列のセルを自動選択し、スクロールしてPDFハイライトも表示：

```javascript
if (e.shiftKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
  if (e.key === 'ArrowRight') { nextPage(); } else { prevPage(); }
  const firstRowIdx = detailRows.findIndex(r => !r.pageBreak && r.page === currentPage);
  if (firstRowIdx !== -1) {
    selectedCells = [{ row: firstRowIdx, col: 0 }];
    selectionAnchor = { row: firstRowIdx, col: 0 };
    renderDetailTable();
    highlightPdfCell(firstRowIdx, 0);
    setTimeout(() => scrollDetailTableToCell(firstRowIdx, 0), 0);
  }
  return;
}
```

---

## 5. ペースト・カットハンドラの追加

`setupPasteHandler()` 関数を新規作成し、初期化時（`showEditScreen` 内）に呼び出してください。

### 5-1. プレーンテキストペースト
セル内（contenteditable）でのペースト時にHTMLフォーマットを除去し、プレーンテキストとして挿入：
```javascript
document.addEventListener('paste', (e) => {
  if (document.activeElement.classList.contains('cell-content')) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  }
});
```

### 5-2. カットイベントでセルデータ同期・再描画
セル内でブラウザのカットが行われた後、`setTimeout` でDOM更新を待ってからデータモデルを同期し、行の高さが自動調整されるよう再描画：
```javascript
document.addEventListener('cut', (e) => {
  const cell = document.activeElement;
  if (!cell.classList.contains('cell-content')) return;
  setTimeout(() => {
    // cell.innerHTML を解析して \n 変換
    // 該当セルのdetailRows[rowIdx][colId]のみ更新（他列は変更しない）
    // saveUndoState() → renderDetailTable()
  }, 0);
});
```

---

## 6. PDFビュー → 明細テーブルの逆引き選択

### 6-1. setupCanvasEventsにclickリスナー追加
selectモード時にPDFキャンバスをクリックしたら `handlePdfTableClick()` を呼ぶ：
```javascript
drawCanvas.addEventListener('click', (e) => {
  if (isOcrMode || currentTool !== 'select') return;
  handlePdfTableClick(e);
});
```

### 6-2. handlePdfTableClick関数の実装
キャンバスのクリック座標 → PDF座標に変換し、`PDF_TABLE` 定数から行・列を特定、`detailRows` の該当行を選択・スクロール：
```javascript
function handlePdfTableClick(e) {
  const canvas = document.getElementById('pdfCanvas');
  const rect = e.target.getBoundingClientRect();
  const canvasX = e.clientX - rect.left;
  const canvasY = e.clientY - rect.top;

  const baseWidth = 595;
  const actualZoom = canvas.width / baseWidth;
  const pdfX = canvasX / actualZoom;
  const pdfY = canvasY / actualZoom;

  // テーブル範囲外チェック
  if (pdfX < 50 || pdfX > 550) return;

  const tableStartY = PDF_TABLE.getStartY(currentPage);
  const dataStartY = tableStartY + 25;
  if (pdfY < dataStartY) return;

  const pdfRowIndex = Math.floor((pdfY - dataStartY) / PDF_TABLE.rowHeight);
  if (pdfRowIndex < 0) return;

  // PDF_TABLE.colsからカラム特定 → detailRowsからpage+pdfRowIndexで行検索
  // → selectedCells設定 → renderDetailTable → highlightPdfCell → scrollDetailTableToCell
}
```

---

## 7. Undo/Redo の粒度修正

### 7-1. セルのfocusイベントで変更前状態を保存
`handleCellBlur` の `saveUndoState()` を削除し、代わりに `handleCellFocus` を新設してセル編集開始時に1回だけ保存：

```javascript
let _cellValueBeforeFocus = null;
function handleCellFocus(e, row, colId) {
  _cellValueBeforeFocus = detailRows[row]?.[colId] || '';
  saveUndoState();
}
```

contenteditableの `<div>` に `onfocus="handleCellFocus(event,${rowIdx},'${col.id}')"` を追加してください。

### 7-2. handleCellBlurで値未変更時のスタック除去
blurでは `saveUndoState()` を呼ばず、値が変わっていなければ focus 時に積んだスタックを `pop` して元に戻す：
```javascript
function handleCellBlur(e, row, colId) {
  // ... value解析・データ更新 ...
  if (_cellValueBeforeFocus !== null && _cellValueBeforeFocus === value) {
    undoStack.pop();
    updateUndoRedoButtons();
  }
  _cellValueBeforeFocus = null;
  renderDetailTable();
}
```

---

## 8. 金額列の色統一

`.detail-table td.formula .cell-content` のCSSで `background: var(--bg-light); color: var(--text-secondary);` を `background: #fff;` のみに変更し、金額列が数量列と同じ白背景・通常文字色になるようにしてください。
