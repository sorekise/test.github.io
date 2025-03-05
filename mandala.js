// アプリケーションの状態
let isEditMode = true; // true: 目標記入モード, false: 採点モード
const STORAGE_KEY = 'mandala-chart-data'; // LocalStorage用のキー

function createMandalaChart() {
  const container = document.getElementById('mandalaChart');

  // 9つのセクションを作成
  for (let sectionRow = 0; sectionRow < 3; sectionRow++) {
    for (let sectionCol = 0; sectionCol < 3; sectionCol++) {
      const section = document.createElement('div');
      section.className = 'mandala-section';

      // セクション内の9つのセルを作成
      for (let cellRow = 0; cellRow < 3; cellRow++) {
        for (let cellCol = 0; cellCol < 3; cellCol++) {
          // セルコンテナを作成
          const cellContainer = document.createElement('div');
          cellContainer.className = 'cell-container status-none';

          // データ属性を追加して状態を記録
          cellContainer.dataset.status = 'none';

          // セクションの位置とセル位置を計算
          const sectionIndex = sectionRow * 3 + sectionCol;
          const cellIndex = cellRow * 3 + cellCol;

          // データ属性を追加して位置を記録
          cellContainer.dataset.section = sectionIndex;
          cellContainer.dataset.cell = cellIndex;

          // 採点モード時のクリックイベントを追加
          cellContainer.addEventListener('click', function (e) {
            if (!isEditMode && e.target === this) {
              toggleCellStatus(this);
              // 状態変更後にLocalStorageに保存
              saveToLocalStorage();
            }
          });

          // テキストエリアを作成
          const textarea = document.createElement('textarea');
          textarea.className = 'mandala-cell';

          // データ属性を追加して位置を記録
          textarea.dataset.section = sectionIndex;
          textarea.dataset.cell = cellIndex;

          // 中央のセクション（4）の場合
          if (sectionIndex === 4) {
            // 中央のセクションの中央のセル
            if (cellIndex === 4) {
              textarea.className += ' center-main-cell';
            }
            // 中央のセクションの周囲8マスの場合
            else {
              textarea.className += ' center-section-cell';
              // 入力イベントを追加
              textarea.addEventListener('input', function () {
                updateSubCenters();
                // 入力後にLocalStorageに保存
                saveToLocalStorage();
              });
            }
          }
          // 他のセクションの中央のセル
          else if (cellIndex === 4) {
            textarea.className += ' sub-center-cell';
            textarea.readOnly = true;
          } else {
            // 通常のセルにも入力イベントを追加
            textarea.addEventListener('input', function () {
              // 入力後にLocalStorageに保存
              saveToLocalStorage();
            });
          }

          textarea.placeholder = '目標を入力';

          cellContainer.appendChild(textarea);
          section.appendChild(cellContainer);
        }
      }

      container.appendChild(section);
    }
  }

  // 初期モードを設定
  updateMode();

  // LocalStorageからデータを読み込む
  loadFromLocalStorage();
}

// モードを切り替える
function toggleMode() {
  isEditMode = !isEditMode;
  updateMode();
}

// 現在のモードに応じてUIを更新
function updateMode() {
  const container = document.getElementById('mandalaChart');
  const modeToggle = document.getElementById('modeToggle');

  if (isEditMode) {
    // 目標記入モード
    container.classList.remove('scoring-mode');
    modeToggle.textContent = '目標記入モード';
  } else {
    // 採点モード
    container.classList.add('scoring-mode');
    modeToggle.textContent = '採点モード';
  }
}

// 採点モードでセルの状態を切り替える
function toggleCellStatus(element) {
  if (isEditMode) return;

  // 中央セクションの中央セルは除外
  const sectionIndex = parseInt(element.dataset.section);
  const cellIndex = parseInt(element.dataset.cell);
  if (sectionIndex === 4 && cellIndex === 4) return;

  const currentStatus = element.dataset.status;

  // 状態を切り替える
  if (currentStatus === 'none') {
    element.dataset.status = 'done';
    element.className = 'cell-container status-done';
  } else if (currentStatus === 'done') {
    element.dataset.status = 'failed';
    element.className = 'cell-container status-failed';
  } else {
    element.dataset.status = 'none';
    element.className = 'cell-container status-none';
  }
}

