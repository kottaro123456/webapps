// Helper function to format date
function getFormattedTimeStr(date) {
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const HH = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return {
        dateStr: `${yyyy}${MM}${dd}`,
        timeStr: `${yyyy}${MM}${dd}${HH}${mm}${ss}`
    };
}

// Color definitions from old project (NJQuake theme)
const Njquake_BackColor = [
    "rgba(107,120,120, 0.9)", // 1
    "rgba(30,110,230, 0.9)",  // 2
    "rgba(50,180,100, 0.9)",  // 3
    "rgba(255,224,93, 0.9)",  // 4
    "rgba(255,170,19, 0.9)",  // 5-
    "rgba(239,112,15, 0.9)",  // 5+
    "rgba(230,0,0, 0.9)",     // 6-
    "rgba(160,0,0, 0.9)",     // 6+
    "rgba(93,0,144, 0.9)",    // 7
    "rgba(150,150,150, 0.9)"  // Unknown
];
const Njquake_TextColor = [
    "rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)",
    "rgb(8,8,8)", "rgb(8,8,8)", "rgb(8,8,8)",
    "rgb(255,255,255)", "rgb(255,255,255)", "rgb(255,255,255)",
    "rgb(255,255,255)"
];

// 警報地域（細分区域）用の不透明色マップ（最大予測震度に基づき配色）
const WarnAreaOpaqueColors = {
    '1': '#6b7878',
    '2': '#1e6ee6',
    '3': '#32b464',
    '4': '#ffe05d',
    '5弱': '#ffaa13',
    '5-': '#ffaa13',
    '5強': '#ef700f',
    '5+': '#ef700f',
    '6弱': '#e60000',
    '6-': '#e60000',
    '6強': '#a00000',
    '6+': '#a00000',
    '7': '#5d0090'
};

function getWarnAreaColor(shindoStr) {
    if (!shindoStr) return null;
    const str = String(shindoStr).trim();
    if (str === '1' || str === '01') return WarnAreaOpaqueColors['1'];
    if (str === '2' || str === '02') return WarnAreaOpaqueColors['2'];
    if (str === '3' || str === '03') return WarnAreaOpaqueColors['3'];
    if (str === '4' || str === '04') return WarnAreaOpaqueColors['4'];
    if (str === '5弱' || str === '5-' || str === '05') return WarnAreaOpaqueColors['5弱'];
    if (str === '5強' || str === '5+') return WarnAreaOpaqueColors['5強'];
    if (str === '6弱' || str === '6-' || str === '06') return WarnAreaOpaqueColors['6弱'];
    if (str === '6強' || str === '6+') return WarnAreaOpaqueColors['6強'];
    if (str === '7' || str === '07') return WarnAreaOpaqueColors['7'];
    return null;
}

function updateWarnAreaColors(warnArea) {
    const targets = [
        { mapObj: typeof map !== 'undefined' ? map : null, suffix: '' },
        { mapObj: typeof subMap !== 'undefined' ? subMap : null, suffix: '_sub' }
    ];

    targets.forEach(({ mapObj, suffix }) => {
        const layerId = 'saibun_fill' + suffix;
        if (!mapObj || !mapObj.getLayer || !mapObj.getLayer(layerId)) return;

        if (Array.isArray(warnArea) && warnArea.length > 0) {
            const matchExpr = ['match', ['get', 'name']];
            let count = 0;
            warnArea.forEach(area => {
                if (!area || !area.Chiiki) return;
                const shindo = area.Shindo1 || area.Shindo2;
                const color = getWarnAreaColor(shindo);
                if (color) {
                    matchExpr.push(area.Chiiki, color);
                    count++;
                }
            });
            matchExpr.push('rgba(0, 0, 0, 0)'); // 該当しない地域は透明

            if (count > 0) {
                mapObj.setPaintProperty(layerId, 'fill-color', matchExpr);
                return;
            }
        }

        mapObj.setPaintProperty(layerId, 'fill-color', 'rgba(0, 0, 0, 0)');
    });
}

// デバッグ/テスト用
window.testWarnAreaColors = function(sampleWarnArea) {
    if (!sampleWarnArea) {
        sampleWarnArea = [
            { Chiiki: "栃木県南部", Shindo1: "5弱" },
            { Chiiki: "茨城県北部", Shindo1: "5弱" },
            { Chiiki: "茨城県南部", Shindo1: "5弱" },
            { Chiiki: "埼玉県南部", Shindo1: "4" },
            { Chiiki: "千葉県北西部", Shindo1: "4" },
            { Chiiki: "埼玉県北部", Shindo1: "4" },
            { Chiiki: "群馬県南部", Shindo1: "4" }
        ];
    }
    updateWarnAreaColors(sampleWarnArea);
    console.log("Applied test WarnArea colors:", sampleWarnArea);
};

function getColorIndex(intensity) {
    if (intensity === null || intensity === undefined) return 9;
    const val = parseFloat(intensity);
    if (isNaN(val)) return 9;
    
    if (val < 0.5) return 0; // 震度1 (または0)
    if (val < 1.5) return 0; // 震度1
    if (val < 2.5) return 1; // 震度2
    if (val < 3.5) return 2; // 震度3
    if (val < 4.5) return 3; // 震度4
    if (val < 5.0) return 4; // 震度5弱
    if (val < 5.5) return 5; // 震度5強
    if (val < 6.0) return 6; // 震度6弱
    if (val < 6.5) return 7; // 震度6強
    if (val >= 6.5) return 8; // 震度7
    return 9;
}

function getIntensityIndex(intensity) {
    if (intensity === null || intensity === undefined) return null;
    const val = parseFloat(intensity);
    if (isNaN(val)) return null;
    
    if (val < -0.5) return null; // not detected
    if (val < 0.5) return 0; // 震度0
    if (val < 1.5) return 1; // 震度1
    if (val < 2.5) return 2; // 震度2
    if (val < 3.5) return 3; // 震度3
    if (val < 4.5) return 4; // 震度4
    if (val < 5.0) return 50; // 震度5弱
    if (val < 5.5) return 55; // 震度5強
    if (val < 6.0) return 60; // 震度6弱
    if (val < 6.5) return 65; // 震度6強
    if (val >= 6.5) return 7; // 震度7
    return null;
}

// Initialize map
const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {},
        layers: [
            {
                id: 'background',
                type: 'background',
                paint: {
                    'background-color': '#111111' // ダークテーマ背景
                }
            }
        ]
    },
    zoom: 5,
    minZoom: 4.5,
    center: [138.0, 36.0], // Center of Japan
    pitch: 0, // ピッチゼロで平面に
    attributionControl: true
});

// Initialize sub map for K-MONI
const subMap = new maplibregl.Map({
    container: 'subMap',
    style: {
        version: 8,
        sources: {},
        layers: [
            {
                id: 'background',
                type: 'background',
                paint: {
                    'background-color': '#111111'
                }
            }
        ]
    },
    zoom: 5,
    minZoom: 4.5,
    center: [138.0, 36.0],
    pitch: 0,
    attributionControl: false
});

let isSyncingMap = false;
let isSyncingSubMap = false;
let isReturningHome = false; // ホーム復帰アニメーション中か
let kmoniPointsData = null;
let snetPointsData = null;
let lastSnetValidTime = null;
let snetGeoJsonData = null;
let isSnetEnabled = true;

// Camera Syncing (One-way: Main -> Sub)
map.on('move', () => {
    // 他の地図が処理中、または公式EEW中、または高確信度アラート中、またはホーム復帰中は同期しない
    // (低確信度 'low' の場合はズームしないため、同期を維持して全体像を見せる)
    if (isSyncingSubMap || isEEWActive || (isCustomAlertActive && customAlertConfidence === 'high') || isReturningHome) return;
    isSyncingMap = true;
    subMap.jumpTo({
        center: map.getCenter(),
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch()
    });
    isSyncingMap = false;
});

subMap.on('move', () => {
    // サブ地図からメイン地図への追従は原則行わない
    if (isSyncingMap || isEEWActive || (isCustomAlertActive && customAlertConfidence === 'high') || isReturningHome) return;
    
    // ユーザー操作によるサブ地図移動のみ許容し、メインには影響を与えない
    isSyncingSubMap = true;
    // 何もしない（または必要に応じて特定の挙動を追加する余地を残す）
    isSyncingSubMap = false;
});

let fetchInterval = null;
let isSimulationMode = false;
let simulationBaseTimestamp = null;
let simulationStartPerfTime = null;

let isPaused = false;
let pausedTimestamp = null;
let isAutoZoom = true; // 現在の追従状態 (ボタンでトグル)
let isAutoZoomEEWDefault = true; // 設定: EEW時に自動ズームを有効にするか
let isAutoZoomCustomDefault = true; // 設定: 独自検知時に自動ズームを有効にするか
let isCustomEnabledDuringEEW = false; // 公式EEW中も独自検知を継続するか
let lastSecondClusterActive = false; // 2つ目のクラスターが表示中か
let activeClusters = []; // 永続管理されるクラスター
let customAlertConfidence = 'none'; // 'none', 'low', 'high'
let customAlertStartTime = 0; // 最初に低確信度検知した時刻

let isDevOptionACheckbox;

// Global Animation State for P/S Waves
let currentEqLon = NaN;
let currentEqLat = NaN;
let lastSubMapFocusedClusterId = null; // 現在サブ地図が追いかけているクラスターのID
let lastSubMapBoundsJSON = ""; // 前回のズーム範囲（JSON文字列）
let targetPRadius = 0;
let targetSRadius = 0;
let currentPRadius = 0;
let currentSRadius = 0;
let lastUpdateTime = performance.now();
let currentZoomTargetRadius = 0;

// --- Logging Function ---
async function logEvent(type, data) {
    try {
        await fetch('log.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: type,
                data: data
            })
        });
    } catch (e) {
        console.warn('Logging failed', e);
    }
}

// Server Time Synchronization
let serverTimeOffset = 0; // offset = server_time - performance.now()
async function syncServerTime() {
    try {
        const res = await fetch('ntp.php');
        if (res.ok) {
            const data = await res.json();
            if (data.server_time) {
                serverTimeOffset = data.server_time - performance.now();
                return true;
            }
        }
    } catch (e) {
        console.warn('NTP sync failed', e);
    }
    return false;
}
setInterval(syncServerTime, 60000); // Sync every 1 minute

map.on('load', async () => {
    // 震度アイコンをロード
    loadShindoIcons(map);
    loadShindoIcons(subMap);

    // ユーザー操作時に自動追従をオフにする
    map.on('dragstart', disableAutoZoom);
    map.on('zoomstart', (e) => {
        if (e.originalEvent) disableAutoZoom();
    });
    map.on('pitchstart', disableAutoZoom);

    // IndexedDBからデータを読み込み
    try {
        const mapLF = localforage.createInstance({
            driver: localforage.INDEXEDDB,
            name: 'webappData',
            storeName: 'map',
            version: 1
        });

        // 共通のデータロード・描画関数
        async function loadAndAddLayer(targetMap, name, sourceId, layerConfig, beforeId = undefined) {
            let data = await mapLF.getItem(name);

            // ストレージにない場合はfetch
            if (!data) {
                try {
                    const response = await fetch(`/static/api/geojson/${name}.geojson`);
                    if (!response.ok) throw new Error(`Fetch failed for ${name}`);
                    data = await response.json();

                    // 次回のために保存
                    await mapLF.setItem(name, data);
                    console.log(`${name} loaded from server and saved to storage.`);
                } catch (err) {
                    console.error(`Error loading ${name}:`, err);
                    return; // 取得失敗時は何もしない
                }
            }

            // 地図に追加
            if (data) {
                if (!targetMap.getSource(sourceId)) {
                    targetMap.addSource(sourceId, { type: 'geojson', data: data });
                }
                // layerConfigは配列（複数レイヤー）でも単一オブジェクトでも対応できるように
                const configs = Array.isArray(layerConfig) ? layerConfig : [layerConfig];
                configs.forEach(config => {
                    if (!targetMap.getLayer(config.id)) {
                        targetMap.addLayer({ source: sourceId, ...config }, beforeId);
                    }
                });
            }
        }

        // 実行部分
        async function initLayers(targetMap, suffix = '') {
            // Countries
            await loadAndAddLayer(targetMap, 'countries', 'countries_source' + suffix, {
                id: 'countries_line' + suffix,
                type: 'line',
                paint: { 'line-color': '#444444', 'line-width': 0.8 }
            });

            // Asia
            await loadAndAddLayer(targetMap, 'asia', 'asia_source' + suffix, {
                id: 'asia_line' + suffix,
                type: 'line',
                paint: { 'line-color': '#444444', 'line-width': 0.8 }
            });

            // Pref (FillとLineの2レイヤー)
            await loadAndAddLayer(targetMap, 'pref', 'pref_source' + suffix, [
                {
                    id: 'pref_fill' + suffix,
                    type: 'fill',
                    paint: { 'fill-color': '#222222' }
                },
                {
                    id: 'pref_line' + suffix,
                    type: 'line',
                    paint: { 'line-color': '#888888', 'line-width': 1.2 }
                }
            ]);

            // Saibun (細分区域: 警報色分け用。pref_line の下に配置して都道府県境界線を活かす)
            await loadAndAddLayer(targetMap, 'saibun', 'saibun_source' + suffix, [
                {
                    id: 'saibun_fill' + suffix,
                    type: 'fill',
                    paint: {
                        'fill-color': 'rgba(0, 0, 0, 0)',
                        'fill-opacity': 1.0
                    }
                },
                {
                    id: 'saibun_line' + suffix,
                    type: 'line',
                    paint: {
                        'line-color': '#333333',
                        'line-width': 0.6
                    }
                }
            ], 'pref_line' + suffix);
        }

        // 呼び出し
        initLayers(map);
        if (subMap.loaded()) {
            initLayers(subMap, '_sub');
        } else {
            subMap.on('load', () => {
                initLayers(subMap, '_sub');
            });
        }
    } catch (e) {
        console.error('Failed to load map data from localforage', e);
    }

    // 初期時刻同期
    await syncServerTime();

    // kmoni_points.json のロード
    try {
        const res = await fetch('/webapps/eew/source/kmoni_points.json');
        if (res.ok) {
            kmoniPointsData = await res.json();
        }
    } catch (e) {
        console.warn('Failed to load kmoni_points.json', e);
    }

    // st_snet.json のロード
    try {
        const res = await fetch('st_snet.json');
        if (res.ok) {
            snetPointsData = await res.json();
            console.log('st_snet.json loaded successfully.');
            // 初回 S-NET 更新と 10秒ごとのポーリングを開始
            checkAndUpdateSnet();
            setInterval(checkAndUpdateSnet, 10000);
        }
    } catch (e) {
        console.warn('Failed to load st_snet.json', e);
    }

    // 独立した旧タイマーの代わりに、新しい統合メインループを開始
    startMainLoop();
    // Wolfx WebSocket 初期化
    initWolfxWebSocket();
});

// ==========================================
// NEW UNIFIED TIMER LOGIC
// ==========================================
let mainTimer = null;
let lastFetchedSecondStr = null;

function getCurrentAppTime() {
    let currentActualTimeMs;

    if (isSimulationMode) {
        if (isPaused) {
            currentActualTimeMs = pausedTimestamp;
        } else {
            currentActualTimeMs = simulationBaseTimestamp + (performance.now() - simulationStartPerfTime);
        }
    } else {
        if (isPaused) {
            currentActualTimeMs = pausedTimestamp;
        } else {
            const delayEl = document.getElementById('realtimeDelayInput');
            const delaySeconds = delayEl ? (parseInt(delayEl.value, 10) || 2) : 2;
            currentActualTimeMs = (performance.now() + serverTimeOffset) - (delaySeconds * 1000);
        }
    }

    const flooredTime = new Date(currentActualTimeMs);
    flooredTime.setMilliseconds(0);
    return flooredTime;
}

function startMainLoop() {
    if (mainTimer) clearInterval(mainTimer);
    mainTimer = setInterval(timeLoop, 250); // 100msから250ms(1秒に4回)に緩和し負荷軽減
}

function timeLoop() {
    const flooredTime = getCurrentAppTime();

    // 時計のUI更新
    updateClockUI(flooredTime);

    // 秒が切り替わった瞬間だけ取得処理を走らせる
    const { dateStr, timeStr } = getFormattedTimeStr(flooredTime);
    if (timeStr !== lastFetchedSecondStr) {
        lastFetchedSecondStr = timeStr;
        if (!isPaused) {
            // 新たな秒が来たのでフェッチ (引数で確定した時間を渡す)
            fetchEEWData(flooredTime, dateStr, timeStr);
        }
    }
}

function updateClockUI(displayTime) {
    const clockEl = document.getElementById('currentClock');
    if (!clockEl) return;

    const yyyy = displayTime.getFullYear();
    const mm = String(displayTime.getMonth() + 1).padStart(2, '0');
    const dd = String(displayTime.getDate()).padStart(2, '0');
    const hh = String(displayTime.getHours()).padStart(2, '0');
    const min = String(displayTime.getMinutes()).padStart(2, '0');
    const ss = String(displayTime.getSeconds()).padStart(2, '0');
    clockEl.textContent = `${yyyy}/${mm}/${dd} ${hh}:${min}:${ss}`;

    // 時計のスタイル変更
    if (isSimulationMode && isPaused) {
        clockEl.style.backgroundColor = '#9000eaff'; // 紫
        clockEl.style.color = '#7aa6ffff';             // 青
    } else if (isSimulationMode) {
        clockEl.style.backgroundColor = '#9000eaff'; // 紫
        clockEl.style.color = '#ffffff';             // 白
    } else if (isPaused) {
        clockEl.style.backgroundColor = '#0055ff';   // 青
        clockEl.style.color = '#ffffff';             // 白
    } else {
        clockEl.style.backgroundColor = '#ffffff';   // 白
        clockEl.style.color = '#000000';             // 黒
    }

    // 生存確認エラーがある場合は背景色を赤紅色に上書き
    const hasAnyError = Object.values(fetchState).some(s => s.hasError);
    if (hasAnyError) {
        clockEl.style.backgroundColor = '#ff0033'; 
        clockEl.style.color = '#ffffff';
    }
}

// SubMap state and logic
let isSubMapOpen = false;
let isEEWActive = false;
const kmoniCoordinates = [
    [128.563, 45.986], // 北西
    [145.979, 45.986], // 北東
    [145.979, 29.597], // 南東
    [128.563, 29.597]  // 南西
];

let isSubMapTransitioning = false;

document.getElementById('toggleSubMapBtn').addEventListener('click', () => {
    isSubMapOpen = !isSubMapOpen;
    isSubMapTransitioning = true;
    const wrapper = document.getElementById('subMapWrapper');
    const btn = document.getElementById('toggleSubMapBtn');
    if (isSubMapOpen) {
        wrapper.classList.remove('hidden');
        btn.classList.add('active');
        checkAndUpdateSnet();
    } else {
        wrapper.classList.add('hidden');
        btn.classList.remove('active');
    }
    // Trigger map resize after CSS transition
    setTimeout(() => {
        isSubMapTransitioning = false;
        map.resize();
        subMap.resize();
        // ズーム中断を防ぐためリサイズ後に再実行
        if (isEEWActive && isAutoZoom && lastAutoZoomBounds) {
            map.fitBounds(lastAutoZoomBounds, {
                padding: 50,
                maxZoom: 7,
                duration: 2000,
                essential: true
            });
        }
    }, 400);
});

let currentKmoniLayerId = null;
let currentKmoniSourceId = null;

// 色抽出プロット用の変数
let kmoniCanvas = null;
let kmoniCtx = null;
let currentKmoniPlotLayerId = null;
let currentKmoniPlotSourceId = null;

