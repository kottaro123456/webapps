// MapLibreの定義
var map = new maplibregl.Map({
    container: 'map', // HTMLのID
    style: {
        version: 8,
        sources: {},
        layers: [
            {
                id: 'background',
                type: 'background',
                paint: {
                    'background-color': '#1d1d1d' // 一旦NERVっぽい色にしておきます
                }
            }
        ]
    },
    center: [137.984, 36.575], // ★注意: [経度, 緯度] の順です！Leafletと逆です。
    zoom: 5, // Leafletとズームレベルの感覚が少し違うので調整が必要かもしれません
    minZoom: 2,
    preserveDrawingBuffer: true // 画面キャプチャ（スクショ）機能のために必要
    // scrollWheelZoom: false, // MapLibreではデフォルトの挙動設定が異なります（一旦コメントアウトでOK）
});

// スケールコントロール
map.addControl(new maplibregl.ScaleControl({
    maxWidth: 150,
    unit: 'metric'
}), 'bottom-right');

// ズームコントロール
map.addControl(new maplibregl.NavigationControl(), 'top-right');

// MapLibreはスタイルのロード完了後に操作する必要があります
map.on('load', async () => {
    // 1. 地図データの読み込み
    await countriesMapGet();
    await asiaMapGet();
    await saibunGet();

    // 2. アイコンの読み込み
    await loadMapIcons();

    // =============== ★ここが抜けている可能性があります！ ===============
    // 3. レイヤーの「入れ物」を作る（震源と震度観測点）
    // --- 1. 津波情報レイヤー (z-index: 7相当) ---
    // ※地図レイヤーより後に定義することで上に表示されます
    map.addSource('tsunami_source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
    });
    // 実線
    map.addLayer({
        id: 'tsunami_line_solid',
        type: 'line',
        source: 'tsunami_source',
        filter: ['!=', ['get', 'isDashed'], true],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
            'line-color': ['get', 'color'],
            'line-width': ['get', 'width']
        }
    });
    // 点線
    map.addLayer({
        id: 'tsunami_line_dashed',
        type: 'line',
        source: 'tsunami_source',
        filter: ['==', ['get', 'isDashed'], true],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
            'line-color': ['get', 'color'],
            'line-width': ['get', 'width'],
            'line-dasharray': [3, 2]
        }
    });


    // --- 2. 震度観測点レイヤー (z-index: 10～70相当) ---
    if (!map.getSource('shindo_point_source')) {
        map.addSource('shindo_point_source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });
        map.addLayer({
            id: 'shindo_point_layer',
            type: 'symbol',
            source: 'shindo_point_source',
            layout: {
                'icon-image': ['get', 'iconName'],
                'icon-size': ['coalesce', ['get', 'iconSize'], 0.13],
                'icon-allow-overlap': true,
                // ★追加: これで震度が大きい(sortKeyが高い)アイコンが手前に来ます！
                'symbol-sort-key': ['get', 'sortKey']
            },
            paint: {
                'icon-opacity': 1
            }
        });
    }

    // --- 3. 震源レイヤー (z-index: 100相当 - 一番上！) ---
    // ※最後にaddLayerすることで、必ず他のアイコンの上に表示されます
    if (!map.getSource('shingen_source')) {
        map.addSource('shingen_source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] }
        });
        map.addLayer({
            id: 'shingen_layer',
            type: 'symbol',
            source: 'shingen_source',
            layout: {
                'icon-image': 'shingen',
                'icon-size': 0.09, // 調整後のサイズ
                'icon-allow-overlap': true
            },
            paint: {
                'icon-opacity': 1
            }
        });
    }

    // ... (震源・震度のポップアップ設定の下あたり) ...

    // --- 3. ポップアップの設定 (マウスホバーで表示) ---
    const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '600px',
        offset: [0, -40]
    });

    // 震源アイコンにマウスが乗ったとき
    map.on('mousemove', 'shingen_layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.popupContent;
        popup.setLngLat(coordinates).setHTML(description).addTo(map);
    });
    map.on('mouseleave', 'shingen_layer', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });

    // 震度アイコンにマウスが乗ったとき
    map.on('mousemove', 'shindo_point_layer', (e) => {
        map.getCanvas().style.cursor = 'pointer';

        // ★ここが重要！
        // マウスの下にある複数のアイコン(e.features)を、sortKey(震度)が大きい順に並べ替えます
        const features = e.features.sort((a, b) => {
            return b.properties.sortKey - a.properties.sortKey;
        });

        // 並べ替えた先頭（＝震度が一番大きいやつ）の情報を取得
        const topFeature = features[0];

        const coordinates = topFeature.geometry.coordinates.slice();
        const description = topFeature.properties.popupContent;

        popup.setLngLat(coordinates).setHTML(description).addTo(map);
    });
    map.on('mouseleave', 'shindo_point_layer', () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
    });

    // 津波レイヤーのポップアップ（カスタムツールチップ）設定
    let tsunamiTooltip = document.getElementById('tsunami_tooltip');
    if (!tsunamiTooltip) {
        tsunamiTooltip = document.createElement('div');
        tsunamiTooltip.id = 'tsunami_tooltip';
        tsunamiTooltip.style.position = 'absolute';
        tsunamiTooltip.style.display = 'none';
        tsunamiTooltip.style.pointerEvents = 'none';
        tsunamiTooltip.style.zIndex = '100000';
        tsunamiTooltip.style.border = '2px solid white';
        tsunamiTooltip.style.fontWeight = '500';
        tsunamiTooltip.style.whiteSpace = 'nowrap';
        tsunamiTooltip.style.fontSize = '1.2rem';
        document.body.appendChild(tsunamiTooltip);
    }

    // 実線・点線レイヤー両方にイベントを設定
    ['tsunami_line_solid', 'tsunami_line_dashed'].forEach(layerId => {
        map.on('mousemove', layerId, (e) => {
            map.getCanvas().style.cursor = 'pointer';

            const props = e.features[0].properties;

            // 警報種別に応じてCSSクラスを割り当て
            let textClass = "";
            if (props.typeName === "大津波警報") textClass = "tsunami_text_1";
            else if (props.typeName === "津波警報") textClass = "tsunami_text_2";
            else if (props.typeName === "津波警報解除") textClass = "tsunami_text_2";
            else if (props.typeName === "津波注意報") textClass = "tsunami_text_3";
            else if (props.typeName === "津波注意報解除") textClass = "tsunami_text_3";
            else if (props.typeName === "津波予報") textClass = "tsunami_text_4";
            else textClass = "tsunami_text_warning";

            // カスタムツールチップの更新（1行で表示）
            tsunamiTooltip.className = textClass;
            // paddingと枠線を適用
            tsunamiTooltip.style.padding = '5px';
            tsunamiTooltip.innerHTML = `${props.areaName}　${props.typeName}`;

            // マウス位置に追従
            tsunamiTooltip.style.display = 'block';
            tsunamiTooltip.style.left = (e.originalEvent.clientX + 15) + 'px';
            tsunamiTooltip.style.top = (e.originalEvent.clientY - 15) + 'px';
        });

        map.on('mouseleave', layerId, () => {
            map.getCanvas().style.cursor = '';
            tsunamiTooltip.style.display = 'none';
        });
    });

    // 4. データの取得と描画
    await Promise.all([
        GetJson(),
        GetQuake()
    ]);

    Cookies.set("listSelectedIndex", 0);

    // ソースを追加した後なので、ここでエラーが出なくなるはずです！
    await QuakeSelect(0);

    await fontLoadingPopup();

    console.log("Ready to draw Quake info.");
});

//JQuakeの配色。使ってないかも
var Color_1 = "#46646e"; var MojiColor_1 = "#ffffff"; var Color_2 = "#1e6ee6"; var MojiColor_2 = "#ffffff"; var Color_3 = "#00c8c8"; var MojiColor_3 = "#000000"; var Color_4 = "#ffff64"; var MojiColor_4 = "#000000"; var Color_50 = "#ffb400"; var MojiColor_50 = "#000000"; var Color_55 = "#ff7800"; var MojiColor_55 = "#000000"; var Color_60 = "#e60000"; var MojiColor_60 = "#ffffff"; var Color_65 = "#a00000"; var MojiColor_65 = "#ffffff"; var Color_7 = "#960096"; var MojiColor_7 = "#ffffff"; var Color_0 = "#008b8b"; var MojiColor_0 = "#ffffff";

const mapLF = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: 'webappData',
    storeName: 'map',
    version: 1
});
const shindobunpuLF = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: 'webappData',
    storeName: 'shindobunpu',
    version: 1
});

//地図に表示させるポリゴンのスタイル
var PolygonLayer_Style_nerv_1 = {
    "color": "#ffffff",
    "weight": 1.2,
    "opacity": 1,
    "fillOpacity": 0,
}
var PolygonLayer_Style_nerv_2 = {
    "color": "#999999",
    "weight": 1,
    "opacity": 1,
    "fillOpacity": 0,
}
var PolygonLayer_Style_nerv_3 = {
    "color": "#999999",
    "weight": 0.5,
    "opacity": 1,
    "fillOpacity": 0,
}
var PolygonLayer_Style_nerv_4 = {
    "opacity": 0,
    "fillColor": "#3a3a3a",
    "fillOpacity": 1,
}
var PolygonLayer_Style_wni_1 = {
    "color": "#000000",
    "weight": 0.5,
    "opacity": 1,
    "fillOpacity": 0,
}
var PolygonLayer_Style_wni_2 = {
    "color": "#ffffff",
    "weight": 1,
    "opacity": 1,
    "fillOpacity": 0,
}
var PolygonLayer_Style_wni_3 = {
    "color": "#999999",
    "weight": 0.4,
    "opacity": 1,
    "fillOpacity": 0,
}
var PolygonLayer_Style_wni_4 = {
    "opacity": 0,
    "fillColor": "#ffffff",
    "fillOpacity": 1,
}
var PolygonLayer_Style_quarog_1 = {
    "color": "#334948",
    "weight": 1.2,
    "opacity": 1,
    "fillOpacity": 0,
}
var PolygonLayer_Style_quarog_2 = {
    "color": "#334948",
    "weight": 1,
    "opacity": 1,
    "fillOpacity": 0,
}
var PolygonLayer_Style_quarog_3 = {
    "color": "#334948",
    "weight": 0.5,
    "opacity": 1,
    "fillOpacity": 0,
}
var PolygonLayer_Style_quarog_4 = {
    "opacity": 0,
    "fillColor": "#508C78",
    "fillOpacity": 1,
}
var PolygonLayer_Style_test_tsunami_1 = {
    "color": "#dd00dd",
    "weight": 8,
    "opacity": 1,
}
var PolygonLayer_Style_test_tsunami_2 = {
    "color": "#ff1400",
    "weight": 7,
    "opacity": 1,
}
var PolygonLayer_Style_test_tsunami_2_kaijo = {
    "color": "#ff1400",
    "weight": 5,
    "opacity": 1,
    "dashArray": "3 8"
}
var PolygonLayer_Style_test_tsunami_3 = {
    "color": "#faf500",
    "weight": 7,
    "opacity": 1,
}
var PolygonLayer_Style_test_tsunami_3_kaijo = {
    "color": "#faf500",
    "weight": 5,
    "opacity": 1,
    "dashArray": "3 8"
}
var PolygonLayer_Style_test_tsunami_4 = {
    "color": "#00ccff",
    "weight": 7,
    "opacity": 1,
}

// 震度ごとの塗りつぶし色定義
// 震度ごとの塗りつぶし色定義 (JMAPoints.jsの変数を参照)
// キーは「アイコンテーマ名 (eqm, jqk, wni)」にします
const shindoColors = {
    eqm: {
        10: eqm_backColor_1,
        20: eqm_backColor_2,
        30: eqm_backColor_3,
        40: eqm_backColor_4,
        45: eqm_backColor_50,
        46: eqm_backColor_50,
        50: eqm_backColor_55,
        55: eqm_backColor_60,
        60: eqm_backColor_65,
        70: eqm_backColor_7,
        default: "#3a3a3a"
    },
    jqk: {
        10: jqk_backColor_1,
        20: jqk_backColor_2,
        30: jqk_backColor_3,
        40: jqk_backColor_4,
        45: jqk_backColor_50,
        46: jqk_backColor_50,
        50: jqk_backColor_55,
        55: jqk_backColor_60,
        60: jqk_backColor_65,
        70: jqk_backColor_7,
        default: "#3a3a3a"
    },
    wni: {
        10: wni_backColor_1,
        20: wni_backColor_2,
        30: wni_backColor_3,
        40: wni_backColor_4,
        45: wni_backColor_50,
        46: wni_backColor_50,
        50: wni_backColor_55,
        55: wni_backColor_60,
        60: wni_backColor_65,
        70: wni_backColor_7,
        default: "#ffffff" // WNIは白背景なので陸地も白
    }
    // もしQuarog用のアイコンセット(ydits)を追加する場合はここに追記
};

