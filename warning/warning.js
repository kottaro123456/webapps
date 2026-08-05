const mapLF = localforage.createInstance({
    driver   : localforage.INDEXEDDB,
    name     : 'webappData',
    storeName: 'map',
    version  : 1
});
const warningLF = localforage.createInstance({
    driver   : localforage.INDEXEDDB,
    name     : 'webappData',
    storeName: 'warning',
    version  : 1
});

var map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {},
        layers: [
            {
                id: 'background',
                type: 'background',
                paint: {
                    'background-color': '#b2d5ff'
                }
            }
        ]
    },
    center: [137.984, 37.575],
    zoom: 4.8,
    minZoom: 3,
    maxZoom: 18,
    customAttribution: "<a href='https://www.jma.go.jp/' target='_blank'>気象庁</a>"
});

map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

var mapData_cities;
var mapData_pref;

var JSONdata;
var filledList = {};
var filledMaxList = {};
var latestTime;
var latestClickPref;
var autoScroll_onoff = "off";
var autoReload_onoff = "off";
var autoReloadInterval;
var lightMode_onoff = "off";
var overview_onoff = "on";

var isAll_text = "";

// 種別絞り込み用セット (初期は全種別選択)
var selectedWarningCodes = new Set(Object.keys(warningName));

// マップロード完了後にデータ読み込みを開始
var mapReadyPromise = new Promise((resolve) => {
    map.on('load', () => {
        resolve();
    });
});

// メイン処理の呼び出し
(async () => {
    await mapReadyPromise;
    await Promise.all([
        warningPrefGet(),
        warningCitiesGet()
    ]);
    setupMapLayers();
    setupFilterModal();
    await getData();
})();

async function warningPrefGet() {
    await mapLF.getItem("warningPref").then(async function(value) {
        if (value !== null) {
            mapData_pref = value;
            console.log("Map Loading completed: 'warningPref', IndexedDB");
        } else {
            const response = await fetch("https://kottaro123456.github.io/geojsons/warningPref.geojson");
            const data = await response.json();
            mapData_pref = data;
            console.log("Map Loading completed: 'warningPref', Network");
            await mapLF.setItem("warningPref", mapData_pref);
            console.log("Map Saved successfully: 'warningPref', IndexedDB");
        }
    });
}

async function warningCitiesGet() {
    await mapLF.getItem("warningCities").then(async function(value) {
        if (value !== null) {
            mapData_cities = value;
            console.log("Map Loading completed: 'warningCities', IndexedDB");
        } else {
            const response = await fetch("https://kottaro123456.github.io/geojsons/warningCities.geojson");
            const data = await response.json();
            mapData_cities = data;
            console.log("Map Loading completed: 'warningCities', Network");
            await mapLF.setItem("warningCities", mapData_cities);
            console.log("Map Saved successfully: 'warningCities', IndexedDB");
        }
    });
}

