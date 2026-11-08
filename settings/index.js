var fontLF = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: 'font',
    storeName: 'font',
    version: 1
});
var fontSettingsLF = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: 'font',
    storeName: 'settings',
    version: 1
});
const mapLF = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: 'webappData',
    storeName: 'map',
    version: 1
});

var mapNameList = ["asia", "cities", "countries", "fukenyohoukutou", "pref", "saibun", "warningCities", "warningPref"];
var mapUrlList = [
    "https://kottaro123456.github.io/geojsons/asia.geojson",
    "https://kottaro123456.github.io/geojsons/cities.geojson",
    "https://kottaro123456.github.io/geojsons/countries.geojson",
    "https://kottaro123456.com/webapps/atsusa/source/fukenyohoukutou.geojson",
    "https://kottaro123456.github.io/geojsons/pref.geojson",
    "https://kottaro123456.github.io/geojsons/saibun.geojson",
    "https://kottaro123456.github.io/geojsons/warningCities.geojson",
    "https://kottaro123456.github.io/geojsons/warningPref.geojson"
];
var mapFamilyList = ["アジア", "市区町村", "世界(アジア除く)", "府県予報区", "都道府県", "細分区域", "市区町村(塗りつぶし用)", "都道府県(塗りつぶし用)"];
var mapSizeList = ["1.22", "10.0", "0.31", "2.42", "3.42", "6.45", "5.12", "2.42"];

// デフォルトのフォント定義（サーバーリストがない場合や初期用）
var defaultFontList = [
    { family: "ヒラギノ角ゴ-Pro", name: "HiraginoSansPr6N-W3", weight: 300 },
    { family: "ヒラギノ角ゴ-Pro", name: "HiraginoSansPr6N-W6", weight: 600 }
];

// ----------------------------------------------------
// ストレージ使用量の計算と表示
// ----------------------------------------------------
async function updateStorageInfo() {
    const detailsElem = document.getElementById('storage_details');
    const fillElem = document.getElementById('storage_bar_fill');
    if (!detailsElem) return;

    try {
        let text = "";
        let percent = 0;

        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const usageMB = (estimate.usage / (1024 * 1024)).toFixed(1);
            const quotaMB = (estimate.quota / (1024 * 1024 * 1024)).toFixed(1);
            percent = Math.min(100, Math.max(0.5, (estimate.usage / estimate.quota) * 100));

            text = `サイト全体の使用量: ${usageMB} MB (上限 ${quotaMB} GB の約 ${percent < 0.1 ? '< 0.1' : percent.toFixed(1)}%)`;
        } else {
            text = "ストレージ情報の自動取得に対応していません。";
        }
        detailsElem.innerHTML = text;
        if (fillElem) fillElem.style.width = percent + "%";
    } catch (e) {
        console.error("Storage estimation error:", e);
        if (detailsElem) detailsElem.innerText = "ストレージ情報を計算できませんでした。";
    }
}

// ----------------------------------------------------
// 地図テーブル関連
// ----------------------------------------------------
async function createMapTable() {
    const tbody = document.getElementById('map-table-body');
    if (!tbody) return;

    let html = "";

    for (let i = 0; i < mapNameList.length; i++) {
        var mapName = mapNameList[i];
        var mapFamily = mapFamilyList[i];
        var mapSize = mapSizeList[i];

        var existingMapData = await mapLF.getItem(mapName);
        var isSaved = !!existingMapData;

        var statusBadge = isSaved
            ? `<span class="status-badge saved">保存済み</span>`
            : `<span class="status-badge not-saved">未保存</span>`;

        var actionButtons = isSaved
            ? `<button class="action-btn" onclick="downloadSingleMap(${i})" title="再取得"><span class="material-symbols-rounded">sync</span>再取得</button>
               <button class="action-btn del-btn" onclick="deleteSingleMap(${i})" title="削除"><span class="material-symbols-rounded">delete</span>削除</button>`
            : `<button class="action-btn" onclick="downloadSingleMap(${i})" title="取得"><span class="material-symbols-rounded">cloud_download</span>取得</button>`;

        html += `<tr>
            <td><strong>${mapFamily}</strong></td>
            <td><code>${mapName}</code></td>
            <td>約 ${mapSize} MB</td>
            <td>${statusBadge}</td>
            <td>${actionButtons}</td>
        </tr>`;
    }

    tbody.innerHTML = html;
    updateStorageInfo();
}