// SVG/画像読み込み用のヘルパー関数
function loadImageBitmap(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = url;
    });
}

// 全テーマのアイコンを一括読み込み
async function loadMapIcons() {
    const themes = ['eqm', 'jqk', 'wni'];
    const suffixes = ['1', '2', '3', '4', '50', '51', '55', '60', '65', '7', '_', 'N'];
    const otherIcons = [
        { name: 'shingen', url: 'source/shingen.svg' }
    ];

    const promises = [];

    // 1. 震度アイコン (eqm_int1, jqk_int1, wni_int1 ... の形式で登録)
    themes.forEach(theme => {
        suffixes.forEach(suffix => {
            const name = `${theme}_int${suffix}`;
            const url = `source/svg/${theme}_int${suffix}.svg`;

            promises.push(new Promise(async (resolve) => {
                try {
                    const image = await loadImageBitmap(url);
                    if (!map.hasImage(name)) {
                        map.addImage(name, image, { sdf: false });
                    }
                } catch (error) {
                    console.warn(`Icon Load Warning: ${name}`, error);
                }
                resolve();
            }));
        });
    });

    // 2. その他のアイコン (震源など)
    otherIcons.forEach(icon => {
        promises.push(new Promise(async (resolve) => {
            try {
                const image = await loadImageBitmap(icon.url);
                if (!map.hasImage(icon.name)) {
                    map.addImage(icon.name, image);
                }
            } catch (error) {
                console.warn(`Icon Load Warning: ${icon.name}`, error);
            }
            resolve();
        }));
    });

    await Promise.all(promises);
    console.log("All Theme Icons Loaded.");
}

//地図に表示させる上下の順番
// map.createPane("pane_map1").style.zIndex = 1; //地図（背景）
// map.createPane("pane_map2").style.zIndex = 2; //地図（市町村）
// map.createPane("pane_map3").style.zIndex = 3; //地図（細分）
// map.createPane("pane_map_filled").style.zIndex = 5; //塗りつぶし
// map.createPane("tsunami_map").style.zIndex = 7; //津波
// map.createPane("shindo10").style.zIndex = 10;
// map.createPane("shindo20").style.zIndex = 20;
// map.createPane("shindo30").style.zIndex = 30;
// map.createPane("shindo40").style.zIndex = 40;
// map.createPane("shindo45").style.zIndex = 45;
// map.createPane("shindo46").style.zIndex = 46;
// map.createPane("shindo50").style.zIndex = 50;
// map.createPane("shindo55").style.zIndex = 55;
// map.createPane("shindo60").style.zIndex = 60;
// map.createPane("shindo70").style.zIndex = 70;
// map.createPane("shingen").style.zIndex = 100; //震源
Cookies.remove('visited');
Cookies.set("saibun", true);
var japan; //都道府県の枠線のみ
var asia; //アジア地域高品質ポリゴン 
var countries; //アジア地域を除く世界の低品質ポリゴン  
var cities; //市区町村
var japan_data; //都道府県データ
var asia_data; //アジア地域高品質ポリゴンデータ 
var countries_data; //アジア地域を除く世界の低品質ポリゴンデータ
var cities_data = null; //市区町村データ
var japan_back; //都道府県の枠線なし

//市区町村を表示させるかどうか

map.on('zoomend', function (e) {
    citiesDraw();
});
function citiesDraw() {
    const isSaibunChecked = document.getElementById('display_onoff_saibun_check').checked;
    if (isSaibunChecked) {
        if (map.getLayer('cities_line')) map.setLayoutProperty('cities_line', 'visibility', 'visible');
        if (map.getLayer('cities_fill')) map.setLayoutProperty('cities_fill', 'visibility', 'visible');
    } else {
        if (map.getLayer('cities_line')) map.setLayoutProperty('cities_line', 'visibility', 'none');
        if (map.getLayer('cities_fill')) map.setLayoutProperty('cities_fill', 'visibility', 'none');
        if (window.citiesPopup) window.citiesPopup.remove();
    }
}

//変数の定義(グローバルでやらないほうがいいらしい。でもやる。)
var QuakeJson;
var TsunamiJson;
var JMAPointsJson;
var JMAPoints;
var maxint;
var shingen_icon;
// var shindo_layer = L.layerGroup();
// var shindo_filled_layer = L.layerGroup();
// var tsunami_layer = L.layerGroup();
var Filled;
var test_on = "test_off";
var shingen_lnglat;
var fly_shingen_lnglat;
var fly_shingen_lnglat_2;
var quakeDefaultView = null;
var bbox_sokuhou;
var gettime;
var autoreload_onoff;
var autoreload_onoff_num;
var autoreload_interval;
var icon_theme = "eqm";
var this_theme = "nerv";
var data_japan;
var filled_list = {};
var point_onoff = 1; //0:off, 1:on
var fill_onoff = 1; //0:off, 1:on
var isMapAtDefault = true; // ユーザーが手動で地図を動かしたかどうかを追跡


async function autoReloadReset() {
    // --- 1. 自動更新のオンオフ取得 ---
    let onoff = await shindobunpuLF.getItem('autoreload_onoff');
    if (onoff === "on") {
        document.getElementsByClassName('autoreload_setsumei')[0].classList.add('on');
        autoreload_onoff = "on";
    } else {
        document.getElementsByClassName('autoreload_setsumei')[0].classList.remove('on');
        autoreload_onoff = "off";
        await shindobunpuLF.setItem('autoreload_onoff', 'off');
    }

    // --- 2. 秒数の取得 ---
    let num = await shindobunpuLF.getItem('autoreload_onoff_num');
    if (num === null || num === undefined) {
        autoreload_onoff_num = 10;
    } else {
        autoreload_onoff_num = num;
        document.getElementById('autoreload_num').value = num;
    }
}

document.getElementById('autoreload').addEventListener("click", async () => {
    if (autoreload_onoff === "on") {
        document.getElementsByClassName('autoreload_setsumei')[0].classList.remove('on');
        autoreload_onoff = "off";
    } else {
        document.getElementsByClassName('autoreload_setsumei')[0].classList.add('on');
        autoreload_onoff = "on";
    }
    await shindobunpuLF.setItem('autoreload_onoff', autoreload_onoff);
    interval();
});

document.getElementById('autoreload_num').addEventListener("change", async () => {
    let inputVal = Number(document.getElementById('autoreload_num').value);

    if (inputVal <= 1) {
        autoreload_onoff_num = 2;
    } else {
        autoreload_onoff_num = inputVal;
    }
    await shindobunpuLF.setItem('autoreload_onoff_num', autoreload_onoff_num);
    interval();
});

autoReloadReset();


document.getElementById('view_info').addEventListener("click", () => {
    document.getElementById('appinfo').classList.add('display');
});
document.getElementById('info_closebtn').addEventListener("click", () => {
    document.getElementById('appinfo').classList.remove('display');
});

//地震情報リストをクリックしたときの発火イベント
var list = document.getElementById('quakelist');
list.onchange = event => {
    Cookies.set("listSelectedIndex", list.selectedIndex);
    QuakeSelect(list.selectedIndex);
}

var koushin_ok;
var koushin;
//ボタン押下時のイベント設定とローカルストレージの設定
document.getElementById('reload').addEventListener("click", () => {
    if (test_on == "test_on") {
        document.getElementById('test').click();
    }
    if (document.getElementById('reload_num').value != "") {
        let num_kari = Math.abs(parseInt(document.getElementById('reload_num').value, 10));
        reloadData(num_kari);
    } else {
        reloadData();
    }
    document.getElementById('reload').innerText = "更新中…";
});
document.getElementById('test').addEventListener("click", () => {
    if (test_on == "test_off") {
        test_on = "test_on";
        document.getElementById('test').innerText = "テスト終了";
    } else {
        test_on = "test_off";
        document.getElementById('test').innerText = "テスト開始";
    }
    Cookies.set("listSelectedIndex", 0);
    (async () => {
        await GetQuake(test_on);
        QuakeSelect(0);
    })();
});
var shokikashippai;