function setupMapLayers() {
    // 市区町村 GeoJSON プロパティの初期設定 (code, level)
    if (mapData_cities && mapData_cities.features) {
        mapData_cities.features.forEach((feature, index) => {
            feature.properties.code = feature.properties.code || cityCode[index];
            feature.properties.level = 0;
        });
    }

    // 都道府県 GeoJSON プロパティの初期設定 (code, level)
    if (mapData_pref && mapData_pref.features) {
        mapData_pref.features.forEach((feature, index) => {
            feature.properties.code = feature.properties.code || prefCodeList[index];
            feature.properties.level = 0;
        });
    }

    // 市区町村 GeoJSON ソース
    map.addSource('cities-source', {
        type: 'geojson',
        data: mapData_cities
    });

    // 都道府県 GeoJSON ソース
    map.addSource('pref-source', {
        type: 'geojson',
        data: mapData_pref
    });

    // 0. 陸地ベースレイヤー (白色 #ffffff)
    map.addLayer({
        id: 'fill-land',
        type: 'fill',
        source: 'pref-source',
        paint: {
            'fill-color': '#ffffff',
            'fill-opacity': 1
        }
    });

    const levelColorExpression = [
        'match',
        ['get', 'level'],
        2, '#ffd000', // 注意報 (黄)
        3, '#dd0000', // 警報 (赤)
        4, '#aa00dd', // 危険警報 (紫)
        5, '#000000', // 特別警報 (黒)
        '#000000'
    ];

    const levelOpacityExpression = [
        'match',
        ['get', 'level'],
        2, 1,
        3, 1,
        4, 1,
        5, 1,
        0
    ];

    // 1. 市区町村塗りつぶしレイヤー
    map.addLayer({
        id: 'fill-cities',
        type: 'fill',
        source: 'cities-source',
        paint: {
            'fill-color': levelColorExpression,
            'fill-opacity': levelOpacityExpression
        }
    });

    // 2. 都道府県塗りつぶしレイヤー（軽量化モード時）
    map.addLayer({
        id: 'fill-pref',
        type: 'fill',
        source: 'pref-source',
        paint: {
            'fill-color': levelColorExpression,
            'fill-opacity': levelOpacityExpression
        },
        layout: {
            'visibility': 'none'
        }
    });

    // 3. 市区町村境界線レイヤー
    map.addLayer({
        id: 'line-cities',
        type: 'line',
        source: 'cities-source',
        paint: {
            'line-color': '#333533',
            'line-width': 0.5
        }
    });

    // 4. 都道府県境界線レイヤー
    map.addLayer({
        id: 'line-pref',
        type: 'line',
        source: 'pref-source',
        paint: {
            'line-color': '#333533',
            'line-width': 1.0
        }
    });

    // 5. 都道府県マウスイベント検出用透明ポリゴンレイヤー
    map.addLayer({
        id: 'fill-pref-hover',
        type: 'fill',
        source: 'pref-source',
        paint: {
            'fill-color': '#ffffff',
            'fill-opacity': 0
        }
    });

    // イベント登録
    map.on('mousemove', 'fill-pref-hover', (e) => {
        if (e.features && e.features.length > 0) {
            map.getCanvas().style.cursor = 'pointer';
            const props = e.features[0].properties;
            createOverview(props.code, props.name);
        }
    });

    map.on('mouseleave', 'fill-pref-hover', () => {
        map.getCanvas().style.cursor = '';
        deleteOverview();
    });

    map.on('click', 'fill-pref-hover', (e) => {
        if (e.features && e.features.length > 0) {
            const props = e.features[0].properties;
            createDetail(props.code, props.name);
        }
    });
}

function getData() {
    $.getJSON("https://www.jma.go.jp/bosai/warning/data/r8/map.json",function(data) {
        JSONdata = data;
        mapDraw();
        if ($('#text_yososhindo').hasClass("display") && $('#text_yososhindo').hasClass("ichiranAll")) {
            document.getElementById('ichiranAll').click();
        } else if ($('#text_yososhindo').hasClass("display") && latestClickPref != "" && latestClickPref != undefined) {
            createDetail(latestClickPref, prefNameList[prefCodeList.indexOf(latestClickPref)])
        }
    });
}