// 中央セクションの周囲8マスの内容を各セクションの中央にコピーする
function updateSubCenters() {
  // 中央セクションのセルの位置を取得
  // 中央セクションは4番目（0から数えて）
  // セル位置は以下のように配置されている
  // 0 1 2
  // 3 4 5
  // 6 7 8

  // 各セクションの位置は以下のように配置
  // 0 1 2
  // 3 4 5
  // 6 7 8

  // 中央セクション(4)の周囲8マスから各セクションの中央へのマッピング
  const centerCellPositions = [0, 1, 2, 3, 5, 6, 7, 8]; // 中央セクションの周囲8マスの位置
  const sectionMapping = [0, 1, 2, 3, 5, 6, 7, 8]; // 対応するセクション番号

  // 中央セクションの各セルの値を対応するセクションの中央セルにコピー
  centerCellPositions.forEach((pos, index) => {
    // 中央セクションの各セルの位置に対応するセル要素を取得
    const centerCell = document.querySelector(
      `.mandala-cell[data-section="4"][data-cell="${pos}"]`
    );
    if (centerCell) {
      const value = centerCell.value;
      const targetSectionIndex = sectionMapping[index];

      // 対応するセクションの中央セル（セル位置4）を取得
      const targetCell = document.querySelector(
        `.mandala-cell[data-section="${targetSectionIndex}"][data-cell="4"]`
      );
      if (targetCell) {
        targetCell.value = value;
      }
    }
  });
}

// LocalStorageにデータを保存
function saveToLocalStorage() {
  try {
    // セルの内容を保存
    const cells = document.querySelectorAll('.mandala-cell');
    const cellData = Array.from(cells).map((cell) => cell.value);

    // 目標達成状態を保存
    const cellContainers = document.querySelectorAll('.cell-container');
    const statusData = Array.from(cellContainers).map(
      (container) => container.dataset.status || 'none'
    );

    // データを結合
    const saveData = {
      cells: cellData,
      statuses: statusData,
      lastUpdated: new Date().toISOString(),
    };

    // LocalStorageに保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));

    console.log('データをLocalStorageに保存しました');
  } catch (error) {
    console.error('LocalStorageへの保存に失敗しました:', error);
  }
}

// LocalStorageからデータを読み込む
function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (!savedData) {
      console.log('LocalStorageに保存されたデータがありません');
      return;
    }

    const data = JSON.parse(savedData);
    console.log('LocalStorageからデータを読み込みました:', data.lastUpdated);

    // セルの内容を読み込み
    if (data.cells) {
      const cells = document.querySelectorAll('.mandala-cell');
      data.cells.forEach((value, index) => {
        if (index < cells.length) {
          cells[index].value = value;
        }
      });
    }

    // 目標達成状態を読み込み
    if (data.statuses) {
      const cellContainers = document.querySelectorAll('.cell-container');
      data.statuses.forEach((status, index) => {
        if (index < cellContainers.length) {
          const container = cellContainers[index];
          container.dataset.status = status;
          container.className = `cell-container status-${status}`;
        }
      });
    }

    // データ読み込み後に中央値を更新
    updateSubCenters();
  } catch (error) {
    console.error('LocalStorageからの読み込みに失敗しました:', error);
  }
}

// LocalStorageのデータをクリア
function clearLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('LocalStorageのデータをクリアしました');

    // 画面をリロード
    location.reload();
  } catch (error) {
    console.error('LocalStorageのクリアに失敗しました:', error);
  }
}

function saveMandala() {
  // セルの内容を保存
  const cells = document.querySelectorAll('.mandala-cell');
  const cellData = Array.from(cells).map((cell) => cell.value);

  // 目標達成状態を保存
  const cellContainers = document.querySelectorAll('.cell-container');
  const statusData = Array.from(cellContainers).map(
    (container) => container.dataset.status || 'none'
  );

  // データを結合
  const saveData = {
    cells: cellData,
    statuses: statusData,
    lastUpdated: new Date().toISOString(),
  };

  const json = JSON.stringify(saveData);

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'mandala-chart.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  // ファイル保存と同時にLocalStorageにも保存
  saveToLocalStorage();
}

function loadMandala(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);

      // セルの内容を読み込み
      if (data.cells) {
        const cells = document.querySelectorAll('.mandala-cell');
        data.cells.forEach((value, index) => {
          if (index < cells.length) {
            cells[index].value = value;
          }
        });
      } else if (Array.isArray(data)) {
        // 古い形式のデータ（配列のみ）の場合
        const cells = document.querySelectorAll('.mandala-cell');
        data.forEach((value, index) => {
          if (index < cells.length) {
            cells[index].value = value;
          }
        });
      }

      // 目標達成状態を読み込み
      if (data.statuses) {
        const cellContainers = document.querySelectorAll('.cell-container');
        data.statuses.forEach((status, index) => {
          if (index < cellContainers.length) {
            const container = cellContainers[index];
            container.dataset.status = status;
            container.className = `cell-container status-${status}`;
          }
        });
      }

      // データ読み込み後に中央値を更新
      updateSubCenters();

      // ファイル読み込み後、LocalStorageにも保存
      saveToLocalStorage();
    } catch (error) {
      alert('ファイルの読み込みに失敗しました。');
      console.error('Error loading file:', error);
    }
  };
  reader.readAsText(file);
}

// ページ読み込み時にマンダラチャートを作成
window.onload = createMandalaChart;