// スクショ・シェア機能
document.getElementById('map_ss').addEventListener('click', async () => {
    // ボタンのテキストを一時的に変更
    const btn = document.getElementById('map_ss');
    const originalText = btn.innerText;
    btn.innerText = "生成中...";
    btn.disabled = true;

    try {
        // MapLibreのCanvasを取得
        const mapCanvas = map.getCanvas();

        // 合成用の新しいCanvasを作成
        const offscreen = document.createElement('canvas');
        offscreen.width = mapCanvas.width;
        offscreen.height = mapCanvas.height;
        const ctx = offscreen.getContext('2d');

        // 1. 地図を描画
        ctx.drawImage(mapCanvas, 0, 0);

        // スケール計算（高解像度ディスプレイ対応）
        const scale = mapCanvas.width / mapCanvas.clientWidth;
        const isMobile = window.innerWidth <= 768;
        const fontFamily = '"ヒラギノ角ゴ-Pro", sans-serif';

        // フォントサイズの調整（CSSに近づける）
        const baseSize = isMobile ? 12 * scale : 16 * scale;
        const titleFontSize = 1.6 * baseSize;
        const timeFontSize = 1.2 * baseSize;
        const infoFontSize = 1.4 * baseSize;
        const maxIntFontSize = 2.0 * baseSize;
        const wmFontSize = Math.max(10, 0.8 * baseSize);

        // --- テキスト描画設定 ---
        ctx.textBaseline = "top";

        // 2. タイトル部分の描画
        const titleText = document.getElementById('title_text').innerText;
        const titleTime = document.getElementById('title_time').innerText;

        ctx.font = `600 ${titleFontSize}px ${fontFamily}`;
        const tTextWidth = ctx.measureText(titleText).width;

        ctx.font = `600 ${timeFontSize}px ${fontFamily}`;
        const tTimeWidth = ctx.measureText(titleTime).width;

        // 白背景の青枠線 (観測点モード)
        const titleBoxWidth = 15 * scale + tTextWidth + 15 * scale;
        const titleBoxHeight = 15 * scale + titleFontSize + 15 * scale;
        const titleX = -2 * scale; // CSS: left: -10px, canvas上は少し隙間
        const titleY = 30 * scale; // CSS: top: 30px

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(titleX, titleY, titleBoxWidth, titleBoxHeight);
        ctx.strokeStyle = "#1f57be";
        ctx.lineWidth = 4 * scale;
        ctx.strokeRect(titleX, titleY, titleBoxWidth, titleBoxHeight);

        ctx.fillStyle = "#1f57be";
        ctx.font = `600 ${titleFontSize}px ${fontFamily}`;
        ctx.fillText(titleText, titleX + 17 * scale, titleY + 15 * scale);

        // 時刻部分
        const timeBoxWidth = 15 * scale + tTimeWidth + 15 * scale;
        const timeBoxHeight = 10 * scale + timeFontSize + 10 * scale;
        const timeY = titleY + 5 * scale + titleBoxHeight;

        ctx.fillStyle = "rgba(0, 0, 0, 0.533)"; // CSS #00000088
        ctx.fillRect(titleX - 2 * scale, timeY, timeBoxWidth, timeBoxHeight);

        ctx.fillStyle = "white";
        ctx.font = `600 ${timeFontSize}px ${fontFamily}`;
        ctx.fillText(titleTime, titleX + 17 * scale, timeY + 10 * scale);

        // 3. 震源情報部分の描画
        const infoDiv = document.getElementById('info');
        if (infoDiv.style.display !== "none") {
            const infoX = 15 * scale; // CSS: left: 15px
            const infoY = timeY + timeBoxHeight + 15 * scale; // CSSに近い位置
            const infoPadding = 12 * scale; // CSS: padding: 10px

            const lines = infoDiv.innerText.split('\n').filter(l => l.trim() !== "");

            // 幅計算 (CSS min-width: 13em)
            let maxLineWidth = 13 * infoFontSize;

            ctx.font = `500 ${maxIntFontSize}px ${fontFamily}`;
            const maxIntTextW = ctx.measureText("最大震度").width;
            const iconSize = maxIntFontSize;
            const maxIntTotalW = maxIntTextW + 5 * scale + iconSize; // アイコンとマージン
            maxLineWidth = Math.max(maxLineWidth, maxIntTotalW);

            lines.forEach((line) => {
                if (!line.includes("最大震度")) {
                    ctx.font = `500 ${infoFontSize}px ${fontFamily}`;
                    maxLineWidth = Math.max(maxLineWidth, ctx.measureText(line).width);
                }
            });

            const infoBoxWidth = maxLineWidth + (infoPadding * 2) + 3 * scale;

            const maxIntLineHeight = 2.2 * baseSize;
            const infoLineHeight = 1.9 * baseSize;
            const textLinesCount = lines.filter(l => !l.includes("最大震度")).length;
            const infoBoxHeight = infoPadding * 2 + maxIntLineHeight + (textLinesCount * infoLineHeight);

            // 背景枠
            ctx.fillStyle = "rgba(0, 0, 0, 0.533)";
            ctx.fillRect(infoX, infoY, infoBoxWidth, infoBoxHeight);

            // テキスト描画
            let currentY = infoY + infoPadding + 3 * scale;

            ctx.fillStyle = "white";
            ctx.font = `500 ${maxIntFontSize}px ${fontFamily}`;

            // 最大震度をセンターに配置
            const maxIntStartX = infoX + (infoBoxWidth - maxIntTotalW) / 2;
            const maxIntTextY = currentY + (maxIntLineHeight - maxIntFontSize) / 2;
            ctx.fillText("最大震度", maxIntStartX, maxIntTextY - 3 * scale);

            const maxIntImg = infoDiv.querySelector('.maxint img');
            if (maxIntImg && maxIntImg.complete) {
                const imgY = currentY + (maxIntLineHeight - iconSize) / 2 - 3 * scale; // translateY(8%)再現
                ctx.drawImage(maxIntImg, maxIntStartX + maxIntTextW + 5 * scale, imgY, iconSize, iconSize);
            }
            currentY += maxIntLineHeight;

            lines.forEach((line) => {
                if (!line.includes("最大震度")) {
                    ctx.font = `500 ${infoFontSize}px ${fontFamily}`;
                    ctx.fillText(line, infoX + infoPadding, currentY + (infoLineHeight - infoFontSize) / 2);
                    currentY += infoLineHeight;
                }
            });
        }

        // 4. 右下のウォーターマーク
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; // ちょっと薄い白
        ctx.font = `500 ${wmFontSize}px ${fontFamily}`;
        ctx.textAlign = "right";

        const wmX = mapCanvas.width - 15 * scale; // 右端からちょっと離す
        let wmY = mapCanvas.height - 15 * scale - wmFontSize;

        ctx.fillText("https://kottaro123456.com/webapps/", wmX, wmY);
        wmY -= (wmFontSize * 1.5);
        ctx.fillText("震度分布図 for kottaro123456", wmX, wmY);

        // textAlignを元に戻す
        ctx.textAlign = "left";

        const dataUrl = offscreen.toDataURL("image/png");

        // 独自のポップアップ（モーダル）を作成して画像を表示
        const modal = document.createElement("div");
        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        modal.style.zIndex = "10000";
        modal.style.display = "flex";
        modal.style.flexDirection = "column";
        modal.style.alignItems = "center";
        modal.style.justifyContent = "center";
        modal.style.fontFamily = fontFamily;
        modal.style.fontWeight = "500";
        modal.style.color = "white";

        const titleHeader = document.createElement("h2");
        titleHeader.innerText = "画像を作成しました";
        titleHeader.style.margin = "10px 0";
        titleHeader.style.fontWeight = "500";
        titleHeader.style.fontFamily = fontFamily;
        modal.appendChild(titleHeader);

        const screenshotImg = document.createElement("img");
        screenshotImg.src = dataUrl;
        screenshotImg.style.maxWidth = "90%";
        screenshotImg.style.maxHeight = "60vh";
        screenshotImg.style.objectFit = "contain";
        screenshotImg.style.border = "2px solid white";
        screenshotImg.style.boxShadow = "0 0 20px rgba(0,0,0,0.5)";
        modal.appendChild(screenshotImg);

        const instruction = document.createElement("p");
        instruction.innerHTML = "長押し または 右クリック で<br>画像を保存または共有してください。";
        instruction.style.margin = "15px 0";
        instruction.style.fontSize = "1.0rem";
        instruction.style.textAlign = "center";
        instruction.style.fontWeight = "500";
        instruction.style.fontFamily = fontFamily;
        modal.appendChild(instruction);

        const closeBtn = document.createElement("button");
        closeBtn.innerText = "閉じる";
        closeBtn.style.padding = "5px 30px";
        closeBtn.style.fontSize = "0.9rem";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.fontFamily = fontFamily;
        closeBtn.style.fontWeight = "500";
        closeBtn.style.color = "white";
        // 既存のボタンとデザインを統一
        closeBtn.style.background = "#00000088";
        closeBtn.style.border = "white 2.5px solid";
        closeBtn.style.borderRadius = "5px";

        closeBtn.addEventListener("click", () => {
            document.body.removeChild(modal);
        });
        modal.appendChild(closeBtn);

        modal.addEventListener("click", (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        });

        document.body.appendChild(modal);

    } catch (error) {
        console.error("Screenshot synthesis failed:", error);
        alert("画像の作成に失敗しました。");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

// マップを初期位置（または震源位置）に戻す関数
// isForce: trueの場合はユーザーが動かしていても強制的に戻す（位置初期化ボタンなど）
function moveMapToDefault(isForce) {
    if (!quakeDefaultView) return;

    // 手動で動かされている、かつ強制ではない場合は何もしない
    if (!isMapAtDefault && !isForce) return;

    const isPanelOpen = document.getElementById('shindo_ichiran_check').checked;
    const lngOffset = isPanelOpen ? 1.0 : 0.0; // ユーザー指定の「1度分」

    if (!quakeDefaultView.isStationMode && quakeDefaultView.bounds) {
        // 震度速報モード：padding機能を使う
        const rightPadding = isPanelOpen ? 450 : 100;
        map.fitBounds(quakeDefaultView.bounds, {
            padding: { top: 100, bottom: 100, left: 100, right: rightPadding },
            maxZoom: 8,
            minZoom: 6.3,
            duration: 500
        });
    } else if (quakeDefaultView.shingenExists) {
        // 震源モード：経度をずらす（震源を画面の左側に寄せるために、地図の中心を「東（+）」にずらす）
        const targetCenter = [quakeDefaultView.rawCenter[0] + lngOffset, quakeDefaultView.rawCenter[1]];

        map.flyTo({
            center: targetCenter,
            zoom: 6.3,
            speed: 1.5,
            duration: 500
        });
    }
    // 自動移動した後は「デフォルト位置にいる」フラグを立てる
    isMapAtDefault = true;
}

// ユーザーの手動操作を検知してフラグを折る
map.on('dragstart', () => { isMapAtDefault = false; });
map.on('zoomstart', () => { isMapAtDefault = false; });
map.on('pitstart', () => { isMapAtDefault = false; });

document.getElementById('map_ichi').addEventListener("click", () => {
    moveMapToDefault(true); // 位置初期化ボタンは「強制」
});

document.getElementById('shindo_ichiran_check').addEventListener("change", () => {
    if (document.getElementById('shindo_ichiran_check').checked) {
        document.getElementById('shindo_ichiran').classList.add('display');
    } else {
        document.getElementById('shindo_ichiran').classList.add('display_none');
        setTimeout(() => {
            document.getElementById('shindo_ichiran').classList.remove('display_none');
            document.getElementById('shindo_ichiran').classList.remove('display');
        }, 450);
    }
    // パネル開閉に合わせてマップを動かす（手動操作時は動かさない）
    moveMapToDefault(false);
});
document.getElementById('display_onoff_shingen_check').addEventListener("change", () => {
    const visibility = document.getElementById('display_onoff_shingen_check').checked ? 'visible' : 'none';
    if (map.getLayer('shingen_layer')) map.setLayoutProperty('shingen_layer', 'visibility', visibility);
});
document.getElementById('display_onoff_point_check').addEventListener("change", () => {
    const visibility = document.getElementById('display_onoff_point_check').checked ? 'visible' : 'none';
    if (map.getLayer('shindo_point_layer')) map.setLayoutProperty('shindo_point_layer', 'visibility', visibility);
});
document.getElementById('display_onoff_fill_check').addEventListener("change", () => {
    // 塗りをすべて消すのではなく、震度の色だけを消すため、再描画をかける（視点は動かさない）
    QuakeSelect(document.getElementById('quakelist').selectedIndex, true);
});
document.getElementById('display_onoff_saibun_check').addEventListener("change", async () => {
    if (document.getElementById('display_onoff_saibun_check').checked) {
        Cookies.set("saibun", true);
        await citiesMapGet();
    } else {
        Cookies.set("saibun", false);
    }
    citiesDraw();
});
document.getElementById('display_onoff_tsunami_check').addEventListener("change", () => {
    const visibility = document.getElementById('display_onoff_tsunami_check').checked ? 'visible' : 'none';
    if (map.getLayer('tsunami_line_solid')) map.setLayoutProperty('tsunami_line_solid', 'visibility', visibility);
    if (map.getLayer('tsunami_line_dashed')) map.setLayoutProperty('tsunami_line_dashed', 'visibility', visibility);
});
document.getElementById('shindoiconbig_check').addEventListener("change", () => {
    QuakeSelect(document.getElementById('quakelist').selectedIndex, true);
});


// 地図テーマの設定値
const mapThemeSettings = {
    nerv: {
        bgColor: '#1d1d1d', // 背景色
        bgOpacity: 1,       // MapLibre背景レイヤーの不透明度
        japanLine: '#ffffff',
        worldLine: '#999999',
        lineWidth: 1.2
    },
    wni: {
        bgColor: '#000000',
        bgOpacity: 0,       // ★0にするとCSSのグラデーションが透けて見える！
        japanLine: '#000000',
        worldLine: '#999999',
        lineWidth: 0.8
    },
    quarog: {
        bgColor: '#78A0C8',
        bgOpacity: 1,
        japanLine: '#334948',
        worldLine: '#334948',
        lineWidth: 1.2
    }
};

// 地図テーマ変更関数
function theme_change(theme_name) {
    this_theme = theme_name;
    const s = mapThemeSettings[theme_name];

    // 1. CSSクラスの切り替え (グラデーション用)
    const mapDiv = document.getElementById('map');
    mapDiv.classList.remove('background_nerv', 'background_wni', 'background_quarog');
    mapDiv.classList.add('background_' + theme_name);

    // 2. 背景レイヤーの更新
    if (map.getLayer('background')) {
        map.setPaintProperty('background', 'background-color', s.bgColor);
        map.setPaintProperty('background', 'background-opacity', s.bgOpacity);
    }

    // 3. 線の色更新
    if (map.getLayer('japan_line')) {
        map.setPaintProperty('japan_line', 'line-color', s.japanLine);
        map.setPaintProperty('japan_line', 'line-width', s.lineWidth);
    }
    if (map.getLayer('asia_line')) map.setPaintProperty('asia_line', 'line-color', s.worldLine);
    if (map.getLayer('countries_line')) map.setPaintProperty('countries_line', 'line-color', s.worldLine);

    // 4. 塗りつぶし色の更新 (QuakeSelectを呼ぶだけでOK)
    QuakeSelect(document.getElementById('quakelist').selectedIndex, true);
}

// アイコンテーマ変更関数
function icon_theme_change(theme_name) {
    icon_theme = theme_name;
    // アイコン名を再計算して描画しなおす
    QuakeSelect(document.getElementById('quakelist').selectedIndex, true);
}

async function reloadData(reloadOption) {
    clearTimeout(koushin_ok);
    await GetQuake(reloadOption);
    await QuakeSelect(Cookies.get("listSelectedIndex"));
    document.getElementById('reload').innerText = "更新完了";
    koushin_ok = setTimeout(() => {
        document.getElementById('reload').innerText = "情報更新";
    }, 1000);
};

// メイン処理の呼び出し
// (async () => {
//     await Promise.all([
//         GetJson(),
//         saibunGet(),
//         GetQuake()
//     ]);
//     Cookies.set("listSelectedIndex", 0);
//     await QuakeSelect(0);
//     await new Promise(resolve => setTimeout(resolve, 500));
//     await Promise.all([
//         asiaMapGet(),
//         countriesMapGet()
//     ]);
//     await fontLoadingPopup();
// })();

//地図データ読み込み
async function saibunGet() {
    let data;
    const value = await mapLF.getItem("saibun");

    if (value !== null) {
        data = value;
        console.log("Map Loading completed: 'saibun', IndexedDB");
    } else {
        const response = await fetch("https://kottaro123456.github.io/geojsons/saibun.geojson");
        data = await response.json();
        console.log("Map Loading completed: 'saibun', Network");
        await mapLF.setItem("saibun", data);
        console.log("Map Saved successfully: 'saibun', IndexedDB");
    }

    // ★追加: GeoJSONの各ポリゴンに 'code' (エリアコード) を付与する
    // AreaCode変数は JMAPoints.js で定義されている前提です
    if (typeof AreaCode !== 'undefined') {
        data.features.forEach((feature, index) => {
            if (AreaCode[index]) {
                feature.properties.code = AreaCode[index];
            }
        });
    }

    japan_data = data;

    // ソース追加
    map.addSource('japan_source', {
        type: 'geojson',
        data: data
    });

    // 塗りつぶしレイヤー (japan_fill)
    map.addLayer({
        'id': 'japan_fill',
        'type': 'fill',
        'source': 'japan_source',
        'layout': {},
        'paint': {
            'fill-color': '#3a3a3a', // デフォルトの色（震度がない場合）
            'fill-opacity': 1
        }
    });

    // 枠線レイヤー (japan_line)
    map.addLayer({
        'id': 'japan_line',
        'type': 'line',
        'source': 'japan_source',
        'layout': {
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#ffffff',
            'line-width': 1.2
        }
    });
}

async function asiaMapGet() {
    let data;
    const value = await mapLF.getItem("asia");

    if (value !== null) {
        data = value;
        console.log("Map Loading completed: 'asia', IndexedDB");
    } else {
        const response = await fetch("https://kottaro123456.github.io/geojsons/asia.geojson");
        data = await response.json();
        console.log("Map Loading completed: 'asia', Network");
        await mapLF.setItem("asia", data);
        console.log("Map Saved successfully: 'asia', IndexedDB");
    }
    asia_data = data;

    // ソース追加
    map.addSource('asia_source', {
        type: 'geojson',
        data: data
    });

    // レイヤー追加（線）
    map.addLayer({
        'id': 'asia_line',
        'type': 'line',
        'source': 'asia_source',
        'layout': { 'line-join': 'round' },
        'paint': {
            'line-color': '#999999',
            'line-width': 1
        }
    });
}

async function countriesMapGet() {
    let data;
    const value = await mapLF.getItem("countries");

    if (value !== null) {
        data = value;
        console.log("Map Loading completed: 'countries', IndexedDB");
    } else {
        const response = await fetch("https://kottaro123456.github.io/geojsons/countries.geojson");
        data = await response.json();
        console.log("Map Loading completed: 'countries', Network");
        await mapLF.setItem("countries", data);
        console.log("Map Saved successfully: 'countries', IndexedDB");
    }
    countries_data = data;

    // ソース追加
    map.addSource('countries_source', {
        type: 'geojson',
        data: data
    });

    // レイヤー追加
    map.addLayer({
        'id': 'countries_line',
        'type': 'line',
        'source': 'countries_source',
        'layout': { 'line-join': 'round' },
        'paint': {
            'line-color': '#999999',
            'line-width': 1
        }
    });
}

async function citiesMapGet() {
    if (cities_data === null) {
        const value = await mapLF.getItem("cities");
        if (value !== null) {
            cities_data = value;
            console.log("Map Loading completed: 'cities', IndexedDB");
        } else {
            if (window.confirm("地図データ「市区町村」（約10MB）をダウンロードします。よろしいですか？")) {
                const response = await fetch("https://kottaro123456.github.io/geojsons/cities.geojson");
                const data = await response.json();
                cities_data = data;
                console.log("Map Loading completed: 'cities', Network");
                await mapLF.setItem("cities", cities_data);
                console.log("Map Saved successfully: 'cities', IndexedDB");
            } else {
                document.getElementById('display_onoff_saibun_check').checked = false;
                return;
            }
        }
    }

    // ソースとレイヤーがまだ追加されていない場合は追加
    if (cities_data && !map.getSource('cities_source')) {
        map.addSource('cities_source', {
            type: 'geojson',
            data: cities_data
        });

        // ★都道府県線(japan_line)の**下**に挿入し、都道府県塗り(japan_fill)の**上**になるようにする
        const beforeId = map.getLayer('japan_line') ? 'japan_line' :
            (map.getLayer('tsunami_line_solid') ? 'tsunami_line_solid' :
                (map.getLayer('shindo_point_layer') ? 'shindo_point_layer' : undefined));

        // 塗りつぶし用（透明でクリックイベント判定用）
        map.addLayer({
            'id': 'cities_fill',
            'type': 'fill',
            'source': 'cities_source',
            'layout': {
                'visibility': 'visible'
            },
            'paint': {
                'fill-color': 'rgba(255, 255, 255, 0)',
                'fill-opacity': 1
            }
        }, beforeId);

        // 境界線用
        map.addLayer({
            'id': 'cities_line',
            'type': 'line',
            'source': 'cities_source',
            'layout': {
                'visibility': 'visible'
            },
            'paint': {
                'line-color': '#999999',
                'line-width': 0.5
            }
        }, beforeId);

        // ポップアップ設定
        const citiesPopup = new maplibregl.Popup({
            closeButton: true,
            closeOnClick: true
        });
        window.citiesPopup = citiesPopup;

        map.on('click', 'cities_fill', (e) => {
            if (map.getLayoutProperty('cities_fill', 'visibility') === 'none') return;

            const props = e.features[0].properties;
            let popupContent = "";
            if (props.N03_001) popupContent += props.N03_001;
            if (props.N03_003) popupContent += " " + props.N03_003;
            if (props.N03_004) popupContent += "<br>" + props.N03_004;
            if (popupContent === "") popupContent = "市区町村情報なし";

            citiesPopup.setLngLat(e.lngLat).setHTML("<div style='padding:5px;font-size:1.2rem;'>" + popupContent + "</div>").addTo(map);
        });

        map.on('mousemove', 'cities_fill', (e) => {
            if (map.getLayoutProperty('cities_fill', 'visibility') !== 'none') {
                map.getCanvas().style.cursor = 'pointer';
            }
        });
        map.on('mouseleave', 'cities_fill', () => {
            map.getCanvas().style.cursor = '';
        });
    }
    citiesDraw();
}

//観測点の位置データなどのデータを取得
async function GetJson() {
    const latestJSON_fetch = await fetch("source/latest.json", { cache: "no-cache" });
    const latestJSON = await latestJSON_fetch.json();
    let isNewDataGet = true;
    await shindobunpuLF.getItem("latestJSON").then(async function (value) {
        if (value !== null) {
            const latestJSON_LF = value;

            if (latestJSON["JMAstations"] == latestJSON_LF["JMAstations"]) {
                await shindobunpuLF.getItem("JMAstations").then(async function (value) {
                    if (value !== null) {
                        // キーが存在し、値が取得できた場合
                        // ストレージからデータを取得し新しく取得しない
                        JMAPointsJson = value;
                        console.log("JSON Loading completed: 'JMAstations', IndexedDB");
                        await shindobunpuLF.getItem("JMAPoints").then(async function (value) {
                            if (value !== null) {
                                JMAPoints = value;
                                console.log("JSON Loading completed: 'JMAPoints', IndexedDB");
                                isNewDataGet = false;
                            }
                        });
                    }
                });
            }
        }

        if (isNewDataGet == true) {
            await shindobunpuLF.setItem("latestJSON", latestJSON);
            // キーが存在しない場合
            // 新しくデータを取得
            const response = await fetch("source/JMAstations.json", { cache: "no-store" });
            const data = await response.json();
            JMAPointsJson = data;
            console.log("JSON Loading completed: 'JMAstations', Network");
            await shindobunpuLF.setItem("JMAstations", JMAPointsJson);
            console.log("JSON Saved successfully: 'JMAstations', IndexedDB");

            JMAPoints = [];
            console.log("JSON Creating started: 'JMAPoints', Network");
            console.time("JSON Creating successfully: 'JMAPoints', Network");
            await JMAPointsJson.forEach(element => {
                JMAPoints.push(element["name"]);
            });
            console.timeEnd("JSON Creating successfully: 'JMAPoints', Network");
            await shindobunpuLF.setItem("JMAPoints", JMAPoints);
            console.log("JSON Saved successfully: 'JMAPoints', IndexedDB");

        } else {
            return;
        }
    });
}

// --- 最大震度情報・テーマ連動ヘルパー ---
const shindoMojiColors = {
    eqm: {
        10: "#ffffff", // 1: 白
        20: "#ffffff", // 2: 白
        30: "#000000", // 3: 黒
        40: "#000000", // 4: 黒
        45: "#000000", // 5-: 黒
        46: "#000000", // 5-: 黒
        50: "#ffffff", // 5+: 白
        55: "#ffffff", // 6-: 白
        60: "#ffffff", // 6+: 白
        70: "#ffffff", // 7: 白
        default: "#ffffff" // ?: 白
    },
    jqk: {
        10: "#ffffff", // 1: 白
        20: "#ffffff", // 2: 白
        30: "#ffffff", // 3: 白
        40: "#000000", // 4: 黒
        45: "#000000", // 5-: 黒
        46: "#000000", // 5-: 黒
        50: "#000000", // 5+: 黒
        55: "#ffffff", // 6-: 白
        60: "#ffffff", // 6+: 白
        70: "#ffffff", // 7: 白
        default: "#ffffff" // ?: 白
    },
    wni: {
        10: "#ffffff", // 1: 白
        20: "#ffffff", // 2: 白
        30: "#000000", // 3: 黒
        40: "#000000", // 4: 黒
        45: "#ffffff", // 5-: 白
        46: "#ffffff", // 5-: 白
        50: "#ffffff", // 5+: 白
        55: "#ffffff", // 6-: 白
        60: "#ffffff", // 6+: 白
        70: "#ffffff", // 7: 白
        default: "#ffffff" // ?: 白
    }
};

function getDynamicIntChipStyle(maxScale) {
    let curTheme = (typeof icon_theme !== 'undefined' && icon_theme && shindoColors[icon_theme]) ? icon_theme : 'eqm';
    let themeColors = shindoColors[curTheme] || shindoColors['eqm'];
    let themeMojiColors = shindoMojiColors[curTheme] || shindoMojiColors['eqm'];

    let bgColor = themeColors[maxScale] || themeColors['default'] || '#555555';
    let textColor = (themeMojiColors[maxScale] !== undefined) ? themeMojiColors[maxScale] : themeMojiColors['default'];

    // 表記から「震度」を外し、数字・強弱のみに統一
    let label = "不明";
    if (maxScale == 70) label = "7";
    else if (maxScale == 60) label = "6強";
    else if (maxScale == 55) label = "6弱";
    else if (maxScale == 50) label = "5強";
    else if (maxScale == 45) label = "5弱";
    else if (maxScale == 46) label = "5弱以上";
    else if (maxScale == 40) label = "4";
    else if (maxScale == 30) label = "3";
    else if (maxScale == 20) label = "2";
    else if (maxScale == 10) label = "1";
    else if (maxScale == -1) label = "?";

    return { label, bgColor, textColor };
}

// --- カスタムドロップダウン関連処理 ---
function updateCustomQuakeTrigger(num) {
    num = Number(num);
    if (!QuakeJson || !QuakeJson[num]) return;

    let element = QuakeJson[num];
    let maxScale = (element['earthquake'] && element['earthquake']['maxScale'] !== undefined) ? element['earthquake']['maxScale'] : -1;
    let chipStyle = getDynamicIntChipStyle(maxScale);

    let chipEl = document.getElementById('custom_quakelist_chip');
    if (chipEl) {
        chipEl.style.backgroundColor = chipStyle.bgColor;
        chipEl.style.color = chipStyle.textColor;
        chipEl.textContent = chipStyle.label;
    }

    let textEl = document.getElementById('custom_quakelist_text');
    if (textEl) {
        let timeStr = (element['earthquake'] && element['earthquake']['time']) ? element['earthquake']['time'].slice(0, -3) : "";
        let hypName = (element['earthquake'] && element['earthquake']['hypocenter'] && element['earthquake']['hypocenter']['name']) ? element['earthquake']['hypocenter']['name'] : "";
        if (element['issue'] && element['issue']['type'] === "ScalePrompt") {
            let pointName = (element['points'] && element['points'][0] && element['points'][0]['addr']) ? element['points'][0]['addr'] + "など" : "震源地不明";
            textEl.textContent = "【速報】" + pointName + " (" + timeStr + ")";
        } else if (element['issue'] && element['issue']['type'] === "Destination") {
            textEl.textContent = "【震源】" + timeStr + " " + hypName;
        } else if (element['issue'] && element['issue']['type'] === "Foreign") {
            textEl.textContent = "【遠地】" + timeStr + " " + hypName;
        } else {
            textEl.textContent = timeStr + " " + hypName;
        }
    }

    let customMenu = document.getElementById('custom_quakelist_menu');
    if (customMenu) {
        let items = customMenu.querySelectorAll('.custom_quakelist_item');
        items.forEach((item, idx) => {
            if (QuakeJson[idx]) {
                let itemMaxScale = (QuakeJson[idx]['earthquake'] && QuakeJson[idx]['earthquake']['maxScale'] !== undefined) ? QuakeJson[idx]['earthquake']['maxScale'] : -1;
                let itemChipStyle = getDynamicIntChipStyle(itemMaxScale);
                let itemChip = item.querySelector('.quake_chip');
                if (itemChip) {
                    itemChip.style.backgroundColor = itemChipStyle.bgColor;
                    itemChip.style.color = itemChipStyle.textColor;
                    itemChip.textContent = itemChipStyle.label;
                }
            }
            if (idx === num) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
}

function selectQuakeItem(num) {
    num = Number(num);
    Cookies.set("listSelectedIndex", num);
    if (list) list.selectedIndex = num;
    updateCustomQuakeTrigger(num);
    closeCustomQuakeDropdown();
    QuakeSelect(num);
}

function closeCustomQuakeDropdown() {
    let wrapper = document.getElementById('custom_quakelist_wrapper');
    if (wrapper) wrapper.classList.remove('open');
}

function toggleCustomQuakeDropdown() {
    let wrapper = document.getElementById('custom_quakelist_wrapper');
    if (wrapper) wrapper.classList.toggle('open');
}

// 画面外クリックでカスタムドロップダウンを閉じる
document.addEventListener('click', (e) => {
    let wrapper = document.getElementById('custom_quakelist_wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        wrapper.classList.remove('open');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    let triggerEl = document.getElementById('custom_quakelist_trigger');
    if (triggerEl) {
        triggerEl.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCustomQuakeDropdown();
        });
    }

    // --- 地震検索 & モード切替のイベント初期化 ---
    const btnLatest = document.getElementById('mode_btn_latest');
    const btnSearch = document.getElementById('mode_btn_search');
    if (btnLatest) btnLatest.addEventListener('click', () => switchAppMode('latest'));
    if (btnSearch) btnSearch.addEventListener('click', () => switchAppMode('search'));

    const togglePanelBtn = document.getElementById('toggle_search_panel_btn');
    const closePanelBtn = document.getElementById('close_search_panel_btn');
    const searchModalOverlay = document.getElementById('search_modal_overlay');

    if (togglePanelBtn && searchModalOverlay) {
        togglePanelBtn.addEventListener('click', () => {
            searchModalOverlay.style.display = 'flex';
        });
    }

    if (closePanelBtn && searchModalOverlay) {
        closePanelBtn.addEventListener('click', () => {
            searchModalOverlay.style.display = 'none';
        });
    }

    if (searchModalOverlay) {
        searchModalOverlay.addEventListener('click', (e) => {
            if (e.target === searchModalOverlay) {
                searchModalOverlay.style.display = 'none';
            }
        });
    }

    const searchSubmitBtn = document.getElementById('search_submit_btn');
    if (searchSubmitBtn) {
        searchSubmitBtn.addEventListener('click', () => {
            if (searchModalOverlay) {
                searchModalOverlay.style.display = 'none';
            }
            ExecuteQuakeSearch(0);
        });
    }

    const searchResetBtn = document.getElementById('search_reset_btn');
    if (searchResetBtn) {
        searchResetBtn.addEventListener('click', () => {
            document.getElementById('search_since_date').value = '';
            document.getElementById('search_until_date').value = '';
            document.getElementById('search_quake_type').value = 'DetailScale';
            document.getElementById('search_min_scale').value = '';
            document.getElementById('search_max_scale').value = '';
            document.getElementById('search_min_m').value = '';
            document.getElementById('search_max_m').value = '';
            document.getElementById('search_pref').value = '';
            document.getElementById('search_pref_min_scale').value = '10';
            document.getElementById('search_order').value = '-1';
            document.getElementById('search_limit').value = '10';

            // モーダル上の完全カスタムドロップダウンの見た目(チップ・テキスト・選択状態)も即座に初期状態へクリア
            initCustomScaleSelects();

            ExecuteQuakeSearch(0);
        });
    }

    const searchPrevBtn = document.getElementById('search_prev_btn');
    const searchNextBtn = document.getElementById('search_next_btn');
    if (searchPrevBtn) {
        searchPrevBtn.addEventListener('click', () => {
            ExecuteQuakeSearch(searchCurrentOffset - searchCurrentLimit);
        });
    }
    if (searchNextBtn) {
        searchNextBtn.addEventListener('click', () => {
            ExecuteQuakeSearch(searchCurrentOffset + searchCurrentLimit);
        });
    }

    const searchMapIchi = document.getElementById('search_map_ichi');
    if (searchMapIchi) {
        searchMapIchi.addEventListener('click', () => {
            document.getElementById('map_ichi')?.click();
        });
    }

    const searchMapSs = document.getElementById('search_map_ss');
    if (searchMapSs) {
        searchMapSs.addEventListener('click', () => {
            document.getElementById('map_ss')?.click();
        });
    }

    const searchBigCheck = document.getElementById('shindoiconbig_check_search');
    const origBigCheck = document.getElementById('shindoiconbig_check');
    if (searchBigCheck && origBigCheck) {
        searchBigCheck.addEventListener('change', () => {
            origBigCheck.checked = searchBigCheck.checked;
            origBigCheck.dispatchEvent(new Event('change'));
        });
    }

    // --- 震度選択カラーチップ連動 & カスタムドロップダウン初期化 ---
    initCustomScaleSelects();
});

// 完全カスタム震度選択ドロップダウンの構築と制御
function initCustomScaleSelects() {
    const scaleSelectConfigs = [
        { wrapperId: 'custom_scale_min_wrapper', selectId: 'search_min_scale', textId: 'text_min_scale', chipId: 'chip_min_scale', menuId: 'menu_min_scale' },
        { wrapperId: 'custom_scale_max_wrapper', selectId: 'search_max_scale', textId: 'text_max_scale', chipId: 'chip_max_scale', menuId: 'menu_max_scale' },
        { wrapperId: 'custom_scale_pref_min_wrapper', selectId: 'search_pref_min_scale', textId: 'text_pref_min_scale', chipId: 'chip_pref_min_scale', menuId: 'menu_pref_min_scale' }
    ];

    scaleSelectConfigs.forEach(config => {
        const wrapper = document.getElementById(config.wrapperId);
        const select = document.getElementById(config.selectId);
        const textEl = document.getElementById(config.textId);
        const chipEl = document.getElementById(config.chipId);
        const menuEl = document.getElementById(config.menuId);

        if (!wrapper || !select || !menuEl) return;

        menuEl.innerHTML = '';

        Array.from(select.options).forEach(opt => {
            const item = document.createElement('div');
            item.className = 'custom_scale_select_item';
            item.dataset.value = opt.value;

            const chipSpan = document.createElement('span');
            chipSpan.className = 'quake_chip scale_chip_fixed';

            if (opt.value !== '') {
                const scaleVal = parseInt(opt.value, 10);
                const style = getDynamicIntChipStyle(scaleVal);
                chipSpan.style.backgroundColor = style.bgColor;
                chipSpan.style.color = style.textColor;
                chipSpan.textContent = style.label;
            } else {
                chipSpan.style.backgroundColor = '#4a5568';
                chipSpan.style.color = '#ffffff';
                chipSpan.textContent = '-';
            }

            const labelSpan = document.createElement('span');
            labelSpan.textContent = opt.textContent;

            item.appendChild(chipSpan);
            item.appendChild(labelSpan);

            if (select.value === opt.value) {
                item.classList.add('selected');
                if (opt.value !== '') {
                    const scaleVal = parseInt(opt.value, 10);
                    const style = getDynamicIntChipStyle(scaleVal);
                    if (chipEl) {
                        chipEl.style.display = 'inline-flex';
                        chipEl.style.backgroundColor = style.bgColor;
                        chipEl.style.color = style.textColor;
                        chipEl.textContent = style.label;
                    }
                } else {
                    if (chipEl) chipEl.style.display = 'none';
                }
                if (textEl) textEl.textContent = opt.textContent;
            }

            item.addEventListener('click', (e) => {
                e.stopPropagation();
                select.value = opt.value;

                if (opt.value !== '') {
                    const scaleVal = parseInt(opt.value, 10);
                    const style = getDynamicIntChipStyle(scaleVal);
                    if (chipEl) {
                        chipEl.style.display = 'inline-flex';
                        chipEl.style.backgroundColor = style.bgColor;
                        chipEl.style.color = style.textColor;
                        chipEl.textContent = style.label;
                    }
                } else {
                    if (chipEl) chipEl.style.display = 'none';
                }
                if (textEl) textEl.textContent = opt.textContent;

                menuEl.querySelectorAll('.custom_scale_select_item').forEach(el => el.classList.remove('selected'));
                item.classList.add('selected');

                wrapper.classList.remove('open');

                select.dispatchEvent(new Event('change'));
            });

            menuEl.appendChild(item);
        });

        const trigger = wrapper.querySelector('.custom_scale_select_trigger');
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.custom_scale_select_wrapper').forEach(w => {
                    if (w !== wrapper) w.classList.remove('open');
                });
                wrapper.classList.toggle('open');
            });
        }
    });

    document.addEventListener('click', (e) => {
        document.querySelectorAll('.custom_scale_select_wrapper').forEach(w => {
            if (!w.contains(e.target)) {
                w.classList.remove('open');
            }
        });
    });
}