async function downloadSingleMap(index) {
    if (!navigator.onLine) {
        alert("オフラインのためダウンロードできません。インターネット接続を確認してください。");
        return;
    }

    var mapName = mapNameList[index];
    var mapURL = mapUrlList[index];
    var mapFamily = mapFamilyList[index];

    reloadON(`「${mapFamily}」取得中`, "サーバーと通信中…");

    try {
        var response = await fetch(mapURL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        var mapData = await response.json();

        await mapLF.setItem(mapName, mapData);
        console.log(`Map saved successfully: '${mapName}'`);
    } catch (error) {
        console.error(`Map loading failed: '${mapName}'`, error);
        alert(`「${mapFamily}」のダウンロードに失敗しました。`);
    } finally {
        await createMapTable();
        reloadOFF();
    }
}

async function deleteSingleMap(index) {
    var mapName = mapNameList[index];
    var mapFamily = mapFamilyList[index];

    if (!confirm(`「${mapFamily}」の保存データを削除しますか？`)) return;

    reloadON(`「${mapFamily}」削除中`, "ストレージから削除中…");
    try {
        await mapLF.removeItem(mapName);
    } catch (e) {
        console.error("Single map deletion failed:", e);
        alert("削除に失敗しました。");
    } finally {
        await createMapTable();
        reloadOFF();
    }
}

async function newMap() {
    if (!navigator.onLine) {
        alert("オフラインのためダウンロードできません。インターネット接続を確認してください。");
        return;
    }

    reloadON("地図データ取得中", `準備中... (0 / ${mapNameList.length})`);

    let successCount = 0;
    for (let i = 0; i < mapNameList.length; i++) {
        var mapName = mapNameList[i];
        var mapURL = mapUrlList[i];
        var mapFamily = mapFamilyList[i];

        const progressPercent = Math.round((i / mapNameList.length) * 100);
        reloadON("地図データ取得中", `「${mapFamily}」を取得中... (${i + 1} / ${mapNameList.length} - ${progressPercent}%)`);

        try {
            var response = await fetch(mapURL);
            if (response.ok) {
                var mapData = await response.json();
                await mapLF.setItem(mapName, mapData);
                successCount++;
            }
        } catch (error) {
            console.error(`Map Loading failed: '${mapName}'\n${error}`);
        }
    }

    reloadON("完了処理中", "画面を更新しています…");
    await createMapTable();
    reloadOFF();

    if (successCount !== mapNameList.length) {
        alert(`一部の地図データのダウンロードに失敗しました (${successCount}/${mapNameList.length} 完了)。`);
    }
}

async function deleteMap() {
    if (!confirm("全ての地図データを削除しますか？")) return;

    reloadON("全地図データ削除中", "処理中…");

    for (let i = 0; i < mapNameList.length; i++) {
        var mapName = mapNameList[i];
        await mapLF.removeItem(mapName);
    }
    await createMapTable();
    reloadOFF();
}

// ----------------------------------------------------
// フォント処理関連 (fonts.phpのrenderFontTableを6列拡張で上書き)
// ----------------------------------------------------
window.renderFontTable = async function(fontList) {
    var tableBody = document.getElementById('font-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    // 引数の fontList が無効な場合はフォールバック
    if (!fontList || !Array.isArray(fontList) || fontList.length === 0) {
        if (typeof phpFontList !== 'undefined' && Array.isArray(phpFontList) && phpFontList.length > 0) {
            fontList = phpFontList;
        } else {
            var serverFontList = await fontSettingsLF.getItem('serverFontList');
            if (serverFontList && Array.isArray(serverFontList) && serverFontList.length > 0) {
                fontList = serverFontList;
            } else {
                fontList = defaultFontList;
            }
        }
    }

    for (let font of fontList) {
        let fontName = font.name || font.family || "Font";
        let fontFamily = font.family || "ヒラギノ角ゴ-Pro";
        let fontWeight = font.weight || "-";

        let blob = await fontLF.getItem(fontName);
        let isSaved = !!blob;
        let sizeStr = '-';

        if (blob) {
            let mb = (blob.size / (1024 * 1024)).toFixed(2);
            sizeStr = `約 ${mb} MB`;
        }

        let statusBadge = isSaved
            ? `<span class="status-badge saved">保存済み</span>`
            : `<span class="status-badge not-saved">未保存</span>`;

        let actionBtn = isSaved
            ? `<button class="action-btn del-btn" onclick="deleteSingleFont('${fontName}')" title="削除"><span class="material-symbols-rounded">delete</span>削除</button>`
            : `<button class="action-btn" onclick="downloadSingleFont('${fontName}')" title="取得"><span class="material-symbols-rounded">cloud_download</span>取得</button>`;

        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${fontFamily}</strong></td>
            <td><code>${fontName}</code></td>
            <td>${fontWeight}</td>
            <td>${sizeStr}</td>
            <td>${statusBadge}</td>
            <td>${actionBtn}</td>
        `;
        tableBody.appendChild(tr);
    }
    updateStorageInfo();
};

async function downloadSingleFont(fontName) {
    if (!navigator.onLine) {
        alert("オフラインのためダウンロードできません。インターネット接続を確認してください。");
        return;
    }
    reloadON("フォント取得中", `「${fontName}」をダウンロード中…`);
    try {
        await fontSettingsLF.setItem(`loadFont`, true);
        await fontSettingsLF.setItem(`loadFont_useFont`, true);
        document.getElementById('set_font1_switch').checked = true;

        if (typeof syncAndLoadFonts === "function") {
            await syncAndLoadFonts();
        }
    } catch(e) {
        console.error("Font single download error:", e);
    } finally {
        await window.renderFontTable();
        reloadOFF();
    }
}

async function deleteSingleFont(fontName) {
    if (!confirm(`「${fontName}」の保存データを削除しますか？`)) return;
    reloadON("フォント削除中", `「${fontName}」を削除中…`);
    try {
        await fontLF.removeItem(fontName);
    } catch (e) {
        console.error("Single font deletion error:", e);
    } finally {
        await window.renderFontTable();
        reloadOFF();
    }
}

async function newFont() {
    if (!navigator.onLine) {
        alert("オフラインのためダウンロードできません。インターネット接続を確認してください。");
        return;
    }

    reloadON("フォント全読み込み中", "フォントデータを取得・保存中…");
    await fontSettingsLF.setItem(`loadFont`, true);
    await fontSettingsLF.setItem(`loadFont_useFont`, true);

    if (typeof syncAndLoadFonts === "function") {
        try {
            await syncAndLoadFonts();
        } catch(e) {
            console.error("syncAndLoadFonts error:", e);
        }
    }
    document.getElementById('set_font1_switch').checked = true;
    await window.renderFontTable();
    reloadOFF();
}

async function deleteFont() {
    if (!confirm("保存されているフォントを全て削除しますか？\nフォント保存設定もオフになります。")) return;

    reloadON("フォント全削除中", "ストレージから削除中…");

    try {
        await fontSettingsLF.setItem(`loadFont`, false);
        await fontSettingsLF.setItem(`loadFont_useFont`, false);
        await fontSettingsLF.removeItem('serverFontList');
        await fontLF.clear();

        document.getElementById('set_font1_switch').checked = false;

        await window.renderFontTable();
        reloadOFF();
    } catch (e) {
        console.error("Font deletion failed:", e);
        alert("削除に失敗しました。");
        reloadOFF();
    }
}

// ----------------------------------------------------
// イベント＆初期化
// ----------------------------------------------------
document.getElementById('set_font1_switch').addEventListener("change", () => {
    if (document.getElementById('set_font1_switch').checked == true) {
        fontSettingsLF.setItem(`loadFont`, true);
    } else {
        fontSettingsLF.setItem(`loadFont`, false);
    }
});

(async () => {
    var result = await fontSettingsLF.getItem(`loadFont`);
    if (result == true) {
        document.getElementById('set_font1_switch').checked = true;
    } else {
        document.getElementById('set_font1_switch').checked = false;
    }

    await createMapTable();
    await window.renderFontTable();
    updateStorageInfo();
})();

// オーバーレイ表示ユーティリティ
function reloadON(title = "データ更新中", subtext = "サーバーと通信中…") {
    const titleElem = document.getElementById('data_reload_title');
    const subtextElem = document.getElementById('data_reload_subtext');

    if (titleElem) titleElem.innerText = title;
    if (subtextElem) subtextElem.innerText = subtext;

    document.getElementById('data_reload').classList.add("display");
    document.getElementById('data_reload_bg').classList.add("display");
}

function reloadOFF() {
    document.getElementById('data_reload').classList.remove("display");
    document.getElementById('data_reload_bg').classList.remove("display");
}