function mapDraw() {
    filledList = {}; 
    filledMaxList = {}; 

    // 地域・警報コードごとの最新日時とステータスを管理する一時オブジェクト
    // 構造: { "0748300": { "49": { status: "発表", time: Date, level: 4 } } }
    let areaStatusMap = {};
    latestTime = new Date(0); // 初期化

    for (let i = 0; i < JSONdata.length; i++) {
        let currentReportTime = new Date(JSONdata[i]["reportDatetime"]);

        if (currentReportTime > latestTime) {
            latestTime = currentReportTime;
        }

        if (!JSONdata[i]["warning"] || !JSONdata[i]["warning"]["class20Items"]) {
            continue;
        }

        JSONdata[i]["warning"]["class20Items"].forEach(element2 => {
            var currentAreaCode = element2["areaCode"];
            var array_Num = cityCode.indexOf(currentAreaCode);
            
            if (array_Num != -1) {
                element2["kinds"].forEach(element3 => {
                    let code = element3["code"];
                    let status = element3["status"];

                    // コードがない場合や選択されていない種別の場合は無視する
                    if (!code || !selectedWarningCodes.has(code)) return;

                    if (!areaStatusMap[currentAreaCode]) {
                        areaStatusMap[currentAreaCode] = {};
                    }

                    // この警報コードに対して、より新しい日時の情報があれば更新する
                    if (!areaStatusMap[currentAreaCode][code] || currentReportTime >= areaStatusMap[currentAreaCode][code].time) {
                        areaStatusMap[currentAreaCode][code] = {
                            status: status,
                            time: currentReportTime,
                            level: warningLevel[code] || 0
                        };
                    }
                });
            }
        });
    }

    // 集計した areaStatusMap から filledList / filledMaxList を構築
    Object.keys(areaStatusMap).forEach(areaCode => {
        Object.keys(areaStatusMap[areaCode]).forEach(code => {
            let item = areaStatusMap[areaCode][code];
            // 解除以外の有効なステータスのみ反映する
            if (item.status === "発表" || item.status === "継続" || item.status === "警報から注意報") {
                if (!filledList[areaCode]) {
                    filledList[areaCode] = {};
                }
                filledList[areaCode][code] = item.level;

                if (filledMaxList[areaCode] == undefined || filledMaxList[areaCode] < item.level) {
                    filledMaxList[areaCode] = item.level;
                }
            }
        });
    });

    let latestTime_month = ('0' + (latestTime.getMonth() + 1)).slice(-2);
    let latestTime_date = ('0' + latestTime.getDate()).slice(-2);
    let latestTime_hour = ('0' + latestTime.getHours()).slice(-2);
    let latestTime_minute = ('0' + latestTime.getMinutes()).slice(-2);
    document.getElementById('title_time').innerHTML = latestTime_month+'<span class="small">月</span>'+latestTime_date+'<span class="small">日</span> '+latestTime_hour+'<span class="small">時</span>'+latestTime_minute+'<span class="small">分</span>更新';

    if (lightMode_onoff == "on") { // 都道府県ごとで塗りつぶし
        var prefFilledMaxList = {};
        Object.keys(filledMaxList).forEach(FMLi => {
            const prefCode = cityToPref[FMLi];
            if (prefCode) {
                if (prefFilledMaxList[prefCode] == undefined || prefFilledMaxList[prefCode] < filledMaxList[FMLi]) {
                    prefFilledMaxList[prefCode] = filledMaxList[FMLi];
                }
            }
        });

        // 都道府県 GeoJSON の各 Feature に level プロパティを設定
        if (mapData_pref && mapData_pref.features) {
            mapData_pref.features.forEach((feature, index) => {
                const code = feature.properties.code || prefCodeList[index];
                feature.properties.code = code;
                feature.properties.level = prefFilledMaxList[code] || 0;
            });
            if (map.getSource('pref-source')) {
                map.getSource('pref-source').setData(mapData_pref);
            }
        }

        // レイヤーの表示・非表示の切り替え
        if (map.getLayer('fill-pref')) map.setLayoutProperty('fill-pref', 'visibility', 'visible');
        if (map.getLayer('fill-cities')) map.setLayoutProperty('fill-cities', 'visibility', 'none');
        if (map.getLayer('line-cities')) map.setLayoutProperty('line-cities', 'visibility', 'none');
    } else { // 市区町村ごとで塗りつぶし
        // 市区町村 GeoJSON の各 Feature に level プロパティを設定
        if (mapData_cities && mapData_cities.features) {
            mapData_cities.features.forEach((feature, index) => {
                const code = feature.properties.code || cityCode[index];
                feature.properties.code = code;
                feature.properties.level = filledMaxList[code] || 0;
            });
            if (map.getSource('cities-source')) {
                map.getSource('cities-source').setData(mapData_cities);
            }
        }

        // レイヤーの表示・非表示の切り替え
        if (map.getLayer('fill-pref')) map.setLayoutProperty('fill-pref', 'visibility', 'none');
        if (map.getLayer('fill-cities')) map.setLayoutProperty('fill-cities', 'visibility', 'visible');
        if (map.getLayer('line-cities')) map.setLayoutProperty('line-cities', 'visibility', 'visible');
    }
}