// --- 事前検知（JQuake風）用の変数 ---
let isCustomAlertActive = false;
let lastCustomDetectionTime = 0; // 最後に検知した時刻
let customAlertTimeout = null;
let customAlertSquareSourceId = null;
let customAlertSquareLayerId = null;
let customAlertPointsSourceId = null; // メイン地図用の点
let customAlertPointsLayerId = null;
let subAlertPointsSourceId = null;   // サブ地図用の点
let subAlertPointsLayerId = null;
const subAlertPointsSourceIdObj = { get val() { return subAlertPointsSourceId; }, set val(v) { subAlertPointsSourceId = v; } };
const subAlertPointsLayerIdObj = { get val() { return subAlertPointsLayerId; }, set val(v) { subAlertPointsLayerId = v; } };
const pointHistory = {}; // 観測点ごとの連続異常カウント用

// --- 音声通知用の設定・状態 ---
let isEewAudioEnabled = true;
let isCustomAudioEnabled = true;

let eewAudioPlayed = false; // EEW発出時に一度だけ鳴らす
let customAudioPlayed = false; // 独自検知時に一度だけ鳴らす
let alertAudio = null;
let lastEewOriginTime = ""; //発生時刻を保存して一回途切れたEEWで音を鳴らさない

// --- データ取得ステータス (生存確認) 用の状態管理 ---
let fetchState = {
    kmoni: { lastSuccess: null, hasError: false },
    yahoo: { lastSuccess: null, hasError: false },
    img:   { lastSuccess: null, hasError: false },
    snet:  { lastSuccess: null, hasError: false }
};

function updateFetchStatusUI() {
    const kmoniLabel = document.getElementById('status-kmoni-label');
    if (kmoniLabel) {
        if (isSimulationMode) {
            kmoniLabel.textContent = '1K****.SIM:';
        } else if (wolfxWS && wolfxWS.readyState === WebSocket.OPEN) {
            kmoniLabel.textContent = '1W****.WS:';
        } else {
            kmoniLabel.textContent = '1W****.HTTP:';
        }
    }

    ['kmoni', 'yahoo', 'img', 'snet'].forEach(key => {
        const item = document.getElementById(`status-${key}`);
        if (!item) return;
        const timeSpan = item.querySelector('.time');
        
        if (fetchState[key].lastSuccess) {
            const d = fetchState[key].lastSuccess;
            timeSpan.textContent = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
        }
        
        if (fetchState[key].hasError) {
            item.classList.add('fetch-error');
        } else {
            item.classList.remove('fetch-error');
        }
    });
}

function playAlertSound(type) {
    let enabled = false;
    let src = '';

    if (type === 'eew') {
        enabled = isEewAudioEnabled;
        src = 'source/eew.mp3';
    } else if (type === 'custom') {
        enabled = isCustomAudioEnabled;
        src = 'source/kenchi.mp3';
    }

    if (!enabled || !src) return;
    
    // すでに再生中の場合は止める
    if (alertAudio) {
        alertAudio.pause();
        alertAudio.currentTime = 0;
    }

    alertAudio = new Audio(src);
    alertAudio.play().catch(e => console.warn('Audio play failed:', e));
}

// 特徴的にノイズが多いなどの理由で判定を厳格化（Strict Mode）する観測点リスト
const STRICT_STATION_CODES = [
    'CHB001', 'CHB002', 'CHB003', 'CHB008', 'CHB009', 'CHB015', 'CHB021', 'CHB024', 'CHB025', 'CHB028', 'CHB029',
    'CHBH04', 'CHBH12', 'CHBH13', 'CHBH14', 'CHBH19', 'GNM010', 'IBR015', 'IBR016', 'IBR018', 'IBRH10', 'IBRH20',
    'KGS009', 'KGS011', 'KGSH07', 'KNG001', 'KNG002', 'KNG007', 'KNG008', 'KNG009', 'KNGH11', 'KYTH07', 'MYZ013',
    'OSK002', 'OSK004', 'OSK006', 'OSKH05', 'SIG010', 'SIT003', 'SIT009', 'SIT013', 'SITH01', 'SITH04', 'TCG005',
    'TCGH12', 'TCGH16', 'TKS002', 'TKY004', 'TKY005', 'TKY007', 'TKY014', 'TKY024', 'TKY028', 'TKYH11', 'TTR008',
    'WKY001', 'WKY003', 'AIC003', 'AIC011', 'MIE002', 'MIE006', 'NGN017', 'NGNH10', 'TKY006', 'TKYH02'
];

// 色から参考数値を引くためのマッピング Map (高速化のためキーを R,G,B の文字列にする)
const SHINDO_COLOR_MAP = new Map([
    ["0,0,205", -3.0], ["0,7,209", -2.9], ["0,14,214", -2.8], ["0,21,218", -2.7], ["0,28,223", -2.6],
    ["0,36,227", -2.5], ["0,43,231", -2.4], ["0,50,236", -2.3], ["0,57,240", -2.2], ["0,64,245", -2.1],
    ["0,72,250", -2.0], ["0,85,238", -1.9], ["0,99,227", -1.8], ["0,112,216", -1.7], ["0,126,205", -1.6],
    ["0,140,194", -1.5], ["0,153,183", -1.4], ["0,167,172", -1.3], ["0,180,161", -1.2], ["0,194,150", -1.1],
    ["0,208,139", -1.0], ["6,212,130", -0.9], ["12,216,121", -0.8], ["18,220,113", -0.7], ["25,224,104", -0.6],
    ["31,228,96", -0.5], ["37,233,88", -0.4], ["44,237,79", -0.3], ["50,241,71", -0.2], ["56,245,62", -0.1],
    ["63,250,54", 0.0], ["75,250,49", 0.1], ["88,250,45", 0.2], ["100,251,41", 0.3], ["113,251,37", 0.4],
    ["125,252,33", 0.5], ["138,252,28", 0.6], ["151,253,24", 0.7], ["163,253,20", 0.8], ["176,254,16", 0.9],
    ["189,255,12", 1.0], ["195,254,10", 1.1], ["202,254,9", 1.2], ["208,254,8", 1.3], ["215,254,7", 1.4],
    ["222,255,5", 1.5], ["228,254,4", 1.6], ["235,255,3", 1.7], ["241,254,2", 1.8], ["248,255,1", 1.9],
    ["255,255,0", 2.0], ["254,251,0", 2.1], ["254,248,0", 2.2], ["254,244,0", 2.3], ["254,241,0", 2.4],
    ["255,238,0", 2.5], ["254,234,0", 2.6], ["255,231,0", 2.7], ["254,227,0", 2.8], ["255,224,0", 2.9],
    ["255,221,0", 3.0], ["254,213,0", 3.1], ["254,205,0", 3.2], ["254,197,0", 3.3], ["254,190,0", 3.4],
    ["255,182,0", 3.5], ["254,174,0", 3.6], ["255,167,0", 3.7], ["254,159,0", 3.8], ["255,151,0", 3.9],
    ["255,144,0", 4.0], ["254,136,0", 4.1], ["254,128,0", 4.2], ["254,121,0", 4.3], ["254,113,0", 4.4],
    ["255,106,0", 4.5], ["254,98,0", 4.6], ["255,90,0", 4.7], ["254,83,0", 4.8], ["255,75,0", 4.9],
    ["255,68,0", 5.0], ["254,61,0", 5.1], ["253,54,0", 5.2], ["252,47,0", 5.3], ["251,40,0", 5.4],
    ["250,33,0", 5.5], ["249,27,0", 5.6], ["248,20,0", 5.7], ["247,13,0", 5.8], ["246,6,0", 5.9],
    ["245,0,0", 6.0], ["238,0,0", 6.1], ["230,0,0", 6.2], ["223,0,0", 6.3], ["215,0,0", 6.4],
    ["208,0,0", 6.5], ["200,0,0", 6.6], ["192,0,0", 6.7], ["185,0,0", 6.8], ["177,0,0", 6.9],
    ["170,0,0", 7.0]
]);

// 検索高速化のための事前展開配列
const SHINDO_COLOR_LIST = Array.from(SHINDO_COLOR_MAP.entries()).map(([rgbStr, val]) => {
    const [r, g, b] = rgbStr.split(',').map(Number);
    return { r, g, b, val };
});

/**
 * 取得したRGBに最も近い震度数値を返す (堅牢な色判定)
 */
function findNearestShindo(r, g, b) {
    let minDiff = Infinity;
    let nearestVal = -4.0;
    
    for (let i = 0; i < SHINDO_COLOR_LIST.length; i++) {
        const item = SHINDO_COLOR_LIST[i];
        // マンハッタン距離で高速に近似検索 (必要なら二乗誤差でもよい)
        const diff = Math.abs(r - item.r) + Math.abs(g - item.g) + Math.abs(b - item.b);
        if (diff < minDiff) {
            minDiff = diff;
            nearestVal = item.val;
        }
        if (minDiff === 0) break; // 完全一致
    }

    // あまりにも色がけ離れている（背景色など）場合は対象外
    // 距離が50以上離れている場合は「該当なし」とする
    return minDiff < 50 ? nearestVal : -4.0;
}