function updateSearchScaleChips() {
    initCustomScaleSelects();
}

// ==========================================================================
// 地震検索機能 & モード切り替え ロジック
// ==========================================================================

let currentAppMode = 'latest'; // 'latest' または 'search'
let searchCurrentOffset = 0;
let searchCurrentLimit = 10;

function switchAppMode(mode) {
    currentAppMode = mode;
    const btnLatest = document.getElementById('mode_btn_latest');
    const btnSearch = document.getElementById('mode_btn_search');
    const latestControls = document.getElementById('latest_controls');
    const searchControls = document.getElementById('search_controls');
    const searchModalOverlay = document.getElementById('search_modal_overlay');
    const titleText = document.getElementById('title_text');

    if (mode === 'latest') {
        if (btnLatest) btnLatest.classList.add('active');
        if (btnSearch) btnSearch.classList.remove('active');
        if (latestControls) latestControls.style.display = 'block';
        if (searchControls) searchControls.style.display = 'none';
        if (searchModalOverlay) searchModalOverlay.style.display = 'none';
        if (titleText) titleText.textContent = "震度分布図 - 観測点モード";

        let reloadNum = document.getElementById('reload_num') ? document.getElementById('reload_num').value : 20;
        GetQuake(reloadNum);
    } else {
        if (btnSearch) btnSearch.classList.add('active');
        if (btnLatest) btnLatest.classList.remove('active');
        if (searchControls) searchControls.style.display = 'inline-flex';
        if (latestControls) latestControls.style.display = 'none';
        if (titleText) titleText.textContent = "震度分布図 - 地震検索モード";

        // 最新情報の自動更新がONなら停止
        if (typeof autoreload_flg !== 'undefined' && autoreload_flg) {
            if (typeof autoreload !== 'undefined') clearInterval(autoreload);
            autoreload_flg = false;
            let autoReloadBtn = document.getElementById('autoreload');
            if (autoReloadBtn) autoReloadBtn.textContent = '自動更新';
        }

        ExecuteQuakeSearch(0);
    }
}