function createDetail(pref, prefName, isAll) {
    const scrollBtn = document.getElementById('btn_scroll_text_yososhindo');
    if (scrollBtn && scrollBtn.classList.contains('on')) {
        scrollBtn.click();
    }

    // 表の大見出し（都道府県名など）
    var filterBadge = isFilterActive() ? '<span class="filterBadge">種別絞り込み適用中</span>' : '';
    var text1 = '<tr><td class="cityName">'+prefName+'</td><td class="cityName">発表警報・注意報'+filterBadge+'</td></tr>';
    
    // 各カテゴリごとのHTMLを保持するオブジェクト
    var catHtml = {
        level5: "",
        level4: "",
        level3: "",
        level2: "",
        tokubetsu: "",
        keiho: "",
        chuiho: ""
    };

    prefToCity[pref].forEach(element => {
        if (filledList[element]) {
            var array_Num = cityCode.indexOf(element);
            var cityNameStr = '<ruby>'+cityName[array_Num]+'<rt>'+cityNameKana[array_Num]+'</rt></ruby>';
            var codes = Object.keys(filledList[element]);

            // この市区町村の、カテゴリごとのspanタグを一時保存
            var localSpans = { level5: "", level4: "", level3: "", level2: "", tokubetsu: "", keiho: "", chuiho: "" };

            codes.forEach(code => {
                var name = warningName[code];
                var shortName = warningShortName[code];
                var longName = warningName[code];
                var levelVal = filledList[element][code];
                
                var span_short = '<span class="color' + levelVal + '">' + shortName + '</span>';
                var span_long = '<span class="widthMushi color' + levelVal + '">' + longName + '</span>';

                // 名称に特定の文字列が含まれているかで仕分け
                if (name.includes("レベル５")) {
                    localSpans.level5 += span_long;
                } else if (name.includes("レベル４")) {
                    localSpans.level4 += span_long;
                } else if (name.includes("レベル３")) {
                    localSpans.level3 += span_long;
                } else if (name.includes("レベル２")) {
                    localSpans.level2 += span_long;
                } else if (name.includes("特別警報")) {
                    localSpans.tokubetsu += span_short;
                } else if (name.includes("警報")) {
                    localSpans.keiho += span_short;
                } else if (name.includes("注意報")) {
                    localSpans.chuiho += span_short;
                }
            });

            // 該当する情報があれば、各カテゴリのHTMLに追加
            if (localSpans.level5) catHtml.level5 += '<tr><td>'+cityNameStr+'</td><td>'+localSpans.level5+'</td></tr>';
            if (localSpans.level4) catHtml.level4 += '<tr><td>'+cityNameStr+'</td><td>'+localSpans.level4+'</td></tr>';
            if (localSpans.level3) catHtml.level3 += '<tr><td>'+cityNameStr+'</td><td>'+localSpans.level3+'</td></tr>';
            if (localSpans.level2) catHtml.level2 += '<tr><td>'+cityNameStr+'</td><td>'+localSpans.level2+'</td></tr>';
            if (localSpans.tokubetsu) catHtml.tokubetsu += '<tr><td>'+cityNameStr+'</td><td>'+localSpans.tokubetsu+'</td></tr>';
            if (localSpans.keiho) catHtml.keiho += '<tr><td>'+cityNameStr+'</td><td>'+localSpans.keiho+'</td></tr>';
            if (localSpans.chuiho) catHtml.chuiho += '<tr><td>'+cityNameStr+'</td><td>'+localSpans.chuiho+'</td></tr>';
        }
    });

    // 存在するカテゴリのみ見出し（colspan=2, 左揃え）を付けて結合
    var contentHtml = "";
    if (catHtml.level5) contentHtml += '<tr><td colspan="2" style="background-color: #000000; color: #ffffff; text-align: left; padding: 5px;">警戒レベル５相当</td></tr>' + catHtml.level5;
    if (catHtml.level4) contentHtml += '<tr><td colspan="2" style="background-color: #aa00dd; color: #ffffff; text-align: left; padding: 5px;">警戒レベル４相当</td></tr>' + catHtml.level4;
    if (catHtml.level3) contentHtml += '<tr><td colspan="2" style="background-color: #dd0000; color: #ffffff; text-align: left; padding: 5px;">警戒レベル３相当</td></tr>' + catHtml.level3;
    if (catHtml.level2) contentHtml += '<tr><td colspan="2" style="background-color: #ffd000; color: #000000; text-align: left; padding: 5px;">警戒レベル２相当</td></tr>' + catHtml.level2;
    if (catHtml.tokubetsu) contentHtml += '<tr><td colspan="2" style="background-color: #000000; color: #ffffff; text-align: left; padding: 5px;">特別警報</td></tr>' + catHtml.tokubetsu;
    if (catHtml.keiho) contentHtml += '<tr><td colspan="2" style="background-color: #dd0000; color: #ffffff; text-align: left; padding: 5px;">警報</td></tr>' + catHtml.keiho;
    if (catHtml.chuiho) contentHtml += '<tr><td colspan="2" style="background-color: #ffd000; color: #000000; text-align: left; padding: 5px;">注意報</td></tr>' + catHtml.chuiho;

    // 発表がない場合の処理
    if (contentHtml === "") {
        text1 += '<tr><td colspan="2" class="nowarning">現在発表されている警報・注意報はありません。</td></tr>';
    } else {
        text1 += contentHtml;
    }

    // 全国一覧表かどうかの分岐
    if (isAll != undefined) {
        latestClickPref = "";
        $('#text_yososhindo').addClass("ichiranAll");

        if (isAll == 0) { // 最初
            if (contentHtml !== "") {
                isAll_text += text1;
            }
        } else if (isAll == 63) { // 最後
            if (contentHtml !== "") {
                if (isAll_text != "") {
                    isAll_text += ('<tr><td colspan="2" style="height: 2rem;opacity: 0;"></td></tr>'+text1);
                } else {
                    isAll_text += (text1);
                }
            }
            document.getElementById('table_text_yososhindo').innerHTML = isAll_text;
            isAll_text = "";
        } else { // 途中
            if (contentHtml !== "") {
                if (isAll_text != "") {
                    isAll_text += ('<tr><td colspan="2" style="height: 2rem;opacity: 0;"></td></tr>'+text1);
                } else {
                    isAll_text += (text1);
                }
            }
        }
    } else {
        latestClickPref = pref;
        $('#text_yososhindo').removeClass("ichiranAll");
        document.getElementById('table_text_yososhindo').innerHTML = text1;
    }
    
    document.getElementById('text_yososhindo').classList.add("display");
    
    // スクロールの処理
    if (autoReload_onoff == "on" && autoScroll_onoff == "on" && document.getElementById('btn_scroll_text_yososhindo').innerText == "ｽｸﾛｰﾙ開始") {
        document.getElementById('table_text_yososhindo').scrollTop = 0;
        document.getElementById('btn_scroll_text_yososhindo').click();
    }
    if (latestClickPref != undefined && latestClickPref != "") {
        document.getElementById('table_text_yososhindo').scrollTop = 0;
    }
}