function detectAndPlotAnomalies(imgData, imgWidth, imgHeight, timestamp) {
    const timestampMs = timestamp || Date.now();

    // 公式EEW受信中に独自検知を行うかどうかのチェック
    if (isEEWActive && !isCustomEnabledDuringEEW) {
        // すでにアラート中なら消去
        if (isCustomAlertActive) clearCustomAlert();
        return;
    }

    const currentValidAnomalies = [];
    const minDistanceKm = 40; // クラスタリング距離（半径）
    const minClusterSize = 5; // クラスターとみなす最小の点数

    let rawAnomalyCount = 0; // 判定基準を超えた点の数

    for (let i = 0; i < kmoniPointsData.length; i++) {
        const pt = kmoniPointsData[i];
        const x = parseInt(pt.x, 10);
        const y = parseInt(pt.y, 10);

        if (x >= 0 && x < imgWidth && y >= 0 && y < imgHeight) {
            const idx = (y * imgWidth + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];
            
            // 判定を厳格化する地点かどうかのフラグ
            // 高感度地点(acc >= 1.5)、またはノイズ等の厳格指定リストに含まれる地点を対象
            const isStrictStation = (pt.acc && parseFloat(pt.acc) >= 1.5) || 
                                   STRICT_STATION_CODES.includes(pt.pointName);

            let isAnomaly = false;
            let currentDelta = 0;
            // 背景（黒・濃い灰色）でないことを確認 (r,g,b合計で判定)
            if (r + g + b >= 60) {
                // 震度数値の取得 (近傍色検索)
                const nowShindo = findNearestShindo(r, g, b);
                
                if (!pointHistory[i]) {
                    pointHistory[i] = { 
                        count: 0, 
                        lastTime: 0, 
                        shindoHistory: [] // [{time, shindo}, ...]
                    };
                }
                
                // 履歴の更新 (直近10秒間)
                pointHistory[i].shindoHistory.push({ time: timestamp, shindo: nowShindo });
                pointHistory[i].shindoHistory = pointHistory[i].shindoHistory.filter(h => timestamp - h.time <= 10000);

                if (pointHistory[i].shindoHistory.length >= 2) {
                    // 直近10秒間の最小震度を取得
                    const minShindoInHistory = Math.min(...pointHistory[i].shindoHistory.map(h => h.shindo));
                    currentDelta = nowShindo - minShindoInHistory;

                    // 判定基準: 
                    // 厳格地点（関東・高感度）: 震度0.5以上 または 5秒以内の上昇幅が0.8以上
                    // その他地点: 震度0.0以上 または 5秒以内の上昇幅が0.5以上
                    const minAbsShindo = isStrictStation ? 0.5 : 0.0;
                    const minDeltaShindo = isStrictStation ? 0.8 : 0.5;

                    if (nowShindo >= minAbsShindo || currentDelta >= minDeltaShindo) {
                        isAnomaly = true;
                    }
                }
            }

            if (isAnomaly) {
                rawAnomalyCount++;
                // 前フレームが直近（例えば5秒以内）なら連続カウントアップ
                if (timestamp - pointHistory[i].lastTime < 10000) {
                    pointHistory[i].count++;
                } else {
                    pointHistory[i].count = 1;
                }
                pointHistory[i].lastTime = timestamp;

                // 判定強化: 超高デルタ（1.0以上）の場合は、2フレーム連続を待たずに即座に有効とする
                // (以前は1.2としていたが、提供事例に合わせて1.0に引き下げ)
                const isInstantTrigger = (currentDelta >= 1.0);

                if (pointHistory[i].count >= 2 || isInstantTrigger) {
                    currentValidAnomalies.push({
                        idx: i,
                        lon: parseFloat(pt.lot),
                        lat: parseFloat(pt.lat),
                        delta: currentDelta,
                        shindo: findNearestShindo(r, g, b),
                        raw_color: `rgb(${r},${g},${b})`,
                        isStrict: isStrictStation // 厳格モード地点かどうかのフラグを保持
                    });
                }
            } else {
                // 異常でない場合はカウンターをリセット
                if (pointHistory[i]) {
                    pointHistory[i].count = 0;
                }
            }
        }
    }

    if (rawAnomalyCount > 0) {
        console.log(`[プレEEW検知分析] 判定基準超過: ${rawAnomalyCount}点, 連続性/即時トリガー通過: ${currentValidAnomalies.length}点`);
    }

    // --- マルチクラスター抽出と永続化ロジック ---
    const currentRawClusters = [];
    const usedPointsForClustering = new Set();

    for (const pt of currentValidAnomalies) {
        if (usedPointsForClustering.has(pt)) continue;

        const clusterPoints = [];
        const queue = [pt];
        usedPointsForClustering.add(pt);

        while (queue.length > 0) {
            const current = queue.shift();
            clusterPoints.push(current);

            for (const neighbor of currentValidAnomalies) {
                if (usedPointsForClustering.has(neighbor)) continue;
                
                const dist = turf.distance(
                    turf.point([current.lon, current.lat]),
                    turf.point([neighbor.lon, neighbor.lat]),
                    { units: 'kilometers' }
                );
                
                if (dist <= minDistanceKm) {
                    usedPointsForClustering.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        // 検知基準の判定 (通常地点およびクラスター全体の規模・急激な上昇を評価)
        const totalPoints = clusterPoints.length;
        const normalPoints = clusterPoints.filter(p => !p.isStrict);
        const strictPoints = clusterPoints.filter(p => p.isStrict);

        const totalDelta04 = clusterPoints.filter(p => p.delta >= 0.4).length;
        const totalDelta08 = clusterPoints.filter(p => p.delta >= 0.8).length;
        const totalDelta10 = clusterPoints.filter(p => p.delta >= 1.0).length;
        const totalDelta12 = clusterPoints.filter(p => p.delta >= 1.2).length;
        const totalDelta15 = clusterPoints.filter(p => p.delta >= 1.5).length;
        const totalDelta25 = clusterPoints.filter(p => p.delta >= 2.5).length;

        const normalDelta04 = normalPoints.filter(p => p.delta >= 0.4).length;
        const normalDelta08 = normalPoints.filter(p => p.delta >= 0.8).length;
        const normalDelta10 = normalPoints.filter(p => p.delta >= 1.0).length;
        const normalDelta12 = normalPoints.filter(p => p.delta >= 1.2).length;
        const normalDelta15 = normalPoints.filter(p => p.delta >= 1.5).length;
        const normalDelta25 = normalPoints.filter(p => p.delta >= 2.5).length;

        let isDetected = false;

        // 1. 大規模・中規模クラスター判定 (多地点で揺れている場合は厳格地点比率に関わらず迅速検知)
        if (totalPoints >= 5 && totalDelta04 >= 4) {
            isDetected = true;
        } else if (totalPoints >= 4 && totalDelta08 >= 3) {
            isDetected = true;
        }
        // 2. 通常地点を含む標準判定
        else if (normalPoints.length >= 3) {
            if (normalDelta10 >= 3) isDetected = true;
            else if (normalDelta15 >= 1 && normalDelta08 >= 2) isDetected = true;
            else if (totalDelta08 >= 3 && normalPoints.length >= 1) isDetected = true;
        } else if (normalPoints.length === 2) {
            let conditionMet = false;
            if (normalDelta15 >= 1 && normalDelta12 >= 1) conditionMet = true;
            else if (normalDelta25 >= 1 && normalDelta10 >= 1) conditionMet = true;
            else if (totalDelta10 >= 2 && totalPoints >= 3) conditionMet = true;

            if (conditionMet) {
                // 地点間の距離チェック
                const d = turf.distance(
                    turf.point([normalPoints[0].lon, normalPoints[0].lat]),
                    turf.point([normalPoints[1].lon, normalPoints[1].lat]),
                    { units: 'kilometers' }
                );
                if (d >= 5.0) {
                    isDetected = true;
                } else {
                    console.log(`[プレEEW検知] 通常2点閾値通過したが距離が近すぎるため保留 (${d.toFixed(2)}km)`);
                }
            }
        }
        // 3. 厳格地点主体の判定 (通常地点が少ない場合でも、厳格地点が複数集まり強い上昇を示していれば評価)
        else if (strictPoints.length >= 3) {
            const strictDelta10 = strictPoints.filter(p => p.delta >= 1.0).length;
            const strictDelta15 = strictPoints.filter(p => p.delta >= 1.5).length;
            if (strictDelta15 >= 1 && strictDelta10 >= 2) {
                isDetected = true;
            } else if (strictDelta10 >= 3) {
                isDetected = true;
            }
        }

        if (isDetected) {
            // 検知確定時のみ、厳格モード地点も含めてクラスター化する
            const lats = clusterPoints.map(p => p.lat);
            const lons = clusterPoints.map(p => p.lon);
            currentRawClusters.push({
                points: clusterPoints, // 厳格モード地点も含む
                centerLat: lats.reduce((a, b) => a + b) / lats.length,
                centerLon: lons.reduce((a, b) => a + b) / lons.length,
                maxDelta: Math.max(...clusterPoints.map(p => p.delta))
            });
        }
    }

    // 既存の activeClusters と マッチング・更新
    for (const raw of currentRawClusters) {
        let matched = false;
        for (const active of activeClusters) {
            const dist = turf.distance(
                turf.point([raw.centerLon, raw.centerLat]),
                turf.point([active.centerLon, active.centerLat]),
                { units: 'kilometers' }
            );
            if (dist < 150) {
                // マージ処理
                raw.points.forEach(rp => {
                    let existing = active.points.find(ap => ap.idx === rp.idx);
                    if (!existing) {
                        active.points.push(rp); // 新しい検知地点を追加
                    } else {
                        existing.delta = rp.delta; // 既存地点も最新のdeltaに更新
                        existing.shindo = rp.shindo;
                    }
                });
                active.lastActiveTime = timestampMs;
                active.centerLat = (active.centerLat + raw.centerLat) / 2;
                active.centerLon = (active.centerLon + raw.centerLon) / 2;
                active.maxDelta = Math.max(active.maxDelta, raw.maxDelta);
                matched = true;
                break;
            }
        }
        if (!matched) {
            raw.lastActiveTime = timestampMs;
            raw.id = Date.now() + Math.random();
            activeClusters.push(raw);
        }
    }

    // 生存判定 (上昇が止まってから10秒間は維持)
    activeClusters = activeClusters.filter(ac => {
        const age = timestampMs - ac.lastActiveTime;
        return age < 10000; 
    });

    // --- クラスター評価とUI更新 ---
    let maxConfidenceInFrame = 'none';
    if (activeClusters.length > 0) {
        // 各クラスターの重要度スコアを算出
        activeClusters.forEach(c => {
            const totalPoints = c.points.length;
            const normalPoints = c.points.filter(p => !p.isStrict);
            const totalDelta10 = c.points.filter(p => p.delta >= 1.0).length;
            const totalDelta15 = c.points.filter(p => p.delta >= 1.5).length;
            const normalDelta10 = normalPoints.filter(p => p.delta >= 1.0).length;
            const normalDelta15 = normalPoints.filter(p => p.delta >= 1.5).length;
            
            let confidence = 'none';
            // 高確信度判定: 4地点以上集まっているか、強い上昇が複数地点にあれば即時high
            if (totalPoints >= 4 || 
                (normalPoints.length >= 3 && (normalDelta10 >= 3 || (normalDelta15 >= 1 && normalPoints.length >= 3))) ||
                totalDelta10 >= 3 ||
                (totalDelta15 >= 1 && totalPoints >= 3)) {
                confidence = 'high';
            } else if (totalPoints >= 2) {
                confidence = 'low';
            }
            c.confidence = confidence;
            
            if (confidence === 'high') maxConfidenceInFrame = 'high';
            else if (confidence === 'low' && maxConfidenceInFrame !== 'high') maxConfidenceInFrame = 'low';

            // スコア計算 (既存ロジック)
            const maxShindo = Math.max(...c.points.map(p => p.shindo || -4.0));
            let intensityWeight = Math.pow(Math.max(0.1, maxShindo + 3.5), 2);
            let baseScore = intensityWeight * c.maxDelta * Math.sqrt(c.points.length);
            
            let eewBonus = 0;
            if (isEEWActive && !isNaN(currentEqLat) && !isNaN(currentEqLon)) {
                const dist = turf.distance(
                    turf.point([c.centerLon, c.centerLat]),
                    turf.point([currentEqLon, currentEqLat]),
                    { units: 'kilometers' }
                );
                // EEW震央に近いクラスターに強力なボーナス (200km以内で支配的になるように)
                eewBonus = 100000 / (dist + 50);
            }
            c.score = baseScore + eewBonus;
        });

        // スコア順にソートして、フレーム全体の最大確信度を評価
        activeClusters.sort((a, b) => b.score - a.score);
        
        // 検証タイマー制御
        if (customAlertConfidence === 'none' && maxConfidenceInFrame === 'low') {
            customAlertStartTime = timestampMs;
            console.log("[プレEEW検知] 低確信度（検証プロセス開始）: 5秒待機します");
        } else if (maxConfidenceInFrame === 'high') {
            // 高確信度に昇格したらタイマー不要
            customAlertStartTime = 0;
        } else if (customAlertConfidence === 'low' && maxConfidenceInFrame === 'low') {
            // 低確信度が続いている場合、5秒経過チェック
            if (customAlertStartTime > 0 && timestampMs - customAlertStartTime > 5000) {
                console.log("[プレEEW検知] 5秒経過しても確信度が上がらないためキャンセルします");
                clearCustomAlert();
                return;
            }
        }

        lastCustomDetectionTime = timestampMs;
        triggerCustomAlert(activeClusters, maxConfidenceInFrame);
    } else {
        if (isCustomAlertActive) {
            if (timestampMs - lastCustomDetectionTime > 10000) {
                console.log(`[プレEEW検知] クラスターが消失したためアラートを終了します`);
                clearCustomAlert();
            }
        }
    }
}

function triggerCustomAlert(clusters, confidence) {
    if (!clusters || clusters.length === 0) return;
    const cluster1 = clusters[0];
    const cluster2 = clusters.length > 1 ? clusters[1] : null;
    const hasNowSecondCluster = !!cluster2;

    const isHigh = (confidence === 'high');

    // UI変更（パネル表示など）※EEWが既に出ている場合はパネルを上書きしない
    if (!isEEWActive) {
        let panel = document.getElementById('eewPanel');
        panel.classList.remove('hidden');

        if (isHigh) {
            panel.classList.remove('confidence-low');
            panel.classList.add('confidence-high');
            panel.style.setProperty('--panel-bg', 'rgba(150, 150, 150, 0.9)'); 
            panel.style.color = '#ffffff'; 
            document.getElementById('shindoLabel').textContent = '強震モニタ';
            document.getElementById('regionName').textContent = clusters.length > 1 ? clusters.length + '地点で揺れを検知' : '観測点の揺れを検知';
            document.getElementById('magnitudeRow').textContent = 'これは緊急地震速報ではありません。';
        } else {
            panel.classList.remove('confidence-high');
            panel.classList.add('confidence-low');
            panel.style.setProperty('--panel-bg', 'rgba(150, 150, 150, 0.9)'); 
            panel.style.color = '#ffffff'; 
            document.getElementById('shindoLabel').textContent = '検証中...';
            document.getElementById('regionName').textContent = '微小な揺れを検知';
            document.getElementById('magnitudeRow').textContent = '小さな揺れや観測点のノイズの可能性があります。';
        }
        
        document.getElementById('calcIntensity').innerHTML = '';
        document.getElementById('reportRow').textContent = '強震モニタ 独自検知システム';
        document.getElementById('originTimeRow').textContent = '';
    }

    // ズーム追従ロジック (高確信度のみ)
    if (isAutoZoom && isHigh) {
        // 現在のトップクラスターの範囲(Bounds)を計算
        const bounds = getClusterBounds(cluster1);
        const boundsJSON = JSON.stringify(bounds);

        // 「追いかけるべき事象(ID)」が変わったか、あるいは「表示範囲」が拡大・変化したか
        const isClusterSwitched = cluster1.id !== lastSubMapFocusedClusterId;
        const isBoundsChanged = boundsJSON !== lastSubMapBoundsJSON;

        if (isClusterSwitched || isBoundsChanged) {
            moveSubMapToCluster(cluster1, bounds);
            lastSubMapFocusedClusterId = cluster1.id;
            lastSubMapBoundsJSON = boundsJSON;
        }
    } else if (!isHigh) {
        // 低確信度のときは、既に他の要因でズームされていたらホームに戻るようにする
        checkAndReturnHome();
    }

    if (!isCustomAlertActive || (customAlertConfidence !== confidence)) {
        isCustomAlertActive = true;
        customAlertConfidence = confidence; // 状態を更新
        updateAutoZoomBtn();
        
        // 高確信度になった瞬間、または既にLowで鳴らしていない場合に高確信度へ昇格した際に音声を再生
        if (isHigh && !customAudioPlayed) {
            playAlertSound('custom');
            customAudioPlayed = true;
            logEvent('custom_detection_high', {
                cluster_count: clusters.length,
                max_delta: cluster1.maxDelta
            });
        }
    }
    
    lastSecondClusterActive = hasNowSecondCluster;
    lastCustomDetectionTime = Date.now();
    
    // 全クラスターの点を集約してグリッド表示用データを作成
    let features = [];
    const allPoints = [];
    clusters.forEach(c => allPoints.push(...c.points));
    
    if (allPoints.length > 0) {
        const latStep = 0.45;
        const lonStep = 0.55;
        
        const cellIds = new Set();
        allPoints.forEach(pt => {
            const latIdx = Math.floor(pt.lat / latStep);
            const lonIdx = Math.floor(pt.lon / lonStep);
            const cellId = `${latIdx}_${lonIdx}`;
            
            if (!cellIds.has(cellId)) {
                cellIds.add(cellId);
                const minLon = lonIdx * lonStep;
                const maxLon = (lonIdx + 1) * lonStep;
                const minLat = latIdx * latStep;
                const maxLat = (latIdx + 1) * latStep;

                features.push(turf.polygon([[
                    [minLon, minLat],
                    [maxLon, minLat],
                    [maxLon, maxLat],
                    [minLon, maxLat],
                    [minLon, minLat]
                ]]));
            }
        });
    }

    const geojsonData = {
        type: 'FeatureCollection',
        features: features
    };

    // 既にレイヤーがある場合はデータを更新するだけ（チカチカ防止）
    if (customAlertSquareSourceId && map.getSource(customAlertSquareSourceId)) {
        map.getSource(customAlertSquareSourceId).setData(geojsonData);
        // 色も最新の確信度に合わせて更新
        if (map.getLayer(customAlertSquareLayerId)) {
            map.setPaintProperty(customAlertSquareLayerId, 'line-color', isHigh ? '#ff7300' : '#149a4a');
        }
    } else {
        const newSourceId = `custom-alert-src-${Date.now()}`;
        const newLayerId = `custom-alert-layer-${Date.now()}`;

        map.addSource(newSourceId, { type: 'geojson', data: geojsonData });
        map.addLayer({
            id: newLayerId,
            type: 'line',
            source: newSourceId,
            paint: { 
                'line-color': isHigh ? '#ff7300' : '#149a4a', 
                'line-width': 2 
            }
        });
        customAlertSquareSourceId = newSourceId;
        customAlertSquareLayerId = newLayerId;
    }

    if (customAlertSquareSourceId && subMap.getSource(customAlertSquareSourceId)) {
        subMap.getSource(customAlertSquareSourceId).setData(geojsonData);
        // 色も最新の確信度に合わせて更新
        if (subMap.getLayer(customAlertSquareLayerId)) {
            subMap.setPaintProperty(customAlertSquareLayerId, 'line-color', isHigh ? '#ff7300' : '#149a4a');
        }
    } else {
        const sid = customAlertSquareSourceId || `custom-alert-src-${Date.now()}`;
        const lid = customAlertSquareLayerId || `custom-alert-layer-${Date.now()}`;
        
        if (!subMap.getSource(sid)) subMap.addSource(sid, { type: 'geojson', data: geojsonData });
        if (!subMap.getLayer(lid)) {
            subMap.addLayer({
                id: lid,
                type: 'line',
                source: sid,
                paint: { 'line-color': isHigh ? '#ff7300' : '#149a4a', 'line-width': 2 }
            });
        }
        customAlertSquareSourceId = sid;
        customAlertSquareLayerId = lid;
    }

    // メイン地図・サブ地図両方への「検知された点のみ」の表示
    const pointsGeojson = {
        type: 'FeatureCollection',
        features: allPoints.map(pt => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [pt.lon, pt.lat] },
            properties: { 
                raw_color: pt.raw_color,
                shindo: pt.shindo
            }
        }))
    };

    // Helper to add/update point layers
    const updatePointOverlay = (targetMap, sidPrefix, lidPrefix, stateSrcIdObj, stateLyrIdObj) => {
        const sid = stateSrcIdObj.val || `${sidPrefix}-${Date.now()}`;
        const lidSym = `${lidPrefix}-sym`;
        const lidCirc = `${lidPrefix}-circ`;

        const pointsGeojson = {
            type: 'FeatureCollection',
            features: allPoints.map(pt => {
                const intIdx = getIntensityIndex(pt.shindo);
                return {
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [pt.lon, pt.lat] },
                    properties: { 
                        raw_color: pt.raw_color,
                        shindo_icon: (intIdx !== null) ? `shindo_icon_${intIdx}` : null
                    }
                };
            })
        };

        if (stateSrcIdObj.val && targetMap.getSource(sid)) {
            targetMap.getSource(sid).setData(pointsGeojson);
        } else {
            targetMap.addSource(sid, { type: 'geojson', data: pointsGeojson });
        }

        const showIcons = isDevOptionACheckbox && iconsLoaded;

        // 1. 白縁取り円レイヤー (lidCirc)
        // アイコン表示時でも、アイコンの下にこの白縁円を表示させたいので filter を ['all'] にします
        if (!targetMap.getLayer(lidCirc)) {
            targetMap.addLayer({
                id: lidCirc,
                type: 'circle',
                source: sid,
                filter: ['all'], // ★ 常に表示（アイコンの下地になる）
                paint: {
                    'circle-radius': 5,
                    'circle-color': ['get', 'raw_color'],
                    'circle-stroke-width': 1.5,
                    'circle-stroke-color': '#ffffff'
                }
            });
        } else {
            targetMap.setFilter(lidCirc, ['all']);
        }

        // 2. アイコンレイヤー (lidSym)
        // 円レイヤーの「上」に追加順を制御します
        if (showIcons) {
            if (!targetMap.getLayer(lidSym)) {
                targetMap.addLayer({
                    id: lidSym,
                    type: 'symbol',
                    source: sid,
                    filter: ['!=', ['get', 'shindo_icon'], null],
                    layout: {
                        'icon-image': ['get', 'shindo_icon'],
                        'icon-size': 1.0,
                        'icon-allow-overlap': true,
                        'icon-anchor': 'center'
                    }
                });
            }
        } else if (targetMap.getLayer(lidSym)) {
            targetMap.removeLayer(lidSym);
        }

        stateSrcIdObj.val = sid;
        stateLyrIdObj.val = lidCirc; 
    };

    // メイン地図更新
    const mSrc = { get val() { return customAlertPointsSourceId; }, set val(v) { customAlertPointsSourceId = v; } };
    const mLyr = { get val() { return customAlertPointsLayerId; }, set val(v) { customAlertPointsLayerId = v; } };
    updatePointOverlay(map, 'custom-points', 'custom-points-layer', mSrc, mLyr);

    // サブ地図強調更新
    updatePointOverlay(subMap, 'custom-points-sub', 'custom-points-layer-sub', subAlertPointsSourceIdObj, subAlertPointsLayerIdObj);
}

function getClusterBounds(cluster) {
    if (!cluster || !cluster.points) return null;
    const latStep = 0.45;
    const lonStep = 0.55;
    let minL = 180, maxL = -180, minA = 90, maxA = -90;
    cluster.points.forEach(pt => {
        const latIdx = Math.floor(pt.lat / latStep);
        const lonIdx = Math.floor(pt.lon / lonStep);
        const cellMinLon = lonIdx * lonStep;
        const cellMaxLon = (lonIdx + 1) * lonStep;
        const cellMinLat = latIdx * latStep;
        const cellMaxLat = (latIdx + 1) * latStep;
        if (cellMinLon < minL) minL = cellMinLon;
        if (cellMaxLon > maxL) maxL = cellMaxLon;
        if (cellMinLat < minA) minA = cellMinLat;
        if (cellMaxLat > maxA) maxA = cellMaxLat;
    });
    // 少し余裕を持たせる (0.2度程度)
    return [
        [minL - 0.2, minA - 0.2],
        [maxL + 0.2, maxA + 0.2]
    ];
}

function moveSubMapToCluster(cluster, precalcBounds = null) {
    if (!cluster || !cluster.points) return;
    
    // 引数がない場合は計算
    const bounds2 = precalcBounds || getClusterBounds(cluster);
    if (!bounds2) return;
    
    const autoOpen = document.getElementById('autoOpenSubMapToggle').checked;
    if (autoOpen && !isSubMapOpen) {
        document.getElementById('toggleSubMapBtn').click();
    }

    // 以前のsetTimeout(500ms)はパネル展開待ちだったが、地図移動はすぐ開始して良い
    subMap.fitBounds(bounds2, { 
        padding: 50, 
        maxZoom: 7.5, 
        duration: 1200, // 少しゆっくり動かして状況を分かりやすく
        essential: true 
    });
}

function clearCustomAlert() {
    lastSecondClusterActive = false;
    isCustomAlertActive = false;
    customAlertConfidence = 'none';
    lastCustomDetectionTime = 0;
    customAudioPlayed = false;
    activeClusters = [];
    lastSubMapFocusedClusterId = null;
    lastSubMapBoundsJSON = "";
    
    let panel = document.getElementById('eewPanel');
    if (!isEEWActive) {
        panel.classList.add('hidden');
        panel.style.setProperty('--panel-bg', 'rgba(150, 150, 150, 0.9)');
        document.getElementById('shindoLabel').textContent = '';
        document.getElementById('calcIntensity').innerHTML = '';
        document.getElementById('magnitudeRow').textContent = '';
        document.getElementById('reportRow').textContent = '';
        document.getElementById('regionName').textContent = '';
        checkAndReturnHome();
    }
    
    customAlertConfidence = 'none';
    customAlertStartTime = 0;
    
    panel.style.removeProperty('--panel-bg');
    panel.classList.remove('confidence-low');
    panel.classList.remove('confidence-high');
    panel.style.color = '#ffffff';

    if (customAlertSquareLayerId) {
        if (map.getLayer(customAlertSquareLayerId)) map.removeLayer(customAlertSquareLayerId);
        if (subMap.getLayer(customAlertSquareLayerId)) subMap.removeLayer(customAlertSquareLayerId);
    }
    if (customAlertSquareSourceId) {
        if (map.getSource(customAlertSquareSourceId)) map.removeSource(customAlertSquareSourceId);
        if (subMap.getSource(customAlertSquareSourceId)) subMap.removeSource(customAlertSquareSourceId);
    }

    const deleteLayers = (targetMap, prefix) => {
        if (targetMap.getLayer(`${prefix}-sym`)) targetMap.removeLayer(`${prefix}-sym`);
        if (targetMap.getLayer(`${prefix}-circ`)) targetMap.removeLayer(`${prefix}-circ`);
    };

    deleteLayers(map, 'custom-points-layer');
    deleteLayers(subMap, 'custom-points-layer-sub');

    if (customAlertPointsSourceId && map.getSource(customAlertPointsSourceId)) {
        map.removeSource(customAlertPointsSourceId);
    }
    if (subAlertPointsSourceId && subMap.getSource(subAlertPointsSourceId)) {
        subMap.removeSource(subAlertPointsSourceId);
    }

    customAlertSquareLayerId = null;
    customAlertSquareSourceId = null;
    customAlertPointsLayerId = null;
    customAlertPointsSourceId = null;
    subAlertPointsLayerId = null;
    subAlertPointsSourceId = null;
}

// function moveSubMapToCluster(cluster) { ... } Old version removed
function plotKmoniFromImage(dataUrl, timestamp) {
    const img = new Image();
    img.onload = () => {
        if (!kmoniCanvas) {
            kmoniCanvas = document.createElement('canvas');
            kmoniCtx = kmoniCanvas.getContext('2d', { willReadFrequently: true });
        }
        kmoniCanvas.width = img.width;
        kmoniCanvas.height = img.height;
        kmoniCtx.clearRect(0, 0, img.width, img.height);
        kmoniCtx.drawImage(img, 0, 0);

        const imgDataList = kmoniCtx.getImageData(0, 0, img.width, img.height).data;
        const timestampMs = timestamp || Date.now();

        detectAndPlotAnomalies(imgDataList, img.width, img.height, timestampMs);

        const features = [];
        for (let i = 0; i < kmoniPointsData.length; i++) {
            const pt = kmoniPointsData[i];
            const x = parseInt(pt.x, 10);
            const y = parseInt(pt.y, 10);

            if (x >= 0 && x < img.width && y >= 0 && y < img.height) {
                const idx = (y * img.width + x) * 4;
                const r = imgDataList[idx];
                const g = imgDataList[idx + 1];
                const b = imgDataList[idx + 2];

                if (r < 30 && g < 30 && b < 30) continue;

                const shindo = findNearestShindo(r, g, b);
                const intIdx = getIntensityIndex(shindo);

                features.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [parseFloat(pt.lot), parseFloat(pt.lat)] },
                    properties: {
                        color: `rgb(${r},${g},${b})`,
                        shindo_icon: (intIdx !== null) ? `shindo_icon_${intIdx}` : null
                    }
                });
            }
        }

        const geojson = { type: 'FeatureCollection', features: features };
        const newSourceId = `kmoni-plot-src-${timestampMs}`;
        const lidIcon = `kmoni-layer-icon-${timestampMs}`;
        const lidCircle = `kmoni-layer-circle-${timestampMs}`;

        subMap.addSource(newSourceId, { type: 'geojson', data: geojson });

        const showIcons = isDevOptionACheckbox && iconsLoaded;

        // 重なり順： [最背面] lidCircle(全点) -> [中] lidCirc(検知白縁) -> [最前面] lidSym(検知アイコン)
        let beforeIdForCircle = undefined;
        if (subMap.getLayer('custom-points-layer-sub-circ')) {
            beforeIdForCircle = 'custom-points-layer-sub-circ';
        }

        if (showIcons) {
            // 背景の円（アイコンがない点のみ）
            subMap.addLayer({
                id: lidCircle,
                type: 'circle',
                source: newSourceId,
                filter: ['==', ['get', 'shindo_icon'], null],
                paint: {
                    'circle-radius': 5,
                    'circle-color': ['get', 'color'],
                    'circle-stroke-width': 0
                }
            }, beforeIdForCircle);

            // 背景のアイコン（検知円が重なることを想定）
            subMap.addLayer({
                id: lidIcon,
                type: 'symbol',
                source: newSourceId,
                filter: ['!=', ['get', 'shindo_icon'], null],
                layout: {
                    'icon-image': ['get', 'shindo_icon'],
                    'icon-size': 1.0,
                    'icon-allow-overlap': true,
                    'icon-ignore-placement': true,
                    'icon-anchor': 'center'
                }
            });
        } else {
            // 従来モード
            subMap.addLayer({
                id: lidCircle,
                type: 'circle',
                source: newSourceId,
                paint: {
                    'circle-radius': 5,
                    'circle-color': ['get', 'color'],
                    'circle-stroke-width': 0
                }
            }, beforeIdForCircle);
        }

        const oldSources = [currentKmoniPlotSourceId];
        const oldLayers = [currentKmoniPlotLayerId, currentKmoniPlotLayerIdCircle];

        currentKmoniPlotSourceId = newSourceId;
        currentKmoniPlotLayerId = lidIcon;
        currentKmoniPlotLayerIdCircle = lidCircle;

        setTimeout(() => {
            oldLayers.forEach(id => { if (id && subMap.getLayer(id)) subMap.removeLayer(id); });
            oldSources.forEach(id => { if (id && subMap.getSource(id)) subMap.removeSource(id); });
        }, 150);
    };
    img.src = dataUrl;
}