async function ExecuteQuakeSearch(offset = 0) {
    searchCurrentOffset = Math.max(0, offset);

    let sinceDateVal = document.getElementById('search_since_date')?.value || '';
    let untilDateVal = document.getElementById('search_until_date')?.value || '';
    let quakeTypeVal = document.getElementById('search_quake_type')?.value || 'DetailScale';
    let minScaleVal = document.getElementById('search_min_scale')?.value || '';
    let maxScaleVal = document.getElementById('search_max_scale')?.value || '';
    let minMVal = document.getElementById('search_min_m')?.value || '';
    let maxMVal = document.getElementById('search_max_m')?.value || '';
    let prefVal = document.getElementById('search_pref')?.value || '';
    let prefMinScaleVal = document.getElementById('search_pref_min_scale')?.value || '10';
    let orderVal = document.getElementById('search_order')?.value || '-1';
    let limitVal = parseInt(document.getElementById('search_limit')?.value || '10', 10);
    searchCurrentLimit = limitVal;

    const baseUrl = "https://api.p2pquake.net/v2/jma/quake";
    const query = new URLSearchParams();

    query.append("limit", limitVal);
    query.append("offset", searchCurrentOffset);
    query.append("order", orderVal);

    if (quakeTypeVal) query.append("quake_type", quakeTypeVal);
    if (sinceDateVal) query.append("since_date", sinceDateVal.replace(/-/g, ''));
    if (untilDateVal) query.append("until_date", untilDateVal.replace(/-/g, ''));
    if (minScaleVal !== '') query.append("min_scale", minScaleVal);
    if (maxScaleVal !== '') query.append("max_scale", maxScaleVal);
    if (minMVal !== '') query.append("min_magnitude", minMVal);
    if (maxMVal !== '') query.append("max_magnitude", maxMVal);
    if (prefVal) query.append("prefectures[]", `${prefVal},${prefMinScaleVal}`);

    let fetchUrl = `${baseUrl}?${query.toString()}`;
    let fetchedData = [];

    try {
        let response = await fetch(fetchUrl);
        fetchedData = await response.json();
        if (!Array.isArray(fetchedData)) fetchedData = [];
    } catch (e) {
        console.error("Earthquake search fetch error:", e);
        fetchedData = [];
    }

    QuakeJson = fetchedData;

    // ページネーション表示更新
    let prevBtn = document.getElementById('search_prev_btn');
    let nextBtn = document.getElementById('search_next_btn');
    let pageInfo = document.getElementById('search_page_info');

    if (prevBtn) {
        prevBtn.disabled = (searchCurrentOffset <= 0);
        prevBtn.textContent = '◄  前';
    }
    if (nextBtn) {
        nextBtn.disabled = (fetchedData.length < limitVal);
        nextBtn.textContent = '次 ►';
    }

    if (pageInfo) {
        if (fetchedData.length === 0) {
            pageInfo.textContent = "0件";
        } else {
            let startNum = searchCurrentOffset + 1;
            let endNum = searchCurrentOffset + fetchedData.length;
            pageInfo.textContent = `${startNum}～${endNum}件目`;
        }
    }

    // リストメニュー再構築
    while (list.lastChild) {
        list.removeChild(list.lastChild);
    }
    let customMenu = document.getElementById('custom_quakelist_menu');
    if (customMenu) customMenu.innerHTML = "";

    let int = 0;
    QuakeJson.forEach(element => {
        let maxScale = (element['earthquake'] && element['earthquake']['maxScale'] !== undefined) ? element['earthquake']['maxScale'] : -1;
        let chipStyle = getDynamicIntChipStyle(maxScale);

        let timeStr = (element['earthquake'] && element['earthquake']['time']) ? element['earthquake']['time'].slice(0, -3) : "";
        let hypName = (element['earthquake'] && element['earthquake']['hypocenter'] && element['earthquake']['hypocenter']['name']) ? element['earthquake']['hypocenter']['name'] : "震源地不明";

        let text = timeStr + " " + hypName + " 最大震度:" + chipStyle.label;
        let optionEl = document.createElement("option");
        optionEl.value = "" + int + "";
        optionEl.textContent = text;
        list.appendChild(optionEl);

        if (customMenu) {
            let itemIndex = int;
            let item = document.createElement("div");
            item.className = "custom_quakelist_item";
            item.dataset.index = itemIndex;

            let chip = document.createElement("span");
            chip.className = "quake_chip";
            chip.style.backgroundColor = chipStyle.bgColor;
            chip.style.color = chipStyle.textColor;
            chip.textContent = chipStyle.label;

            let titleDiv = document.createElement("div");
            titleDiv.className = "custom_quakelist_item_title";
            let displayTitle = (element['issue'] && element['issue']['type'] === "ScalePrompt" && element['points'] && element['points'][0])
                ? "【震度速報】" + element['points'][0]['addr'] + "など"
                : (timeStr + " " + hypName);
            titleDiv.textContent = displayTitle;

            item.appendChild(chip);
            item.appendChild(titleDiv);

            item.addEventListener("click", () => {
                selectQuakeItem(itemIndex);
            });

            customMenu.appendChild(item);
        }
        int++;
    });

    if (QuakeJson.length > 0) {
        selectQuakeItem(0);
    } else {
        updateCustomQuakeTrigger(-1);
    }
}