function isFilterActive() {
    const totalCount = Object.keys(warningName).filter(c => c !== "00").length;
    return selectedWarningCodes.size < totalCount;
}

function createOverview(pref, prefName) {
    if (overview_onoff == "on") {
        var level4 = [];
        var level3 = [];
        var level2 = [];
        var level1 = [];
        prefToCity[pref].forEach(element => {
            if (filledList[element]) {
                Object.keys(filledList[element]).forEach(element2 => {
                    if (warningLevel[element2] == 4) {
                        if (!level4.includes(element2)) {level4.push(element2);}
                    } else if (warningLevel[element2] == 3) {
                        if (!level3.includes(element2)) {level3.push(element2);}
                    } else if (warningLevel[element2] == 2) {
                        if (!level2.includes(element2)) {level2.push(element2);}
                    } else if (warningLevel[element2] == 1) {
                        if (!level1.includes(element2)) {level1.push(element2);}
                    }
                });
            }
        });
        var level4_text = "";
        var level3_text = "";
        var level2_text = "";
        var level1_text = "";
        level4.forEach(L => {level4_text += '<span class="color4">'+warningShortName[L]+'</span>';});
        level3.forEach(L => {level3_text += '<span class="color3">'+warningShortName[L]+'</span>';});
        level2.forEach(L => {level2_text += '<span class="color2">'+warningShortName[L]+'</span>';});
        level1.forEach(L => {level1_text += '<span class="color1">'+warningShortName[L]+'</span>';});
        if (level4_text === "" && level3_text === "" && level2_text === "" && level1_text === "") {
            level4_text = "発表されている警報・注意報はありません。";
        }
        var filterNotice = isFilterActive() ? '<div style="font-size: 0.75em; color: #ff9800; font-weight: var(--fontWeightBold); margin-bottom: 2px;">※種別絞り込み適用中</div>' : '';
        document.getElementById('overview').innerHTML = '<div style="line-height: 1.4em;font-size: 1.1em;margin-bottom: 4px;">'+prefName+filterNotice+'</div>'+level4_text+level3_text+level2_text+level1_text;
        document.getElementById('overview').classList.add("display");
    }
}

function deleteOverview(pref, e) {
    document.getElementById('overview').classList.remove("display");
}

document.getElementById('map').addEventListener("mousemove", (e)=>{overviewMove(e);});
document.getElementById('overview').addEventListener("mousemove", (e)=>{overviewMove(e);});