let currentKmoniPlotLayerIdCircle = null;

async function updateKmoniLayer(now, dateStr, timeStr) {
    if (!subMap.getStyle() || !isSubMapOpen) return;

    const typeRadio = document.querySelector('input[name="kmoniType"]:checked');
    const imgType = typeRadio ? typeRadio.value : 'jma_s';
    // const imgUrl = `http://www.kmoni.bosai.go.jp/data/map_img/RealTimeImg/${imgType}/${dateStr}/${timeStr}.${imgType}.gif`;
    const imgUrl = `https://www.lmoni.bosai.go.jp/img_svr/data/map_img/RealTimeImg/${imgType}/${dateStr}/${timeStr}.${imgType}.gif`;
    const proxyUrl = `api.php?url=${encodeURIComponent(imgUrl)}`;

    try {
        const res = await fetch(proxyUrl);
        if (!res.ok) {
            fetchState.img.hasError = true;
            updateFetchStatusUI();
            return;
        }
        const blob = await res.blob();
        fetchState.img.lastSuccess = now;
        fetchState.img.hasError = false;
        updateFetchStatusUI();

        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result;
            const renderRadio = document.querySelector('input[name="kmoniRender"]:checked');
            const renderMode = renderRadio ? renderRadio.value : 'image';

            if (renderMode === 'plot' && kmoniPointsData) {
                // 画像レイヤーが存在する場合は消しておく
                if (currentKmoniLayerId && subMap.getLayer(currentKmoniLayerId)) {
                    subMap.removeLayer(currentKmoniLayerId);
                }
                if (currentKmoniSourceId && subMap.getSource(currentKmoniSourceId)) {
                    subMap.removeSource(currentKmoniSourceId);
                }
                currentKmoniLayerId = null;
                currentKmoniSourceId = null;

                const parseTimeStr = (str) => {
                    // "20260310234500" のような形式を想定
                    if (!str || str.length !== 14) return Date.now();
                    const y = str.slice(0,4), m = str.slice(4,6) - 1, d = str.slice(6,8);
                    const h = str.slice(8,10), min = str.slice(10,12), s = str.slice(12,14);
                    return new Date(y, m, d, h, min, s).getTime();
                };

                plotKmoniFromImage(dataUrl, parseTimeStr(dateStr + timeStr));
            } else {
                // プロットレイヤーが存在する場合は消しておく
                if (currentKmoniPlotLayerId && subMap.getLayer(currentKmoniPlotLayerId)) {
                    subMap.removeLayer(currentKmoniPlotLayerId);
                }
                if (currentKmoniPlotSourceId && subMap.getSource(currentKmoniPlotSourceId)) {
                    subMap.removeSource(currentKmoniPlotSourceId);
                }
                currentKmoniPlotLayerId = null;
                currentKmoniPlotSourceId = null;

                const timestamp = Date.now();
                const newSourceId = `kmoni-img-${timestamp}`;
                const newLayerId = `kmoni-layer-${timestamp}`;

                subMap.addSource(newSourceId, {
                    type: 'image',
                    url: dataUrl,
                    coordinates: kmoniCoordinates
                });

                // 最前面に来るべきレイヤー（独自検知格子 > 波形）の下に描画されるよう beforeId を探す
                let beforeId = undefined;
                if (customAlertSquareLayerId && subMap.getLayer(customAlertSquareLayerId)) {
                    beforeId = customAlertSquareLayerId;
                } else if (subMap.getLayer('p-wave-line')) {
                    beforeId = 'p-wave-line';
                } else if (subMap.getLayer('s-wave-line')) {
                    beforeId = 's-wave-line';
                }

                subMap.addLayer({
                    id: newLayerId,
                    type: 'raster',
                    source: newSourceId,
                    paint: {
                        'raster-opacity': 0.8,
                        'raster-resampling': 'nearest'
                    }
                }, beforeId);

                const oldLayerId = currentKmoniLayerId;
                const oldSourceId = currentKmoniSourceId;

                currentKmoniLayerId = newLayerId;
                currentKmoniSourceId = newSourceId;

                // 下になって見えなくなった古い画像を、描画完了後に削除（チカチカ防止）
                setTimeout(() => {
                    if (oldLayerId && subMap.getLayer(oldLayerId)) {
                        subMap.removeLayer(oldLayerId);
                    }
                    if (oldSourceId && subMap.getSource(oldSourceId)) {
                        subMap.removeSource(oldSourceId);
                    }
                }, 150);
            } // end else
        };
        reader.readAsDataURL(blob);
    } catch (e) {
        // 画像取得失敗
        fetchState.img.hasError = true;
        updateFetchStatusUI();
    }
}

function parseSnetValidTime(validTimeStr) {
    if (!validTimeStr || String(validTimeStr).length !== 14) return new Date();
    const str = String(validTimeStr);
    const y = parseInt(str.slice(0, 4), 10);
    const m = parseInt(str.slice(4, 6), 10) - 1;
    const d = parseInt(str.slice(6, 8), 10);
    const h = parseInt(str.slice(8, 10), 10);
    const min = parseInt(str.slice(10, 12), 10);
    const s = parseInt(str.slice(12, 14), 10);
    // targetTimes.jsonのvalidtimeはUTC時刻なのでDate.UTCを用いてJSTに変換
    return new Date(Date.UTC(y, m, d, h, min, s));
}

// ==========================================
// S-NET (海底地震計) 処理ロジック
// ==========================================
async function checkAndUpdateSnet() {
    if (!isSnetEnabled || !isSubMapOpen) {
        if (!isSnetEnabled) clearSnetLayers();
        return;
    }
    if (!snetPointsData) return;

    try {
        const targetTimesUrl = `snet_proxy.php?url=` + encodeURIComponent('https://www.msil.go.jp/data/tiles/smoni/targetTimes.json');
        const res = await fetch(targetTimesUrl);
        if (!res.ok) {
            fetchState.snet.hasError = true;
            updateFetchStatusUI();
            return;
        }

        const timesList = await res.json();
        if (!Array.isArray(timesList) || timesList.length === 0) {
            fetchState.snet.hasError = true;
            updateFetchStatusUI();
            return;
        }

        const latestTimeObj = timesList[timesList.length - 1];
        const validTime = latestTimeObj.validtime;
        const baseTime = latestTimeObj.basetime;

        // validTime が変化していなければ画像読み込み不要のためリターン（ステータス時刻は画像取得時のみ更新）
        if (validTime === lastSnetValidTime && snetGeoJsonData) {
            return;
        }

        const BASE_TILE_URL = `https://www.msil.go.jp/data/tiles/smoni/tileimage/${baseTime}/${validTime}/`;
        const features = [];
        const tileEntries = Object.entries(snetPointsData);

        const promises = tileEntries.map(([tilePath, stations]) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = "Anonymous";
                const targetUrl = BASE_TILE_URL + tilePath;
                img.src = `snet_proxy.php?url=${encodeURIComponent(targetUrl)}`;

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 256;
                    canvas.height = 256;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    ctx.drawImage(img, 0, 0);

                    stations.forEach(station => {
                        const pixel = ctx.getImageData(station.pixel_x, station.pixel_y, 1, 1).data;
                        const r = pixel[0];
                        const g = pixel[1];
                        const b = pixel[2];
                        const a = pixel[3] / 255;

                        if (a > 0 && (r + g + b >= 20)) {
                            const shindo = findNearestShindo(r, g, b);
                            const intIdx = getIntensityIndex(shindo);
                            features.push({
                                type: 'Feature',
                                geometry: {
                                    type: 'Point',
                                    coordinates: [parseFloat(station.longitude), parseFloat(station.latitude)]
                                },
                                properties: {
                                    station_cd: station.station_cd,
                                    color: `rgb(${r},${g},${b})`,
                                    shindo: shindo,
                                    shindo_icon: (intIdx !== null) ? `shindo_icon_${intIdx}` : null,
                                    alpha: a
                                }
                            });
                        }
                    });
                    resolve();
                };

                img.onerror = () => {
                    resolve();
                };
            });
        });

        await Promise.all(promises);

        lastSnetValidTime = validTime;
        snetGeoJsonData = {
            type: 'FeatureCollection',
            features: features
        };

        renderSnetLayers();

        // 取得した現在時刻ではなく、画像タイル(validTime)の時刻を表示
        fetchState.snet.lastSuccess = parseSnetValidTime(validTime);
        fetchState.snet.hasError = false;
        updateFetchStatusUI();

    } catch (e) {
        console.warn('S-NET update error:', e);
        fetchState.snet.hasError = true;
        updateFetchStatusUI();
    }
}

function renderSnetLayers() {
    if (!snetGeoJsonData || !isSnetEnabled) return;
    if (!subMap.getStyle()) return;

    const sourceId = `sub-snet-src`;
    const circLayerId = `sub-snet-circ`;
    const symLayerId = `sub-snet-sym`;

    if (subMap.getSource(sourceId)) {
        subMap.getSource(sourceId).setData(snetGeoJsonData);
    } else {
        subMap.addSource(sourceId, {
            type: 'geojson',
            data: snetGeoJsonData
        });
    }

    // 1. 円レイヤー
    if (!subMap.getLayer(circLayerId)) {
        subMap.addLayer({
            id: circLayerId,
            type: 'circle',
            source: sourceId,
            paint: {
                'circle-radius': 5,
                'circle-color': ['get', 'color'],
                'circle-stroke-width': 1,
                'circle-stroke-color': '#000000'
            }
        });
    }

    // 2. 震度アイコンレイヤー (通常の強震モニタ観測点と同じスイッチ: isDevOptionACheckbox)
    const showIcons = isDevOptionACheckbox && iconsLoaded;
    if (showIcons) {
        if (!subMap.getLayer(symLayerId)) {
            subMap.addLayer({
                id: symLayerId,
                type: 'symbol',
                source: sourceId,
                filter: ['!=', ['get', 'shindo_icon'], null],
                layout: {
                    'icon-image': ['get', 'shindo_icon'],
                    'icon-size': 1.0,
                    'icon-allow-overlap': true,
                    'icon-anchor': 'center'
                }
            });
        }
    } else {
        if (subMap.getLayer(symLayerId)) {
            subMap.removeLayer(symLayerId);
        }
    }
}