//地震情報をP2PQuakeより取得
//引数"option"は情報取得のボタンの件数か熊本県地震のテストデータを取得する文章
async function GetQuake(option) {
    const urlParams = new URLSearchParams(window.location.search);
    const testParam = urlParams.get('test');

    let quakeData = [];

    if (testParam) {
        let response = await fetch("source/" + testParam + "/formatter.json");
        quakeData = await response.json();
    } else if (option == "test_on") {
        let response = await fetch("https://api.p2pquake.net/v2/jma/quake?limit=100&quake_type=ScalePrompt&min_scale=60");
        quakeData = await response.json();
    } else if (!isNaN(option) && option !== null && option !== "") {
        let targetCount = Math.max(1, parseInt(option, 10));
        let fetched = [];
        let offset = 0;
        while (fetched.length < targetCount) {
            let fetchLimit = Math.min(100, targetCount - fetched.length);
            let url = `https://api.p2pquake.net/v2/history?codes=551&limit=${fetchLimit}&offset=${offset}`;
            try {
                let response = await fetch(url);
                let batch = await response.json();
                if (!Array.isArray(batch) || batch.length === 0) {
                    break;
                }
                fetched = fetched.concat(batch);
                offset += batch.length;
                if (batch.length < fetchLimit) {
                    break; // これ以上のデータが存在しない
                }
            } catch (e) {
                console.error("P2PQuake API fetch error:", e);
                break;
            }
        }
        quakeData = fetched;
    } else {
        let response = await fetch("https://api.p2pquake.net/v2/history?codes=551&limit=20");
        quakeData = await response.json();
    }

    QuakeJson = quakeData || [];

    // 現在の時刻を分解して○月○日形式にする
    gettime = new Date();
    var getmonth = ('0' + (gettime.getMonth() + 1)).slice(-2);
    var getday = ('0' + gettime.getDate()).slice(-2);
    var gethour = ('0' + gettime.getHours()).slice(-2);
    var getminute = ('0' + gettime.getMinutes()).slice(-2);
    var getsecond = ('0' + gettime.getSeconds()).slice(-2);
    document.getElementById('title_time').innerHTML = getmonth + '<span class="small">月</span>' + getday + '<span class="small">日</span> ' + gethour + '<span class="small">時</span>' + getminute + '<span class="small">分</span>' + getsecond + '<span class="small">秒</span>現在';

    // 地震情報リストの中身をすべて削除する
    while (list.lastChild) {
        list.removeChild(list.lastChild);
    }
    let customMenu = document.getElementById('custom_quakelist_menu');
    if (customMenu) {
        customMenu.innerHTML = "";
    }

    var int = 0;
    QuakeJson.forEach(element => {
        let maxScale = (element['earthquake'] && element['earthquake']['maxScale'] !== undefined) ? element['earthquake']['maxScale'] : -1;
        let chipStyle = getDynamicIntChipStyle(maxScale);

        let kibo = (element['earthquake'] && element['earthquake']['hypocenter'] && element['earthquake']['hypocenter']['magnitude'] !== undefined) ? Number(element['earthquake']['hypocenter']['magnitude']).toFixed(1) : -1;
        if (kibo == -1) {
            kibo = "不明";
        }

        let timeStr = (element['earthquake'] && element['earthquake']['time']) ? element['earthquake']['time'].slice(0, -3) : "";
        let hypName = (element['earthquake'] && element['earthquake']['hypocenter'] && element['earthquake']['hypocenter']['name']) ? element['earthquake']['hypocenter']['name'] : "震源地不明";

        let text = "";
        if (element['issue']['type'] != "ScalePrompt" && element['issue']['type'] != "Foreign" && element['issue']['type'] != "Destination" && element['issue']['type'] != "ScaleAndDestination") {
            text = timeStr + " " + hypName + " \n\n最大震度 : " + chipStyle.label + " ";
        } else if (element['issue']['type'] == "Destination" || element['issue']['type'] == "ScaleAndDestination") {
            text = "【震源情報】" + timeStr + " " + hypName;
        } else if (element['issue']['type'] == "Foreign") {
            text = "【遠地地震】" + timeStr + " " + hypName;
        } else {
            if (element['points'] && element['points'][0]) {
                text = "【震度速報】" + element['points'][0]['addr'] + "など \n" + timeStr + "\n最大震度 : " + chipStyle.label + " ";
            } else {
                text = "【震度速報】震源地不明 \n" + timeStr + "\n最大震度 : " + chipStyle.label + " ";
            }
        }

        // 隠し select 用
        var optionEl = document.createElement("option");
        optionEl.value = "" + int + "";
        optionEl.textContent = text;
        list.appendChild(optionEl);

        // 自前カスタムドロップダウンメニュー用
        if (customMenu) {
            let itemIndex = int;
            let item = document.createElement("div");
            item.className = "custom_quakelist_item";
            item.dataset.index = itemIndex;

            let chip = document.createElement("span");
            chip.className = "quake_chip";
            chip.style.backgroundColor = chipStyle.bgColor;
            chip.style.color = chipStyle.textColor;
            chip.textContent = chipStyle.label;

            let titleDiv = document.createElement("div");
            titleDiv.className = "custom_quakelist_item_title";
            let displayTitle = (element['issue']['type'] === "ScalePrompt" && element['points'] && element['points'][0])
                ? "【震度速報】" + element['points'][0]['addr'] + "など"
                : (timeStr + " " + hypName);
            titleDiv.textContent = displayTitle;

            item.appendChild(chip);
            item.appendChild(titleDiv);

            item.addEventListener("click", () => {
                selectQuakeItem(itemIndex);
            });

            customMenu.appendChild(item);
        }

        int++;
    });

    let savedIndex = Cookies.get("listSelectedIndex") || 0;
    updateCustomQuakeTrigger(savedIndex);
}