function overviewMove(e) {
    if (document.getElementById('overview').classList.contains("display") == true) {
        document.getElementById('overview').style.top = (e.clientY + 10) + "px";
        document.getElementById('overview').style.left = (e.clientX + 10) + "px";
    }
}

var koushin;
var koushin_ok;
//ボタン押下時のイベント設定とローカルストレージの設定
document.getElementById('reload').addEventListener("click",()=>{
    clearTimeout(koushin);
    clearTimeout(koushin_ok);
    getData();
    document.getElementById('reload').innerText = "更新中…";
    koushin = setTimeout(() => {
        document.getElementById('reload').innerText = "更新完了";
        koushin_ok = setTimeout(() => {
            document.getElementById('reload').innerText = "情報更新";
        }, 1000);
    }, 1000);
});

document.getElementById('autoReload').addEventListener("click",()=>{
    if (autoReload_onoff == "on") {
        document.getElementById('autoReload').classList.remove('on');
        document.getElementById('text_yososhindo_autoreload_onoff').innerText = "AR:×";
    } else {
        document.getElementById('autoReload').classList.add('on');
        document.getElementById('text_yososhindo_autoreload_onoff').innerText = "AR:⭘";
    }
    interval();
});

function interval() {
    var autoReload_onoff_num = 5 * 60 * 1000;
    if (autoReload_onoff == "off") {
        if (autoReloadInterval != null || autoReloadInterval != 0) {
            clearInterval(autoReloadInterval);
            autoReloadInterval = null;
        }
        console.warn("5分間隔で情報の自動更新を行います。\n異常時に自動更新を強制停止させる場合は「clearInterval(autoReloadInterval);」または「interval();」をこのコンソールにコピーし実行してください。");
        autoReloadInterval = setInterval(() => {
            getData();
        }, autoReload_onoff_num);
        autoReload_onoff = "on";
    } else {
        clearInterval(autoReloadInterval);
        autoReloadInterval = null;
        autoReload_onoff = "off";
        console.info("情報の自動更新を解除しました。");
    }
}

document.getElementById('ichiranAll').addEventListener("click",()=>{
    for (let i = 0; i < prefCodeList.length; i++) {
        var code = prefCodeList[i];
        var name = prefNameList[i];
        createDetail(code, name, i);
    }
});

const overviewBtn = document.getElementById('overviewBtn');
overviewBtn.addEventListener('click', () => {
    if (overview_onoff == 'on') {
        overviewBtn.classList.remove('on');
        overview_onoff = 'off';
    } else {
        overviewBtn.classList.add('on');
        overview_onoff = 'on';
    }
});

$('#lightMode').click(event => {
    if (lightMode_onoff == "off") {
        lightMode_onoff = "on";
        $('#lightMode').addClass('on');
        mapDraw(true);
    } else {
        lightMode_onoff = "off";
        $('#lightMode').removeClass('on');
        mapDraw();
    }
});

