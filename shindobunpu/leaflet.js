//JQuakeの配色。使ってないかも
var Color_1 = "#46646e";var MojiColor_1 = "#ffffff";var Color_2 = "#1e6ee6";var MojiColor_2 = "#ffffff";var Color_3 = "#00c8c8";var MojiColor_3 = "#000000";var Color_4 = "#ffff64";var MojiColor_4 = "#000000";var Color_50 = "#ffb400";var MojiColor_50 = "#000000";var Color_55 = "#ff7800";var MojiColor_55 = "#000000";var Color_60 = "#e60000";var MojiColor_60 = "#ffffff";var Color_65 = "#a00000";var MojiColor_65 = "#ffffff";var Color_7 = "#960096";var MojiColor_7 = "#ffffff";var Color_0 = "#008b8b";var MojiColor_0 = "#ffffff";
//Leafletの定義
var map = L.map('map', {
    center: [36.575, 137.984],
    zoom: 6,
    minZoom: 2,
    scrollWheelZoom: false,
    smoothWheelZoom: true,
    smoothSensitivity: 1.5,
    preferCanvas:false,
});
L.control.scale({ maxWidth: 150, position: 'bottomright', imperial: false }).addTo(map);  // スケールを表示
map.zoomControl.setPosition('topright');

const mapLF = localforage.createInstance({
    driver   : localforage.INDEXEDDB,
    name     : 'webappData',
    storeName: 'map',
    version  : 1
});
const shindobunpuLF = localforage.createInstance({
    driver   : localforage.INDEXEDDB,
    name     : 'webappData',
    storeName: 'shindobunpu',
    version  : 1
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
//地図に表示させる上下の順番
map.createPane("pane_map1").style.zIndex = 1; //地図（背景）
map.createPane("pane_map2").style.zIndex = 2; //地図（市町村）
map.createPane("pane_map3").style.zIndex = 3; //地図（細分）
map.createPane("pane_map_filled").style.zIndex = 5; //塗りつぶし
map.createPane("tsunami_map").style.zIndex = 7; //津波
map.createPane("shindo10").style.zIndex = 10;
map.createPane("shindo20").style.zIndex = 20;
map.createPane("shindo30").style.zIndex = 30;
map.createPane("shindo40").style.zIndex = 40;
map.createPane("shindo45").style.zIndex = 45;
map.createPane("shindo46").style.zIndex = 46;
map.createPane("shindo50").style.zIndex = 50;
map.createPane("shindo55").style.zIndex = 55;
map.createPane("shindo60").style.zIndex = 60;
map.createPane("shindo70").style.zIndex = 70;
map.createPane("shingen").style.zIndex = 100; //震源
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

map.on('zoomend', function(e) {
    citiesDraw();
});
function citiesDraw() {
    if (cities && Cookies.get("drawMode") == "saibun") {
        map.removeLayer(cities);
    } else if (cities && Cookies.get("saibun") == "true") {
        if (map.getZoom() < 7) {
            map.removeLayer(cities);
        } else {
            cities.addTo(map);
        }
    } else if (cities) {
        map.removeLayer(cities);
    }
}

//変数の定義(グローバルでやらないほうがいいらしい。でもやる。)
var QuakeJson;
var TsunamiJson;
var JMAPointsJson;
var JMAPoints;
var maxint;
var shingen_icon;
var shindo_layer = L.layerGroup();
var shindo_filled_layer = L.layerGroup();
var tsunami_layer = L.layerGroup();
var Filled;
var test_on = "test_off";
var shingen_lnglat;
var fly_shingen_lnglat;
var fly_shingen_lnglat_2;
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
document.getElementById('reload').addEventListener("click",()=>{
    if (test_on == "test_on") {
        document.getElementById('test').click();
    }
    if (document.getElementById('reload_num').value != "") {
        if (document.getElementById('reload_num').value > 100) {
            reloadData(100);
        } else {
            let num_kari = Math.abs(document.getElementById('reload_num').value);
            reloadData(num_kari);
        }
    } else {
        reloadData();
    }
    document.getElementById('reload').innerText = "更新中…";
});
document.getElementById('test').addEventListener("click",()=>{
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
document.getElementById('map_ichi').addEventListener("click",()=>{
    if (fly_shingen_lnglat != undefined && fly_shingen_lnglat != 0) {
        if (document.getElementById('shindo_ichiran_check').checked) {
            if (fly_shingen_lnglat_2 != undefined && fly_shingen_lnglat_2 != 0) {
                map.flyTo(fly_shingen_lnglat_2, 8, { duration: 0.5 });
            }
        } else {
            map.flyTo(fly_shingen_lnglat, 8, { duration: 0.5 });
        }
    } else {
        clearTimeout(shokikashippai);
        document.getElementById('map_ichi').innerText = "初期化失敗";
        shokikashippai = setTimeout(() => {
            document.getElementById('map_ichi').innerText = "位置初期化";
        }, 1000);
    }
});
document.getElementById('shindo_ichiran_check').addEventListener("change",()=>{
    if (document.getElementById('shindo_ichiran_check').checked) {
        document.getElementById('shindo_ichiran').classList.add('display');
        if (map.getZoom() == 8 && fly_shingen_lnglat_2 != undefined && fly_shingen_lnglat_2 != null && fly_shingen_lnglat_2 != 0) {
            map.flyTo(fly_shingen_lnglat_2, 8, { duration: 0.5 });
        }
    } else {
        document.getElementById('shindo_ichiran').classList.add('display_none');
        setTimeout(() => {
            document.getElementById('shindo_ichiran').classList.remove('display_none');
            document.getElementById('shindo_ichiran').classList.remove('display');
        }, 450);
        if (map.getZoom() == 8 && fly_shingen_lnglat != undefined && fly_shingen_lnglat != null && fly_shingen_lnglat != 0) {
            map.flyTo(fly_shingen_lnglat, 8, { duration: 0.5 });
        }
    }
});
document.getElementById('display_onoff_point_check').addEventListener("change",()=>{
    if (document.getElementById('display_onoff_point_check').checked) {
        if (shindo_layer != undefined && shindo_layer != 0) {
            map.addLayer(shindo_layer);
            point_onoff = 1;
        } else {
            console.error('エラー： \"shindo_layer\" が見つからないため、観測点をマップに追加できません。');
            point_onoff = 0;
        }
    } else {
        if (shindo_layer != undefined && shindo_layer != 0) {
            map.removeLayer(shindo_layer);
            point_onoff = 0;
        } else {
            console.error('エラー： \"shindo_layer\" が見つからないため、観測点をマップから削除できません。');
            point_onoff = 1;
        }
    }
});
document.getElementById('display_onoff_fill_check').addEventListener("change",()=>{
    if (document.getElementById('display_onoff_fill_check').checked) {
        if (shindo_filled_layer != undefined && shindo_filled_layer != 0) {
            map.addLayer(shindo_filled_layer);
            fill_onoff = 1;
        } else {
            console.error('エラー： \"shindo_filled_layer\" が見つからないため、塗りつぶしをマップに追加できません。');
            fill_onoff = 0;
        }
    } else {
        if (shindo_filled_layer != undefined && shindo_filled_layer != 0) {
            map.removeLayer(shindo_filled_layer);
            fill_onoff = 0;
        } else {
            console.error('エラー： \"shindo_filled_layer\" が見つからないため、塗りつぶしをマップから削除できません。');
            fill_onoff = 1;
        }
    }
});
document.getElementById('display_onoff_saibun_check').addEventListener("change", async ()=>{
    if (document.getElementById('display_onoff_saibun_check').checked) {
        Cookies.set("saibun", true);
        await citiesMapGet();
    } else {
        Cookies.set("saibun", false);
    }
    citiesDraw();
});
document.getElementById('display_onoff_tsunami_check').addEventListener("change",()=>{
    if (document.getElementById('display_onoff_tsunami_check').checked) {
        if (tsunami_layer != undefined && tsunami_layer != 0) {
            map.addLayer(tsunami_layer);
        } else {
            console.error('エラー： \"tsunami_layer\" が見つからないため、津波をマップに追加できません。');
        }
    } else {
        if (tsunami_layer != undefined && tsunami_layer != 0) {
            map.removeLayer(tsunami_layer);
        } else {
            console.error('エラー： \"tsunami_layer\" が見つからないため、津波をマップから削除できません。');
        }
    }
});
document.getElementById('shindoiconbig_check').addEventListener("change",()=>{
    QuakeSelect(document.getElementById('quakelist').selectedIndex, true);
});


//地図テーマ変更時
function theme_change(theme_name) {
    this_theme = theme_name;
    if (japan && asia && countries && cities && japan_back) {
        map.removeLayer(japan);
        map.removeLayer(japan_back);
        map.removeLayer(asia);
        map.removeLayer(countries);
        map.removeLayer(cities);
        eval('japan = L.geoJson(japan_data, {pane: "pane_map3",style: PolygonLayer_Style_'+theme_name+'_1,}).addTo(map);');
        eval('japan_back = L.geoJson(japan_data, {pane: "pane_map1",style: PolygonLayer_Style_'+theme_name+'_4,}).addTo(map);');
        eval('asia = L.geoJson(asia_data, {pane: "pane_map3",style: PolygonLayer_Style_'+theme_name+'_2,}).addTo(map);');
        eval('countries = L.geoJson(countries_data, {pane: "pane_map3",style: PolygonLayer_Style_'+theme_name+'_2,}).addTo(map);');
        if (map.getZoom() >= 7) {
            eval('cities = L.geoJson(cities_data, {pane: "pane_map2",style: PolygonLayer_Style_'+theme_name+'_3,}).addTo(map);');
        } else {
            eval('cities = L.geoJson(cities_data, {pane: "pane_map2",style: PolygonLayer_Style_'+theme_name+'_3,});');
        }
        document.getElementById('map').classList.remove('background_nerv');
        document.getElementById('map').classList.remove('background_wni');
        document.getElementById('map').classList.remove('background_quarog');
        eval("document.getElementById('map').classList.add('background_"+theme_name+"');");
        QuakeSelect(document.getElementById('quakelist').selectedIndex, true);
    }
}
//震度配色の変更時
function icon_theme_change(theme_name) {
    icon_theme = theme_name;
    QuakeSelect(document.getElementById('quakelist').selectedIndex, true);
}

//読込時のフォント読み込みポップアップ
async function fontLoadingPopup() {
    var infoDiv = document.createElement('div');
    infoDiv.classList.add("topRightInfo");
    var fontsettingchecked = "";

    var fontLoadResult = await fontSettingsLF.getItem(`loadFont`);
    if (fontLoadResult == true || fontLoadResult == "true") {
        fontsettingchecked = "checked";
    }
    
    infoDiv.innerHTML = `<span class="material-symbols-rounded">text_fields</span> フォント読み込み <label for="set_font2_switch" class="acc_content_switch_label"><input type="checkbox" class="acc_content_switch" id="set_font2_switch" ${fontsettingchecked}><div class="acc_content_switch_back" id="set_font2_switch_back"></div><div class="acc_content_switch_front" id="set_font2_switch_front"></div></label>`;
    document.body.appendChild(infoDiv);

    document.getElementById('set_font2_switch').addEventListener("click", async()=>{
        if (document.getElementById('set_font2_switch').checked) {
            await fontSettingsLF.setItem(`loadFont`, true);
        } else {
            await fontSettingsLF.setItem(`loadFont`, false);
        }
        loadFont();
    });

    setTimeout(() => {
        infoDiv.classList.add("display");
        setTimeout(() => {
            infoDiv.classList.remove("display");
            setTimeout(() => {
                document.body.removeChild(infoDiv);
            }, 500);
        }, 8000);
    }, 50);
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
(async () => {
    await Promise.all([
        GetJson(),
        saibunGet(),
        GetQuake()
    ]);
    Cookies.set("listSelectedIndex", 0);
    await QuakeSelect(0);
    await new Promise(resolve => setTimeout(resolve, 500));
    await Promise.all([
        asiaMapGet(),
        countriesMapGet()
    ]);
    await fontLoadingPopup();
})();

//地図データ読み込み
async function saibunGet() {
    await mapLF.getItem("saibun").then(async function(value) {
        if (value !== null) {
            // キーが存在し、値が取得できた場合
            // ストレージからデータを取得し新しく取得しない
            japan_data = value;
            console.log("Map Loading completed: 'saibun', IndexedDB");
        } else {
            // キーが存在しない場合
            // 新しくデータを取得
            const response = await fetch("https://kottaro123456.github.io/geojsons/saibun.geojson");
            const data = await response.json();
            japan_data = data;
            console.log("Map Loading completed: 'saibun', Network");
            await mapLF.setItem("saibun", japan_data);
            console.log("Map Saved successfully: 'saibun', IndexedDB");
        }
        japan = L.geoJson(japan_data, {
            pane: "pane_map3",
            style: PolygonLayer_Style_nerv_1,
        }).addTo(map);
        japan_back = L.geoJson(japan_data, {
            pane: "pane_map1",
            style: PolygonLayer_Style_nerv_4,
        }).addTo(map);
    });
}

async function asiaMapGet() {
    await mapLF.getItem("asia").then(async function(value) {
        if (value !== null) {
            // キーが存在し、値が取得できた場合
            // ストレージからデータを取得し新しく取得しない
            asia_data = value;
            console.log("Map Loading completed: 'asia', IndexedDB");
        } else {
            // キーが存在しない場合
            // 新しくデータを取得
            const response = await fetch("https://kottaro123456.github.io/geojsons/asia.geojson");
            const data = await response.json();
            asia_data = data;
            console.log("Map Loading completed: 'asia', Network");
            await mapLF.setItem("asia", asia_data);
            console.log("Map Saved successfully: 'asia', IndexedDB");
        }
        asia = L.geoJson(asia_data, {
            pane: "pane_map3",
            style: PolygonLayer_Style_nerv_2,
        }).addTo(map);
    });
}
async function countriesMapGet() {
    await mapLF.getItem("countries").then(async function(value) {
        if (value !== null) {
            // キーが存在し、値が取得できた場合
            // ストレージからデータを取得し新しく取得しない
            countries_data = value;
            console.log("Map Loading completed: 'countries', IndexedDB");
        } else {
            // キーが存在しない場合
            // 新しくデータを取得
            const response = await fetch("https://kottaro123456.github.io/geojsons/countries.geojson");
            const data = await response.json();
            countries_data = data;
            console.log("Map Loading completed: 'countries', Network");
            await mapLF.setItem("countries", countries_data);
            console.log("Map Saved successfully: 'countries', IndexedDB");
        }
        countries = L.geoJson(countries_data, {
            pane: "pane_map3",
            style: PolygonLayer_Style_nerv_2,
        }).addTo(map);
    });
}
async function citiesMapGet() {
    if (cities_data !== null) {
        return;
    }
    await mapLF.getItem("cities").then(async function(value) {
        if (value !== null) {
            // キーが存在し、値が取得できた場合
            // ストレージからデータを取得し新しく取得しない
            cities_data = value;
            console.log("Map Loading completed: 'cities', IndexedDB");
        } else {
            // キーが存在しない場合
            // 新しくデータを取得
            // 市区町村データをダウンロードするか確認
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
        cities = L.geoJson(cities_data, {
            pane: "pane_map2",
            style: PolygonLayer_Style_nerv_2,
        });
    });
}

//観測点の位置データなどのデータを取得
async function GetJson() {
    const latestJSON_fetch = await fetch("source/latest.json", {cache: "no-cache"});
    const latestJSON = await latestJSON_fetch.json();
    let isNewDataGet = true;
    await shindobunpuLF.getItem("latestJSON").then(async function(value) {
        if (value !== null) {
            const latestJSON_LF = value;
            
            if (latestJSON["JMAstations"] == latestJSON_LF["JMAstations"]) {
                await shindobunpuLF.getItem("JMAstations").then(async function(value) {
                    if (value !== null) {
                        // キーが存在し、値が取得できた場合
                        // ストレージからデータを取得し新しく取得しない
                        JMAPointsJson = value;
                        console.log("JSON Loading completed: 'JMAstations', IndexedDB");
                        await shindobunpuLF.getItem("JMAPoints").then(async function(value) {
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
            const response = await fetch("source/JMAstations.json", {cache: "no-store"});
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

//地震情報をP2PQuakeより取得
//引数"option"は情報取得のボタンの件数か熊本県地震のテストデータを取得する文章
async function GetQuake(option) {
    if (option == "test_on") {
        // var url = "https://api.p2pquake.net/v2/jma/quake?quake_type=DetailScale&min_scale=70&limit=5";
        var url = "https://api.p2pquake.net/v2/jma/quake?limit=100&quake_type=ScalePrompt&min_scale=60";
    } else if (!isNaN(option)) {
        var url = "https://api.p2pquake.net/v2/history?codes=551&limit="+option;
    } else {
        var url = "https://api.p2pquake.net/v2/history?codes=551&limit=20";
        // var url = "formatter.json";
    }
    const response = await fetch(url)
    const data = await response.json()
    .then(data => {
        QuakeJson = [];
        QuakeJson = data;
        //現在の時刻を分解して○月○日形式にする
        gettime = new Date();
        var getmonth = ('0' + (gettime.getMonth() + 1)).slice(-2);
        var getday = ('0' + gettime.getDate()).slice(-2);
        var gethour = ('0' + gettime.getHours()).slice(-2);
        var getminute = ('0' + gettime.getMinutes()).slice(-2);
        var getsecond = ('0' + gettime.getSeconds()).slice(-2);
        document.getElementById('title_time').innerHTML = getmonth+'<span class="small">月</span>'+getday+'<span class="small">日</span> '+gethour+'<span class="small">時</span>'+getminute+'<span class="small">分</span>'+getsecond+'<span class="small">秒</span>現在';
        var int = 0;
        //地震情報リストの中身をすべて削除する
        while (list.lastChild) {
            list.removeChild(list.lastChild);
        }
        //地震情報を地震情報リストに表示するための処理
        //forEachは配列に入っているデータをすべて繰り返す。変数elementに一個ずつの配列が入る
        QuakeJson.forEach(element => {
            //震度の判定
            if (element['earthquake']['maxScale'] == 10){
                maxint = "1";
            } else if (element['earthquake']['maxScale'] == 20) {
                maxint = "2";
            } else if (element['earthquake']['maxScale'] == 30) {
                maxint = "3";
            } else if (element['earthquake']['maxScale'] == 40) {
                maxint = "4";
            } else if (element['earthquake']['maxScale'] == 45 || element['earthquake']['maxScale'] == 46) {
                maxint = "5弱";
            } else if (element['earthquake']['maxScale'] == 50) {
                maxint = "5強";
            } else if (element['earthquake']['maxScale'] == 55) {
                maxint = "6弱";
            } else if (element['earthquake']['maxScale'] == 60) {
                maxint = "6強";
            } else if (element['earthquake']['maxScale'] == 70) {
                maxint = "7";
            } else {
                maxint = "不明"
            }
            
            var option = document.createElement("option");
            var Kibo = Number(QuakeJson[int]["earthquake"]["hypocenter"]["magnitude"]).toFixed(1);
            if (Kibo == -1) {
                Kibo = "不明";
            }
            var text;
            if (QuakeJson[int]["issue"]["type"] != "ScalePrompt" && QuakeJson[int]["issue"]["type"] != "Foreign" && QuakeJson[int]["issue"]["type"] != "Destination" && QuakeJson[int]["issue"]["type"] != "ScaleAndDestination") {
                text = QuakeJson[int]["earthquake"]["time"].slice(0, -3) + " " + QuakeJson[int]["earthquake"]["hypocenter"]["name"] + " " +  "\n" + "\n最大震度 : " + maxint + " ";
            } else if (QuakeJson[int]["issue"]["type"] == "Destination" || QuakeJson[int]["issue"]["type"] == "ScaleAndDestination") {
                text = "【震源情報】" + QuakeJson[int]["earthquake"]["time"].slice(0, -3) + " " + QuakeJson[int]["earthquake"]["hypocenter"]["name"];
            } else if (QuakeJson[int]["issue"]["type"] == "Foreign") {
                text = "【遠地地震】" + QuakeJson[int]["earthquake"]["time"].slice(0, -3) + " " + QuakeJson[int]["earthquake"]["hypocenter"]["name"];
            } else {
                if (QuakeJson[int]["points"][0]) {
                    text = "【震度速報】" + QuakeJson[int]["points"][0]["addr"] + "など " + "\n" + QuakeJson[int]["earthquake"]["time"].slice(0, -3) + "\n最大震度 : " + maxint + " ";
                } else {
                    text = "【震度速報】" + "震源地不明 " + "\n" + QuakeJson[int]["earthquake"]["time"].slice(0, -3) + "\n最大震度 : " + maxint + " ";
                }
            }
            option.value = "" + int + "";
            option.textContent = text;
            list.appendChild(option);
            int++;
        });
    })
}

//地震情報の描画の処理
//引数"num"には地震情報リストの上からの順番が入る(はじめは0)
//引数"isFlyOff"には、ズームをしない場合「true」が入る。ズームする場合は「」何もなし。
async function QuakeSelect(num, isFlyOff) {
    if (QuakeJson[num] == undefined) {
        num = 1;
        Cookies.set("listSelectedIndex", 1);
    }

    num = Number(num);

    list.options[Cookies.get("listSelectedIndex")].selected = true;

    //今まであった震度をすべて消す
    if (shingen_icon && shindo_layer && shindo_filled_layer) {
        map.removeLayer(shindo_layer);
        shindo_layer = L.layerGroup();
        map.removeLayer(shingen_icon);
        shindo_icon = "";
        map.removeLayer(shindo_filled_layer);
        shindo_filled_layer = L.layerGroup();
    }
    //今まであった塗りつぶしをすべて消す
    map.eachLayer(function (layer) {
        if (layer.myTag && layer.myTag === "Filled") {
            map.removeLayer(layer)
        }
    });

    filled_list = {};
        //震源アイコンの定義
        let shingenIcon = L.icon({
            iconUrl: 'source/shingen.svg',
            iconSize: [40,40],
            iconAnchor: [20, 20],
            popupAnchor: [0,-40]
        });
        //震源の座標
        shingen_lnglat = new L.LatLng(QuakeJson[num]["earthquake"]["hypocenter"]["latitude"], QuakeJson[num]["earthquake"]["hypocenter"]["longitude"]);
        //震源のマーカー
        shingen_icon = L.marker(shingen_lnglat, { icon: shingenIcon, pane: "shingen" }).addTo(map);
        let maxint_image;
        var maxint_text;

        var CTPS = num;
        if (QuakeJson[num]["issue"]["type"] == "Destination") { //震源情報
            if (QuakeJson[num+1]) {
                if (QuakeJson[num+1]["issue"]["type"] == "ScalePrompt" && QuakeJson[num+1]["earthquake"]["time"] == QuakeJson[num]["earthquake"]["time"]) {
                    CTPS = num + 1;
                    // 選択項目が震源情報である、かつ、選択＋１項目が震度速報である場合、震度情報には震度情報の情報を用いる
                }
            }
        }
        //震度アイコンの画像を判定
        if (QuakeJson[CTPS]['earthquake']['maxScale'] == 10){
            maxint = "1";
            maxint_text = "1";
        } else if (QuakeJson[CTPS]['earthquake']['maxScale'] == 20) {
            maxint = "2";
            maxint_text = "2";
        } else if (QuakeJson[CTPS]['earthquake']['maxScale'] == 30) {
            maxint = "3";
            maxint_text = "3";
        } else if (QuakeJson[CTPS]['earthquake']['maxScale'] == 40) {
            maxint = "4";
            maxint_text = "4";
        } else if (QuakeJson[CTPS]['earthquake']['maxScale'] == 45 || QuakeJson[CTPS]['earthquake']['maxScale'] == 46) {
            maxint = "50";
            maxint_text = "5弱";
        } else if (QuakeJson[CTPS]['earthquake']['maxScale'] == 50) {
            maxint = "55";
            maxint_text = "5強";
        } else if (QuakeJson[CTPS]['earthquake']['maxScale'] == 55) {
            maxint = "60";
            maxint_text = "6弱";
        } else if (QuakeJson[CTPS]['earthquake']['maxScale'] == 60) {
            maxint = "65";
            maxint_text = "6強";
        } else if (QuakeJson[CTPS]['earthquake']['maxScale'] == 70) {
            maxint = "7";
            maxint_text = "7";
        } else {
            maxint = "_";
            maxint_text = "不明";
        }
        maxint_image = '<img src="source/svg/'+icon_theme+'_int'+maxint+'.svg" alt="震度'+maxint_text+'" title="震度'+maxint_text+'">';
        if (QuakeJson[CTPS]['earthquake']['maxScale'] == -1) {
            maxint_image = '<img src="source/svg/'+icon_theme+'_int_.svg" alt="震度'+maxint_text+'" title="震度'+maxint_text+'">';
        }
        //マグニチュードや深さなどの判定
        var Magnitude;
        if (QuakeJson[num]['earthquake']['hypocenter']['magnitude'] != -1) {
            Magnitude = Number(QuakeJson[num]['earthquake']['hypocenter']['magnitude']).toFixed(1);
        } else {
            Magnitude = 'ー.ー';
        }
        var Name;
        if (QuakeJson[num]['earthquake']['hypocenter']['name'] != "") {
            Name = QuakeJson[num]['earthquake']['hypocenter']['name'];
        } else {
            Name = '情報なし';
        }
        var depth;
        if (QuakeJson[num]['earthquake']['hypocenter']['depth'] == -1) {
            depth = '不明';
        } else if (QuakeJson[num]['earthquake']['hypocenter']['depth'] == 0) {
            depth = 'ごく浅い';
        } else {
            depth = "約"+QuakeJson[num]['earthquake']['hypocenter']['depth']+"km";
        }
        var tsunami_text;
        if (QuakeJson[num]['earthquake']['domesticTsunami'] == 'None') {
            tsunami_text = '<span id="tsunami_text_span">なし</span>';
        } else if (QuakeJson[num]['earthquake']['domesticTsunami'] == 'Unknown') {
            tsunami_text = '<span id="tsunami_text_span">不明</span>';
        } else if (QuakeJson[num]['earthquake']['domesticTsunami'] == 'Checking') {
            tsunami_text = '<span id="tsunami_text_span">調査中</span>';
        } else if (QuakeJson[num]['earthquake']['domesticTsunami'] == 'NonEffective') {
            tsunami_text = '<span id="tsunami_text_span"><a href="../tsunami/" target="_blank"><span class="tsunami_text_4" title="詳しくは津波情報図をご覧ください。">若干の海面変動</span></a></span>';
        } else if (QuakeJson[num]['earthquake']['domesticTsunami'] == 'Watch') {
            tsunami_text = '<span id="tsunami_text_span"><a href="../tsunami/" target="_blank"><span class="tsunami_text_3" title="詳しくは津波情報図をご覧ください。">津波注意報</span></a></span>';
        } else if (QuakeJson[num]['earthquake']['domesticTsunami'] == 'Warning') {
            tsunami_text = '<span id="tsunami_text_span"><a href="../tsunami/" target="_blank"><span class="tsunami_text_warning" title="詳しくは津波情報図をご覧ください。">情報あり</span></a></span>';
        } else {
            tsunami_text = '<span id="tsunami_text_span">情報なし</span>';
        }
        //すべてを結合して震源アイコンを地図に表示
        shingen_icon.bindPopup('発生時刻：'+(QuakeJson[num]['earthquake']['time'])+'<br>最大震度：'+maxint_text+'<br>震源地：'+Name+'<span style=\"font-size: 85%;\"> ('+QuakeJson[num]["earthquake"]["hypocenter"]["latitude"]+", "+QuakeJson[num]["earthquake"]["hypocenter"]["longitude"]+')</span><br>規模：M'+Magnitude+'　深さ：'+depth+'<br>受信：'+QuakeJson[num]['issue']['time']+', '+QuakeJson[num]['issue']['source'],{closeButton: false, zIndexOffset: 10000});
        //震源アイコンにマウスが乗ったときにポップアップを表示
        //thisは震源アイコンのこと
        shingen_icon.on('mouseover', function (e) {
            this.openPopup();
        });
        shingen_icon.on('mouseout', function (e) {
            this.closePopup();
        });
        //左上の情報ボックスに表示する内容
        var datekari = QuakeJson[num]['earthquake']['time'];
        let info_1danme = '<div class="maxint">最大震度'+maxint_image+'</div>';
        let info_2danme = datekari.substring(5,7)+'月'+datekari.substring(8,10)+'日 '+datekari.substring(11,13)+'時'+datekari.substring(14,16)+'分ごろ' +'<br>';
        let info_3danme = '　震源地　：'+Name +'<br>';
        let info_4danme = '地震の規模：M'+Magnitude +'<br>';
        let info_5danme = '震源の深さ：'+depth +'<br>';
        let info_6danme = '津波の心配：'+tsunami_text;
        document.getElementById('info').innerHTML = info_1danme + info_2danme + info_3danme + info_4danme + info_5danme + info_6danme;
        
        //震度一覧の情報の全消去
        //ここはもう少しコンパクトに行けたかも
        document.getElementById('shindo1').classList.remove('display');
        document.getElementById('shindo2').classList.remove('display');
        document.getElementById('shindo3').classList.remove('display');
        document.getElementById('shindo4').classList.remove('display');
        document.getElementById('shindo50').classList.remove('display');
        document.getElementById('shindo55').classList.remove('display');
        document.getElementById('shindo60').classList.remove('display');
        document.getElementById('shindo65').classList.remove('display');
        document.getElementById('shindo7').classList.remove('display');
        document.getElementById('shindo_').classList.remove('display');
        document.getElementById('shindoN').classList.remove('display');
        document.getElementById('shindo1_article').innerHTML = "";
        document.getElementById('shindo2_article').innerHTML = "";
        document.getElementById('shindo3_article').innerHTML = "";
        document.getElementById('shindo4_article').innerHTML = "";
        document.getElementById('shindo50_article').innerHTML = "";
        document.getElementById('shindo55_article').innerHTML = "";
        document.getElementById('shindo60_article').innerHTML = "";
        document.getElementById('shindo65_article').innerHTML = "";
        document.getElementById('shindo7_article').innerHTML = "";
        document.getElementById('shindo__article').innerHTML = "";
        document.getElementById('shindoN_article').innerHTML = "";

        //震度一覧の数が何個あったか
        var maxint1_num = 0;
        var maxint2_num = 0;
        var maxint3_num = 0;
        var maxint4_num = 0;
        var maxint50_num = 0;
        var maxint55_num = 0;
        var maxint60_num = 0;
        var maxint65_num = 0;
        var maxint7_num = 0;
        var maxint__num = 0;
        var maxintN_num = 0;
        
        if (QuakeJson[num]["issue"]["type"] != "ScalePrompt" && QuakeJson[num]["issue"]["type"] != "Destination") { //各地の震度に関する情報
            document.getElementById('title_text').innerText = "震度分布図 - 観測点モード";
            Cookies.set("drawMode", "point");
            //通常時の位置初期化の位置
            fly_shingen_lnglat = new L.LatLng(Number(QuakeJson[num]["earthquake"]["hypocenter"]["latitude"]), Number(QuakeJson[num]["earthquake"]["hypocenter"]["longitude"]) - 0.5);
            //震度一覧を開いているときの位置初期化の位置
            fly_shingen_lnglat_2 = new L.LatLng(Number(QuakeJson[num]["earthquake"]["hypocenter"]["latitude"]), Number(QuakeJson[num]["earthquake"]["hypocenter"]["longitude"]) + 0.5);
            bbox_sokuhou = null;
            //観測点の震度についてすべての観測点に対して繰り返す
            QuakeJson[num]["points"].forEach(element => {
                var result = JMAPoints.indexOf(element["addr"]);
                if (result != -1) {
                    var ImgUrl = "";
                    var PointShindo = "";
                    var PointColor;
                    var shindo_ichiran_doko;
                    if (element["scale"] == 10) {
                        eval('PointColor = '+icon_theme+'_backColor_1');
                        ImgUrl = "source/svg/"+icon_theme+"_int1.svg";
                        PointShindo = "震度1";
                        shindo_ichiran_doko = "document.getElementById('shindo1_article')";
                        maxint1_num++;
                    } else if (element["scale"] == 20) {
                        eval('PointColor = '+icon_theme+'_backColor_2');
                        ImgUrl = "source/svg/"+icon_theme+"_int2.svg";
                        PointShindo = "震度2";
                        shindo_ichiran_doko = "document.getElementById('shindo2_article')";
                        maxint2_num++;
                    } else if (element["scale"] == 30) {
                        eval('PointColor = '+icon_theme+'_backColor_3');
                        ImgUrl = "source/svg/"+icon_theme+"_int3.svg";
                        PointShindo = "震度3";
                        shindo_ichiran_doko = "document.getElementById('shindo3_article')";
                        maxint3_num++;
                    } else if (element["scale"] == 40) {
                        eval('PointColor = '+icon_theme+'_backColor_4');
                        ImgUrl = "source/svg/"+icon_theme+"_int4.svg";
                        PointShindo = "震度4";
                        shindo_ichiran_doko = "document.getElementById('shindo4_article')";
                        maxint4_num++;
                    } else if (element["scale"] == 45) {
                        eval('PointColor = '+icon_theme+'_backColor_50');
                        ImgUrl = "source/svg/"+icon_theme+"_int50.svg";
                        PointShindo = "震度5弱";
                        shindo_ichiran_doko = "document.getElementById('shindo50_article')";
                        maxint50_num++;
                    } else if (element["scale"] == 46) {
                        eval('PointColor = '+icon_theme+'_backColor_50');
                        ImgUrl = "source/svg/"+icon_theme+"_int_.svg";
                        PointShindo = "震度5弱以上と推定";
                        shindo_ichiran_doko = "document.getElementById('shindo__article')";
                        maxint__num++;
                    } else if (element["scale"] == 50) {
                        eval('PointColor = '+icon_theme+'_backColor_55');
                        ImgUrl = "source/svg/"+icon_theme+"_int55.svg";
                        PointShindo = "震度5強";
                        shindo_ichiran_doko = "document.getElementById('shindo55_article')";
                        maxint55_num++;
                    } else if (element["scale"] == 55) {
                        eval('PointColor = '+icon_theme+'_backColor_60');
                        ImgUrl = "source/svg/"+icon_theme+"_int60.svg";
                        PointShindo = "震度6弱";
                        shindo_ichiran_doko = "document.getElementById('shindo60_article')";
                        maxint60_num++;
                    } else if (element["scale"] == 60) {
                        eval('PointColor = '+icon_theme+'_backColor_65');
                        ImgUrl = "source/svg/"+icon_theme+"_int65.svg";
                        PointShindo = "震度6強";
                        shindo_ichiran_doko = "document.getElementById('shindo65_article')";
                        maxint65_num++;
                    } else if (element["scale"] == 70) {
                        eval('PointColor = '+icon_theme+'_backColor_7');
                        ImgUrl = "source/svg/"+icon_theme+"_int7.svg";
                        PointShindo = "震度7";
                        shindo_ichiran_doko = "document.getElementById('shindo7_article')";
                        maxint7_num++;
                    } else {
                        eval('PointColor = '+icon_theme+'_backColor__');
                        ImgUrl = "source/svg/"+icon_theme+"_int_.svg";
                        PointShindo = "震度不明";
                        shindo_ichiran_doko = "document.getElementById('shindo__article')";
                        maxint__num++;
                    }

                    eval(shindo_ichiran_doko+'.innerHTML += "<ruby>'+element["addr"] + '<rt>' + JMAPointsJson[result]["furigana"] + '</rt></ruby>　"');

                    if (element["isArea"] == false) { //観測点
                        let shindo_latlng = new L.LatLng(JMAPointsJson[result]["lat"], JMAPointsJson[result]["lon"]);
                        let shindoIcon = L.icon({
                            iconUrl: ImgUrl,
                            iconSize: [20, 20],
                            popupAnchor: [0, -40]
                        });
                        let shindoIcon_big = L.icon({
                            iconUrl: ImgUrl,
                            iconSize: [34, 34],
                            popupAnchor: [0, -40]
                        });
                        var shindo_icon;
                        if (document.getElementById('shindoiconbig_check').checked) {
                            shindo_icon = L.marker(shindo_latlng, { icon: shindoIcon_big,pane: eval('\"shindo'+element["scale"]+'\"') });
                        } else {
                            shindo_icon = L.marker(shindo_latlng, { icon: shindoIcon,pane: eval('\"shindo'+element["scale"]+'\"') });
                        }
                        shindo_icon.bindPopup('<ruby>'+element["addr"] + '<rt style="font-size: 0.7em;">' + JMAPointsJson[result]["furigana"] + '</rt></ruby>　'+ PointShindo,{closeButton: false, zIndexOffset: 10000,autoPan: false,});
                        shindo_icon.on('mouseover', function (e) {
                            this.openPopup();
                        });
                        shindo_icon.on('mouseout', function (e) {
                            this.closePopup();
                        });
                        shindo_layer.addLayer(shindo_icon);
                        // console.log(element["addr"] + " " + PointShindo + " OK");
                        
                        //塗りつぶしの設定をする
                        //AreaNameToCode()は下を参照。大阪府北部を520等に変換
                        //filled_listは連想配列で{520: 10, 120: 20}など、エリアコード: 震度の大きさ
                        var areaCode = AreaNameToCode(JMAPointsJson[result]["area"]["name"]);
                        //filled_listにエリアコードがなかったり、さらに大きな震度になっていたら更新
                        if ((!filled_list[areaCode]) || filled_list[areaCode] < element["scale"]) {
                            filled_list[areaCode] = element["scale"];
                        }
                    }
                } else {
                    var shindo_ichiran_doko;
                    shindo_ichiran_doko = "document.getElementById('shindoN_article')";
                    maxintN_num++;
                    eval(shindo_ichiran_doko+'.innerHTML += "<ruby>'+element["addr"] + '<rt>フリガナフメイ</rt></ruby>　"');
                }
            });
            //for(... in ...)もforEachと同等。keyに連想配列の名前が入る
            for (key in filled_list){ 
                var PointColor;
                if (filled_list[key] == 10) {
                    eval('PointColor = '+icon_theme+'_backColor_1');
                } else if (filled_list[key] == 20) {
                    eval('PointColor = '+icon_theme+'_backColor_2');
                } else if (filled_list[key] == 30) {
                    eval('PointColor = '+icon_theme+'_backColor_3');
                } else if (filled_list[key] == 40) {
                    eval('PointColor = '+icon_theme+'_backColor_4');
                } else if (filled_list[key] == 45) {
                    eval('PointColor = '+icon_theme+'_backColor_50');
                } else if (filled_list[key] == 46) {
                    eval('PointColor = '+icon_theme+'_backColor_50');
                } else if (filled_list[key] == 50) {
                    eval('PointColor = '+icon_theme+'_backColor_55');
                } else if (filled_list[key] == 55) {
                    eval('PointColor = '+icon_theme+'_backColor_60');
                } else if (filled_list[key] == 60) {
                    eval('PointColor = '+icon_theme+'_backColor_65');
                } else if (filled_list[key] == 70) {
                    eval('PointColor = '+icon_theme+'_backColor_7');
                }
                //引数"key"はエリアコード、"PointColor"は塗りつぶし色のHEX値
                FillPolygon(key, PointColor);
            }
        } else { //震度速報 or 震源情報
            num = Number(num);
            
            var selectNum = num;
            document.getElementById('title_text').innerText = "震度速報 - 細分区域モード";
            Cookies.set("drawMode", "saibun");

            if (QuakeJson[num]["issue"]["type"] == "Destination") { //震源情報
                //通常時の位置初期化の位置
                fly_shingen_lnglat = new L.LatLng(Number(QuakeJson[num]["earthquake"]["hypocenter"]["latitude"]), Number(QuakeJson[num]["earthquake"]["hypocenter"]["longitude"]) - 0.5);
                //震度一覧を開いているときの位置初期化の位置
                fly_shingen_lnglat_2 = new L.LatLng(Number(QuakeJson[num]["earthquake"]["hypocenter"]["latitude"]), Number(QuakeJson[num]["earthquake"]["hypocenter"]["longitude"]) + 0.5);
                
                if (QuakeJson[num+1]) {
                if (QuakeJson[num+1]["issue"]["type"] == "ScalePrompt" && QuakeJson[num+1]["earthquake"]["time"] == QuakeJson[num]["earthquake"]["time"]) {
                    selectNum = num + 1;
                    if (isFlyOff != true) {
                        var infoDiv = document.createElement('div');
                        infoDiv.classList.add("topRightInfo");
                        infoDiv.innerHTML = `<span class="material-symbols-rounded">data_info_alert</span>  直前の震度速報を描画しています。`;
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
                    if (isFlyOff != true) {
                        var errorDiv = document.createElement('div');
                        errorDiv.classList.add("topRightError");
                        errorDiv.innerHTML = `<span class="material-symbols-rounded">emergency_home</span>  対象の震度速報を取得できませんでした。`;
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
            }

            var latlon;
            var latList = [];
            var lonList = [];
            QuakeJson[selectNum]["points"].forEach(element => {
                var ImgUrl = "";
                var PointShindo = "";
                var PointColor;
                var shindo_ichiran_doko;
                if (element["scale"] == 10) {
                    eval('PointColor = '+icon_theme+'_backColor_1');
                    ImgUrl = "source/svg/"+icon_theme+"_int1.svg";
                    PointShindo = "震度1";
                    shindo_ichiran_doko = "document.getElementById('shindo1_article')";
                    maxint1_num++;
                } else if (element["scale"] == 20) {
                    eval('PointColor = '+icon_theme+'_backColor_2');
                    ImgUrl = "source/svg/"+icon_theme+"_int2.svg";
                    PointShindo = "震度2";
                    shindo_ichiran_doko = "document.getElementById('shindo2_article')";
                    maxint2_num++;
                } else if (element["scale"] == 30) {
                    eval('PointColor = '+icon_theme+'_backColor_3');
                    ImgUrl = "source/svg/"+icon_theme+"_int3.svg";
                    PointShindo = "震度3";
                    shindo_ichiran_doko = "document.getElementById('shindo3_article')";
                    maxint3_num++;
                } else if (element["scale"] == 40) {
                    eval('PointColor = '+icon_theme+'_backColor_4');
                    ImgUrl = "source/svg/"+icon_theme+"_int4.svg";
                    PointShindo = "震度4";
                    shindo_ichiran_doko = "document.getElementById('shindo4_article')";
                    maxint4_num++;
                } else if (element["scale"] == 45) {
                    eval('PointColor = '+icon_theme+'_backColor_50');
                    ImgUrl = "source/svg/"+icon_theme+"_int50.svg";
                    PointShindo = "震度5弱";
                    shindo_ichiran_doko = "document.getElementById('shindo50_article')";
                    maxint50_num++;
                } else if (element["scale"] == 46) {
                    eval('PointColor = '+icon_theme+'_backColor_50');
                    ImgUrl = "source/svg/"+icon_theme+"_int_.svg";
                    PointShindo = "震度5弱以上と推定";
                    shindo_ichiran_doko = "document.getElementById('shindo__article')";
                    maxint__num++;
                } else if (element["scale"] == 50) {
                    eval('PointColor = '+icon_theme+'_backColor_55');
                    ImgUrl = "source/svg/"+icon_theme+"_int55.svg";
                    PointShindo = "震度5強";
                    shindo_ichiran_doko = "document.getElementById('shindo55_article')";
                    maxint55_num++;
                } else if (element["scale"] == 55) {
                    eval('PointColor = '+icon_theme+'_backColor_60');
                    ImgUrl = "source/svg/"+icon_theme+"_int60.svg";
                    PointShindo = "震度6弱";
                    shindo_ichiran_doko = "document.getElementById('shindo60_article')";
                    maxint60_num++;
                } else if (element["scale"] == 60) {
                    eval('PointColor = '+icon_theme+'_backColor_65');
                    ImgUrl = "source/svg/"+icon_theme+"_int65.svg";
                    PointShindo = "震度6強";
                    shindo_ichiran_doko = "document.getElementById('shindo65_article')";
                    maxint65_num++;
                } else if (element["scale"] == 70) {
                    eval('PointColor = '+icon_theme+'_backColor_7');
                    ImgUrl = "source/svg/"+icon_theme+"_int7.svg";
                    PointShindo = "震度7";
                    shindo_ichiran_doko = "document.getElementById('shindo7_article')";
                    maxint7_num++;
                } else {
                    eval('PointColor = '+icon_theme+'_backColor__');
                    ImgUrl = "source/svg/"+icon_theme+"_int_.svg";
                    PointShindo = "震度不明";
                    shindo_ichiran_doko = "document.getElementById('shindo__article')";
                    maxint__num++;
                }
                eval(shindo_ichiran_doko+'.innerHTML += \'<ruby>'+element["addr"] + '<rt style="font-size: 0.7em;">' + AreaNameToKana(element["addr"]) + '</rt></ruby>　\'');
                var area_Code = AreaNameToCode(element["addr"]);
                latlon = FillPolygon(area_Code, PointColor);
                latList.push(Number(latlon["lat"]));
                lonList.push(Number(latlon["lng"]));
                let shindoIcon = L.icon({
                    iconUrl: ImgUrl,
                    iconSize: [30, 30],
                    popupAnchor: [0, -50]
                });
                var shindo_icon = L.marker(latlon, { icon: shindoIcon,pane: eval('\"shindo'+element["scale"]+'\"') });
                shindo_icon.bindPopup('<ruby>'+element["addr"] + '<rt style="font-size: 0.7em;">' + AreaNameToKana(element["addr"]) + '</rt></ruby>　'+ PointShindo,{closeButton: false, zIndexOffset: 10000,autoPan: false,});
                shindo_icon.on('mouseover', function (e) {
                    this.openPopup();
                });
                shindo_icon.on('mouseout', function (e) {
                    this.closePopup();
                });
                shindo_layer.addLayer(shindo_icon);
                // console.log(element["addr"] + " " + PointShindo + " OK");
            });

            if (QuakeJson[num]["issue"]["type"] == "ScalePrompt") {
                const aryMax = function (a, b) {return Math.max(a, b);}
                const aryMin = function (a, b) {return Math.min(a, b);}
                var latMax = latList.reduce(aryMax);
                var latMin = latList.reduce(aryMin);
                var lonMax = lonList.reduce(aryMax);
                var lonMin = lonList.reduce(aryMin);
                //通常時の位置初期化の位置
                fly_shingen_lnglat = new L.LatLng(Number((latMax+latMin)/2), Number((lonMax+lonMin)/2) - 0.5);
                //震度一覧を開いているときの位置初期化の位置
                fly_shingen_lnglat_2 = new L.LatLng(Number((latMax+latMin)/2), Number((lonMax+lonMin)/2) + 0.5);
                bbox_sokuhou = null;
            }
            latList = [];
            lonList = [];
        }
        let shindo_ichiran_kakutitle = document.getElementsByClassName('shindo_ichiran_kakutitle');
        let shindo_ichiran_kakutitle_1 = '震度<img src="source/svg/'+icon_theme+'_int';
        let shindo_ichiran_kakutitle_2;
        if (Cookies.get("drawMode") == "point") {
            shindo_ichiran_kakutitle_2 = '<span class="kasho_small">ヶ所</span>';
        } else {
            shindo_ichiran_kakutitle_2 = '<span class="kasho_small">区域</span>';
        }

        // 処理対象となる震度のデータ（接尾辞と対応する変数の値）を配列として定義
        const shindoIchiranRoopSuffices1Data = [
            { suffix: '7', num: maxint7_num },
            { suffix: '65', num: maxint65_num },
            { suffix: '60', num: maxint60_num },
            { suffix: '55', num: maxint55_num },
            { suffix: '50', num: maxint50_num },
            { suffix: '4', num: maxint4_num },
            { suffix: '3', num: maxint3_num },
            { suffix: '2', num: maxint2_num },
            { suffix: '1', num: maxint1_num },
            { suffix: '_', num: maxint__num }
        ];
        // 配列をループし、shindo_ichiran_kakutitleの対応する要素に値を設定
        shindoIchiranRoopSuffices1Data.forEach((data, index) => {
            if (shindo_ichiran_kakutitle[index]) {
                shindo_ichiran_kakutitle[index].innerHTML = 
                    shindo_ichiran_kakutitle_1 + data.suffix + '.svg">　' + data.num + shindo_ichiran_kakutitle_2;
            }
        });

        shindo_ichiran_kakutitle[10].innerHTML = '観測点情報なし<img src="source/svg/'+icon_theme+'_intN.svg">　'+maxintN_num+shindo_ichiran_kakutitle_2;
        let maxint_sum = maxint__num+maxint1_num+maxint2_num+maxint3_num+maxint4_num+maxint50_num+maxint55_num+maxint60_num+maxint65_num+maxint7_num+maxintN_num;
        if (Cookies.get("drawMode") == "point") {
            document.getElementById('shindoichiran_title_num').innerHTML = '全 '+maxint_sum+'<span class="small">ヶ所</span>';
        } else {
            document.getElementById('shindoichiran_title_num').innerHTML = '全 '+maxint_sum+'<span class="small">区域</span>';
        }

        // 20251125追記：保守性向上のため
        const shindoSuffixes = ['1', '2', '3', '4', '50', '55', '60', '65', '7', '_', 'N'];
        shindoSuffixes.forEach(suffix => {
            const articleId = `shindo${suffix}_article`;
            const targetId = `shindo${suffix}`;
            const articleElement = document.getElementById(articleId);

            if (articleElement && articleElement.innerHTML === "") {
                document.getElementById(targetId).classList.add('display');
            }
        });
        // 20251125追記おわり
        
        if (point_onoff == 1) {
            map.addLayer(shindo_layer);
        }
        if (fill_onoff == 1) {
            map.addLayer(shindo_filled_layer);
        }

        if (isFlyOff == true) {
        } else {
            if (QuakeJson[document.getElementById('quakelist').selectedIndex]["issue"]["type"] == "Foreign") { // 遠地地震
                map.flyTo(fly_shingen_lnglat, 2, { duration: 0.5 });
            } else {
                if (document.getElementById('shindo_ichiran_check').checked) {
                    if (fly_shingen_lnglat_2 != undefined && fly_shingen_lnglat_2 != 0) {
                        map.flyTo(fly_shingen_lnglat_2, 8, { duration: 0.5 })
                    }
                } else {
                    //map.flyTo(fly_shingen_lnglat, 7.5, { duration: 0.5 });
                    map.flyTo(fly_shingen_lnglat, 8, { duration: 0.5 });
                }
            }
        }
        tsunamiDraw();
        Cookies.set('visited','already');
    
}

function tsunamiDraw() {
    var mapAdd = false;
    var mapAdd_num = 0;
    map.removeLayer(tsunami_layer);
    var selectNum = document.getElementById('quakelist').selectedIndex;
    var tsunami_forecast_howmany;
    if (document.getElementById('display_onoff_tsunami_check').checked && QuakeJson[selectNum]['earthquake']['domesticTsunami'] != 'None' && QuakeJson[selectNum]['earthquake']['domesticTsunami'] != 'Checking') {
        $.getJSON("https://www.jma.go.jp/bosai/tsunami/data/list.json", function(data) {
        // $.getJSON("list.json", function(data) {
            TsunamiJson = data;
            for (const element of TsunamiJson) {
                
                if (element == undefined) {return false;}
                var Json_atEdit = element["at"].substring(11, 19);
                var Json_anm = element["anm"];
                if (Json_atEdit == QuakeJson[selectNum]['earthquake']['time'].substring(11, 19) && Json_anm == QuakeJson[selectNum]['earthquake']['hypocenter']['name']) {
                
                if (element["ttl"].indexOf("津波予報") !== -1) {
                    $.getJSON("https://www.jma.go.jp/bosai/tsunami/data/"+element["json"], function(data2) {
                        var TsunamiDetails = data2;

                        tsunami_forecast_howmany = TsunamiDetails["Body"]["Tsunami"]["Forecast"]["Item"].length;
                        console.log(tsunami_forecast_howmany)
                        tsunami_layer = L.layerGroup();
                        var tsunami_types = [0, 0, 0, 0]; //大津波警報, 津波警報, 津波注意報, 津波予報
                        const tsunami_types_names = ["大津波警報", "津波警報", "津波注意報", "津波予報"];
                        var highestPriorityAlert;
                        var highestPriorityAlertNum;
                        TsunamiDetails["Body"]["Tsunami"]["Forecast"]["Item"].forEach(element => {
                            let name = element["Area"]["Name"];
                            var url = "https://kottaro123456.com/webapps/tsunami/source/geojson/"+name+".geojson";
                            var color_Style;
                            var colorHTML_style;
                            var type;
                            var nodraw = false;
                            if (element["Category"]["Kind"]["Code"] == "52" || element["Category"]["Kind"]["Code"] == "53") {
                                color_Style = PolygonLayer_Style_test_tsunami_1;
                                colorHTML_style = "PolygonLayer_Style_test_tsunami_1";
                                type = "大津波警報";
                                tsunami_types[0] = tsunami_types[0] + 1;
                            } else if (element["Category"]["Kind"]["Code"] == "50") {
                                color_Style = PolygonLayer_Style_test_tsunami_2_kaijo;
                                colorHTML_style = "PolygonLayer_Style_test_tsunami_2_kaijo";
                                type = "津波警報解除";
                            } else if (element["Category"]["Kind"]["Code"] == "51") {
                                color_Style = PolygonLayer_Style_test_tsunami_2;
                                colorHTML_style = "PolygonLayer_Style_test_tsunami_2";
                                type = "津波警報";
                                tsunami_types[1] = tsunami_types[1] + 1;
                            } else if (element["Category"]["Kind"]["Code"] == "60") {
                                color_Style = PolygonLayer_Style_test_tsunami_3_kaijo;
                                colorHTML_style = "PolygonLayer_Style_test_tsunami_3_kaijo";
                                type = "津波注意報解除";
                            } else if (element["Category"]["Kind"]["Code"] == "62") {
                                color_Style = PolygonLayer_Style_test_tsunami_3;
                                colorHTML_style = "PolygonLayer_Style_test_tsunami_3";
                                type = "津波注意報";
                                tsunami_types[2] = tsunami_types[2] + 1;
                            } else if (element["Category"]["Kind"]["Code"] == "71" || element["Category"]["Kind"]["Code"] == "72" || element["Category"]["Kind"]["Code"] == "73") {
                                color_Style = PolygonLayer_Style_test_tsunami_4;
                                colorHTML_style = "PolygonLayer_Style_test_tsunami_4";
                                type = "津波予報";
                                tsunami_types[3] = tsunami_types[3] + 1;
                            } else if (element["Category"]["Kind"]["Code"] == "00") {
                                nodraw = true;
                            }
                            if (nodraw == false) {
                                $.getJSON(url)
                                .done(function (data) {
                                    var line = L.geoJson(data, {
                                        pane: "tsunami_map",
                                        style: color_Style,
                                        popupAnchor: [0, -40]
                                    });
                                    line.bindTooltip(name + '　'+ type,{opacity: 1,sticky: true, className: colorHTML_style});
                                    tsunami_layer.addLayer(line);
                                    if (mapAdd_num == tsunami_forecast_howmany - 1) {
                                        mapAdd = true;
                                    } else {
                                        mapAdd_num++;
                                    }
                                });
                            }
                            console.log(name+" "+element["Category"]["Kind"]["Code"]+" "+type);
                        });
                        console.log(tsunami_types);
                        for (let i = 0; i < tsunami_types.length; i++) {
                            if (tsunami_types[i] >= 1) {
                                // 発令されている最も深刻度の高い警報名をセット
                                highestPriorityAlert = tsunami_types_names[i];
                                highestPriorityAlertNum = i;
                                console.log(highestPriorityAlertNum+', '+highestPriorityAlert);
                                
                                break;
                            }
                        }

                        let tsunami_infobox_text = ["＜大津波警報＞ただちに避難してください。\nただちに巨大な津波が襲い、木造家屋が全壊・流失し、人は津波による流れに巻き込まれます。\n沿岸部や川沿いにいる人は、ただちに高台や避難ビルなど安全な場所へ避難してください。", "＜津波警報＞ただちに避難してください。\n津波による被害が発生します。\n沿岸部や川沿いにいる人はただちに高台や避難ビルなど安全な場所へ避難してください。\n津波は繰り返し襲ってきます。警報が解除されるまで安全な場所から離れないでください。", "＜津波注意報＞ただちに避難してください。\n海の中や海岸付近は危険です。\n海の中にいる人はただちに海から上がって、海岸から離れてください。\n潮の流れが速い状態が続きますので、注意報が解除されるまで海に入ったり海岸に近づいたりしないようにしてください。", "＜津波予報（若干の海面変動）＞\n若干の海面変動が予想されますが、被害の心配はありません。\n警報が発表された沿岸部や川沿いにいる人はただちに高台や避難ビルなど安全な場所へ避難してください。"]
                        document.getElementById('tsunami_text_span').innerHTML = `<a href="../tsunami/" target="_blank"><span class="tsunami_text_${highestPriorityAlertNum+1}" title="詳しくは津波情報図をご覧ください。">${highestPriorityAlert}</span></a>`;

                        document.querySelector('.tsunami_infobox').classList.add('display');
                        document.querySelector('.tsunami_infobox').classList.add(`tsunami_text_${highestPriorityAlertNum+1}`);
                        document.querySelector('.tsunami_infobox').innerHTML = `<span class="tsunami_infobox_close"><span class="material-symbols-outlined">close</span></span><span style="font-size: 1.6rem;">${highestPriorityAlert}が発表されています。</span><br><br>`+tsunami_infobox_text[highestPriorityAlertNum];
                        MA_tsunami_infobox();

                        function mapAddtimeout() {
                            setTimeout(() => {
                                if (mapAdd == true) {
                                    console.warn("繰り返し処理は終了しました。");
                                    if (fill_onoff == 1) {
                                        tsunami_layer.addTo(map);
                                    }
                                } else {
                                    mapAddtimeout();
                                    console.warn("繰り返しています…。");
                                }
                            }, 200);
                        }
                        mapAddtimeout();
                    })
                break;
                }
                }
            }
        });
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
function autoreload_onoff_num_get(){
    if (localStorage.getItem('autoreload_onoff_num')){
        autoreload_onoff_num = localStorage.getItem('autoreload_onoff_num');
    } else {
        autoreload_onoff_num = 10;
    }
    
}

function AreaNameToCode(Name) {
    var array_Num = AreaName.indexOf(Name);
    return AreaCode[array_Num];
}
function AreaNameToKana(Name) {
    var array_Num = AreaName.indexOf(Name);
    return AreaKana[array_Num];
}
function AreaCodeToName(code) {
    var array_Num = AreaCode.indexOf(code);
    return AreaName[array_Num];
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