//地震情報の描画の処理
//引数"num"には地震情報リストの上からの順番が入る(はじめは0)
//引数"isFlyOff"には、ズームをしない場合「true」が入る。ズームする場合は「」何もなし。
// 地震情報の描画処理（震度速報・震源情報・通知UI対応版）
async function QuakeSelect(num, isFlyOff) {
    // データ存在チェック
    if (!QuakeJson[num]) {
        num = 0;
        Cookies.set("listSelectedIndex", 0);
    }
    num = Number(num);

    // リスト選択状態の更新
    if (list.options[num]) {
        list.options[num].selected = true;
    }
    updateCustomQuakeTrigger(num);

    // --- 1. データタイプの判定とターゲット設定 ---
    const originalData = QuakeJson[num];
    const issueType = originalData.issue.type;
    let targetData = originalData; // 実際に描画に使うデータ
    let isStationMode = true; // 観測点モードか、区域モードか

    // タイトルとモードの切り替え
    if (issueType === "ScalePrompt" || issueType === "Destination") {
        document.getElementById('title_text').innerText = "震度速報 - 細分区域モード";
        isStationMode = false;
    } else {
        document.getElementById('title_text').innerText = "震度分布図 - 観測点モード";
        isStationMode = true;
    }

    // 「震源情報」の場合の特例処理：直後の「震度速報」を探してデータとして使う
    if (issueType === "Destination") {
        // 次のデータが存在し、かつ震度速報で、かつ発生時刻が同じならペアとみなす
        if (QuakeJson[num + 1] &&
            QuakeJson[num + 1].issue.type === "ScalePrompt" &&
            QuakeJson[num + 1].earthquake.time === originalData.earthquake.time) {

            targetData = QuakeJson[num + 1]; // 描画用データ差し替え

            // ★追加: 直前の震度速報を描画していることを通知
            if (isFlyOff != true) {
                var infoDiv = document.createElement('div');
                infoDiv.classList.add("topRightInfo");
                infoDiv.innerHTML = `<span class="material-symbols-rounded">data_info_alert</span> 直前の震度速報を描画しています。`;
                document.body.appendChild(infoDiv);
                setTimeout(() => {
                    infoDiv.classList.add("display");
                    setTimeout(() => {
                        infoDiv.classList.remove("display");
                        setTimeout(() => {
                            document.body.removeChild(infoDiv);
                        }, 500);
                    }, 5000);
                }, 50);
            }

        } else {
            // ペアが見つからない場合（震源のみ表示）

            // ★追加: 震度速報が見つからなかったことを通知
            if (isFlyOff != true) {
                var errorDiv = document.createElement('div');
                errorDiv.classList.add("topRightError");
                errorDiv.innerHTML = `<span class="material-symbols-rounded">emergency_home</span> 対象の震度速報を取得できませんでした。`;
                document.body.appendChild(errorDiv);
                setTimeout(() => {
                    errorDiv.classList.add("display");
                    setTimeout(() => {
                        errorDiv.classList.remove("display");
                        setTimeout(() => {
                            document.body.removeChild(errorDiv);
                        }, 500);
                    }, 5000);
                }, 50);
            }
        }
    }


    // --- 2. 基本情報の取得（震源は元のデータを使用） ---
    const hypocenter = originalData.earthquake.hypocenter;
    const shingenLng = Number(hypocenter.longitude);
    const shingenLat = Number(hypocenter.latitude);
    shingen_lnglat = [shingenLng, shingenLat];

    let Magnitude = (hypocenter.magnitude != -1) ? Number(hypocenter.magnitude).toFixed(1) : 'ー.ー';
    let depth = (hypocenter.depth == -1) ? '不明' : (hypocenter.depth == 0 ? 'ごく浅い' : `約${hypocenter.depth}km`);

    // 最大震度の処理（targetDataから取得）
    let maxScale = targetData.earthquake.maxScale;
    let maxint_text = "不明";
    let maxint_code = "_";

    if (maxScale == 10) { maxint_text = "1"; maxint_code = "1"; }
    else if (maxScale == 20) { maxint_text = "2"; maxint_code = "2"; }
    else if (maxScale == 30) { maxint_text = "3"; maxint_code = "3"; }
    else if (maxScale == 40) { maxint_text = "4"; maxint_code = "4"; }
    else if (maxScale == 45) { maxint_text = "5弱"; maxint_code = "50"; }
    else if (maxScale == 46) { maxint_text = "5弱以上"; maxint_code = "50"; }
    else if (maxScale == 50) { maxint_text = "5強"; maxint_code = "55"; }
    else if (maxScale == 55) { maxint_text = "6弱"; maxint_code = "60"; }
    else if (maxScale == 60) { maxint_text = "6強"; maxint_code = "65"; }
    else if (maxScale == 70) { maxint_text = "7"; maxint_code = "7"; }

    // 津波情報
    let tsunami_text = '<span id="tsunami_text_span">情報なし</span>';
    const tsunamiStatus = originalData.earthquake.domesticTsunami;
    if (tsunamiStatus == 'None') tsunami_text = '<span id="tsunami_text_span">なし</span>';
    else if (tsunamiStatus == 'Unknown') tsunami_text = '<span id="tsunami_text_span">不明</span>';
    else if (tsunamiStatus == 'Checking') tsunami_text = '<span id="tsunami_text_span">調査中</span>';
    else if (tsunamiStatus == 'NonEffective') tsunami_text = '<span id="tsunami_text_span"><span class="tsunami_text_4">若干の海面変動</span></span>';
    else if (tsunamiStatus == 'Watch') tsunami_text = '<span id="tsunami_text_span"><span class="tsunami_text_3">津波注意報</span></span>';
    else if (tsunamiStatus == 'Warning') tsunami_text = '<span id="tsunami_text_span"><span class="tsunami_text_warning">津波警報等あり</span></span>';


    // --- 3. UI更新 ---
    const dateStr = originalData.earthquake.time;
    const info_html = `
        <div class="maxint">最大震度<img src="source/svg/${icon_theme}_int${maxint_code}.svg" style="height: 1em; transform: translateY(8%); margin-left: 5px;"></div>
        ${dateStr.substring(5, 7)}月${dateStr.substring(8, 10)}日 ${dateStr.substring(11, 13)}時${dateStr.substring(14, 16)}分ごろ<br>
        　震源地　：${hypocenter.name}<br>
        地震の規模：M${Magnitude}<br>
        震源の深さ：${depth}<br>
        津波の心配：${tsunami_text}
    `;
    document.getElementById('info').innerHTML = info_html;


    // --- 4. 震源アイコン更新 ---
    const shingenPopupContent = `発生時刻：${dateStr}<br>最大震度：${maxint_text}<br>震源地：${hypocenter.name}<span style="font-size: 85%;"> (${shingenLat}, ${shingenLng})</span><br>規模：M${Magnitude}　深さ：${depth}`;

    // 震源情報がない(LatLonが-1)場合は表示しない
    const shingenFeatures = (shingenLng !== -1 && shingenLat !== -1) ? [{
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [shingenLng, shingenLat] },
        properties: { popupContent: shingenPopupContent }
    }] : [];

    map.getSource('shingen_source').setData({
        type: 'FeatureCollection',
        features: shingenFeatures
    });
    const shingenVisibility = (document.getElementById('display_onoff_shingen_check') && document.getElementById('display_onoff_shingen_check').checked) ? 'visible' : 'none';
    if (map.getLayer('shingen_layer')) map.setLayoutProperty('shingen_layer', 'visibility', shingenVisibility);


    // --- 5. ポイント＆塗りつぶしデータの作成 ---
    const pointsFeatures = [];
    filled_list = {};
    const counts = {};
    ['1', '2', '3', '4', '50', '51', '55', '60', '65', '7', '_', 'N'].forEach(s => counts[s] = 0);

    // リストUIのリセット
    ['1', '2', '3', '4', '50', '51', '55', '60', '65', '7', '_', 'N'].forEach(s => {
        const el = document.getElementById(`shindo${s}_article`);
        if (el) el.innerHTML = "";
    });

    // 震度データのループ処理
    if (targetData.points) {
        targetData.points.forEach(point => {
            let lat, lon, name, furigana;
            let iconSize = 0.13; // デフォルトサイズ

            if (isStationMode) {
                // [観測点モード]
                const stationIndex = JMAPoints.indexOf(point.addr);
                if (stationIndex !== -1) {
                    const stationData = JMAPointsJson[stationIndex];
                    lat = stationData.lat;
                    lon = stationData.lon;
                    name = point.addr;
                    furigana = stationData.furigana;

                    // 塗りつぶし用: 観測点のエリアコードを取得
                    const areaCode = AreaNameToCode(stationData.area.name);
                    if (areaCode) {
                        if ((!filled_list[areaCode]) || filled_list[areaCode] < point.scale) {
                            filled_list[areaCode] = point.scale;
                        }
                    }
                }
            } else {
                // [区域モード(震度速報)]
                // point.addr が「エリア名」になっている
                const areaCode = AreaNameToCode(point.addr);
                if (areaCode && centerPoint[areaCode]) {
                    lat = centerPoint[areaCode].lat;
                    lon = centerPoint[areaCode].lng;
                    name = point.addr;
                    furigana = AreaNameToKana(name);

                    // 塗りつぶし用: そのまま使用
                    filled_list[areaCode] = point.scale;

                    // ★修正: アイコンサイズを調整 (0.22)
                    iconSize = 0.22;
                }
            }

            // 「震度大きく」のチェックが入っていればサイズを1.5倍にする
            if (document.getElementById('shindoiconbig_check').checked) {
                iconSize *= 1.5;
            }

            // 座標が特定できた場合のみ追加
            if (lat !== undefined && lon !== undefined) {
                // 震度に応じたアイコン名とテキスト、およびソートキー
                let iconName = "int_";
                let shindoText = "不明";
                let suffix = "_";
                let sortKey = 0; // ★追加: 並び順用変数の初期化

                // sortKeyには震度の数値(10, 20...70)をそのまま入れます
                if (point.scale == 10) { iconName = `${icon_theme}_int1`; shindoText = "震度1"; suffix = "1"; sortKey = 10; }
                else if (point.scale == 20) { iconName = `${icon_theme}_int2`; shindoText = "震度2"; suffix = "2"; sortKey = 20; }
                else if (point.scale == 30) { iconName = `${icon_theme}_int3`; shindoText = "震度3"; suffix = "3"; sortKey = 30; }
                else if (point.scale == 40) { iconName = `${icon_theme}_int4`; shindoText = "震度4"; suffix = "4"; sortKey = 40; }
                else if (point.scale == 45) { iconName = `${icon_theme}_int50`; shindoText = "震度5弱"; suffix = "50"; sortKey = 45; }
                else if (point.scale == 46) { iconName = `${icon_theme}_int51`; shindoText = "震度5弱以上と推定"; suffix = "51"; sortKey = 46; }
                else if (point.scale == 50) { iconName = `${icon_theme}_int55`; shindoText = "震度5強"; suffix = "55"; sortKey = 50; }
                else if (point.scale == 55) { iconName = `${icon_theme}_int60`; shindoText = "震度6弱"; suffix = "60"; sortKey = 55; }
                else if (point.scale == 60) { iconName = `${icon_theme}_int65`; shindoText = "震度6強"; suffix = "65"; sortKey = 60; }
                else if (point.scale == 70) { iconName = `${icon_theme}_int7`; shindoText = "震度7"; suffix = "7"; sortKey = 70; }
                else if (point.scale <= 0) { iconName = `${icon_theme}_intN`; shindoText = "情報なし"; suffix = "N"; sortKey = -1; }

                // GeoJSON feature作成
                pointsFeatures.push({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [lon, lat] },
                    properties: {
                        iconName: iconName,
                        iconSize: iconSize,
                        sortKey: sortKey, // ★追加: ここで並び順をデータに持たせる
                        popupContent: `<ruby>${name}<rt>${furigana}</rt></ruby>　${shindoText}`
                    }
                });

                // 右側リストへの追加
                const article = document.getElementById(`shindo${suffix}_article`);
                if (article) {
                    article.innerHTML += `<ruby>${name}<rt>${furigana}</rt></ruby>　`;
                    counts[suffix]++;
                }
            } else {
                // 座標が特定できなかった観測点 (位置プロット不可) -> 「観測点情報なし」に記録
                const unmappedName = point.addr || "名称不明";
                const articleN = document.getElementById('shindoN_article');
                if (articleN) {
                    articleN.innerHTML += `<ruby>${unmappedName}<rt></rt></ruby>　`;
                    counts['N']++;
                }
            }
        });
    }

    // 地図上のポイント更新
    map.getSource('shindo_point_source').setData({
        type: 'FeatureCollection',
        features: pointsFeatures
    });


    // --- 6. 塗りつぶしの適用 ---
    const themeColors = shindoColors[icon_theme] || shindoColors.eqm;
    const landColors = { nerv: "#3a3a3a", wni: "#ffffff", quarog: "#508C78" };
    const defaultLandColor = landColors[this_theme] || "#3a3a3a";

    // 塗りのオンオフをチェック
    const isFillOn = document.getElementById('display_onoff_fill_check').checked;

    const matchExpression = ['match', ['get', 'code']];
    for (const [code, scale] of Object.entries(filled_list)) {
        // オフの場合はデフォルトベースカラーにする
        const color = isFillOn ? (themeColors[scale] || themeColors.default) : defaultLandColor;
        matchExpression.push(code);
        matchExpression.push(color);
    }
    matchExpression.push(defaultLandColor);

    if (map.getLayer('japan_fill')) {
        map.setPaintProperty('japan_fill', 'fill-color', matchExpression);
        // 必ず表示状態にしておく（色分けで隠すため）
        map.setLayoutProperty('japan_fill', 'visibility', 'visible');
    }


    // --- 7. リストのUI更新 (件数表示など) ---
    let totalPoints = 0;
    const kakutitle = document.getElementsByClassName('shindo_ichiran_kakutitle');
    const updateTitle = (index, suffix) => {
        if (kakutitle[index]) {
            const unit = isStationMode ? "ヶ所" : "区域";
            const label = (suffix === 'N') ? "観測点情報なし" : "震度";
            kakutitle[index].innerHTML = `${label}<img src="source/svg/${icon_theme}_int${suffix}.svg">　${counts[suffix]}<span class="kasho_small">${unit}</span>`;
            totalPoints += counts[suffix];

            const container = document.getElementById(`shindo${suffix}`);
            if (container) {
                if (counts[suffix] === 0) container.classList.add('display');
                else container.classList.remove('display');
            }
        }
    };

    // HTMLの並び順に合わせて更新
    updateTitle(0, '7');
    updateTitle(1, '65');
    updateTitle(2, '60');
    updateTitle(3, '55');
    updateTitle(4, '50');
    updateTitle(5, '51');
    updateTitle(6, '4');
    updateTitle(7, '3');
    updateTitle(8, '2');
    updateTitle(9, '1');
    updateTitle(10, '_');
    updateTitle(11, 'N');

    const unitTotal = isStationMode ? "ヶ所" : "区域";
    document.getElementById('shindoichiran_title_num').innerHTML = `全 ${totalPoints}<span class="small">${unitTotal}</span>`;


    // --- 8. カメラ移動 (FlyTo) ---
    // 保存 (位置初期化用)
    let currentBounds = null;
    if (!isStationMode && pointsFeatures.length > 0) {
        currentBounds = new maplibregl.LngLatBounds();
        pointsFeatures.forEach(p => currentBounds.extend(p.geometry.coordinates));
    }

    // quakeDefaultViewには「生の」震源位置を保存しておく
    quakeDefaultView = {
        isStationMode: isStationMode,
        shingenExists: (shingenLng !== -1 && shingenLat !== -1),
        rawCenter: [shingenLng, shingenLat],
        bounds: currentBounds
    };

    // 実際の移動処理（パネルの状態を考慮する）
    if (!isFlyOff) {
        isMapAtDefault = true; // 新しい地震を選択したときはデフォルト位置に戻る
        moveMapToDefault(true); // 強制的に移動
    }

    // ★追加: 津波情報の描画処理を呼び出す
    await tsunamiDraw();

    console.log(`QuakeSelect executed. Mode: ${isStationMode ? "Station" : "Area"}, Points: ${pointsFeatures.length}`);
}