function setupFilterModal() {
    const filterBtn = document.getElementById('filter');
    const filterModal = document.getElementById('filterModal');
    const closeBtn = document.getElementById('closeFilterModal');
    const container = document.getElementById('filterListContainer');
    
    if (!filterBtn || !filterModal || !container) return;

    container.innerHTML = '';
    const codes = Object.keys(warningName).filter(c => c !== "00");

    // レベル順 (レベル5 -> レベル4 -> レベル3 -> レベル2) にセクション分類して生成
    const sections = [
        { level: 5, title: '特別警報（警戒レベル５相当）', className: 'level5' },
        { level: 4, title: '警戒レベル４相当（危険警報等）', className: 'level4' },
        { level: 3, title: '警報（警戒レベル３相当）', className: 'level3' },
        { level: 2, title: '注意報（警戒レベル２相当）', className: 'level2' }
    ];

    const categoryCheckers = {
        rain: (name) => name.includes("大雨"),
        landslide: (name) => name.includes("土砂"),
        flood: (name) => name.includes("洪水"),
        storm: (name) => name.includes("暴風") || name.includes("強風"),
        snow: (name) => name.includes("雪"),
        wave: (name) => name.includes("波浪") || name.includes("高潮")
    };

    const sectionCheckboxes = [];

    sections.forEach(sec => {
        let groupCodes = codes.filter(c => (warningLevel[c] || 2) === sec.level);
        if (groupCodes.length === 0) return;

        // レベル～とついている項目が区分の先頭に来るようにソート
        groupCodes.sort((a, b) => {
            const nameA = warningName[a] || "";
            const nameB = warningName[b] || "";
            const hasLevelA = nameA.includes("レベル");
            const hasLevelB = nameB.includes("レベル");
            if (hasLevelA && !hasLevelB) return -1;
            if (!hasLevelA && hasLevelB) return 1;
            return a.localeCompare(b);
        });

        const secElem = document.createElement('div');
        secElem.className = 'filterSection';

        // セクションヘッダー (全選択/解除チェックボックス付き)
        const header = document.createElement('div');
        header.className = `filterSectionHeader ${sec.className}`;
        
        const titleSpan = document.createElement('span');
        titleSpan.innerText = sec.title;
        header.appendChild(titleSpan);

        const secCheckLabel = document.createElement('label');
        secCheckLabel.className = 'sectionHeaderCheck';
        const secCheckbox = document.createElement('input');
        secCheckbox.type = 'checkbox';
        
        secCheckLabel.appendChild(secCheckbox);
        secCheckLabel.appendChild(document.createTextNode(' 全選択'));
        header.appendChild(secCheckLabel);

        secElem.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'filterSectionGrid';

        const itemCheckboxes = [];

        groupCodes.forEach(code => {
            const name = warningName[code];
            const item = document.createElement('label');
            item.className = 'filterItem';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = code;
            checkbox.checked = selectedWarningCodes.has(code);
            
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    selectedWarningCodes.add(code);
                } else {
                    selectedWarningCodes.delete(code);
                }
                updateSectionCheckbox();
                updateFilterActiveState();
                mapDraw();
            });

            itemCheckboxes.push(checkbox);
            item.appendChild(checkbox);
            item.appendChild(document.createTextNode(name));
            grid.appendChild(item);
        });

        function updateSectionCheckbox() {
            const allChecked = groupCodes.every(c => selectedWarningCodes.has(c));
            secCheckbox.checked = allChecked;
        }

        secCheckbox.addEventListener('change', () => {
            const isChecked = secCheckbox.checked;
            groupCodes.forEach(c => {
                if (isChecked) {
                    selectedWarningCodes.add(c);
                } else {
                    selectedWarningCodes.delete(c);
                }
            });
            itemCheckboxes.forEach(cb => cb.checked = isChecked);
            updateFilterActiveState();
            mapDraw();
        });

        sectionCheckboxes.push(updateSectionCheckbox);
        updateSectionCheckbox();

        secElem.appendChild(grid);
        container.appendChild(secElem);
    });

    // モーダル開閉
    filterBtn.addEventListener('click', () => {
        filterModal.classList.add('display');
    });

    closeBtn.addEventListener('click', () => {
        filterModal.classList.remove('display');
    });

    document.getElementById('btnFilterApply').addEventListener('click', () => {
        filterModal.classList.remove('display');
    });

    // プリセット・ショートカットボタン
    document.getElementById('btnFilterSelectAll').addEventListener('click', () => {
        codes.forEach(c => selectedWarningCodes.add(c));
        syncCheckboxes();
    });

    document.getElementById('btnFilterClearAll').addEventListener('click', () => {
        selectedWarningCodes.clear();
        syncCheckboxes();
    });

    document.getElementById('btnFilterLevel3Up').addEventListener('click', () => {
        selectedWarningCodes.clear();
        codes.forEach(c => {
            const lvl = warningLevel[c];
            if (lvl >= 3) selectedWarningCodes.add(c);
        });
        syncCheckboxes();
    });

    // 独立カテゴリボタンのイベント登録 (大雨, 土砂, 洪水, 暴風, 雪, 波浪)
    Object.keys(categoryCheckers).forEach(catKey => {
        const btnId = 'btnShortcut' + catKey.charAt(0).toUpperCase() + catKey.slice(1);
        const btn = document.getElementById(btnId);
        if (!btn) return;

        const checker = categoryCheckers[catKey];
        const targetCodes = codes.filter(c => checker(warningName[c]));

        btn.addEventListener('click', () => {
            const allTargetChecked = targetCodes.length > 0 && targetCodes.every(c => selectedWarningCodes.has(c));
            if (allTargetChecked) {
                targetCodes.forEach(c => selectedWarningCodes.delete(c));
            } else {
                targetCodes.forEach(c => selectedWarningCodes.add(c));
            }
            syncCheckboxes();
        });
    });

    document.getElementById('btnFilterReset').addEventListener('click', () => {
        codes.forEach(c => selectedWarningCodes.add(c));
        syncCheckboxes();
    });

    function syncCheckboxes() {
        container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (cb.value) {
                cb.checked = selectedWarningCodes.has(cb.value);
            }
        });
        sectionCheckboxes.forEach(fn => fn());
        updateFilterActiveState();
        mapDraw();
    }

    function updateFilterActiveState() {
        const totalCount = codes.length;
        if (selectedWarningCodes.size < totalCount) {
            filterBtn.classList.add('active');
            filterBtn.innerText = "種別絞り込み (適用中)";
        } else {
            filterBtn.classList.remove('active');
            filterBtn.innerText = "種別絞り込み";
        }

        // 各独立カテゴリボタンのアクティブ（色ON/OFF）状態を動的に同期
        Object.keys(categoryCheckers).forEach(catKey => {
            const btnId = 'btnShortcut' + catKey.charAt(0).toUpperCase() + catKey.slice(1);
            const btn = document.getElementById(btnId);
            if (!btn) return;

            const checker = categoryCheckers[catKey];
            const targetCodes = codes.filter(c => checker(warningName[c]));
            const isAllActive = targetCodes.length > 0 && targetCodes.every(c => selectedWarningCodes.has(c));

            if (isAllActive) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // 初回ボタン状態の同期
    updateFilterActiveState();
}

document.getElementById('close_text_yososhindo').addEventListener("click",()=>{
    document.getElementById('text_yososhindo').classList.remove("display");
    const scrollBtn = document.getElementById('btn_scroll_text_yososhindo');
    if (scrollBtn && scrollBtn.classList.contains('on')) {
        scrollBtn.click();
    }
    latestClickPref = "";
});

document.addEventListener('DOMContentLoaded', () => {
    let animationFrameId = null;
    let scrollY = 0;
    let autoScrollState = 'off';
    let isWaiting = false; // 一時停止中かどうかを管理するフラグ

    const scrollBtn = document.getElementById('btn_scroll_text_yososhindo');
    const scrollInput = document.getElementById('scroll_num');
    const table = document.querySelector('#text_yososhindo table');

    if (!scrollBtn || !table) {
        console.error("要素が見つかりません。IDやセレクタを確認してください。", { scrollBtn, table });
        return;
    }

    const stopScroll = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        scrollBtn.classList.remove('on');
        autoScrollState = 'off';
        isWaiting = false;
    };

    const startScroll = () => {
        let speed = parseFloat(scrollInput ? scrollInput.value : 1);
        if (isNaN(speed) || speed < 0.1) {
            speed = 1;
            if (scrollInput) scrollInput.value = 1;
            console.warn("スクロール速度が不正な値に設定されたため、1に初期化しました。");
        }

        scrollBtn.classList.add('on');
        autoScrollState = 'on';

        scrollY = table.scrollTop;

        const step = () => {
            // 一時停止中の場合はフレームを更新するだけで位置を進めない
            if (isWaiting) {
                animationFrameId = requestAnimationFrame(step);
                return;
            }

            scrollY += speed;
            const maxScroll = table.scrollHeight - table.clientHeight;

            // ① 最下部に達した時の処理
            if (scrollY >= maxScroll) {
                // 最下部ピッタリに合わせてスクロール固定
                scrollY = maxScroll;
                table.scrollTop = scrollY;
                
                isWaiting = true; // スクロール一時停止

                // 1.5秒後に先頭へ戻し、さらに1.5秒待機
                setTimeout(() => {
                    // 自動スクロールが途中でオフにされていたら処理しない
                    if (autoScrollState !== 'on') return;

                    // ② 先頭（位置0）に戻す
                    scrollY = 0;
                    table.scrollTop = 0;

                    // さらに1.5秒待ってからスクロールを再開
                    setTimeout(() => {
                        if (autoScrollState !== 'on') return;
                        isWaiting = false; // 待機解除（スクロール再開）
                    }, 1500);

                }, 1500);

                animationFrameId = requestAnimationFrame(step);
                return;
            }

            // 通常スクロール時
            table.scrollTop = scrollY;
            animationFrameId = requestAnimationFrame(step);
        };

        animationFrameId = requestAnimationFrame(step);
    };

    scrollBtn.addEventListener('click', () => {
        const isRunning = scrollBtn.classList.contains('on');
        if (isRunning) {
            stopScroll();
        } else {
            startScroll();
        }
    });
});