function clearSnetLayers() {
    if (!subMap.getStyle()) return;
    const sourceId = `sub-snet-src`;
    const circLayerId = `sub-snet-circ`;
    const symLayerId = `sub-snet-sym`;

    if (subMap.getLayer(symLayerId)) subMap.removeLayer(symLayerId);
    if (subMap.getLayer(circLayerId)) subMap.removeLayer(circLayerId);
    if (subMap.getSource(sourceId)) subMap.removeSource(sourceId);
}

    // ==========================================
    // WOLFX API (WEBSOCKET & ADAPTER LOGIC)
    // ==========================================
    let wolfxWS = null;
    let wolfxReconnectTimer = null;
    let wolfxPingInterval = null;
    let lastWolfxEventId = null;
    let lastWolfxSerial = -1;
    let latestFetchedTime = null;
    let lastAutoZoomBounds = null;
    let currentWolfxEEWData = null;

    // ==========================================
    // DEBUG INDICATOR LOGIC
    // ==========================================
    let isDebugIndicatorEnabled = false;

    function formatDetailTime(d) {
        if (!d) d = new Date();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        const ms = String(d.getMilliseconds()).padStart(3, '0');
        return `${hh}:${mm}:${ss}.${ms}`;
    }

    function updateDebugWsBadge(status) {
        updateEEWMonitorWsBadge(status);
        if (!isDebugIndicatorEnabled) return;
        const badge = document.getElementById('debugWsBadge');
        if (!badge) return;
        badge.className = `debug-badge ${status}`;
        if (status === 'connected') badge.textContent = 'WS: CONNECTED';
        else if (status === 'connecting') badge.textContent = 'WS: CONNECTING';
        else badge.textContent = 'WS: DISCONNECTED';
    }

    function updateDebugWsInfo(rawData, niedData) {
        if (!isDebugIndicatorEnabled) return;
        const timeEl = document.getElementById('debugWsRecvTime');
        const reportEl = document.getElementById('debugWsReportNum');
        const eventIdEl = document.getElementById('debugWsEventId');
        const hypoEl = document.getElementById('debugWsHypoInfo');
        const intensityEl = document.getElementById('debugWsIntensity');
        const dotEl = document.getElementById('debugWsFlashDot');
        const panel = document.getElementById('debugIndicatorPanel');

        if (timeEl) timeEl.textContent = formatDetailTime(new Date());

        if (dotEl) {
            dotEl.classList.remove('active');
            void dotEl.offsetWidth;
            dotEl.classList.add('active');
        }
        if (panel) {
            panel.classList.add('flash-ws');
            setTimeout(() => panel.classList.remove('flash-ws'), 400);
        }

        if (rawData && (rawData.type === 'ping' || rawData.type === 'pong' || rawData.type === 'heartbeat')) {
            return;
        }

        if (niedData && niedData.result && niedData.result.status === 'success') {
            if (reportEl) reportEl.textContent = niedData.report_num ? `第${niedData.report_num}報${niedData.is_final ? '(最終)' : ''}` : '初報';
            if (eventIdEl) eventIdEl.textContent = niedData.event_id || '--';
            if (hypoEl) hypoEl.textContent = `${niedData.region_name || '不明'} M${niedData.magunitude || '0.0'}`;
            if (intensityEl) intensityEl.textContent = `最大震度${niedData.calcintensity || '0'} [${niedData.alertflg || '予報'}]`;
        } else if (rawData) {
            if (reportEl) reportEl.textContent = rawData.Title || rawData.type || '受信';
            if (eventIdEl) eventIdEl.textContent = rawData.EventID || '--';
            if (hypoEl) hypoEl.textContent = rawData.Hypocenter || '--';
            if (intensityEl) intensityEl.textContent = rawData.MaxIntensity || '--';
        }
    }

    function updateDebugYahooInfo(yahooData, fetchTime) {
        if (!isDebugIndicatorEnabled) return;
        const timeEl = document.getElementById('debugYahooFetchTime');
        const validStatusEl = document.getElementById('debugYahooValidStatus');
        const hypoEl = document.getElementById('debugYahooHypo');
        const psWaveEl = document.getElementById('debugYahooPsWave');
        const badgeEl = document.getElementById('debugYahooBadge');

        if (timeEl) timeEl.textContent = formatDetailTime(fetchTime || new Date());

        const isValid = yahooData && (yahooData.hypoInfo !== null || yahooData.psWave !== null);

        if (validStatusEl) {
            validStatusEl.textContent = isValid ? '有効データあり' : 'データなし (null)';
            validStatusEl.className = `debug-value ${isValid ? 'active-eew' : ''}`;
        }

        if (badgeEl) {
            badgeEl.textContent = isValid ? 'VALID' : 'NULL';
            badgeEl.className = `debug-badge-mini ${isValid ? 'valid' : 'invalid'}`;
        }

        if (hypoEl) {
            if (yahooData && yahooData.hypoInfo && yahooData.hypoInfo.items && yahooData.hypoInfo.items.length > 0) {
                const item = yahooData.hypoInfo.items[0];
                hypoEl.textContent = `第${item.reportNum || '1'}報 ${item.regionName || ''} (M${item.magnitude || '0.0'})`;
            } else {
                hypoEl.textContent = 'null';
            }
        }

        if (psWaveEl) {
            if (yahooData && yahooData.psWave) {
                psWaveEl.textContent = '存在 (波形描画中)';
            } else {
                psWaveEl.textContent = 'null';
            }
        }
    }

    /**
     * 地震発生時刻と深さから自前で地表P波・S波到達半径 (km) を計算する
     * @param {string} originTimeStr - "YYYYMMDDHHmmss" または "YYYY-MM-DD HH:mm:ss" 形式
     * @param {string|number} depthVal - 深さ（例: "10km", "50", 100）
     * @param {Date} [nowDate] - 現在時刻 (省略時はgetCurrentAppTime())
     * @returns {{pRadius: number, sRadius: number}}
     */
    // ==========================================
    // WOLFX EEW MONITOR & HISTORY ARCHIVE
    // ==========================================
    let isEEWMonitorEnabled = false;
    let monitorPopoutWindow = null;
    let currentWolfxEvents = {};
    let activeMonitorEventId = null;
    let activeMonitorSelectedSerial = 'latest';

    function initEEWMonitorUI() {
        const monitorToggleEl = document.getElementById('eewMonitorToggle');
        const toggleBtn = document.getElementById('toggleMonitorBtn');
        const closeBtn = document.getElementById('eewMonitorCloseBtn');
        const popoutBtn = document.getElementById('eewMonitorPopoutBtn');
        const copyBtn = document.getElementById('eewCopyJsonBtn');
        const historyBtn = document.getElementById('eewHistoryBtn');
        const historyCloseBtn = document.getElementById('eewHistoryCloseBtn');
        const historyBackdropEl = document.getElementById('eewHistoryBackdrop');
        const historyRefreshBtn = document.getElementById('eewHistoryRefreshBtn');

        const savedMonitorState = localStorage.getItem('eew_monitor_enabled') === 'true';
        setEEWMonitorVisible(savedMonitorState);

        if (monitorToggleEl) {
            monitorToggleEl.checked = savedMonitorState;
            monitorToggleEl.addEventListener('change', (e) => {
                setEEWMonitorVisible(e.target.checked);
            });
        }

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                setEEWMonitorVisible(!isEEWMonitorEnabled);
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                setEEWMonitorVisible(false);
            });
        }

        if (popoutBtn) {
            popoutBtn.addEventListener('click', () => {
                openEEWMonitorPopout();
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                copyCurrentMonitorJson();
            });
        }

        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                openEEWHistoryModal();
            });
        }
        if (historyCloseBtn) {
            historyCloseBtn.addEventListener('click', () => {
                closeEEWHistoryModal();
            });
        }
        if (historyBackdropEl) {
            historyBackdropEl.addEventListener('click', () => {
                closeEEWHistoryModal();
            });
        }
        if (historyRefreshBtn) {
            historyRefreshBtn.addEventListener('click', () => {
                loadEEWHistoryList();
            });
        }
    }

    function updateEEWMonitorWsBadge(status) {
        const badge = document.getElementById('eewMonitorWsBadge');
        if (badge) {
            badge.className = `debug-badge ${status}`;
            if (status === 'connected') badge.textContent = 'WS: ON';
            else if (status === 'connecting') badge.textContent = 'WS: CONNECTING';
            else badge.textContent = 'WS: OFF';
        }

        if (monitorPopoutWindow && !monitorPopoutWindow.closed) {
            try {
                const popBadge = monitorPopoutWindow.document.getElementById('popWsBadge');
                if (popBadge) {
                    popBadge.className = `debug-badge ${status}`;
                    popBadge.textContent = status === 'connected' ? 'WS: ON' : (status === 'connecting' ? 'WS: CONNECTING' : 'WS: OFF');
                }
            } catch (e) {}
        }
    }

    function setEEWMonitorVisible(visible) {
        isEEWMonitorEnabled = visible;
        localStorage.setItem('eew_monitor_enabled', visible ? 'true' : 'false');

        const monitorPanelEl = document.getElementById('eewMonitorPanel');
        const monitorToggleEl = document.getElementById('eewMonitorToggle');
        const toggleBtn = document.getElementById('toggleMonitorBtn');

        if (monitorPanelEl) {
            if (visible) monitorPanelEl.classList.remove('hidden');
            else monitorPanelEl.classList.add('hidden');
        }
        if (monitorToggleEl) {
            monitorToggleEl.checked = visible;
        }
        if (toggleBtn) {
            if (visible) toggleBtn.classList.add('active');
            else toggleBtn.classList.remove('active');
        }

        if (visible) {
            updateEEWMonitorDisplay();
        }
    }

    function handleWolfxMonitorAndSave(rawData, niedData) {
        if (!rawData) return;
        if (rawData.type === 'ping' || rawData.type === 'pong' || rawData.type === 'heartbeat') return;

        const eventId = String(rawData.EventID || (niedData && niedData.event_id) || (rawData.OriginTime ? String(rawData.OriginTime).replace(/[^0-9]/g, '') : Date.now()));
        const serial = parseInt(rawData.Serial !== undefined ? rawData.Serial : ((niedData && niedData.report_num) || 1), 10);
        const recvTime = new Date();

        if (!currentWolfxEvents[eventId]) {
            currentWolfxEvents[eventId] = {
                event_id: eventId,
                reports: []
            };
        }

        const reports = currentWolfxEvents[eventId].reports;
        const existingIdx = reports.findIndex(r => r.serial === serial);
        const reportEntry = {
            serial: serial,
            recv_time: recvTime,
            raw: rawData,
            parsed: niedData
        };

        if (existingIdx >= 0) {
            reports[existingIdx] = reportEntry;
        } else {
            reports.push(reportEntry);
            reports.sort((a, b) => a.serial - b.serial);
        }

        activeMonitorEventId = eventId;
        activeMonitorSelectedSerial = 'latest';

        updateEEWMonitorDisplay();
        saveEEWMessageToBackend(rawData);
    }

    function saveEEWMessageToBackend(rawData) {
        try {
            fetch('api.php?action=save_eew', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rawData)
            }).catch(err => {
                console.warn("[EEW] api.php save failed:", err);
            });
        } catch (e) {
            console.warn("[EEW] save error:", e);
        }
    }

    function updateEEWMonitorDisplay() {
        const timeEl = document.getElementById('eewMonitorRecvTime');
        const dotEl = document.getElementById('eewMonitorFlashDot');
        const badgeEl = document.getElementById('eewMonitorStatusBadge');
        const hypoEl = document.getElementById('eewMonitorHypo');
        const maxIntEl = document.getElementById('eewMonitorMaxInt');
        const magEl = document.getElementById('eewMonitorMag');
        const depthEl = document.getElementById('eewMonitorDepth');
        const warnEl = document.getElementById('eewMonitorWarn');
        const tabsEl = document.getElementById('eewReportTabs');
        const preEl = document.getElementById('eewJsonPre');
        const panelEl = document.getElementById('eewMonitorPanel');

        if (!activeMonitorEventId || !currentWolfxEvents[activeMonitorEventId]) {
            if (preEl) preEl.innerHTML = '<code>// Wolfx WebSocket電文を受信するとここに生JSONが表示されます</code>';
            return;
        }

        const ev = currentWolfxEvents[activeMonitorEventId];
        const reports = ev.reports || [];
        if (reports.length === 0) return;

        let curReport = reports[reports.length - 1];
        if (activeMonitorSelectedSerial !== 'latest') {
            const found = reports.find(r => r.serial === parseInt(activeMonitorSelectedSerial, 10));
            if (found) curReport = found;
        }

        const raw = curReport.raw;
        const parsed = curReport.parsed;

        // フラッシュアニメーション
        if (dotEl) {
            dotEl.classList.remove('active');
            void dotEl.offsetWidth;
            dotEl.classList.add('active');
        }
        if (panelEl) {
            panelEl.classList.add('flash');
            setTimeout(() => panelEl.classList.remove('flash'), 400);
        }

        // サマリー更新
        if (timeEl) timeEl.textContent = `受信: ${formatDetailTime(curReport.recv_time)}`;

        const isCancel = raw.isCancel === true || raw.is_cancel === true;
        const isWarn = raw.Warn === true || raw.isWarn === true || raw.warn === true;
        const isFinal = raw.isFinal === true || raw.is_final === true;

        if (badgeEl) {
            badgeEl.className = 'summary-status-badge';
            if (isCancel) {
                badgeEl.classList.add('cancel');
                badgeEl.textContent = '取消報';
            } else if (isWarn) {
                badgeEl.classList.add('warn');
                badgeEl.textContent = isFinal ? '警報 (最終)' : '緊急地震速報 (警報)';
            } else {
                badgeEl.classList.add('forecast');
                badgeEl.textContent = isFinal ? '予報 (最終)' : '緊急地震速報 (予報)';
            }
        }

        if (hypoEl) hypoEl.textContent = (parsed && parsed.region_name) || raw.Hypocenter || raw.Title || '震源不明';
        if (maxIntEl) maxIntEl.textContent = (parsed && parsed.calcintensity) || raw.MaxIntensity || '--';
        if (magEl) magEl.textContent = `M${(parsed && parsed.magnitude) || raw.Magunitude || raw.Magnitude || '--'}`;
        if (depthEl) depthEl.textContent = (parsed && parsed.depth) || (raw.Depth !== undefined ? `${raw.Depth}km` : '--');
        if (warnEl) warnEl.textContent = isWarn ? '警報' : (isCancel ? '取消' : '予報');

        // タブ生成
        if (tabsEl) {
            tabsEl.innerHTML = '';
            const latestBtn = document.createElement('button');
            latestBtn.className = `eew-tab-btn ${activeMonitorSelectedSerial === 'latest' ? 'active' : ''}`;
            latestBtn.textContent = `最新報 (第${reports[reports.length - 1].serial}報)`;
            latestBtn.addEventListener('click', () => {
                activeMonitorSelectedSerial = 'latest';
                updateEEWMonitorDisplay();
            });
            tabsEl.appendChild(latestBtn);

            reports.forEach(r => {
                const btn = document.createElement('button');
                btn.className = `eew-tab-btn ${activeMonitorSelectedSerial === String(r.serial) ? 'active' : ''}`;
                btn.textContent = `第${r.serial}報`;
                btn.addEventListener('click', () => {
                    activeMonitorSelectedSerial = String(r.serial);
                    updateEEWMonitorDisplay();
                });
                tabsEl.appendChild(btn);
            });
        }

        // JSON整形表示
        const jsonStr = JSON.stringify(raw, null, 2);
        if (preEl) {
            preEl.textContent = jsonStr;
        }

        // ポップアップウィンドウにも反映
        syncEEWMonitorToPopout(curReport, reports, jsonStr);
    }

    function copyCurrentMonitorJson() {
        const preEl = document.getElementById('eewJsonPre');
        const copyBtn = document.getElementById('eewCopyJsonBtn');
        if (!preEl) return;

        const text = preEl.textContent;
        navigator.clipboard.writeText(text).then(() => {
            if (copyBtn) {
                const origHtml = copyBtn.innerHTML;
                copyBtn.innerHTML = '<span class="material-symbols-rounded">check</span> コピー完了';
                copyBtn.style.color = '#4ade80';
                setTimeout(() => {
                    copyBtn.innerHTML = origHtml;
                    copyBtn.style.color = '';
                }, 2000);
            }
        }).catch(err => {
            console.warn("Clipboard copy failed:", err);
        });
    }

    function openEEWMonitorPopout() {
        if (monitorPopoutWindow && !monitorPopoutWindow.closed) {
            monitorPopoutWindow.focus();
            return;
        }

        monitorPopoutWindow = window.open('', 'eew_popout_window', 'width=560,height=720,menubar=no,toolbar=no,status=no,location=no');
        if (!monitorPopoutWindow) {
            alert("ポップアップブロックを解除してください。");
            return;
        }

        const doc = monitorPopoutWindow.document;
        doc.open();
        doc.write(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>Wolfx EEW Monitor (別ウィンドウ)</title>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@48,400,1,0" />
    <style>
        body {
            margin: 0;
            padding: 16px;
            background: #0f172a;
            color: #f1f5f9;
            font-family: 'Roboto Mono', monospace, sans-serif;
            font-size: 13px;
            box-sizing: border-box;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid rgba(255,255,255,0.15);
            padding-bottom: 10px;
            margin-bottom: 12px;
        }
        .title {
            font-weight: 700;
            font-size: 15px;
            color: #38bdf8;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .debug-badge {
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 4px;
        }
        .debug-badge.connected { background: #16a34a; color: #fff; }
        .debug-badge.connecting { background: #ca8a04; color: #fff; }
        .debug-badge.disconnected { background: #dc2626; color: #fff; }
        .summary-card {
            background: rgba(0,0,0,0.4);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 12px;
        }
        .summary-top {
            display: flex;
            justify-content: space-between;
            color: #94a3b8;
            font-size: 11px;
            margin-bottom: 6px;
        }
        .summary-main {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }
        .status-badge {
            padding: 3px 8px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 11px;
            background: #475569;
        }
        .status-badge.warn { background: #ef4444; color: #fff; }
        .status-badge.forecast { background: #0284c7; color: #fff; }
        .hypo { font-size: 17px; font-weight: 700; color: #fff; }
        .grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            border-top: 1px solid rgba(255,255,255,0.08);
            padding-top: 8px;
            font-size: 12px;
        }
        .grid span { color: #94a3b8; }
        .grid strong { color: #38bdf8; display: block; font-size: 13px; }
        .tabs {
            display: flex;
            gap: 6px;
            overflow-x: auto;
            margin-bottom: 12px;
            padding-bottom: 4px;
        }
        .tab-btn {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            color: #cbd5e1;
            padding: 4px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
            white-space: nowrap;
        }
        .tab-btn.active {
            background: #0284c7;
            border-color: #38bdf8;
            color: #fff;
            font-weight: 700;
        }
        .json-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
            font-size: 11px;
            color: #94a3b8;
        }
        .copy-btn {
            background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.15);
            color: #cbd5e1;
            padding: 3px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
        }
        .copy-btn:hover { background: rgba(56,189,248,0.2); color: #38bdf8; }
        pre {
            background: #020617;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 6px;
            padding: 12px;
            color: #e2e8f0;
            font-size: 12px;
            line-height: 1.4;
            max-height: calc(100vh - 280px);
            overflow: auto;
            white-space: pre-wrap;
            word-break: break-all;
            margin: 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">WOLFX EEW MONITOR</div>
        <div class="debug-badge disconnected" id="popWsBadge">WS: OFF</div>
    </div>
    <div class="summary-card">
        <div class="summary-top">
            <span id="popRecvTime">受信: --:--:--.--</span>
        </div>
        <div class="summary-main">
            <span class="status-badge" id="popStatusBadge">待機中</span>
            <span class="hypo" id="popHypo">電文を受信していません</span>
        </div>
        <div class="grid">
            <div><span>最大震度</span><strong id="popMaxInt">--</strong></div>
            <div><span>規模</span><strong id="popMag">--</strong></div>
            <div><span>深さ</span><strong id="popDepth">--</strong></div>
            <div><span>警報/予報</span><strong id="popWarn">--</strong></div>
        </div>
    </div>
    <div class="tabs" id="popTabs"></div>
    <div class="json-header">
        <span>Raw JSON</span>
        <button class="copy-btn" id="popCopyBtn">コピー</button>
    </div>
    <pre id="popPre"><code>// 電文待機中</code></pre>
</body>
</html>`);
        doc.close();

        updateEEWMonitorWsBadge(wolfxWS && wolfxWS.readyState === WebSocket.OPEN ? 'connected' : 'disconnected');
        updateEEWMonitorDisplay();

        monitorPopoutWindow.addEventListener('unload', () => {
            monitorPopoutWindow = null;
        });
    }

    function syncEEWMonitorToPopout(curReport, reports, jsonStr) {
        if (!monitorPopoutWindow || monitorPopoutWindow.closed) return;
        try {
            const doc = monitorPopoutWindow.document;
            const popRecvTime = doc.getElementById('popRecvTime');
            const popStatusBadge = doc.getElementById('popStatusBadge');
            const popHypo = doc.getElementById('popHypo');
            const popMaxInt = doc.getElementById('popMaxInt');
            const popMag = doc.getElementById('popMag');
            const popDepth = doc.getElementById('popDepth');
            const popWarn = doc.getElementById('popWarn');
            const popTabs = doc.getElementById('popTabs');
            const popPre = doc.getElementById('popPre');
            const popCopyBtn = doc.getElementById('popCopyBtn');

            const raw = curReport.raw;
            const parsed = curReport.parsed;
            const isCancel = raw.isCancel === true || raw.is_cancel === true;
            const isWarn = raw.Warn === true || raw.isWarn === true || raw.warn === true;
            const isFinal = raw.isFinal === true || raw.is_final === true;

            if (popRecvTime) popRecvTime.textContent = `受信: ${formatDetailTime(curReport.recv_time)}`;
            if (popStatusBadge) {
                popStatusBadge.className = 'status-badge';
                if (isCancel) { popStatusBadge.classList.add('cancel'); popStatusBadge.textContent = '取消報'; }
                else if (isWarn) { popStatusBadge.classList.add('warn'); popStatusBadge.textContent = isFinal ? '警報 (最終)' : '緊急地震速報 (警報)'; }
                else { popStatusBadge.classList.add('forecast'); popStatusBadge.textContent = isFinal ? '予報 (最終)' : '緊急地震速報 (予報)'; }
            }
            if (popHypo) popHypo.textContent = (parsed && parsed.region_name) || raw.Hypocenter || raw.Title || '震源不明';
            if (popMaxInt) popMaxInt.textContent = (parsed && parsed.calcintensity) || raw.MaxIntensity || '--';
            if (popMag) popMag.textContent = `M${(parsed && parsed.magnitude) || raw.Magunitude || raw.Magnitude || '--'}`;
            if (popDepth) popDepth.textContent = (parsed && parsed.depth) || (raw.Depth !== undefined ? `${raw.Depth}km` : '--');
            if (popWarn) popWarn.textContent = isWarn ? '警報' : (isCancel ? '取消' : '予報');

            if (popTabs) {
                popTabs.innerHTML = '';
                const latestBtn = doc.createElement('button');
                latestBtn.className = `tab-btn ${activeMonitorSelectedSerial === 'latest' ? 'active' : ''}`;
                latestBtn.textContent = `最新報 (第${reports[reports.length - 1].serial}報)`;
                latestBtn.addEventListener('click', () => {
                    activeMonitorSelectedSerial = 'latest';
                    updateEEWMonitorDisplay();
                });
                popTabs.appendChild(latestBtn);

                reports.forEach(r => {
                    const btn = doc.createElement('button');
                    btn.className = `tab-btn ${activeMonitorSelectedSerial === String(r.serial) ? 'active' : ''}`;
                    btn.textContent = `第${r.serial}報`;
                    btn.addEventListener('click', () => {
                        activeMonitorSelectedSerial = String(r.serial);
                        updateEEWMonitorDisplay();
                    });
                    popTabs.appendChild(btn);
                });
            }

            if (popPre) popPre.textContent = jsonStr;
            if (popCopyBtn && !popCopyBtn._hasListener) {
                popCopyBtn._hasListener = true;
                popCopyBtn.addEventListener('click', () => {
                    monitorPopoutWindow.navigator.clipboard.writeText(jsonStr).then(() => {
                        popCopyBtn.textContent = 'コピー完了！';
                        setTimeout(() => { popCopyBtn.textContent = 'コピー'; }, 2000);
                    });
                });
            }
        } catch (e) {
            console.warn("syncEEWMonitorToPopout error:", e);
        }
    }

    // ==========================================
    // EEW HISTORY ARCHIVE LOGIC (MODAL)
    // ==========================================
    function openEEWHistoryModal() {
        const modal = document.getElementById('eewHistoryModal');
        if (modal) {
            modal.classList.remove('hidden');
            loadEEWHistoryList();
        }
    }

    function closeEEWHistoryModal() {
        const modal = document.getElementById('eewHistoryModal');
        if (modal) modal.classList.add('hidden');
    }

    async function loadEEWHistoryList() {
        const listEl = document.getElementById('eewHistoryItemsList');
        const countEl = document.getElementById('eewHistoryCount');
        if (!listEl) return;

        listEl.innerHTML = '<div class="history-empty">履歴を取得中...</div>';

        try {
            const res = await fetch('api.php?action=list_eew&limit=100');
            const data = await res.json();

            if (data.status !== 'success' || !data.items || data.items.length === 0) {
                listEl.innerHTML = '<div class="history-empty">保存された過去のEEW電文はありません</div>';
                if (countEl) countEl.textContent = '0 件';
                const detailEl = document.getElementById('eewHistoryDetailPane');
                if (detailEl) detailEl.innerHTML = '<div class="detail-placeholder">保存された電文がありません</div>';
                return;
            }

            if (countEl) countEl.textContent = `${data.total} 件`;
            listEl.innerHTML = '';

            data.items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'history-item-card';
                card.dataset.eventId = item.event_id;

                const isWarn = item.is_warn || false;
                const shindoClass = isWarn ? 'history-card-shindo warn' : 'history-card-shindo';
                const statusText = item.is_cancel ? '取消' : (isWarn ? '警報' : '予報');

                card.innerHTML = `
                    <div class="history-card-header">
                        <span class="history-card-time">${item.origin_time || item.updated_at || item.event_id}</span>
                        <span class="${shindoClass}">震度${item.max_intensity || '--'}</span>
                    </div>
                    <div class="history-card-hypo">${item.hypocenter || '震源不明'}</div>
                    <div class="history-card-footer">
                        <span>M${item.magnitude || '--'} / ${item.depth || '--'}</span>
                        <span>全${item.reports_count || item.latest_serial || 1}報${item.is_final ? '(最終)' : ''} [${statusText}]</span>
                    </div>
                `;

                card.addEventListener('click', () => {
                    listEl.querySelectorAll('.history-item-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    loadEEWHistoryDetail(item.event_id);
                });

                listEl.appendChild(card);
            });

            // 最初のカードを自動選択
            const firstCard = listEl.querySelector('.history-item-card');
            if (firstCard) firstCard.click();
        } catch (e) {
            console.error("loadEEWHistoryList error:", e);
            listEl.innerHTML = '<div class="history-empty">履歴の取得に失敗しました</div>';
        }
    }

    async function loadEEWHistoryDetail(eventId) {
        const detailEl = document.getElementById('eewHistoryDetailPane');
        if (!detailEl) return;

        detailEl.innerHTML = '<div class="detail-placeholder">電文詳細を読み込み中...</div>';

        try {
            const res = await fetch(`api.php?action=get_eew&event_id=${encodeURIComponent(eventId)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const eventData = await res.json();

            const reports = eventData.reports || [];
            let activeReportIndex = reports.length - 1;

            function renderDetailContent() {
                const curReport = reports[activeReportIndex] || {};
                const raw = curReport.raw || {};
                const isWarn = eventData.is_warn || raw.Warn === true;
                const isFinal = eventData.is_final || raw.isFinal === true;
                const isCancel = eventData.is_cancel || raw.isCancel === true;

                // シミュレーション時刻文字列（YYYY-MM-DDTHH:mm:ss）
                let simTimeStr = '';
                const ot = eventData.origin_time || raw.OriginTime || eventData.event_id || '';
                const cleanOt = String(ot).replace(/[^0-9]/g, '');
                if (cleanOt.length >= 14) {
                    const y = cleanOt.substring(0, 4);
                    const m = cleanOt.substring(4, 6);
                    const d = cleanOt.substring(6, 8);
                    const h = cleanOt.substring(8, 10);
                    const min = cleanOt.substring(10, 12);
                    const s = cleanOt.substring(12, 14);
                    simTimeStr = `${y}-${m}-${d}T${h}:${min}:${s}`;
                }

                detailEl.innerHTML = `
                    <div class="detail-header-card">
                        <div class="detail-header-top">
                            <span class="detail-event-id">Event ID: ${eventData.event_id}</span>
                            <div class="detail-action-buttons">
                                ${simTimeStr ? `<button class="detail-sim-btn" id="historySimJumpBtn" title="この日時の強震モニタをシミュレーション再生"><span class="material-symbols-rounded">play_circle</span> シミュレーション起動</button>` : ''}
                            </div>
                        </div>
                        <div class="detail-main-info">
                            <span class="detail-hypo-name">${eventData.hypocenter || raw.Hypocenter || '震源不明'}</span>
                            <span class="summary-status-badge ${isCancel ? 'cancel' : (isWarn ? 'warn' : 'forecast')}">
                                ${isCancel ? '取消報' : (isWarn ? (isFinal ? '警報 (最終)' : '警報') : (isFinal ? '予報 (最終)' : '予報'))}
                            </span>
                        </div>
                        <div class="detail-grid">
                            <div class="detail-grid-item"><span class="detail-grid-label">発震時刻</span><span class="detail-grid-val">${eventData.origin_time || raw.OriginTime || '--'}</span></div>
                            <div class="detail-grid-item"><span class="detail-grid-label">最大震度</span><span class="detail-grid-val">震度${eventData.max_intensity || raw.MaxIntensity || '--'}</span></div>
                            <div class="detail-grid-item"><span class="detail-grid-label">マグニチュード</span><span class="detail-grid-val">M${eventData.magnitude || raw.Magunitude || raw.Magnitude || '--'}</span></div>
                            <div class="detail-grid-item"><span class="detail-grid-label">深さ</span><span class="detail-grid-val">${eventData.depth || raw.Depth || '--'}</span></div>
                        </div>
                    </div>

                    <div class="eew-report-tabs-section">
                        <div class="tabs-label">報数 (${reports.length}報中 第${curReport.serial || activeReportIndex + 1}報を表示):</div>
                        <div class="eew-report-tabs" id="historyReportTabs"></div>
                    </div>

                    <div class="eew-json-section">
                        <div class="eew-json-header">
                            <span>第${curReport.serial || activeReportIndex + 1}報 生電文 (Raw JSON) - 受信: ${curReport.recv_time || '--'}</span>
                            <button class="copy-json-btn" id="historyCopyJsonBtn">
                                <span class="material-symbols-rounded">content_copy</span> コピー
                            </button>
                        </div>
                        <pre class="eew-json-pre" id="historyJsonPre">${JSON.stringify(raw, null, 2)}</pre>
                    </div>
                `;

                // 報数タブ生成
                const tabsEl = detailEl.querySelector('#historyReportTabs');
                if (tabsEl) {
                    reports.forEach((rep, idx) => {
                        const btn = document.createElement('button');
                        btn.className = `eew-tab-btn ${idx === activeReportIndex ? 'active' : ''}`;
                        btn.textContent = `第${rep.serial || idx + 1}報`;
                        btn.addEventListener('click', () => {
                            activeReportIndex = idx;
                            renderDetailContent();
                        });
                        tabsEl.appendChild(btn);
                    });
                }

                // コピーボタン
                const copyBtn = detailEl.querySelector('#historyCopyJsonBtn');
                if (copyBtn) {
                    copyBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(JSON.stringify(raw, null, 2)).then(() => {
                            copyBtn.innerHTML = '<span class="material-symbols-rounded">check</span> コピー完了';
                            copyBtn.style.color = '#4ade80';
                            setTimeout(() => {
                                copyBtn.innerHTML = '<span class="material-symbols-rounded">content_copy</span> コピー';
                                copyBtn.style.color = '';
                            }, 2000);
                        });
                    });
                }

                // シミュレーション起動ボタン
                const simBtn = detailEl.querySelector('#historySimJumpBtn');
                if (simBtn && simTimeStr) {
                    simBtn.addEventListener('click', () => {
                        const simInput = document.getElementById('simTimeInput');
                        const simToggleBtn = document.getElementById('simToggleBtn');
                        if (simInput) {
                            simInput.value = simTimeStr;
                            closeEEWHistoryModal();
                            if (!isSimulationMode && simToggleBtn) {
                                simToggleBtn.click();
                            }
                        }
                    });
                }
            }

            renderDetailContent();
        } catch (e) {
            console.error("loadEEWHistoryDetail error:", e);
            detailEl.innerHTML = '<div class="detail-placeholder">電文詳細の取得に失敗しました</div>';
        }
    }

    function calculateEstimatedPSWaveRadius(originTimeStr, depthVal, nowDate) {
        if (!nowDate) nowDate = getCurrentAppTime();
        if (!originTimeStr) return { pRadius: 0, sRadius: 0 };

        let originMs = 0;
        const cleanOt = String(originTimeStr).replace(/[^0-9]/g, '');
        if (cleanOt.length === 14) {
            const yyyy = parseInt(cleanOt.substring(0, 4), 10);
            const mm = parseInt(cleanOt.substring(4, 6), 10) - 1;
            const dd = parseInt(cleanOt.substring(6, 8), 10);
            const hh = parseInt(cleanOt.substring(8, 10), 10);
            const mi = parseInt(cleanOt.substring(10, 12), 10);
            const ss = parseInt(cleanOt.substring(12, 14), 10);
            originMs = new Date(yyyy, mm, dd, hh, mi, ss).getTime();
        } else {
            originMs = new Date(originTimeStr).getTime();
        }

        if (isNaN(originMs) || originMs <= 0) return { pRadius: 0, sRadius: 0 };

        // 経過時間 t (秒)
        const elapsedSec = Math.max(0, (nowDate.getTime() - originMs) / 1000);

        // 深さ d (km)
        let depthKm = 10;
        if (depthVal !== undefined && depthVal !== null) {
            const parsedD = parseFloat(String(depthVal).replace(/[^0-9.]/g, ''));
            if (!isNaN(parsedD)) depthKm = parsedD;
        }

        // 深さ d による速度選定
        // d < 30 km: v_P = 6.0, v_S = 3.6
        // 30 <= d < 80 km: v_P = 7.9, v_S = 4.5
        // d >= 80 km: v_P = 8.5, v_S = 4.8
        let vP = 6.0;
        let vS = 3.6;
        if (depthKm >= 80) {
            vP = 8.5;
            vS = 4.8;
        } else if (depthKm >= 30) {
            vP = 7.9;
            vS = 4.5;
        }

        // 直線走時波 D (km)
        const distP = vP * elapsedSec;
        const distS = vS * elapsedSec;

        // 地表到達円の半径 r = sqrt(D^2 - d^2) (km)
        const rP = distP > depthKm ? Math.sqrt(distP * distP - depthKm * depthKm) : 0;
        const rS = distS > depthKm ? Math.sqrt(distS * distS - depthKm * depthKm) : 0;

        return {
            pRadius: Math.round(rP * 10) / 10,
            sRadius: Math.round(rS * 10) / 10
        };
    }

    function isWolfxEEWActive(niedData, nowDate) {
        if (!niedData || niedData.is_cancel) return false;
        if (!niedData.calcintensity || niedData.calcintensity === "0" || niedData.calcintensity === "00") return false;

        const ot = niedData.origin_time;
        if (!ot || ot.length !== 14) return false;

        if (!nowDate) nowDate = getCurrentAppTime();
        const yyyy = parseInt(ot.substring(0, 4), 10);
        const mm = parseInt(ot.substring(4, 6), 10) - 1;
        const dd = parseInt(ot.substring(6, 8), 10);
        const hh = parseInt(ot.substring(8, 10), 10);
        const mi = parseInt(ot.substring(10, 12), 10);
        const ss = parseInt(ot.substring(12, 14), 10);
        const originMs = new Date(yyyy, mm, dd, hh, mi, ss).getTime();
        if (isNaN(originMs)) return false;

        const elapsedSec = (nowDate.getTime() - originMs) / 1000;
        const isFinal = niedData.is_final === true || niedData.is_final === "true";
        // 最終報なら180秒（3分）以内、続報中なら300秒（5分）以内を発出中と判定
        const maxActiveSec = isFinal ? 180 : 300;
        if (elapsedSec < -30 || elapsedSec > maxActiveSec) {
            return false;
        }

        return true;
    }

    function parseWolfxEEW(raw) {
        if (!raw) return null;

        if (raw.type && raw.type !== 'jma_eew' && raw.type !== 'eew' && raw.type !== 'jma') {
            if (raw.type === 'heartbeat' || raw.type === 'ping' || raw.type === 'pong') return null;
        }

        const isCancel = raw.isCancel === true || raw.isCancel === "true" || raw.is_cancel === true || raw.isCancel === 1;
        const isFinal = raw.isFinal === true || raw.isFinal === "true" || raw.is_final === true;

        const serial = raw.Serial !== undefined ? raw.Serial : (raw.report_num || raw.serial || '1');
        const regionName = raw.Hypocenter || raw.Title || raw.region_name || raw.hypocenter || '不明';
        
        // Wolfxのマグニチュードは "Magunitude" キー(u入り大文字)で格納されているため、優先取得する
        const magnitudeVal = raw.Magunitude !== undefined ? raw.Magunitude : (raw.Magnitude !== undefined ? raw.Magnitude : (raw.magunitude || raw.magnitude || '0.0'));

        let depthVal = raw.Depth !== undefined ? raw.Depth : (raw.depth || '');
        if (typeof depthVal === 'number') {
            depthVal = `${depthVal}km`;
        }

        const intensity = raw.MaxIntensity || raw.calcintensity || raw.max_intensity || '0';

        let originTimeStr = "";
        const rawOriginTime = raw.OriginTime || raw.origin_time || raw.EventID || "";
        if (rawOriginTime) {
            originTimeStr = String(rawOriginTime).replace(/[-:\s/]/g, '');
            if (originTimeStr.length > 14) {
                originTimeStr = originTimeStr.substring(0, 14);
            }
        }

        const isWarn = raw.Warn === true || raw.isWarn === true || raw.warn === true;
        const alertflg = isWarn ? '警報' : '予報';

        const latStr = (raw.Latitude !== undefined && raw.Latitude !== null) ? String(raw.Latitude) : (raw.latitude ? String(raw.latitude) : null);
        const lonStr = (raw.Longitude !== undefined && raw.Longitude !== null) ? String(raw.Longitude) : (raw.longitude ? String(raw.longitude) : null);

        const warnArea = Array.isArray(raw.WarnArea) ? raw.WarnArea : [];

        return {
            result: { status: isCancel ? 'cancel' : 'success' },
            is_cancel: isCancel,
            is_final: isFinal,
            report_num: String(serial),
            region_name: String(regionName),
            magunitude: String(magnitudeVal),
            magnitude: String(magnitudeVal),
            depth: String(depthVal),
            calcintensity: String(intensity),
            origin_time: originTimeStr,
            alertflg: alertflg,
            latitude: latStr,
            longitude: lonStr,
            event_id: raw.EventID || raw.event_id || originTimeStr,
            warn_area: warnArea
        };
    }

    function initWolfxWebSocket() {
        if (isSimulationMode) return;
        if (wolfxWS && (wolfxWS.readyState === WebSocket.CONNECTING || wolfxWS.readyState === WebSocket.OPEN)) {
            return;
        }

        isInitialCheckDone = false;
        updateDebugWsBadge('connecting');
        updateEEWMonitorWsBadge('connecting');

        try {
            wolfxWS = new WebSocket('wss://ws-api.wolfx.jp/jma_eew');

            wolfxWS.onopen = () => {
                console.log("Wolfx WebSocket Connected");
                fetchState.kmoni.hasError = false;
                fetchState.kmoni.lastSuccess = getCurrentAppTime();
                updateFetchStatusUI();
                updateDebugWsBadge('connected');
                updateEEWMonitorWsBadge('connected');

                // Heartbeat (Ping) 毎20秒送信
                clearInterval(wolfxPingInterval);
                wolfxPingInterval = setInterval(() => {
                    if (wolfxWS && wolfxWS.readyState === WebSocket.OPEN) {
                        try {
                            wolfxWS.send(JSON.stringify({ type: 'ping' }));
                        } catch (pe) {
                            // ignore ping error
                        }
                    }
                }, 20000);

                // 初回起動・接続確立時: 設定の遅延時間(2秒等)を差し引いた時計時刻(getCurrentAppTime)で
            };

            wolfxWS.onmessage = async (event) => {
                try {
                    const rawData = JSON.parse(event.data);
                    fetchState.kmoni.lastSuccess = new Date();
                    fetchState.kmoni.hasError = false;
                    updateFetchStatusUI();

                    const niedData = parseWolfxEEW(rawData);
                    updateDebugWsInfo(rawData, niedData);
                    handleWolfxMonitorAndSave(rawData, niedData);

                    if (niedData) {
                        await handleWolfxEEW(niedData);
                    }
                } catch (err) {
                    console.error("Wolfx WS parse error:", err);
                }
            };

            wolfxWS.onerror = (err) => {
                console.warn("Wolfx WS error:", err);
                fetchState.kmoni.hasError = true;
                updateFetchStatusUI();
                updateDebugWsBadge('disconnected');
            };

            wolfxWS.onclose = () => {
                console.log("Wolfx WebSocket Closed");
                clearInterval(wolfxPingInterval);
                fetchState.kmoni.hasError = true;
                updateFetchStatusUI();
                updateDebugWsBadge('disconnected');
                if (!isSimulationMode) {
                    clearTimeout(wolfxReconnectTimer);
                    wolfxReconnectTimer = setTimeout(() => {
                        initWolfxWebSocket();
                    }, 5000);
                }
            };
        } catch (e) {
            console.error("Wolfx WS init error:", e);
            fetchState.kmoni.hasError = true;
            updateFetchStatusUI();
            updateDebugWsBadge('disconnected');
        }
    }

function closeWolfxWebSocket() {
    clearTimeout(wolfxReconnectTimer);
    clearInterval(wolfxPingInterval);
    if (wolfxWS) {
        wolfxWS.onclose = null;
        wolfxWS.close();
        wolfxWS = null;
    }
    updateDebugWsBadge('disconnected');
}

let yahooMissingStartTime = 0; // YahooのEEW情報が消失し始めた時刻

async function handleWolfxEEW(niedData) {
    if (isSimulationMode) return;

    try {
        if (!niedData || niedData.is_cancel || !niedData.calcintensity) {
            currentWolfxEEWData = null;
            yahooMissingStartTime = 0;
            processAndDisplayData(null, null);
            return;
        }

        // 過去の古い電文（発生から規定時間以上経過）は画面に表示しない
        const now = getCurrentAppTime();
        if (!isWolfxEEWActive(niedData, now)) {
            console.log("[EEW判定] 過去の電文または有効期限切れのためスキップします:", niedData.origin_time);
            currentWolfxEEWData = null;
            isInitialCheckDone = true;
            processAndDisplayData(null, null);
            return;
        }

        // 報数逆転チェック
        if (niedData.event_id) {
            if (lastWolfxEventId === niedData.event_id) {
                const currentSerial = parseInt(niedData.report_num, 10) || 0;
                if (currentSerial < lastWolfxSerial && currentSerial !== 0) {
                    return;
                }
                lastWolfxSerial = currentSerial;
            } else {
                lastWolfxEventId = niedData.event_id;
                lastWolfxSerial = parseInt(niedData.report_num, 10) || 0;
            }
        }

        // Wolfxを主系統として保持
        currentWolfxEEWData = niedData;
        isInitialCheckDone = true;

        // Yahooの波形データも非同期で取得（P/S波描画用）
        const { dateStr, timeStr } = getFormattedTimeStr(now);
        const yahooUrl = `https://weather-kyoshin.west.edge.storage-yahoo.jp/RealTimeData/${dateStr}/${timeStr}.json`;
        let yahooData = null;
        try {
            const yahooRes = await fetch(yahooUrl);
            if (yahooRes.ok) {
                const data = await yahooRes.json();
                updateDebugYahooInfo(data, now);
                if (data && (data.hypoInfo !== null || data.psWave !== null)) {
                    yahooData = data;
                    yahooMissingStartTime = 0;
                }
            } else {
                updateDebugYahooInfo(null, now);
            }
        } catch (e) {
            updateDebugYahooInfo(null, now);
        }

        // Wolfx電文のマグニチュード・震源地・震度等を即座に描画（Yahoo未達でも自前走時計算で波形描画）
        processAndDisplayData(niedData, yahooData);
    } catch (e) {
        console.error("Error in handleWolfxEEW:", e);
    }
}

async function fetchWolfxHTTPFallback(now) {
    const fallbackUrl = `api.php?url=` + encodeURIComponent(`https://api.wolfx.jp/jma_eew.json`);
    try {
        const res = await fetch(fallbackUrl);
        if (res.ok) {
            const rawData = await res.json();
            fetchState.kmoni.lastSuccess = now;
            fetchState.kmoni.hasError = false;
            const niedData = parseWolfxEEW(rawData);
            if (niedData) {
                handleWolfxEEW(niedData);
            }
        } else {
            fetchState.kmoni.hasError = true;
        }
        updateFetchStatusUI();
    } catch (e) {
        fetchState.kmoni.hasError = true;
        updateFetchStatusUI();
    }
}

// 渡された正確な時間情報(ミリ秒0)を用いてフェッチを実行する
async function fetchEEWData(now, dateStr, timeStr) {
    if (isPaused) return;

    if (isSimulationMode) {
        document.getElementById('simStatus').textContent = `シミュレーション時刻: ${now.toLocaleString('ja-JP')}`;
    }

    latestFetchedTime = now;

    // K-MONI Update
    updateKmoniLayer(now, dateStr, timeStr);

    if (isSimulationMode) {
        // シミュレーションモード時は従来の K-MONI / Yahoo HTTP 過去データ取得
        const niedUrl = `api.php?url=` + encodeURIComponent(`https://www.lmoni.bosai.go.jp/monitor/webservice/hypo/eew/${timeStr}.json`);
        const yahooUrl = `https://weather-kyoshin.west.edge.storage-yahoo.jp/RealTimeData/${dateStr}/${timeStr}.json`;

        try {
            const niedRes = await fetch(niedUrl);
            if (!niedRes.ok) {
                fetchState.kmoni.hasError = true;
                updateFetchStatusUI();
            } else {
                const niedData = await niedRes.json();
                fetchState.kmoni.lastSuccess = now;
                fetchState.kmoni.hasError = false;

                let yahooData = null;
                if (niedData && niedData.result.status === 'success' && niedData.is_cancel !== true && niedData.calcintensity) {
                    try {
                        const yahooRes = await fetch(yahooUrl);
                        if (yahooRes.ok) {
                            yahooData = await yahooRes.json();
                            fetchState.yahoo.lastSuccess = now;
                            fetchState.yahoo.hasError = false;
                        } else {
                            fetchState.yahoo.hasError = true;
                        }
                    } catch (yErr) {
                        fetchState.yahoo.hasError = true;
                    }
                } else {
                    fetchState.yahoo.hasError = false;
                }

                processAndDisplayData(niedData, yahooData);
            }
            updateFetchStatusUI();

        } catch (error) {
            fetchState.kmoni.hasError = true;
            updateFetchStatusUI();
        }
    } else {
        // リアルタイムモード時: WebSocketが未接続ならHTTPフォールバック
        if (!wolfxWS || wolfxWS.readyState !== WebSocket.OPEN) {
            fetchWolfxHTTPFallback(now);
        }

        // EEW発出中（Wolfx電文受信中）の場合のみ、毎秒Yahooデータを取得して波形(psWave)更新を行う
        if (isEEWActive && currentWolfxEEWData) {
            const yahooUrl = `https://weather-kyoshin.west.edge.storage-yahoo.jp/RealTimeData/${dateStr}/${timeStr}.json`;
            try {
                const yahooRes = await fetch(yahooUrl);
                if (yahooRes.ok) {
                    const yahooData = await yahooRes.json();
                    fetchState.yahoo.lastSuccess = now;
                    fetchState.yahoo.hasError = false;
                    updateDebugYahooInfo(yahooData, now);

                    if (isEEWActive && currentWolfxEEWData) {
                        if (yahooData && (yahooData.hypoInfo !== null || yahooData.psWave !== null)) {
                            // YahooのEEW情報が存在する -> カウントクリア＆データ更新
                            yahooMissingStartTime = 0;
                            processAndDisplayData(currentWolfxEEWData, yahooData);
                        } else {
                            // YahooのEEW情報が空(null)でもWolfxの有効期間内なら自前計算で継続
                            handleYahooMissingData(now);
                        }
                    }
                } else {
                    fetchState.yahoo.hasError = false;
                    updateDebugYahooInfo(null, now);
                    if (isEEWActive && currentWolfxEEWData) handleYahooMissingData(now);
                }
            } catch (e) {
                fetchState.yahoo.hasError = true;
                updateDebugYahooInfo(null, now);
                if (isEEWActive && currentWolfxEEWData) handleYahooMissingData(now);
            }
            updateFetchStatusUI();
        }
    }
}

function handleYahooMissingData(now) {
    if (!now) now = getCurrentAppTime();

    // Wolfx電文自体が有効期限切れ（地震発生から一定時間経過）ならクリア
    if (!currentWolfxEEWData || !isWolfxEEWActive(currentWolfxEEWData, now)) {
        console.log("[EEW判定] EEWの有効期限が終了したためクリアします。");
        currentWolfxEEWData = null;
        yahooMissingStartTime = 0;
        processAndDisplayData(null, null);
        return;
    }

    // 有効期間内であれば、Yahoo未到着時でも自前推定でP/S波の描画を継続
    processAndDisplayData(currentWolfxEEWData, null);

    const nowMs = Date.now();
    if (yahooMissingStartTime === 0) {
        yahooMissingStartTime = nowMs;
    } else if (nowMs - yahooMissingStartTime >= 15000) {
        console.log("[EEW判定] YahooのEEW消失から一定時間経過したためクリアします。");
        currentWolfxEEWData = null;
        yahooMissingStartTime = 0;
        processAndDisplayData(null, null);
    }
}

function processAndDisplayData(niedData, yahooData) {
    let panel = document.getElementById('eewPanel');

    // ★ ここにあった自動展開ロジックはズーム後に実行するため削除

    if (!niedData || niedData.result.status !== 'success' || niedData.is_cancel || !niedData.calcintensity) {
        if (isEEWActive) {
            isEEWActive = false;
            eewAudioPlayed = false;
            currentWolfxEEWData = null;
            lastWolfxEventId = null;
            lastWolfxSerial = -1;
            yahooMissingStartTime = 0;
            checkAndReturnHome();
        }
        
        // 独自検知アラート(Custom Alert)が有効な間は、パネルの内容をクリアしない
        if (!isCustomAlertActive) {
            // パネルは消さずに内容だけクリア
            document.getElementById('shindoLabel').innerHTML = '';
            document.getElementById('calcIntensity').innerHTML = '';
            document.getElementById('regionName').innerHTML = '';
            document.getElementById('originTimeRow').innerHTML = '';
            document.getElementById('magnitudeRow').innerHTML = '';
            document.getElementById('reportRow').innerHTML = '';

            // 背景色は明るめグレーにする
            panel.style.setProperty('--panel-bg', 'rgba(150, 150, 150, 0.9)');
            panel.style.color = '#ffffff';
            
            // パネルを隠す (独自検知も出ていない場合のみ)
            panel.classList.add('hidden');
        }

        clearMapData();
        return;
    }

    // 1. Update UI Panel
    if (!isEEWActive) {
        isEEWActive = true;
        // デフォルト設定に基づいて自動ズームを初期化
        isAutoZoom = isAutoZoomEEWDefault;
        updateAutoZoomBtn();

        // 新規EEW時、音声通知
        if (!eewAudioPlayed) {
            // 追加ここから　20260515:EEWが途切れても再度音を鳴らさないようにする
            // 発生時刻が同じなら新しく検知しても途切れただけなので音を鳴らさない
            if (niedData.origin_time != lastEewOriginTime) {
                playAlertSound('eew');
            } else {
                // console.log('EEW is not new, skipping sound alert');
            }
            eewAudioPlayed = true;
            lastEewOriginTime = niedData.origin_time;
            // 追加ここまで　20260515

            // EEW detected logging
            logEvent('eew_detection', {
                region: niedData.region_name,
                magnitude: niedData.magunitude,
                intensity: niedData.calcintensity,
                report_num: niedData.report_num,
                is_final: niedData.is_final
            });
        }
    }
    panel.classList.remove('hidden');

    // Alert Type & Report Info
    let alertType = niedData.alertflg || '予報';

    let isFinal = niedData.is_final === "true" || niedData.is_final === true;
    let reportText = isFinal ? `最終報` : `第 ${niedData.report_num} 報`;

    let intensityVal = String(niedData.calcintensity || '');
    let displayIntensity = intensityVal;
    if (intensityVal === '01' || intensityVal === '1') displayIntensity = '1';
    else if (intensityVal === '02' || intensityVal === '2') displayIntensity = '2';
    else if (intensityVal === '03' || intensityVal === '3') displayIntensity = '3';
    else if (intensityVal === '04' || intensityVal === '4') displayIntensity = '4';
    else if (intensityVal === '05' || intensityVal === '5-' || intensityVal === '5弱') displayIntensity = '5弱';
    else if (intensityVal === '5+' || intensityVal === '5強') displayIntensity = '5強';
    else if (intensityVal === '06' || intensityVal === '6-' || intensityVal === '6弱') displayIntensity = '6弱';
    else if (intensityVal === '6+' || intensityVal === '6強') displayIntensity = '6強';
    else if (intensityVal === '07' || intensityVal === '7') displayIntensity = '7';

    document.getElementById('shindoLabel').textContent = '最大震度';
    document.getElementById('calcIntensity').textContent = displayIntensity;
    document.getElementById('regionName').textContent = niedData.region_name;
    document.getElementById('magnitudeRow').innerHTML = `規模：<span id="magnitude">M${niedData.magunitude}</span>　深さ：<span id="depth">${niedData.depth}</span>`;
    document.getElementById('reportRow').innerHTML = `緊急地震速報（<span id="alertType">${alertType}</span>）　<span id="reportNum">${reportText}</span>`;

    // Format origin time: "20260307053149" -> "2026/03/07 05:31:49"
    const ot = niedData.origin_time;
    if (ot && ot.length === 14) {
        document.getElementById('originTimeRow').textContent =
            `${ot.substring(0, 4)}/${ot.substring(4, 6)}/${ot.substring(6, 8)} ${ot.substring(8, 10)}:${ot.substring(10, 12)}:${ot.substring(12, 14)} 発生`;
    }

    // Apply dynamic colors from old project
    let colorIdx = getColorIndex(intensityVal);
    let bgColor = Njquake_BackColor[colorIdx];
    let txtColor = Njquake_TextColor[colorIdx];

    // Using CSS custom properties to update the colors reliably
    // 公式EEW優先：独自検知の確信度クラスをクリア
    panel.classList.remove('confidence-high');
    panel.classList.remove('confidence-low');
    
    panel.style.setProperty('--panel-bg', bgColor);
    panel.style.color = txtColor;

    // 警報細分区域の震度色分け更新
    updateWarnAreaColors(niedData.warn_area);

    // Parse NIED coordinates first if available (e.g. "北緯35.6度" -> 35.6 or number 35.6)
    let lat = NaN;
    let lon = NaN;
    if (niedData.latitude !== undefined && niedData.latitude !== null && niedData.longitude !== undefined && niedData.longitude !== null) {
        lat = parseFloat(String(niedData.latitude).replace(/[^0-9.]/g, ''));
        lon = parseFloat(String(niedData.longitude).replace(/[^0-9.]/g, ''));
    }

    const psItems = yahooData?.psWave?.items;

    // Fallback to Yahoo API for epicenter if NIED is missing or unparseable
    if (isNaN(lat) || isNaN(lon)) {
        if (psItems && psItems.length > 0 && psItems[0].latitude && psItems[0].longitude) {
            lat = parseFloat(String(psItems[0].latitude).replace(/[^0-9.]/g, ''));
            lon = parseFloat(String(psItems[0].longitude).replace(/[^0-9.]/g, ''));
        }
    }

    if (isNaN(lat) || isNaN(lon)) {
        clearMapData();
        return;
    }

    let pRadius = 0;
    let sRadius = 0;

    // Yahoo API に有効な psWave が存在していれば公式解析値を優先使用
    if (psItems && psItems.length > 0 && (parseFloat(psItems[0].pRadius) > 0 || parseFloat(psItems[0].sRadius) > 0)) {
        pRadius = parseFloat(psItems[0].pRadius) || 0;
        sRadius = parseFloat(psItems[0].sRadius) || 0;
    } else {
        // Yahooデータ未到着(最初の2~3秒)時は、地震発生時刻と深さから自前で走時理論半径を即座に推定計算
        const estWave = calculateEstimatedPSWaveRadius(niedData.origin_time, niedData.depth, getCurrentAppTime());
        pRadius = estWave.pRadius;
        sRadius = estWave.sRadius;
    }

    // Auto Zoom Calculation
    const currentMaxRadius = Math.max(pRadius, sRadius);

    // Set animation targets
    if (currentEqLon !== lon || currentEqLat !== lat) {
        // Fly to epicenter for a new earthquake
        currentZoomTargetRadius = Math.max(currentMaxRadius, 50) + 120; // 初期ズーム枠をさらに少し小さく
        const latOffset = currentZoomTargetRadius / 111.32;
        const lonOffset = currentZoomTargetRadius / (111.32 * Math.cos(lat * Math.PI / 180));
        const targetBounds = [
            [lon - lonOffset, lat - latOffset], // SW
            [lon + lonOffset, lat + latOffset]  // NE
        ];

        if (isAutoZoom) {
            lastAutoZoomBounds = targetBounds;
            
            // 常にメイン地図はEEWを追従
            map.fitBounds(targetBounds, {
                padding: 50,
                maxZoom: 7,
                duration: 1500,
                essential: true
            });

            // サブ地図: 独自検知がアクティブでない場合のみEEWを追従
            if (!isCustomAlertActive) {
                setTimeout(() => {
                    subMap.fitBounds(targetBounds, {
                        padding: 30,
                        maxZoom: 7,
                        duration: 1000,
                        essential: true
                    });
                }, 500);
            }

            // サブマップを強制展開（EEW時は常にON）
            setTimeout(() => {
                const autoOpen = document.getElementById('autoOpenSubMapToggle').checked;
                if (autoOpen && !isSubMapOpen) {
                    document.getElementById('toggleSubMapBtn').click();
                }
            }, 1600);
        } else {
            // オートズームがオフの場合は待たずにすぐ開く
            const autoOpen = document.getElementById('autoOpenSubMapToggle').checked;
            if (autoOpen && !isSubMapOpen) {
                document.getElementById('toggleSubMapBtn').click();
            }
        }
        currentEqLon = lon;
        currentEqLat = lat;

        // Immediate snap for new earthquake
        currentPRadius = pRadius;
        currentSRadius = sRadius;
        targetPRadius = pRadius;
        targetSRadius = sRadius;
    } else {
        // Existing earthquake, smooth transition start
        // Store the old target as the new current (starting point for next 1-second lerp)
        currentPRadius = targetPRadius > 0 ? targetPRadius : pRadius;
        currentSRadius = targetSRadius > 0 ? targetSRadius : sRadius;

        // Hard reset if radii jump backwards (e.g. simulation restart)
        if (pRadius < currentPRadius - 50) {
            currentPRadius = pRadius;
            currentSRadius = sRadius;
        }

        targetPRadius = pRadius;
        targetSRadius = sRadius;

        // 円が追従枠に近づいた時（あるいは超えた時）だけ段階的にズームアウト
        if (currentMaxRadius + 30 > currentZoomTargetRadius) {
            currentZoomTargetRadius = currentMaxRadius + 150; // 次のステップを少し小さく
            const latOffset = currentZoomTargetRadius / 111.32;
            const lonOffset = currentZoomTargetRadius / (111.32 * Math.cos(lat * Math.PI / 180));
            const targetBounds = [
                [lon - lonOffset, lat - latOffset], // SW
                [lon + lonOffset, lat + latOffset]  // NE
            ];

            if (isAutoZoom) {
                lastAutoZoomBounds = targetBounds;
                if (!isSubMapTransitioning) {
                    map.fitBounds(targetBounds, {
                        padding: 50,
                        maxZoom: 7,
                        duration: 2500, // ゆっくりズームアウト
                        essential: true
                    });
                }
            }
        }
    }

    // Reset interpolation timer
    lastUpdateTime = performance.now();

    // Add/Update Marker
    if (!epicenterMarker) {
        const el = document.createElement('div');
        el.className = 'epicenter-marker';
        const pulse = document.createElement('div');
        pulse.className = 'epicenter-pulse';
        el.appendChild(pulse);

        epicenterMarker = new maplibregl.Marker({ element: el })
            .setLngLat([lon, lat])
            .addTo(map);
    } else {
        epicenterMarker.setLngLat([lon, lat]);
    }

    // Add/Update SubMap Marker (Simple Cross)
    if (!subEpicenterMarker) {
        const elSub = document.createElement('div');
        elSub.className = 'sub-epicenter-marker';
        elSub.textContent = '×';
        subEpicenterMarker = new maplibregl.Marker({ element: elSub })
            .setLngLat([lon, lat])
            .addTo(subMap);
    } else {
        subEpicenterMarker.setLngLat([lon, lat]);
    }

    // Initial source creation if missing
    if (!map.getSource('p-wave')) {
        addOrUpdateCircleLayer('p-wave', turf.circle([lon, lat], 1, { steps: 64, units: 'kilometers' }), 'rgba(59, 130, 246, 0.2)', 'rgba(59, 130, 246, 0.8)');
    }
    if (!map.getSource('s-wave')) {
        addOrUpdateCircleLayer('s-wave', turf.circle([lon, lat], 1, { steps: 64, units: 'kilometers' }), 'rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0.8)');
    }

    // Initial source creation for subMap (thin lines only)
    if (!subMap.getSource('p-wave')) {
        addOrUpdateSubCircleLayer('p-wave', turf.circle([lon, lat], 1, { steps: 64, units: 'kilometers' }), 'rgba(59, 130, 246, 0.8)');
    }
    if (!subMap.getSource('s-wave')) {
        addOrUpdateSubCircleLayer('s-wave', turf.circle([lon, lat], 1, { steps: 64, units: 'kilometers' }), 'rgba(239, 68, 68, 0.8)');
    }
}

let epicenterMarker = null;
function addOrUpdateCircleLayer(id, geojson, fillColor, lineColor) {
    if (map.getSource(id)) {
        map.getSource(id).setData(geojson);
    } else {
        map.addSource(id, {
            type: 'geojson',
            data: geojson
        });

        // 独自検知格子があればその下に、なければ最前面
        let beforeId = undefined;
        if (customAlertSquareLayerId && map.getLayer(customAlertSquareLayerId)) {
            beforeId = customAlertSquareLayerId;
        }

        map.addLayer({
            id: `${id}-fill`,
            type: 'fill',
            source: id,
            paint: {
                'fill-color': fillColor,
                'fill-outline-color': lineColor
            }
        }, beforeId);

        map.addLayer({
            id: `${id}-line`,
            type: 'line',
            source: id,
            paint: {
                'line-color': lineColor,
                'line-width': 2
            }
        }, beforeId);
    }
}

let subEpicenterMarker = null;
function addOrUpdateSubCircleLayer(id, geojson, lineColor) {
    if (subMap.getSource(id)) {
        subMap.getSource(id).setData(geojson);
    } else {
        subMap.addSource(id, {
            type: 'geojson',
            data: geojson
        });

        // 独自検知格子があればその下に、なければ最前面
        let beforeId = undefined;
        if (customAlertSquareLayerId && subMap.getLayer(customAlertSquareLayerId)) {
            beforeId = customAlertSquareLayerId;
        }

        subMap.addLayer({
            id: `${id}-line`,
            type: 'line',
            source: id,
            paint: {
                'line-color': lineColor,
                'line-width': 1 // サブ地図用は細い線のみ
            }
        }, beforeId);
    }
}

// Clear map elements when information is gone
function clearMapData() {
    if (epicenterMarker) {
        epicenterMarker.remove();
        epicenterMarker = null;
    }
    if (subEpicenterMarker) {
        subEpicenterMarker.remove();
        subEpicenterMarker = null;
    }

    if (map.getSource('p-wave')) map.getSource('p-wave').setData(turf.circle([0, 0], 0));
    if (map.getSource('s-wave')) map.getSource('s-wave').setData(turf.circle([0, 0], 0));
    if (subMap.getSource('p-wave')) subMap.getSource('p-wave').setData(turf.circle([0, 0], 0));
    if (subMap.getSource('s-wave')) subMap.getSource('s-wave').setData(turf.circle([0, 0], 0));

    targetPRadius = 0;
    targetSRadius = 0;
    currentEqLon = null;
    currentEqLat = null;
    currentZoomTargetRadius = 0;
    lastAutoZoomBounds = null;
    
    // 警報細分区域の震度色分けをクリア
    updateWarnAreaColors([]);

    // EEWクリア時、カスタムアラートは独自に寿命(10秒)管理しているためここでは消さない
    isEEWActive = false;
}

// function animateWaves(time) の直前までの不要な宣言を削除

function animateWaves(time) {
    requestAnimationFrame(animateWaves);

    if (currentEqLon === null || currentEqLat === null) return;
    if (targetPRadius <= 0 && targetSRadius <= 0) return;

    // Time elapsed since we received the last API update (up to 1000ms typically)
    const elapsed = time - lastUpdateTime;
    // Interpolation progress from 0.0 to 1.0 based on 1000ms (1 second) interval
    const progress = Math.min(elapsed / 1000, 1.0);

    // Lerp from current base to target
    const currentFramePRadius = currentPRadius + (targetPRadius - currentPRadius) * progress;
    const currentFrameSRadius = currentSRadius + (targetSRadius - currentSRadius) * progress;

    if (currentFramePRadius > 0.1 && map.getSource('p-wave')) {
        const pCircle = turf.circle([currentEqLon, currentEqLat], currentFramePRadius, { steps: 64, units: 'kilometers' });
        map.getSource('p-wave').setData(pCircle);
        if (subMap.getSource('p-wave')) subMap.getSource('p-wave').setData(pCircle);
    }
    if (currentFrameSRadius > 0.1 && map.getSource('s-wave')) {
        const sCircle = turf.circle([currentEqLon, currentEqLat], currentFrameSRadius, { steps: 64, units: 'kilometers' });
        map.getSource('s-wave').setData(sCircle);
        if (subMap.getSource('s-wave')) subMap.getSource('s-wave').setData(sCircle);
    }
}

// Start wave animation loop
requestAnimationFrame(animateWaves);


// Map Interaction logic
function handleMapInteraction(e) {
    // 物理的なユーザー操作（マウス、タッチ等）による移動の場合のみ自動追従を解除
    if (!e.originalEvent) return;
    
    if (isEEWActive || isCustomAlertActive) {
        disableAutoZoom();
    }
}

map.on('dragstart', handleMapInteraction);
map.on('zoomstart', handleMapInteraction);
map.on('wheel', handleMapInteraction);

// Simulation Controls
document.getElementById('simToggleBtn').addEventListener('click', (e) => {
    const btn = e.target;
    if (!isSimulationMode) {
        const inputVal = document.getElementById('simTimeInput').value;
        if (!inputVal) {
            alert('時刻を指定してください');
            return;
        }
        simulationBaseTimestamp = new Date(inputVal).getTime();
        simulationStartPerfTime = performance.now();
        isSimulationMode = true;

        if (isPaused) {
            pausedTimestamp = simulationBaseTimestamp;
        } else {
            pausedTimestamp = null;
        }

        lastFetchedSecondStr = null; // force fetch immediately on next tick

        // シミュレーション中はリアルタイム WS を停止
        closeWolfxWebSocket();

        btn.textContent = '停止';
        btn.classList.add('active');
        document.getElementById('simTimeInput').disabled = true;
        document.getElementById('simStatus').textContent = 'オン';
    } else {
        isSimulationMode = false;

        if (isPaused) {
            const delaySeconds = parseInt(document.getElementById('realtimeDelayInput').value, 10) || 2;
            pausedTimestamp = (performance.now() + serverTimeOffset) - (delaySeconds * 1000);
        } else {
            pausedTimestamp = null;
        }
        lastFetchedSecondStr = null; // force fetch

        btn.textContent = '開始';
        btn.classList.remove('active');
        document.getElementById('simTimeInput').disabled = false;
        document.getElementById('simStatus').textContent = 'オフ（現在時刻で動作中）';

        // Clear Map features
        clearMapData();
        // Sync API time immediately
        syncServerTime();
        // リアルタイム WS 再接続
        initWolfxWebSocket();
    }
});

// Controls
document.getElementById('autoCamBtn').addEventListener('click', () => {
    isAutoZoom = !isAutoZoom;
    updateAutoZoomBtn();

    // 即時適用
    if (isAutoZoom && lastAutoZoomBounds) {
        map.fitBounds(lastAutoZoomBounds, { padding: 50, maxZoom: 7, duration: 1000, essential: true });
    }
});

function disableAutoZoom() {
    // EEWまたは独自検知発出時でなければ自動追従を解除しない
    if (!isEEWActive && !isCustomAlertActive) return;
    if (isAutoZoom) {
        isAutoZoom = false;
        updateAutoZoomBtn();
    }
}

function updateAutoZoomBtn() {
    const btn = document.getElementById('autoCamBtn');
    if (isAutoZoom) {
        btn.classList.add('active');
        btn.title = 'カメラ自動追従 (ON)';
    } else {
        btn.classList.remove('active');
        btn.title = 'カメラ自動追従 (OFF)';
    }
}

document.getElementById('toggleFetchBtn').addEventListener('click', async (e) => {
    const icon = document.getElementById('fetchIcon');
    if (!isPaused) {
        // いまから一時停止する
        isPaused = true;
        icon.textContent = 'play_arrow';

        // 停止した瞬間のミリ秒0を保持する
        if (isSimulationMode) {
            pausedTimestamp = simulationBaseTimestamp + (performance.now() - simulationStartPerfTime);
        } else {
            const delaySeconds = parseInt(document.getElementById('realtimeDelayInput').value, 10) || 2;
            pausedTimestamp = (performance.now() + serverTimeOffset) - (delaySeconds * 1000);
        }
    } else {
        // 再開する
        isPaused = false;
        icon.textContent = 'pause';

        if (isSimulationMode) {
            simulationBaseTimestamp = pausedTimestamp;
            simulationStartPerfTime = performance.now();
        }

        pausedTimestamp = null;
        lastFetchedSecondStr = null; // force fetch next frame

        // NTPでサーバー時刻を再取得
        await syncServerTime();
    }
});

// Settings Modal
document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('setPanel').classList.toggle('hidden');
});

document.getElementById('closeSettingsBtn').addEventListener('click', () => {
    document.getElementById('setPanel').classList.add('hidden');
});

document.getElementById('enableCustomDetectionDuringEEW').addEventListener('change', (e) => {
    isCustomEnabledDuringEEW = e.target.checked;
});

document.getElementById('autoZoomEEWToggle').addEventListener('change', (e) => {
    isAutoZoomEEWDefault = e.target.checked;
});

document.getElementById('autoZoomCustomToggle').addEventListener('change', (e) => {
    isAutoZoomCustomDefault = e.target.checked;
});

// EEW Audio Settings
document.getElementById('eewAudioToggle').addEventListener('change', (e) => {
    isEewAudioEnabled = e.target.checked;
});

// Custom Audio Settings
document.getElementById('customAudioToggle').addEventListener('change', (e) => {
    isCustomAudioEnabled = e.target.checked;
});

// Sub-Map Width Control
const subMapWidthSlider = document.getElementById('subMapWidthSlider');
const subMapWidthValue = document.getElementById('subMapWidthValue');
subMapWidthSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    subMapWidthValue.textContent = `${val}%`;
    document.documentElement.style.setProperty('--submap-width', `${val}vw`);
    
    // Resize maps after width change
    map.resize();
    subMap.resize();
});

// Home Position Logic
let homePosition = null; // { center: [lng, lat], zoom: level }
async function loadHomePosition() {
    try {
        const saved = await localforage.getItem('homePosition');
        if (saved) {
            homePosition = saved;
            updateHomePosUI();
        }
    } catch (e) {
        console.warn('Failed to load home position', e);
    }
}

function updateHomePosUI() {
    const statusEl = document.getElementById('homePosStatus');
    if (homePosition && statusEl) {
        statusEl.textContent = `ホーム: (${homePosition.center[0].toFixed(2)}, ${homePosition.center[1].toFixed(2)}) Z:${homePosition.zoom.toFixed(1)}`;
    }
}

document.getElementById('setHomePosBtn').addEventListener('click', async () => {
    homePosition = {
        center: map.getCenter().toArray(),
        zoom: map.getZoom()
    };
    try {
        await localforage.setItem('homePosition', homePosition);
        updateHomePosUI();
    } catch (e) {
        console.error('Failed to save home position', e);
    }
});

document.getElementById('goHomeBtn').addEventListener('click', () => {
    checkAndReturnHome(true); // 即時復帰
});

let returnHomeTimeout = null;
function checkAndReturnHome(immediate = false) {
    // 待機時間をスキップして即時実行する場合
    if (immediate && homePosition) {
        if (returnHomeTimeout) clearTimeout(returnHomeTimeout);
        performReturnHome();
        return;
    }

    // EEWも独自検知（高確信度）も出ていない場合にホームへ戻る
    // (低確信度 'low' の場合は戻ることを許容する)
    if (!isEEWActive && (!isCustomAlertActive || customAlertConfidence === 'low')) {
        const autoReturn = document.getElementById('autoReturnHomeToggle').checked;
        if (autoReturn && homePosition) {
            // 少し待ってから戻る (余韻)
            if (returnHomeTimeout) clearTimeout(returnHomeTimeout);
            returnHomeTimeout = setTimeout(() => {
                // 低確信度 'low' の場合は戻ることを許容する
                if (!isEEWActive && (!isCustomAlertActive || customAlertConfidence === 'low') && homePosition) {
                    performReturnHome();
                }
            }, 3000);
        }
    }
}

function performReturnHome() {
    isReturningHome = true;
    console.log("[マルチマップ] ホームポジションへ復帰します (確信度: " + customAlertConfidence + ")");

                    // 共通の復帰パラメータ
                    const params = {
                        center: homePosition.center,
                        zoom: homePosition.zoom,
                        bearing: 0,
                        pitch: 0,
                        duration: 1500,
                        essential: true
                    };

                    // メイン地図の移動判定
                    // すでにホームに近い（zoom差0.2以内かつ中心距離が近い）場合はメインは動かさない
                    const currentCenter = map.getCenter();
                    const distToHome = turf.distance(
                        turf.point([currentCenter.lng, currentCenter.lat]),
                        turf.point(homePosition.center),
                        { units: 'kilometers' }
                    );

                    if (distToHome < 10 && Math.abs(map.getZoom() - homePosition.zoom) < 0.2) {
                        console.log("[マルチマップ] メイン地図は既にホーム付近のため移動をスキップします");
                    } else {
                        map.easeTo(params);
                    }

                    // サブ地図は必ず戻す
                    subMap.easeTo(params);

                    // 移動完了後にフラグを下げ、同期を再開可能にする
                    setTimeout(() => {
                        isReturningHome = false;
                        console.log("[マルチマップ] ホーム復帰完了（同期再開可能）");
                    }, 1600);
}


// 初期値反映
function initAudioSettings() {
    isEewAudioEnabled = document.getElementById('eewAudioToggle').checked;
    isCustomAudioEnabled = document.getElementById('customAudioToggle').checked;
    isAutoZoomEEWDefault = document.getElementById('autoZoomEEWToggle').checked;
    isAutoZoomCustomDefault = document.getElementById('autoZoomCustomToggle').checked;
    isCustomEnabledDuringEEW = document.getElementById('enableCustomDetectionDuringEEW').checked;
    
    const snetToggleEl = document.getElementById('enableSnetToggle');
    if (snetToggleEl) isSnetEnabled = snetToggleEl.checked;

    loadHomePosition();
    
    // リスナー追加
    document.getElementById('autoZoomEEWToggle').addEventListener('change', (e) => {
        isAutoZoomEEWDefault = e.target.checked;
    });
    document.getElementById('autoZoomCustomToggle').addEventListener('change', (e) => {
        isAutoZoomCustomDefault = e.target.checked;
    });
    document.getElementById('enableCustomDetectionDuringEEW').addEventListener('change', (e) => {
        isCustomEnabledDuringEEW = e.target.checked;
        if (isEEWActive && !isCustomEnabledDuringEEW) {
            if (isCustomAlertActive) clearCustomAlert();
        }
    });
    document.getElementById('eewAudioToggle').addEventListener('change', (e) => {
        isEewAudioEnabled = e.target.checked;
    });
    document.getElementById('customAudioToggle').addEventListener('change', (e) => {
        isCustomAudioEnabled = e.target.checked;
    });

    if (snetToggleEl) {
        snetToggleEl.addEventListener('change', (e) => {
            isSnetEnabled = e.target.checked;
            if (isSnetEnabled) {
                lastSnetValidTime = null;
                checkAndUpdateSnet();
            } else {
                clearSnetLayers();
            }
        });
    }

    // デバッグインジケーターの設定読み込み＆初期化
    const debugToggleEl = document.getElementById('debugIndicatorToggle');
    const debugPanelEl = document.getElementById('debugIndicatorPanel');
    if (debugToggleEl && debugPanelEl) {
        const savedDebugState = localStorage.getItem('eew_debug_indicator') === 'true';
        debugToggleEl.checked = savedDebugState;
        isDebugIndicatorEnabled = savedDebugState;
        if (isDebugIndicatorEnabled) {
            debugPanelEl.classList.remove('hidden');
        } else {
            debugPanelEl.classList.add('hidden');
        }

        debugToggleEl.addEventListener('change', (e) => {
            isDebugIndicatorEnabled = e.target.checked;
            localStorage.setItem('eew_debug_indicator', isDebugIndicatorEnabled);
            if (isDebugIndicatorEnabled) {
                debugPanelEl.classList.remove('hidden');
            } else {
                debugPanelEl.classList.add('hidden');
            }
        });
    }
}

initAudioSettings();
initEEWMonitorUI();

// A:ver1.1.12 & B:ver1.0.1
const devOptionAEl = document.getElementById('devOptionACheckbox');
if (devOptionAEl) {
    devOptionAEl.addEventListener('change', (e) => {
        isDevOptionACheckbox = e.target.checked;
        console.log("Icon mode:", isDevOptionACheckbox);
        renderSnetLayers();
    });
}
// テーマ変更のリスナー追加
document.querySelectorAll('input[name="devOptionB"]').forEach(radio => {
    radio.addEventListener('change', () => {
        refreshAllIcons();
    });
});

let iconsLoaded = false;
const SHINDO_INDICES = [0, 1, 2, 3, 4, 50, 55, 60, 65, 7];
// ディレクトリまでのURLを定義
const ICON_DIR_URL = "https://kottaro123456.com/webapps/eew/source/shindo/";

// 震度アイコンを地図にロード テーマ選択 (imgTheme) に対応
async function loadShindoIcons(targetMap) {
    // 直径を 13 -> 16 に変更
    const targetDiameter = 16;
    const originalImageSize = 256;
    const calculatedPixelRatio = originalImageSize / targetDiameter;

    // テーマの取得
    const typeRadio = document.querySelector('input[name="devOptionB"]:checked');
    const imgTheme = typeRadio ? typeRadio.value : 'jqk';

    const promises = SHINDO_INDICES.map(idx => {
        return new Promise((resolve) => {
            const url = `${ICON_DIR_URL}${imgTheme}_int${idx}.png`;
            targetMap.loadImage(url, (error, image) => {
                if (error) {
                    console.warn(`Failed to load icon: ${url}`);
                    resolve(false);
                    return;
                }
                const iconName = `shindo_icon_${idx}`;
                
                // テーマ切り替えに対応するため、既存の画像があれば削除してから追加
                if (targetMap.hasImage(iconName)) {
                    targetMap.removeImage(iconName);
                }
                
                targetMap.addImage(iconName, image, { pixelRatio: calculatedPixelRatio });
                resolve(true);
            });
        });
    });
    const results = await Promise.all(promises);
    if (results.every(r => r)) iconsLoaded = true;
}

// テーマ変更時に全地図のアイコンを再ロードする
async function refreshAllIcons() {
    iconsLoaded = false;
    await Promise.all([
        loadShindoIcons(map),
        loadShindoIcons(subMap)
    ]);
    console.log("Icons refreshed with new theme.");
}

// ==========================================
// 開発者向けオプション パスワード認証 & 防護モジュール
// ==========================================
(function initDevSecurityManager() {
    let isDevAuthenticated = false;
    let devAuthTokenInfo = null;
    let isTampered = false;

    const devAuthBtn = document.getElementById('devAuthBtn');
    const devAuthBadge = document.getElementById('devAuthBadge');
    const devAuthModalBackdrop = document.getElementById('devAuthModalBackdrop');
    const closeDevAuthModalBtn = document.getElementById('closeDevAuthModalBtn');
    const cancelDevAuthBtn = document.getElementById('cancelDevAuthBtn');
    const submitDevAuthBtn = document.getElementById('submitDevAuthBtn');
    const devAuthPasswordInput = document.getElementById('devAuthPasswordInput');
    const devAuthErrorMsg = document.getElementById('devAuthErrorMsg');

    const devInputs = [
        document.getElementById('devOptionACheckbox'),
        document.getElementById('devOptionB_1'),
        document.getElementById('devOptionB_2')
    ].filter(Boolean);

    // 開発者オプション要素を無効化
    function lockDevOptions() {
        devInputs.forEach(input => {
            input.disabled = true;
            if (input.type === 'checkbox') input.checked = false;
        });
        if (devAuthBadge) devAuthBadge.classList.add('hidden');
        if (devAuthBtn) {
            devAuthBtn.classList.remove('hidden');
            devAuthBtn.disabled = false;
        }
    }

    // 開発者オプション要素を有効化
    function unlockDevOptions() {
        if (!isDevAuthenticated || isTampered) return;
        devInputs.forEach(input => {
            input.disabled = false;
        });
        if (devAuthBtn) devAuthBtn.classList.add('hidden');
        if (devAuthBadge) devAuthBadge.classList.remove('hidden');
    }

    // 改ざん検出通報 & 強制ロック
    async function handleTamperDetected(reason) {
        if (isTampered) return;
        isTampered = true;
        isDevAuthenticated = false;
        devAuthTokenInfo = null;

        console.warn('Security Alert: Tampering detected!', reason);
        lockDevOptions();

        if (devAuthBtn) {
            devAuthBtn.textContent = '機能が無効化されました';
            devAuthBtn.disabled = true;
            devAuthBtn.style.color = '#f87171';
            devAuthBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
            devAuthBtn.style.background = 'rgba(239, 68, 68, 0.15)';
        }

        try {
            await fetch('auth_dev.php?action=report_tamper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: reason, timestamp: Date.now() })
            });
        } catch (e) {
            console.error('Failed to send tamper report:', e);
        }
    }

    // DOM改ざん監視 (MutationObserver)
    const devGroupEl = document.getElementById('devSettingsGroup');
    if (devGroupEl && window.MutationObserver) {
        const observer = new MutationObserver((mutations) => {
            if (isDevAuthenticated && !isTampered) return;
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
                    const target = mutation.target;
                    if (devInputs.includes(target) && !target.disabled) {
                        target.disabled = true;
                        handleTamperDetected('DOM disabled attribute forced removal');
                        break;
                    }
                }
            }
        });

        devInputs.forEach(input => {
            observer.observe(input, { attributes: true, attributeFilter: ['disabled'] });
        });
    }

    // イベントリスナーのガード（二重検証）
    devInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            if (!isDevAuthenticated || isTampered) {
                e.preventDefault();
                e.stopPropagation();
                if (input.type === 'checkbox') input.checked = false;
                handleTamperDetected('Unauthorized input change attempt');
            }
        });
    });

    // モーダル表示/非表示
    function openModal() {
        if (isTampered) {
            alert('セキュリティ違反が検知されたため、開発者機能は無効化されています。');
            return;
        }
        if (devAuthPasswordInput) devAuthPasswordInput.value = '';
        if (devAuthErrorMsg) devAuthErrorMsg.classList.add('hidden');
        if (devAuthModalBackdrop) devAuthModalBackdrop.classList.remove('hidden');
        if (devAuthPasswordInput) devAuthPasswordInput.focus();
    }

    function closeModal() {
        if (devAuthModalBackdrop) devAuthModalBackdrop.classList.add('hidden');
    }

    // パスワード認証処理
    async function submitAuth() {
        const pwd = devAuthPasswordInput ? devAuthPasswordInput.value.trim() : '';
        if (!pwd) {
            showError('パスワードを入力してください');
            return;
        }

        try {
            const res = await fetch('auth_dev.php?action=auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: pwd })
            });

            const data = await res.json();

            if (res.ok && data.status === 'authenticated') {
                isDevAuthenticated = true;
                devAuthTokenInfo = data.auth_info;
                closeModal();
                unlockDevOptions();
            } else if (res.status === 429) {
                showError(`IPがブロックされています (${data.retry_after_seconds || 900}秒後に解除)`);
                handleTamperDetected('Blocked IP attempted authentication');
            } else {
                const remain = data.remaining_attempts !== undefined ? ` (残り ${data.remaining_attempts} 回)` : '';
                showError((data.error || 'パスワードが正しくありません') + remain);
                if (data.is_blocked) {
                    handleTamperDetected('Max password retries exceeded');
                }
            }
        } catch (err) {
            console.error('Auth request failed:', err);
            showError('認証通信に失敗しました。');
        }
    }

    function showError(msg) {
        if (devAuthErrorMsg) {
            devAuthErrorMsg.textContent = msg;
            devAuthErrorMsg.classList.remove('hidden');
        }
    }

    if (devAuthBtn) devAuthBtn.addEventListener('click', openModal);
    if (closeDevAuthModalBtn) closeDevAuthModalBtn.addEventListener('click', closeModal);
    if (cancelDevAuthBtn) cancelDevAuthBtn.addEventListener('click', closeModal);
    if (submitDevAuthBtn) submitDevAuthBtn.addEventListener('click', submitAuth);

    if (devAuthPasswordInput) {
        devAuthPasswordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submitAuth();
        });
    }

    // モーダル背景クリック時閉じ
    if (devAuthModalBackdrop) {
        devAuthModalBackdrop.addEventListener('click', (e) => {
            if (e.target === devAuthModalBackdrop) closeModal();
        });
    }
})();