// 津波情報の描画（MapLibre版）
async function tsunamiDraw() {
    // まず既存の津波表示をクリア
    if (map.getSource('tsunami_source')) {
        map.getSource('tsunami_source').setData({ type: 'FeatureCollection', features: [] });
    }

    // UI非表示
    const infobox = document.querySelector('.tsunami_infobox');
    if (infobox) infobox.classList.remove('display');
    document.getElementById('tsunami_text_span').innerHTML = '情報なし';

    // チェックボックスがオフ、または津波なしなら終了
    const selectNum = document.getElementById('quakelist').selectedIndex;
    if (!document.getElementById('display_onoff_tsunami_check').checked) return;
    if (!QuakeJson[selectNum]) return;
    const quakeData = QuakeJson[selectNum];
    const domesticTsunami = quakeData.earthquake.domesticTsunami;
    if (domesticTsunami === 'None' || domesticTsunami === 'Checking') return;

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const testParam = urlParams.get('test');

        // 1. 津波リストを取得
        let listUrl = "https://www.jma.go.jp/bosai/tsunami/data/list.json";
        if (testParam) {
            listUrl = "source/" + testParam + "/list.json";
        }
        const listResponse = await fetch(listUrl);
        const tsunamiList = await listResponse.json();

        // 地震の発生時刻と震源名でマッチング
        const targetTime = quakeData.earthquake.time.substring(11, 19); // HH:mm:ss
        const targetName = quakeData.earthquake.hypocenter.name;

        const targetItem = tsunamiList.find(item => {
            const itemTime = item.at.substring(11, 19);
            return itemTime === targetTime && item.anm === targetName && item.ttl.includes("津波");
        });

        if (!targetItem) return;

        // 2. 詳細データを取得
        let detailUrl = `https://www.jma.go.jp/bosai/tsunami/data/${targetItem.json}`;
        if (testParam) {
            detailUrl = `source/${testParam}/${targetItem.json}`;
        }
        const detailResponse = await fetch(detailUrl);
        const tsunamiDetails = await detailResponse.json();

        const items = tsunamiDetails.Body.Tsunami.Forecast.Item;
        if (!items) return;

        // 3. 各予報区のGeoJSONを並列ダウンロードして結合
        let combinedFeatures = [];
        const tsunamiTypesCount = [0, 0, 0, 0]; // [大警報, 警報, 注意報, 予報]

        // fetch処理の配列を作成
        const fetchPromises = items.map(async (item) => {
            const code = item.Category.Kind.Code;
            const name = item.Area.Name;

            // 色とスタイルの設定
            let color = null;
            let width = 0;
            let isDashed = false;
            let typeName = "";
            let priority = -1; // 優先度用

            // コード表に基づくスタイル定義
            if (code === "52" || code === "53") { // 大津波警報
                color = "#dd00dd"; width = 8; typeName = "大津波警報"; tsunamiTypesCount[0]++;
            } else if (code === "51") { // 津波警報
                color = "#ff1400"; width = 7; typeName = "津波警報"; tsunamiTypesCount[1]++;
            } else if (code === "50") { // 津波警報解除 -> 点線
                color = "#ff1400"; width = 5; isDashed = true; typeName = "津波警報解除";
            } else if (code === "62") { // 津波注意報
                color = "#faf500"; width = 7; typeName = "津波注意報"; tsunamiTypesCount[2]++;
            } else if (code === "60") { // 津波注意報解除 -> 点線
                color = "#faf500"; width = 5; isDashed = true; typeName = "津波注意報解除";
            } else if (code === "71" || code === "72" || code === "73") { // 津波予報
                color = "#00ccff"; width = 7; typeName = "津波予報"; tsunamiTypesCount[3]++;
            } else {
                return; // 描画対象外
            }

            // GeoJSONのフェッチ
            try {
                // kottaro123456.com のサーバーから取得 (CORS設定済みと仮定)
                // ローカルテストなどでCORSエラーが出る場合はプロキシが必要ですが、元のコードに準拠します
                const url = `https://kottaro123456.com/webapps/tsunami/source/geojson/${name}.geojson`;
                const res = await fetch(url);
                if (!res.ok) return;
                const geoJson = await res.json();

                // GeoJSONの各Featureにスタイル情報を埋め込む
                geoJson.features.forEach(feature => {
                    feature.properties = {
                        ...feature.properties,
                        color: color,
                        width: width,
                        isDashed: isDashed,
                        areaName: name,
                        typeName: typeName
                    };
                });
                combinedFeatures = combinedFeatures.concat(geoJson.features);

            } catch (e) {
                console.warn(`Tsunami GeoJSON load failed: ${name}`, e);
            }
        });

        // 全てのリクエスト完了を待つ
        await Promise.all(fetchPromises);

        // 4. マップへ一括反映
        if (map.getSource('tsunami_source')) {
            map.getSource('tsunami_source').setData({
                type: 'FeatureCollection',
                features: combinedFeatures
            });
        }

        // 5. UI情報の更新 (最も高いグレードを表示)
        const tsunamiTypesNames = ["大津波警報", "津波警報", "津波注意報", "津波予報"];
        const tsunamiMessages = [
            "＜大津波警報＞ただちに避難してください。\nただちに巨大な津波が襲い、木造家屋が全壊・流失し、人は津波による流れに巻き込まれます。\n沿岸部や川沿いにいる人は、ただちに高台や避難ビルなど安全な場所へ避難してください。",
            "＜津波警報＞ただちに避難してください。\n津波による被害が発生します。\n沿岸部や川沿いにいる人はただちに高台や避難ビルなど安全な場所へ避難してください。\n津波は繰り返し襲ってきます。警報が解除されるまで安全な場所から離れないでください。",
            "＜津波注意報＞ただちに避難してください。\n海の中や海岸付近は危険です。\n海の中にいる人はただちに海から上がって、海岸から離れてください。\n潮の流れが速い状態が続きますので、注意報が解除されるまで海に入ったり海岸に近づいたりしないようにしてください。",
            "＜津波予報（若干の海面変動）＞\n若干の海面変動が予想されますが、被害の心配はありません。\n警報が発表された沿岸部や川沿いにいる人はただちに高台や避難ビルなど安全な場所へ避難してください。"
        ];

        let highestLevel = -1;
        for (let i = 0; i < 4; i++) {
            if (tsunamiTypesCount[i] > 0) {
                highestLevel = i;
                break;
            }
        }

        if (highestLevel !== -1) {
            const alertName = tsunamiTypesNames[highestLevel];
            const alertMsg = tsunamiMessages[highestLevel];

            // 左上のテキスト更新
            const textSpan = document.getElementById('tsunami_text_span');
            textSpan.innerHTML = `<a href="../tsunami/" target="_blank"><span class="tsunami_text_${highestLevel + 1}" title="詳細">${alertName}</span></a>`;

            // ポップアップボックス更新
            if (infobox) {
                infobox.className = 'tsunami_infobox display'; // クラスリセットして表示
                infobox.classList.add(`tsunami_text_${highestLevel + 1}`);
                infobox.innerHTML = `
                    <span class="tsunami_infobox_close"><span class="material-symbols-outlined">close</span></span>
                    <span style="font-size: 1.6rem;">${alertName}が発表されています。</span><br><br>${alertMsg}
                `;
                // 閉じるボタンのイベント再設定
                MA_tsunami_infobox();
            }
        }

    } catch (e) {
        console.error("Tsunami info fetch error:", e);
    }
}


function interval() {
    autoreload_onoff_num_get();
    autoreload_onoff_num *= 1000;
    if (autoreload_onoff == "on") {
        if (autoreload_interval != null || autoreload_interval != 0) {
            clearInterval(autoreload_interval);
            autoreload_interval = null;
        }
        autoreload_interval = setInterval(() => {
            if (autoreload_onoff_num <= 3000) {
                GetQuake();
            } else {
                document.getElementById('reload').click();
            }
        }, autoreload_onoff_num);
    } else {
        clearInterval(autoreload_interval);
        autoreload_interval = null;
    }
}
if (autoreload_onoff == "on") {
    interval();
}
function autoreload_onoff_num_get() {
    if (localStorage.getItem('autoreload_onoff_num')) {
        autoreload_onoff_num = localStorage.getItem('autoreload_onoff_num');
    } else {
        autoreload_onoff_num = 10;
    }

}


// エリア名からコードへの変換 (JMAPoints.jsの配列を使用)
function AreaNameToCode(name) {
    // AreaName配列からインデックスを探し、AreaCode配列の対応する値を返す
    const index = AreaName.indexOf(name);
    return index !== -1 ? AreaCode[index] : null;
}

// エリア名からフリガナへの変換 (おまけ)
function AreaNameToKana(name) {
    const index = AreaName.indexOf(name);
    return index !== -1 ? AreaKana[index] : "";
}

function FillPolygon(area_Code, PointColor) {
    var array_Num = AreaCode.indexOf(area_Code);
    if (array_Num != -1) {
        var style;
        if (this_theme == "nerv") {
            style = {
                "color": "#ffffff",
                "weight": 1.2,
                "opacity": 1,
                "fillColor": PointColor,
                "fillOpacity": 1,
            }
        } else if (this_theme == "wni") {
            style = {
                "color": "#000000",
                "weight": 0.8,
                "opacity": 1,
                "fillColor": PointColor,
                "fillOpacity": 1,
            }
        } else if (this_theme == "quarog") {
            style = {
                "color": "#334948",
                "weight": 1.2,
                "opacity": 1,
                "fillColor": PointColor,
                "fillOpacity": 1,
            }
        }
        data_japan = japan_data["features"][array_Num];
        Filled_Layer = L.geoJSON(data_japan, {
            style: style,
            pane: "pane_map_filled",
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.popupContent) {
                    layer.bindPopup(feature.properties.popupContent);
                }
                layer.myTag = "Filled"
            },
        });
        shindo_filled_layer.addLayer(Filled_Layer);
        let latlon = centerPoint[area_Code];
        // map.addLayer(Filled_Layer);
        // var geodata = data_japan["geometry"]["coordinates"][0];
        // map.eachLayer(function (layer) {
        //     if (layer.myTag && layer.myTag === "Filled") {
        //         latlon = layer.getCenter();
        //     }
        // });
        // map.removeLayer(Filled_Layer);
        return latlon;
    }
}

// #shindo_ichiranのドラッグ (Moveable.js)
var shindo_ichiran_title = document.querySelector("#shindo_ichiran_title_parent");
const shindoIchiran = document.getElementById('shindo_ichiran');
const shindoIchiranDrag = document.getElementById('shindo_ichiran_drag');
const shindoIchiranScroll = document.getElementById('shindo_ichiran_scroll');
var isDraggingTitle = false;

shindoIchiran.style.pointerEvents = "auto";

const moveable_shindo_ichiran = new Moveable(document.body, {
    target: document.querySelector("#shindo_ichiran"),
    draggable: true,
});
shindo_ichiran_title.addEventListener("mousedown", () => {
    isDraggingTitle = true;
    shindo_ichiran_title.style.cursor = "grabbing";
});
document.addEventListener("mouseup", () => {
    isDraggingTitle = false;
    shindo_ichiran_title.style.cursor = "grab";
    shindoIchiranScroll.style.pointerEvents = "auto";
});
// ドラッグ中の処理
moveable_shindo_ichiran.on("drag", ({ target, transform }) => {
    shindoIchiranScroll.style.pointerEvents = "auto";
    if (isDraggingTitle == true) {
        target.style.transform = transform;
    }
});

// #shindo_ichiranのサイズ変更
let isDragging = false;
let startX = 0;
let startWidth = 0;

shindoIchiranDrag.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startWidth = shindoIchiran.offsetWidth;
    document.addEventListener('mousemove', drag_onMouseMove);
    document.addEventListener('mouseup', drag_onMouseUp);
    e.preventDefault();
    document.body.style.cursor = `ew-resize`;
});
function drag_onMouseMove(e) {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    var newWidth = startWidth - deltaX - 24;
    shindoIchiran.style.width = `${newWidth}px`;
}
function drag_onMouseUp() {
    if (isDragging) {
        isDragging = false;
        document.removeEventListener('mousemove', drag_onMouseMove);
        document.removeEventListener('mouseup', drag_onMouseUp);
    }
    document.body.style.cursor = `initial`;
}

function MA_tsunami_infobox() {
    const moveable_tsunami_infobox = new Moveable(document.body, {
        target: document.querySelector(".tsunami_infobox"),
        draggable: true,
    });
    moveable_tsunami_infobox.on("dragStart", ({ target, inputEvent, set }) => {
        target.style.cursor = "grabbing";

        const isCloseButton = inputEvent.target.closest(".tsunami_infobox_close");
        if (isCloseButton) {
            set(true);
            target.classList.remove("display");
            moveable_tsunami_infobox.destroy();
        }
    });
    moveable_tsunami_infobox.on("drag", ({ target, transform }) => {
        target.style.transform = transform;
    });
    moveable_tsunami_infobox.on("dragEnd", ({ target, isDrag }) => {
        target.style.cursor = "grab";
    });
}