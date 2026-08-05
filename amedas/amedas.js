var PointList;
var Tempre;



const mapLF = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: 'webappData',
    storeName: 'map',
    version: 1
});
const amedasLF = localforage.createInstance({
    driver: localforage.INDEXEDDB,
    name: 'webappData',
    storeName: 'amedas',
    version: 1
});

function getName(x) {
    return x == 'temp' ? '現在の気温' :
        x == 'humidity' ? '現在の湿度' :
            x == 'wind' ? '現在の風向風速' :
                x == 'snow' ? '現在の積雪深' :
                    x == 'snow1h' ? '1時間降雪量' :
                        x == 'snow3h' ? '3時間降雪量' :
                            x == 'snow12h' ? '12時間降雪量' :
                                x == 'snow24h' ? '24時間降雪量' :
                                    x == 'sun10m' ? '10分日照時間' :
                                        x == 'sun1h' ? '1時間日照時間' :
                                            x == 'precipitation10m' ? '10分降雨量' :
                                                x == 'precipitation1h' ? '1時間降雨量' :
                                                    x == 'precipitation3h' ? '3時間降雨量' :
                                                        x == 'precipitation24h' ? '24時間降雨量' :
                                                            x == 'pressure' ? '現地気圧' :
                                                                x == 'normalPressure' ? '海面更正気圧' :
                                                                    'データなし';
}

function getContrastColor(hexcolor) {
    if (!hexcolor || hexcolor.indexOf('#') !== 0) return '#000000';
    let r = parseInt(hexcolor.substr(1, 2), 16);
    let g = parseInt(hexcolor.substr(3, 2), 16);
    let b = parseInt(hexcolor.substr(5, 2), 16);
    let yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
}
function getModeName(x) {
    return x == 'temp' ? '気温' :
        x == 'humidity' ? '湿度' :
            x == 'wind' ? '風速' :
                x == 'snow' ? '積雪深' :
                    x == 'snow1h' ? '1時間降雪量' :
                        x == 'snow3h' ? '3時間降雪量' :
                            x == 'snow12h' ? '12時間降雪量' :
                                x == 'snow24h' ? '24時間降雪量' :
                                    x == 'sun10m' ? '10分日照時間' :
                                        x == 'sun1h' ? '1時間日照時間' :
                                            x == 'precipitation10m' ? '10分間降雨量' :
                                                x == 'precipitation1h' ? '1時間降雨量' :
                                                    x == 'precipitation3h' ? '3時間降雨量' :
                                                        x == 'precipitation24h' ? '24時間降雨量' :
                                                            x == 'pressure' ? '現地気圧' :
                                                                x == 'normalPressure' ? '海面更正気圧' :
                                                                    '---';
}

function getHanreiNumber(x) {
    return x == 'temp' ? [35, 30, 25, 20, 15, 10, 5, 0, -5, -10, -15] :
        x == 'humidity' ? [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0] :
            x == 'wind' ? [40, 20, 15, 10, 5, 2, 1.5, 1, 0.5, 0.2, 0] :
                x == 'snow' ? [300, 250, 200, 150, 100, 75, 50, 20, 10, 5, 0] :
                    x == 'snow1h' ? [40, 30, 20, 15, 10, 5, 3, 2, 1, 0.1, 0] :
                        x == 'snow3h' ? [100, 80, 60, 40, 30, 20, 10, 5, 2, 0.1, 0] :
                            x == 'snow12h' ? [200, 150, 100, 60, 30, 20, 10, 5, 2, 0.1, 0] :
                                x == 'snow24h' ? [400, 300, 200, 100, 50, 30, 10, 5, 2, 0.1, 0] :
                                    x == 'sun10m' ? [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] :
                                        x == 'sun1h' ? [60, 53, 47, 41, 35, 29, 23, 17, 11, 5, 0] :
                                            x == 'precipitation10m' ? [40, 30, 20, 15, 10, 5, 3, 2, 1, 0.1, 0] :
                                                x == 'precipitation1h' ? [100, 80, 60, 40, 30, 20, 10, 5, 2, 0.1, 0] :
                                                    x == 'precipitation3h' ? [200, 150, 100, 60, 30, 20, 10, 5, 2, 0.1, 0] :
                                                        x == 'precipitation24h' ? [400, 300, 200, 100, 50, 30, 10, 5, 2, 0.1, 0] :
                                                            x == 'pressure' ? [1030, 1025, 1020, 1015, 1010, 1005, 1000, 995, 990, 980, 950] :
                                                                x == 'normalPressure' ? [1020, 1015, 1012, 1010, 1008, 1006, 1004, 1002, 1000, 990, 950] :
                                                                    '---';
}

function getUnit(x) {
    return x == 'temp' ? '℃' :
        x == 'humidity' ? '%' :
            x == 'wind' ? 'm/s' :
                x == 'snow' ? 'cm' :
                    x == 'snow1h' ? 'cm' :
                        x == 'snow3h' ? 'cm' :
                            x == 'snow12h' ? 'cm' :
                                x == 'snow24h' ? 'cm' :
                                    x == 'sun10m' ? '分' :
                                        x == 'sun1h' ? '分' :
                                            x == 'precipitation10m' ? 'mm' :
                                                x == 'precipitation1h' ? 'mm' :
                                                    x == 'precipitation3h' ? 'mm' :
                                                        x == 'precipitation24h' ? 'mm' :
                                                            x == 'pressure' ? 'hPa' :
                                                                x == 'normalPressure' ? 'hPa' :
                                                                    '';
}

function getColor_temp(d) {
    return d >= 35 ? '#CC00FF' :
        d >= 30 ? '#FF0000' :
            d >= 25 ? '#FF8800' :
                d >= 20 ? '#dddd00' :
                    d >= 15 ? '#44dd00' :
                        d >= 10 ? '#007700' :
                            d >= 5 ? '#00aadd' :
                                d >= 0 ? '#002AFF' :
                                    d >= -5 ? '#002080' :
                                        d >= -10 ? '#999999' :
                                            d >= -15 ? '#595959' :
                                                '#000000';
}
function getColor_humidity(d) {
    return d >= 100 ? '#dd0088' :
        d >= 90 ? '#CC00FF' :
            d >= 80 ? '#FF0000' :
                d >= 70 ? '#FF8800' :
                    d >= 60 ? '#dddd00' :
                        d >= 50 ? '#44dd00' :
                            d >= 40 ? '#007700' :
                                d >= 30 ? '#00aadd' :
                                    d >= 20 ? '#002AFF' :
                                        d >= 10 ? '#002080' :
                                            d >= 0 ? '#838383' :
                                                d >= -15 ? '#000000' :
                                                    '#00000000';
}
function getColor_wind(d) {
    return d >= 40 ? '#CC00FF' :
        d >= 20 ? '#FF0000' :
            d >= 15 ? '#FF8800' :
                d >= 10 ? '#dddd00' :
                    d >= 5 ? '#44dd00' :
                        d >= 2 ? '#007700' :
                            d >= 1.5 ? '#00aadd' :
                                d >= 1 ? '#002AFF' :
                                    d >= 0.5 ? '#002080' :
                                        d >= 0.2 ? '#838383' :
                                            '#00000000';
}
function getColor_snow(d) {
    return d >= 300 ? '#CC00FF' :
        d >= 250 ? '#FF0000' :
            d >= 200 ? '#FF8800' :
                d >= 150 ? '#dddd00' :
                    d >= 100 ? '#44dd00' :
                        d >= 75 ? '#007700' :
                            d >= 50 ? '#00aadd' :
                                d >= 20 ? '#002AFF' :
                                    d >= 10 ? '#002080' :
                                        d >= 5 ? '#838383' :
                                            d >= 0 ? '#83838399' :
                                                d >= -15 ? '#00000000' :
                                                    '#00000000';
}
function getColor_pressure(d) {
    return d >= 1030 ? '#CC00FF' :
        d >= 1025 ? '#FF0000' :
            d >= 1020 ? '#FF8800' :
                d >= 1015 ? '#dddd00' :
                    d >= 1010 ? '#44dd00' :
                        d >= 1005 ? '#007700' :
                            d >= 1000 ? '#00aadd' :
                                d >= 995 ? '#002AFF' :
                                    d >= 990 ? '#002080' :
                                        d >= 980 ? '#999999' :
                                            d >= 950 ? '#595959' :
                                                d >= -15 ? '#000000' :
                                                    '#00000000';
}
function getColor_normalPressure(d) {
    return d >= 1020 ? '#CC00FF' :
        d >= 1015 ? '#FF0000' :
            d >= 1012 ? '#FF8800' :
                d >= 1010 ? '#dddd00' :
                    d >= 1008 ? '#44dd00' :
                        d >= 1006 ? '#007700' :
                            d >= 1004 ? '#00aadd' :
                                d >= 1002 ? '#002AFF' :
                                    d >= 1000 ? '#002080' :
                                        d >= 990 ? '#999999' :
                                            d >= 950 ? '#595959' :
                                                d >= -15 ? '#000000' :
                                                    '#00000000';
}
function getColor_sun10m(d) {
    return d >= 10 ? '#dd0088' :
        d >= 9 ? '#CC00FF' :
            d >= 8 ? '#FF0000' :
                d >= 7 ? '#FF8800' :
                    d >= 6 ? '#dddd00' :
                        d >= 5 ? '#44dd00' :
                            d >= 4 ? '#007700' :
                                d >= 3 ? '#00aadd' :
                                    d >= 2 ? '#002AFF' :
                                        d >= 1 ? '#002080' :
                                            d > 0 ? '#838383' :
                                                d >= -15 ? '#83838300' :
                                                    '#00000000';
}
function getColor_sun1h(d) {
    return d >= 60 ? '#dd0088' :
        d >= 53 ? '#CC00FF' :
            d >= 47 ? '#FF0000' :
                d >= 41 ? '#FF8800' :
                    d >= 35 ? '#dddd00' :
                        d >= 29 ? '#44dd00' :
                            d >= 23 ? '#007700' :
                                d >= 17 ? '#00aadd' :
                                    d >= 11 ? '#002AFF' :
                                        d >= 5 ? '#002080' :
                                            d > 0 ? '#838383' :
                                                d >= -15 ? '#83838300' :
                                                    '#00000000';
}
function getColor_precipitation10m(d) {
    return d >= 40 ? '#CC00FF' :
        d >= 30 ? '#FF0000' :
            d >= 20 ? '#FF8800' :
                d >= 15 ? '#dddd00' :
                    d >= 10 ? '#44dd00' :
                        d >= 5 ? '#007700' :
                            d >= 3 ? '#00aadd' :
                                d >= 2 ? '#002AFF' :
                                    d >= 1 ? '#002080' :
                                        d > 0 ? '#838383' :
                                            d >= -15 ? '#83838300' :
                                                '#00000000';
}
function getColor_precipitation1h(d) {
    return d >= 100 ? '#CC00FF' :
        d >= 80 ? '#FF0000' :
            d >= 60 ? '#FF8800' :
                d >= 40 ? '#dddd00' :
                    d >= 30 ? '#44dd00' :
                        d >= 20 ? '#007700' :
                            d >= 10 ? '#00aadd' :
                                d >= 5 ? '#002AFF' :
                                    d >= 2 ? '#002080' :
                                        d > 0 ? '#838383' :
                                            d >= -15 ? '#83838300' :
                                                '#00000000';
}
function getColor_precipitation3h(d) {
    return d >= 200 ? '#CC00FF' :
        d >= 150 ? '#FF0000' :
            d >= 100 ? '#FF8800' :
                d >= 60 ? '#dddd00' :
                    d >= 30 ? '#44dd00' :
                        d >= 20 ? '#007700' :
                            d >= 10 ? '#00aadd' :
                                d >= 5 ? '#002AFF' :
                                    d >= 2 ? '#002080' :
                                        d > 0 ? '#838383' :
                                            d >= -15 ? '#83838300' :
                                                '#00000000';
}
function getColor_precipitation24h(d) {
    return d >= 400 ? '#CC00FF' :
        d >= 300 ? '#FF0000' :
            d >= 200 ? '#FF8800' :
                d >= 100 ? '#dddd00' :
                    d >= 50 ? '#44dd00' :
                        d >= 30 ? '#007700' :
                            d >= 10 ? '#00aadd' :
                                d >= 5 ? '#002AFF' :
                                    d >= 2 ? '#002080' :
                                        d > 0 ? '#838383' :
                                            d >= -15 ? '#83838300' :
                                                '#00000000';
}

function getColor_mlitLine(d) {
    return d > 0 ? '#000000' :
        '#00000000';
}

function getColor_snow1h(d) {
    return d >= 40 ? '#CC00FF' :
        d >= 30 ? '#FF0000' :
            d >= 20 ? '#FF8800' :
                d >= 15 ? '#dddd00' :
                    d >= 10 ? '#44dd00' :
                        d >= 5 ? '#007700' :
                            d >= 3 ? '#00aadd' :
                                d >= 2 ? '#002AFF' :
                                    d >= 1 ? '#002080' :
                                        d > 0 ? '#838383' :
                                            d >= -15 ? '#83838300' :
                                                '#00000000';
}
function getColor_snow3h(d) {
    return d >= 100 ? '#CC00FF' :
        d >= 80 ? '#FF0000' :
            d >= 60 ? '#FF8800' :
                d >= 40 ? '#dddd00' :
                    d >= 30 ? '#44dd00' :
                        d >= 20 ? '#007700' :
                            d >= 10 ? '#00aadd' :
                                d >= 5 ? '#002AFF' :
                                    d >= 2 ? '#002080' :
                                        d > 0 ? '#838383' :
                                            d >= -15 ? '#83838300' :
                                                '#00000000';
}
function getColor_snow12h(d) {
    return d >= 200 ? '#CC00FF' :
        d >= 150 ? '#FF0000' :
            d >= 100 ? '#FF8800' :
                d >= 60 ? '#dddd00' :
                    d >= 30 ? '#44dd00' :
                        d >= 20 ? '#007700' :
                            d >= 10 ? '#00aadd' :
                                d >= 5 ? '#002AFF' :
                                    d >= 2 ? '#002080' :
                                        d > 0 ? '#838383' :
                                            d >= -15 ? '#83838300' :
                                                '#00000000';
}
function getColor_snow24h(d) {
    return d >= 400 ? '#CC00FF' :
        d >= 300 ? '#FF0000' :
            d >= 200 ? '#FF8800' :
                d >= 100 ? '#dddd00' :
                    d >= 50 ? '#44dd00' :
                        d >= 30 ? '#007700' :
                            d >= 10 ? '#00aadd' :
                                d >= 5 ? '#002AFF' :
                                    d >= 2 ? '#002080' :
                                        d > 0 ? '#838383' :
                                            d >= -15 ? '#83838300' :
                                                '#00000000';
}
function getNum_wind(d) {
    return d >= 40 ? '10' :
        d >= 20 ? '9' :
            d >= 15 ? '8' :
                d >= 10 ? '7' :
                    d >= 5 ? '6' :
                        d >= 2 ? '5' :
                            d >= 1.5 ? '4' :
                                d >= 1 ? '3' :
                                    d >= 0.5 ? '2' :
                                        d >= 0.2 ? '1' :
                                            '0';
}
var windDirection = { 0: "静穏", 1: "北北東", 2: "北東", 3: "東北東", 4: "東", 5: "東南東", 6: "南東", 7: "南南東", 8: "南", 9: "南南西", 10: "南西", 11: "西南西", 12: "西", 13: "西北西", 14: "北西", 15: "北北西", 16: "北" };

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
                    'background-color': '#00000000'
                }
            }
        ]
    },
    center: [137.984, 37.575], // [lng, lat]
    zoom: 4.6, // MapLibre zoom 0-based offset, Leaflet zoom 5.6 -> MapLibre ~4.6
    minZoom: 3,
    maxPitch: 85,
    dragRotate: true,
    attributionControl: false
});
map.addControl(new maplibregl.NavigationControl({
    visualizePitch: true
}), 'top-right');

function createPolygon(lng, lat, radiusKm = 2.5, shape = 'square') {
    const points = [];
    const kmPerDegLat = 111.32;
    const kmPerDegLng = 111.32 * Math.cos(lat * Math.PI / 180);
    if (shape === 'square') {
        const sides = 4;
        for (let i = 0; i <= sides; i++) {
            const angle = (i * Math.PI * 2 / sides) + (Math.PI / 4);
            const dLng = (radiusKm * Math.cos(angle)) / kmPerDegLng;
            const dLat = (radiusKm * Math.sin(angle)) / kmPerDegLat;
            points.push([lng + dLng, lat + dLat]);
        }
    } else {
        const sides = 16;
        for (let i = 0; i <= sides; i++) {
            const angle = i * Math.PI * 2 / sides;
            const dLng = (radiusKm * Math.cos(angle)) / kmPerDegLng;
            const dLat = (radiusKm * Math.sin(angle)) / kmPerDegLat;
            points.push([lng + dLng, lat + dLat]);
        }
    }
    return [points];
}


class CustomAttributionControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.className = 'maplibregl-ctrl maplibregl-ctrl-attrib';
        this.update();
        return this._container;
    }
    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
    update() {
        let attr = ["<a href='https://www.jma.go.jp/' target='_blank'>気象庁</a>"];
        let amagumo = document.getElementById('amagumo_settings_checkbox');
        if (amagumo && amagumo.checked) {
            attr.push("<a href='https://weathernews.jp/' target='_blank' rel='noopener noreferrer'>ウェザーニュース</a>");
        }
        let liden = document.getElementById('liden_settings_checkbox');
        let mlit = document.getElementById('amagumo_settings_checkbox_mlit');
        if ((liden && liden.checked) || (mlit && mlit.checked)) {
            attr.push("<a href='https://www.mlit.go.jp/' target='_blank'>国土交通省</a>");
        }
        this._container.innerHTML = attr.join(" | ");
    }
}
window.customAttrib = new CustomAttributionControl();
map.addControl(window.customAttrib, 'bottom-right');

// AttributionControl is added by default by MapLibre, gathering attributions from sources.// map LF, amedas LF ...
var mapdata;
//地図データ読み込み
async function prefGet() {
    await mapLF.getItem("pref").then(async function (value) {
        if (value !== null) {
            // キーが存在し、値が取得できた場合
            // ストレージからデータを取得し新しく取得しない
            mapdata = value;
            console.log("Map Loading completed: 'pref', IndexedDB");
        } else {
            // キーが存在しない場合
            // 新しくデータを取得
            const response = await fetch("https://kottaro123456.com/static/api/geojson/pref.geojson");
            const data = await response.json();
            mapdata = data;
            console.log("Map Loading completed: 'pref', Network");
            await mapLF.setItem("pref", mapdata);
            console.log("Map Saved successfully: 'pref', IndexedDB");
        }
    });

    if (!map.loaded()) {
        await new Promise(resolve => map.once('load', resolve));
    }

    if (map.getSource('pref')) {
        map.getSource('pref').setData(mapdata);
    } else {
        map.addSource('pref', {
            type: 'geojson',
            data: mapdata
        });
        map.addLayer({
            id: 'pane_map',
            type: 'fill',
            source: 'pref',
            paint: {
                'fill-color': '#ffffff',
                'fill-opacity': 1
            }
        });
        map.addLayer({
            id: 'pane_map_border',
            type: 'line',
            source: 'pref',
            paint: {
                'line-color': '#333533',
                'line-width': 0.7,
                'line-opacity': 1
            }
        });
        map.addLayer({
            id: 'pane_map_2',
            type: 'line',
            source: 'pref',
            paint: {
                'line-color': '#333533',
                'line-width': 1,
                'line-opacity': 1
            }
        });
    }
}


//L.tileLayer('https://tile.weathernews.jp/3/tile/rad_anl/2023/04/19/2023-04-19-14-00_Tiles_999999999999/{z}_{x}_{y}.png', {pane: "pane_map",opacity: 0.8}).addTo(map);

var PointList;
var latestTime;
var tempJson;
var lidenJson = [];
var mlitRainDataJson = "";
var lowtempList = [];
var hightempList = [];
Cookies.remove('latesttemp');
var autoReloadInterval;
var autoreload_onoff;
var autoreload_onoff_num;

var amedasMarkers = [];
var mlitMarkers = [];
var lidenMarkers = [];


let params = new URL(window.location.href).searchParams;
var consoletext = "自動更新は無効です。自動更新するにはURLに「?autoreload=on」を付け加えます。";
if (params.get('autoreload') == "on") {
    document.getElementsByClassName('autoreload_setsumei')[0].classList.add('on');
    autoreload_onoff = "on";
    autoReloadInterval = setInterval(() => {
        TempInfo_get();
    }, 300000);
    consoletext = "自動更新は有効です。5分ごとに情報の更新が行われます。";
}
console.log(consoletext);

// メイン処理の呼び出し
(async () => {
    await Promise.all([
        PointList_get(),
        prefGet()
    ]);
    await TempInfo_get();

    await fontLoadingPopup();
})();


async function PointList_get() {
    await amedasLF.getItem("amedastable").then(async function (value) {
        if (value !== null) {
            // キーが存在し、値が取得できた場合
            // ストレージからデータを取得し新しく取得しない
            PointList = value;
            console.log("JSON Loading completed: 'amedastable', IndexedDB");
        } else {
            // キーが存在しない場合
            // 新しくデータを取得
            const response = await fetch("amedastable.json");
            const data = await response.json();
            PointList = data;
            console.log("JSON Loading completed: 'amedastable', Network");
            await amedasLF.setItem("amedastable", PointList);
            console.log("JSON Saved successfully: 'amedastable', IndexedDB");
        }
    });
}

var param = "temp";
var currentMode = "";
var already;
var displayDate;
var nowcastDate;
var graphDate
async function TempInfo_get() {
    already = false;
    $.get("https://www.jma.go.jp/bosai/amedas/data/latest_time.txt", function (data) {
        // $.get("latest.txt", function(data){
        latestTime = data;
        nowcastDate = new Date(data.substring(0, 19));
        graphDate = new Date(data.substring(0, 19));
        displayDate = new Date(data.substring(0, 19));
        nowcastDate.setHours(nowcastDate.getHours() - 9);

        if (param == "snow" || param == "snow1h" || param == "snow6h" || param == "snow12h" || param == "snow24h") {
            latestTime = latestTime.substring(0, 4) + latestTime.substring(5, 7) + latestTime.substring(8, 10) + latestTime.substring(11, 13) + '0000';
        } else {
            latestTime = latestTime.substring(0, 4) + latestTime.substring(5, 7) + latestTime.substring(8, 10) + latestTime.substring(11, 13) + latestTime.substring(14, 16) + latestTime.substring(17, 19);
        }
        document.getElementById('title_text').innerText = getName(param);
        document.getElementById('title_time').innerHTML = latestTime.substring(4, 6) + '<span class="small">月</span>' + latestTime.substring(6, 8) + '<span class="small">日</span> ' + latestTime.substring(8, 10) + '<span class="small">時</span>' + latestTime.substring(10, 12) + '<span class="small">分</span>現在';

        console.log(latestTime + ".json を取得中です…。");
        (async () => {
            const url = "https://www.jma.go.jp/bosai/amedas/data/map/" + latestTime + ".json";
            const response = await fetch(url)
                .then(response => response.json())
                .then(response => {
                    tempJson = response;
                    let nowcastyear = nowcastDate.getFullYear();
                    let nowcastmonth = ('0' + (nowcastDate.getMonth() + 1)).slice(-2);
                    let nowcastday = ('0' + nowcastDate.getDate()).slice(-2);
                    let nowcasthour = ('0' + nowcastDate.getHours()).slice(-2);
                    let nowcastminute = ('0' + nowcastDate.getMinutes()).slice(-2);
                    let lidenTime = "" + nowcastyear + nowcastmonth + nowcastday + nowcasthour + nowcastminute + "00";
                    lidenJson = [];
                    if (document.getElementById('liden_settings_period_10m').checked == true) { // 10分間指定
                        $.getJSON("https://www.jma.go.jp/bosai/jmatile/data/nowc/" + lidenTime + "/none/" + lidenTime + "/surf/liden/data.geojson", function (data) {
                            lidenJson.push(data);
                            nowcastDate.setMinutes(nowcastDate.getMinutes() - 5);
                            let nowcasthour2 = ('0' + nowcastDate.getHours()).slice(-2);
                            let nowcastminute2 = ('0' + nowcastDate.getMinutes()).slice(-2);
                            let lidenTime2 = "" + nowcastyear + nowcastmonth + nowcastday + nowcasthour2 + nowcastminute2 + "00";
                            nowcastDate.setMinutes(nowcastDate.getMinutes() + 5);
                            $.getJSON("https://www.jma.go.jp/bosai/jmatile/data/nowc/" + lidenTime2 + "/none/" + lidenTime2 + "/surf/liden/data.geojson", function (data) {
                                lidenJson.push(data);
                                mlitRainData_get();
                            });
                        });
                    } else if (document.getElementById('liden_settings_period_all').checked == true) { // 全期間指定
                        $.getJSON("https://www.jma.go.jp/bosai/jmatile/data/nowc/targetTimes_N3.json", function (data1) {
                            var targetCount = 0;
                            var foreachCount = 0;
                            data1.forEach(element => { if (element["elements"].includes("liden") == true) { targetCount++; } });
                            data1.forEach((element, index) => {
                                if (element["elements"].includes("liden") == true) {
                                    let lidenTime3 = element["basetime"];
                                    $.getJSON("https://www.jma.go.jp/bosai/jmatile/data/nowc/" + lidenTime3 + "/none/" + lidenTime3 + "/surf/liden/data.geojson", function (data2) {
                                        lidenJson.push(data2);
                                        foreachCount++;
                                        if (foreachCount == targetCount) {
                                            mlitRainData_get();
                                        }
                                    });

                                }
                            });
                        });
                    } else {
                        ;
                        console.warn("雷レーダーの期間指定が不正な値だったため、雷レーダー情報は取得していません。情報を更新するまで雷レーダー機能は使用できません。");
                    }

                });
        })();
    });
}

var miltParam;
function mlitRainData_get(isDraw) {
    mlitRainDataJson = "";
    if (param.indexOf('precipitation') !== -1) {
        var mlitRain_date = new Date(nowcastDate.getTime());
        mlitRain_date.setMinutes(mlitRain_date.getMinutes() - 10);
        miltParam = param == "precipitation10m" ? "10m" :
            param == "precipitation1h" ? "1h" :
                param == "precipitation3h" ? "3h" :
                    param == "precipitation24h" ? "24h" : "";
        if (miltParam == "") { console.warn("国土交通省管轄雨量計データ取得用のパラムが不正な値だったため、国土交通省管轄雨量計データは取得していません。"); }
        var mlit_dateText = "" + mlitRain_date.getFullYear() + ('0' + (mlitRain_date.getMonth() + 1)).slice(-2) + ('0' + mlitRain_date.getDate()).slice(-2) + ('0' + mlitRain_date.getHours()).slice(-2) + ('0' + mlitRain_date.getMinutes()).slice(-2) + "00";
        $.getJSON("https://www.jma.go.jp/bosai/jmatile/data/nowc/" + mlit_dateText + "/none/" + mlit_dateText + "/surf/rain" + miltParam + "/data.geojson", function (mlitData) {
            mlitRainDataJson = mlitData;
            if (isDraw != false && isDraw != "false") {
                mapDraw(param, true);
            }
        });
    } else {
        if (isDraw != false && isDraw != "false") {
            mapDraw(param, true);
        }
    }
}

var unit;
var nowcast_basemap;

function mapDraw(param_mapDraw, redrawNowcast, timeChange) {
    // 3D表示が有効な状態で降水量または積雪量モードに切り替わった場合、国交省雨量計を自動オフにする
    let is3DEnabled = document.getElementById('amedas_settings_3d_enable')?.checked ?? true;
    if ((param_mapDraw.indexOf('precipitation') !== -1 || param_mapDraw.indexOf('snow') !== -1) && param_mapDraw !== currentMode && is3DEnabled) {
        let mlitCheck = document.getElementById('amagumo_settings_checkbox_mlit');
        if (mlitCheck) mlitCheck.checked = false;
    }
    currentMode = param_mapDraw;

    document.getElementById('title_text').innerText = getName(param_mapDraw);
    if (amedasMarkers) { amedasMarkers.forEach(m => { if (m.getElement()._tippy) m.getElement()._tippy.destroy(); m.remove(); }); amedasMarkers = []; }
    // mlitMarkers は廃止（Source/Layer方式へ移行）
    if (map.getLayer('mlit_circle')) map.removeLayer('mlit_circle');
    if (map.getSource('mlit_source')) map.removeSource('mlit_source');
    if (lidenMarkers) { lidenMarkers.forEach(m => { if (m.getElement()._tippy) m.getElement()._tippy.destroy(); m.remove(); }); lidenMarkers = []; }
    if (redrawNowcast != undefined) {
        if (map.getLayer('nowcast')) map.removeLayer('nowcast');
        if (map.getSource('nowcast_source')) map.removeSource('nowcast_source');

        let nowcastyear = nowcastDate.getFullYear();
        let nowcastmonth = ('0' + (nowcastDate.getMonth() + 1)).slice(-2);
        let nowcastday = ('0' + nowcastDate.getDate()).slice(-2);
        let nowcasthour = ('0' + nowcastDate.getHours()).slice(-2);
        let nowcastminute = ('0' + nowcastDate.getMinutes()).slice(-2);
        let nowcastGetTime = "" + nowcastyear + "-" + nowcastmonth + "-" + nowcastday + "-" + nowcasthour + "-" + nowcastminute;

        let nowcast_url = "https://tile.weathernews.jp/3/tile/rad_anl/" + nowcastyear + "/" + nowcastmonth + "/" + nowcastday + "/" + nowcastGetTime + "_Tiles_999999999999/{z}_{x}_{y}.png";

        map.addSource('nowcast_source', {
            type: 'raster',
            tiles: [nowcast_url],
            tileSize: 256,
            maxzoom: 9,
            attribution: '<a href="https://weathernews.jp/" target="_blank" rel="noopener noreferrer">ウェザーニュース</a>'
        });

        let opacity = Number(document.getElementById('amagumo_settings_range_span').innerText) || 0.75;
        let visibility = document.getElementById('amagumo_settings_checkbox').checked ? 'visible' : 'none';

        map.addLayer({
            id: 'nowcast',
            type: 'raster',
            source: 'nowcast_source',
            layout: { visibility: visibility },
            paint: { 'raster-opacity': opacity }
        }, 'pane_map_2'); // put above borders if possible (if pane_map_2 exists)
    }

    param = param_mapDraw;

    document.title = getName(param_mapDraw) + " アメダス天気Viewer for MiyakoCam"

    let amedasFeatures = [];
    lowtempList = [];
    hightempList = [];

    let hanreiNumberList = getHanreiNumber(param_mapDraw);
    let hanreiNumberListLength = hanreiNumberList.length + 1;
    for (let i = 1; i <= hanreiNumberListLength; i++) {
        if (i == hanreiNumberListLength) {
            eval("document.getElementById('hanrei_td" + i + "_1').style.color = getColor_" + param_mapDraw + "(" + ((hanreiNumberList[i - 2]) - 0.1) + ");");
        } else {
            eval("document.getElementById('hanrei_td" + i + "_1').style.color = getColor_" + param_mapDraw + "(" + hanreiNumberList[i - 1] + ");");
        }
    }
    for (let a = 1; a <= hanreiNumberListLength; a++) {
        if (param_mapDraw == "temp" || param_mapDraw.indexOf('ressure') !== -1) {
            if (a == 1) { //最初は100～とするため。
                eval("document.getElementById('hanrei_td" + a + "_2').innerText = " + hanreiNumberList[a - 1]);
                eval("document.getElementById('hanrei_td" + a + "_4').innerText = ''");
            } else if (a == hanreiNumberListLength) { //最後は～-10とするため。
                eval("document.getElementById('hanrei_td" + a + "_2').innerText = ''");
                eval("document.getElementById('hanrei_td" + a + "_4').innerText = " + hanreiNumberList[a - 2]);
            } else {
                eval("document.getElementById('hanrei_td" + a + "_2').innerText = " + hanreiNumberList[a - 1]);
                eval("document.getElementById('hanrei_td" + a + "_4').innerText = " + hanreiNumberList[a - 2]);
            }
        } else {
            if (a == 1) { //最初は100～とするため。
                eval("document.getElementById('hanrei_td" + a + "_2').innerText = " + hanreiNumberList[a - 1]);
                eval("document.getElementById('hanrei_td" + a + "_4').innerText = ''");
            } else if (a == hanreiNumberListLength) { //最後は0～10とするため。

            } else {
                eval("document.getElementById('hanrei_td" + a + "_2').innerText = " + hanreiNumberList[a - 1]);
                eval("document.getElementById('hanrei_td" + a + "_4').innerText = " + hanreiNumberList[a - 2]);
            }
        }
    }
    if (param_mapDraw == "temp" || param_mapDraw.indexOf('ressure') !== -1) {
        document.getElementById('hanrei_td11').style.display = "table-row";
        document.getElementById('hanrei_td12').style.display = "table-row";
    } else if (hanreiNumberListLength == 12) {
        document.getElementById('hanrei_td11').style.display = "table-row";
        document.getElementById('hanrei_td12').style.display = "none";
    } else {
        document.getElementById('hanrei_td11').style.display = "none";
        document.getElementById('hanrei_td12').style.display = "none";
    }
    document.getElementById('hanrei_td0_1').innerText = getUnit(param_mapDraw);

    Object.entries(PointList).forEach(element => {

        unit = getUnit(param_mapDraw);
        if (element[0] in tempJson) {
            if (param_mapDraw in tempJson[element[0]]) {
                if (tempJson[element[0]][param_mapDraw][0] != null) {
                    if (param_mapDraw == "sun1h" && already == false) { tempJson[element[0]][param_mapDraw][0] = tempJson[element[0]][param_mapDraw][0] * 60; }
                    if (param_mapDraw == "temp" || param_mapDraw == "pressure" || param_mapDraw == "normalPressure") { tempJson[element[0]][param_mapDraw][0] = Number(tempJson[element[0]][param_mapDraw][0]).toFixed(1); }
                    // Leaflet -> MapLibre marker
                    let colorFuncName = "getColor_" + param_mapDraw;
                    let colorVal = typeof window[colorFuncName] === "function" ? window[colorFuncName](tempJson[element[0]][param_mapDraw][0]) : '#000';
                    let markerEl;
                    let popupHtml;
                    if (param_mapDraw != "wind") {
                        let fillOpacityColor;
                        let hex = colorVal.replace('#', '');
                        if (hex.length === 6) {
                            let r = parseInt(hex.substring(0, 2), 16);
                            let g = parseInt(hex.substring(2, 4), 16);
                            let b = parseInt(hex.substring(4, 6), 16);
                            fillOpacityColor = 'rgba(' + r + ',' + g + ',' + b + ',0.3)';
                        } else {
                            fillOpacityColor = colorVal;
                        }
                        popupHtml = '<ruby>' + element[1]['kjName'] + '<rt>' + element[1]['knName'] + '</rt></ruby>　' + tempJson[element[0]][param_mapDraw][0] + unit;

                        let lng = element[1]["lon"][0] + element[1]["lon"][1] / 60;
                        let lat = element[1]["lat"][0] + element[1]["lat"][1] / 60;
                        let shape = document.getElementById('amedas_settings_3d_shape')?.value || 'square';
                        let thickness = Number(document.getElementById('amedas_settings_3d_thickness')?.value || 2.5);
                        let is3D = document.getElementById('amedas_settings_3d_enable')?.checked ?? true;
                        let val = tempJson[element[0]][param_mapDraw][0];
                        let geometry = ((param_mapDraw.indexOf('precipitation') !== -1 || param_mapDraw.indexOf('snow') !== -1) && is3D && val > 0) ?
                            { type: 'Polygon', coordinates: createPolygon(lng, lat, thickness, shape) } :
                            { type: 'Point', coordinates: [lng, lat] };

                        amedasFeatures.push({
                            type: 'Feature',
                            geometry: geometry,
                            properties: {
                                id: element[0],
                                color: colorVal,
                                fillColor: fillOpacityColor,
                                popup: popupHtml,
                                kjName: element[1]['kjName'],
                                knName: element[1]['knName'],
                                tempUnit: tempJson[element[0]][param_mapDraw][0] + unit,
                                value: tempJson[element[0]][param_mapDraw][0]
                            }
                        });
                    } else {
                        let markerEl = document.createElement('div');
                        markerEl.classList.add('amedas-marker');
                        markerEl.style.cursor = "pointer";
                        let innerEl = document.createElement('img');
                        innerEl.src = 'source/wind' + getNum_wind(tempJson[element[0]][param_mapDraw][0]) + '.png';
                        innerEl.style.width = '30px';
                        innerEl.style.height = '30px';
                        innerEl.style.transform = 'rotate(' + (tempJson[element[0]]['windDirection'][0] * 22.5) + 'deg)';
                        markerEl.appendChild(innerEl);
                        popupHtml = '<ruby>' + element[1]['kjName'] + '<rt>' + element[1]['knName'] + '</rt></ruby>　' + windDirection[tempJson[element[0]]['windDirection'][0]] + ' ' + tempJson[element[0]][param_mapDraw][0] + unit;

                        let lngLat = [(element[1]["lon"][0] + element[1]["lon"][1] / 60), (element[1]["lat"][0] + element[1]["lat"][1] / 60)];
                        let marker = new maplibregl.Marker({ element: markerEl, pitchAlignment: 'map' })
                            .setLngLat(lngLat);

                        markerEl.addEventListener('mouseenter', () => {
                            window.hoverPopup.removeClassName('liden-popup');
                            window.hoverPopup.setLngLat(lngLat).setHTML(popupHtml).addTo(map);
                        });
                        markerEl.addEventListener('mouseleave', () => {
                            window.hoverPopup.remove();
                        });

                        markerEl.addEventListener('click', function (e) {
                            e.stopPropagation();
                            window.hoverPopup.remove();
                            if (document.getElementById('amedas_settings_checkbox_graph').checked) {
                                let mockE = { target: { kjName: element[1]['kjName'], knName: element[1]['knName'], tempUnit: tempJson[element[0]][param_mapDraw][0] + unit } };
                                createGraph(element[0], mockE);
                            }
                        });

                        // 間引き用データ
                        markerEl.dataset.type = element[1]['type'];
                        markerEl.dataset.value = tempJson[element[0]][param_mapDraw][0];

                        window["circle" + element[0]] = marker;
                        amedasMarkers.push(marker);
                    }

                    //if (param_mapDraw == "temp") {
                    if (!Cookies.get('i')) {
                        Cookies.set('i', 0);
                        var i = 0;
                    }
                    var i = Cookies.get('i');
                    eval('lowtempList[' + i + '] = {};');
                    eval('lowtempList[' + i + ']["key"] = "' + element[0] + '";');
                    eval('lowtempList[' + i + ']["name"] = "' + element[1]["kjName"] + '";');
                    eval('lowtempList[' + i + ']["name_kana"] = "' + element[1]["knName"] + '";');
                    eval('lowtempList[' + i + ']["temp"] = "' + tempJson[element[0]][param][0] + '";');
                    eval('hightempList[' + i + '] = {};');
                    eval('hightempList[' + i + ']["key"] = "' + element[0] + '";');
                    eval('hightempList[' + i + ']["name"] = "' + element[1]["kjName"] + '";');
                    eval('hightempList[' + i + ']["name_kana"] = "' + element[1]["knName"] + '";');
                    eval('hightempList[' + i + ']["temp"] = "' + tempJson[element[0]][param][0] + '";');
                    i++;
                    Cookies.set('i', i);
                    //}
                }
            }
        }
    });
    //if (param == "temp") {
    Cookies.remove('i');
    lowtempList.sort((x, y) => x.temp - y.temp);
    hightempList.sort((x, y) => y.temp - x.temp);
    //}
    if (document.getElementById('amagumo_settings_checkbox_amedas').checked) {
        amedasMarkers.forEach(m => m.addTo(map));
    }

    if (map.getSource('amedas_source')) {
        map.getSource('amedas_source').setData({ type: 'FeatureCollection', features: amedasFeatures });
    } else {
        map.addSource('amedas_source', {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: amedasFeatures }
        });
        map.addLayer({
            id: 'amedas_circle',
            type: 'circle',
            source: 'amedas_source',
            filter: ['==', ['geometry-type'], 'Point'],
            paint: {
                'circle-radius': [
                    'interpolate', ['exponential', 2], ['zoom'],
                    5, 3,
                    10, 96
                ],
                'circle-color': ['get', 'fillColor'],
                'circle-stroke-color': ['get', 'color'],
                'circle-stroke-width': 3,
                'circle-pitch-alignment': 'map',
                'circle-pitch-scale': 'map'
            }
        });

        let heightMult = Number(document.getElementById('amedas_settings_3d_height')?.value || 1500);
        let opacity = Number(document.getElementById('amedas_settings_3d_opacity')?.value || 0.8);

        map.addLayer({
            id: 'amedas_extrusion',
            type: 'fill-extrusion',
            source: 'amedas_source',
            filter: ['==', ['geometry-type'], 'Polygon'],
            paint: {
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-height': ['*', ['get', 'value'], heightMult],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': opacity
            }
        });

        let currentHoverId = null;
        ['amedas_circle', 'amedas_extrusion'].forEach(layer => {
            map.on('mousemove', layer, (e) => {
                if (e.features.length > 0) {
                    map.getCanvas().style.cursor = 'pointer';
                    let prop = e.features[0].properties;
                    if (currentHoverId !== prop.id) {
                        currentHoverId = prop.id;
                        let coords;
                        if (e.features[0].geometry.type === 'Polygon') {
                            coords = [e.lngLat.lng, e.lngLat.lat];
                        } else {
                            coords = e.features[0].geometry.coordinates.slice();
                        }
                        while (Math.abs(e.lngLat.lng - coords[0]) > 180) { coords[0] += e.lngLat.lng > coords[0] ? 360 : -360; }
                        window.hoverPopup.removeClassName('liden-popup');
                        window.hoverPopup.setLngLat(coords).setHTML(prop.popup).addTo(map);

                        // ポップアップの色設定を適用
                        const popupType = document.getElementById('amedas_settings_popup_color')?.value || 'standard';
                        const popupEl = window.hoverPopup.getElement();
                        if (popupEl) {
                            const popupContent = popupEl.querySelector('.maplibregl-popup-content');
                            const popupTip = popupEl.querySelector('.maplibregl-popup-tip');
                            if (popupType === 'station' && prop.color) {
                                const bgColor = prop.color;
                                const textColor = getContrastColor(bgColor);
                                if (popupContent) {
                                    popupContent.style.setProperty('background-color', bgColor, 'important');
                                    popupContent.style.setProperty('color', textColor, 'important');
                                }
                                if (popupTip) {
                                    // 矢印の色も背景色に合わせる（全方向対応）
                                    popupTip.style.setProperty('border-top-color', bgColor, 'important');
                                    popupTip.style.setProperty('border-bottom-color', bgColor, 'important');
                                    popupTip.style.setProperty('border-left-color', bgColor, 'important');
                                    popupTip.style.setProperty('border-right-color', bgColor, 'important');
                                }
                            } else {
                                if (popupContent) {
                                    popupContent.style.removeProperty('background-color');
                                    popupContent.style.removeProperty('color');
                                }
                                if (popupTip) {
                                    popupTip.style.removeProperty('border-top-color');
                                    popupTip.style.removeProperty('border-bottom-color');
                                    popupTip.style.removeProperty('border-left-color');
                                    popupTip.style.removeProperty('border-right-color');
                                }
                            }
                        }
                    }
                }
            });
            map.on('mouseleave', layer, () => {
                map.getCanvas().style.cursor = '';
                currentHoverId = null;
                window.hoverPopup.remove();
            });
            map.on('click', layer, (e) => {
                if (document.getElementById('amedas_settings_checkbox_graph').checked) {
                    let prop = e.features[0].properties;
                    window.hoverPopup.remove();
                    let mockE = { target: { kjName: prop.kjName, knName: prop.knName, tempUnit: prop.tempUnit } };
                    createGraph(prop.id, mockE);
                }
            });
        });
    }

    let isCheckedAmedas = document.getElementById('amagumo_settings_checkbox_amedas').checked;
    if (map.getLayer('amedas_circle')) {
        map.setLayoutProperty('amedas_circle', 'visibility', isCheckedAmedas ? 'visible' : 'none');
    }
    if (map.getLayer('amedas_extrusion')) {
        map.setLayoutProperty('amedas_extrusion', 'visibility', isCheckedAmedas ? 'visible' : 'none');
    }

    if (param_mapDraw == "sun1h") { already = true; }

    // 雷描画 2024/09/22追加
    var iconSize_value = document.getElementById('liden_settings_size')?.value || 30;
    var iconOpacity_value = document.getElementById('liden_settings_opacity')?.value || 1;
    var iconZindex_value = document.getElementById('liden_settings_zindex')?.value || 60;
    for (let i = 0; i < lidenJson.length; i++) {
        if (!lidenJson[i] || !lidenJson[i]["features"]) continue;
        lidenJson[i]["features"].forEach(element => {
            if (element["properties"]["type"] == 4) {
                let markerEl = document.createElement('img');
                markerEl.src = 'source/liden-thunder.svg';
                markerEl.style.width = iconSize_value + 'px';
                markerEl.style.height = iconSize_value + 'px';
                markerEl.style.opacity = iconOpacity_value;
                markerEl.style.zIndex = iconZindex_value;

                let popupHtml = "観測日時 : " + element["properties"]["obstimeJST"];
                let lngLat = [element["geometry"]["coordinates"][0], element["geometry"]["coordinates"][1]];
                markerEl.addEventListener('mouseenter', () => {
                    window.hoverPopup.addClassName('liden-popup');
                    window.hoverPopup.setLngLat(lngLat).setHTML(popupHtml).addTo(map);
                });
                markerEl.addEventListener('mouseleave', () => {
                    window.hoverPopup.removeClassName('liden-popup');
                    window.hoverPopup.remove();
                });

                let lidenMarker = new maplibregl.Marker({ element: markerEl, anchor: 'center', pitchAlignment: 'map' })
                    .setLngLat(lngLat);

                let isLidenVisible = document.getElementById('liden_settings_checkbox').checked;
                if (isLidenVisible) lidenMarker.addTo(map);
                lidenMarkers.push(lidenMarker);
            }
        });
    }

    // 国土交通省雨量計描画 2024/10/19追加 -> 2024/10/22 高速化(Source/Layer方式)
    if (param_mapDraw.indexOf('precipitation') !== -1 && mlitRainDataJson != "") {
        let mlitFeatures = [];
        let colorFuncName = "getColor_" + param_mapDraw;
        let isMlitVisible = document.getElementById('amagumo_settings_checkbox_mlit').checked;

        mlitRainDataJson["features"].forEach(element => {
            let val = element['properties']['rain' + miltParam];
            let colorVal = typeof window[colorFuncName] === "function" ? window[colorFuncName](val) : '#000';
            let strokeColor = getColor_mlitLine(val);

            // プロパティに描画用の情報を追加
            element.properties.color = colorVal;
            element.properties.strokeColor = strokeColor;
            element.properties.popupHtml = "" + val + unit;
            mlitFeatures.push(element);
        });

        map.addSource('mlit_source', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: mlitFeatures
            }
        });

        map.addLayer({
            id: 'mlit_circle',
            type: 'circle',
            source: 'mlit_source',
            layout: {
                'visibility': isMlitVisible ? 'visible' : 'none'
            },
            paint: {
                'circle-radius': 5,
                'circle-color': ['get', 'color'],
                'circle-stroke-color': ['get', 'strokeColor'],
                'circle-stroke-width': 1,
                'circle-opacity': 0.3,
                'circle-stroke-opacity': 0.3,
                'circle-pitch-alignment': 'map',
                'circle-pitch-scale': 'map'
            }
        });

        // レイヤーに対するホバーイベントを追加（初回のみ登録されるようにチェック）
        if (!window.mlitEventsAdded) {
            map.on('mouseenter', 'mlit_circle', (e) => {
                map.getCanvas().style.cursor = 'pointer';
                let coordinates = e.features[0].geometry.coordinates.slice();
                let popupHtml = e.features[0].properties.popupHtml;

                window.hoverPopup.removeClassName('liden-popup');
                window.hoverPopup.setLngLat(coordinates).setHTML(popupHtml).addTo(map);

                // ポップアップの色設定を適用
                const popupType = document.getElementById('amedas_settings_popup_color')?.value || 'standard';
                const popupEl = window.hoverPopup.getElement();
                if (popupEl) {
                    const popupContent = popupEl.querySelector('.maplibregl-popup-content');
                    const popupTip = popupEl.querySelector('.maplibregl-popup-tip');
                    if (popupType === 'station' && e.features[0].properties.color) {
                        const bgColor = e.features[0].properties.color;
                        const textColor = getContrastColor(bgColor);
                        if (popupContent) {
                            popupContent.style.setProperty('background-color', bgColor, 'important');
                            popupContent.style.setProperty('color', textColor, 'important');
                        }
                        if (popupTip) {
                            popupTip.style.setProperty('border-top-color', bgColor, 'important');
                            popupTip.style.setProperty('border-bottom-color', bgColor, 'important');
                            popupTip.style.setProperty('border-left-color', bgColor, 'important');
                            popupTip.style.setProperty('border-right-color', bgColor, 'important');
                        }
                    } else {
                        if (popupContent) {
                            popupContent.style.removeProperty('background-color');
                            popupContent.style.removeProperty('color');
                        }
                        if (popupTip) {
                            popupTip.style.removeProperty('border-top-color');
                            popupTip.style.removeProperty('border-bottom-color');
                            popupTip.style.removeProperty('border-left-color');
                            popupTip.style.removeProperty('border-right-color');
                        }
                    }
                }
            });

            map.on('mouseleave', 'mlit_circle', () => {
                map.getCanvas().style.cursor = '';
                window.hoverPopup.remove();
            });
            window.mlitEventsAdded = true;
        }
    }
    if (param_mapDraw.indexOf('precipitation') !== -1 && document.getElementById('amagumo_settings_checkbox_mlit').checked == true) {
        if (window.customAttrib) window.customAttrib.update();
    }

    let is3D = document.getElementById('amedas_settings_3d_enable')?.checked ?? true;
    if (param_mapDraw.indexOf('precipitation') !== -1 && is3D) {
        if (map.getPitch() < 40) {
            map.easeTo({ pitch: 60, bearing: -15, duration: 1500 });
        }
    } else {
        if (map.getPitch() > 10) {
            map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
        }
    }

    if (timeChange != undefined) {
        document.getElementById('liden_settings_checkbox').checked = false;
        document.getElementById('liden_settings_checkbox').disabled = true;
        document.getElementById('liden_settings_period_10m').disabled = true;
        document.getElementById('liden_settings_period_all').disabled = true;
        document.getElementById('liden_settings_opacity').disabled = true;
        document.getElementById('liden_settings_size').disabled = true;
        document.getElementById('liden_settings_zindex').disabled = true;
        document.getElementById('liden_settings_error_latest').style.display = "block";
    } else {
        document.getElementById('liden_settings_checkbox').disabled = false;
        document.getElementById('liden_settings_period_10m').disabled = false;
        document.getElementById('liden_settings_period_all').disabled = false;
        document.getElementById('liden_settings_opacity').disabled = false;
        document.getElementById('liden_settings_size').disabled = false;
        document.getElementById('liden_settings_zindex').disabled = false;
        document.getElementById('liden_settings_error_latest').style.display = "none";
        if (param_mapDraw.indexOf('precipitation') !== -1) {
            document.getElementById('liden_settings_checkbox').checked = true;
            lidenMarkers.forEach(m => m.addTo(map));
        } else {
            document.getElementById('liden_settings_checkbox').checked = false;
            lidenMarkers.forEach(m => m.remove());
        }
        if (window.customAttrib) window.customAttrib.update();
    }
    updateWindVisibility();
}


// URLのGETパラメータから現在のモードを取得する関数
// 現在は不使用
function getParam(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


function modeChange(e) {
    const mode = e.currentTarget.dataset.mode;
    param = mode;
    if (param == "snow" || param == "snow1h" || param == "snow6h" || param == "snow12h" || param == "snow24h") {
        TempInfo_get();
    } else if (param.indexOf('precipitation') !== -1) {
        mlitRainData_get();
    } else {
        mapDraw(mode);
    }
}

function ranking_create(type) {
    document.getElementById('table_datetime').innerText = latestTime.substring(4, 6) + "月" + latestTime.substring(6, 8) + "日 " + latestTime.substring(8, 10) + ":" + latestTime.substring(10, 12) + "現在";
    document.getElementById('table_title').innerText = getModeName(param) + "ランキング トップ--";
    Cookies.remove('latesttemp');
    if (type == 'low') {
        let i = 0;
        let itemCount = 0;
        let all0 = false;
        for (let a = 0; a < 16; a++) {
            if (i == (lowtempList.length)) {
                if (a == 0) {
                    all0 = true;
                }
                document.getElementById('num' + (a + 1)).innerHTML = '　';
                document.getElementById('name' + (a + 1)).innerHTML = '<ruby>　<rt>　</rt></ruby>';
                document.getElementById('temp' + (a + 1)).innerHTML = '　';
            } else {
                if (lowtempList[i]["temp"] == 0 && param != "temp") {
                    a--;
                    document.getElementById('table_title').innerText = "低" + getModeName(param) + "ランキング トップ" + itemCount;
                } else {
                    itemCount++;
                    if (lowtempList[i]["temp"] == Cookies.get('latesttemp')) {
                        document.getElementById('num' + (a + 1)).innerHTML = document.getElementById('num' + a).innerText;
                        itemCount--;
                    } else if (a == 0) {
                        document.getElementById('num' + (a + 1)).innerHTML = 1;
                    } else {
                        document.getElementById('num' + (a + 1)).innerHTML = Number(document.getElementById('num' + a).innerText) + 1;
                    }
                    document.getElementById('table_title').innerText = "低" + getModeName(param) + "ランキング トップ" + itemCount;
                    document.getElementById('name' + (a + 1)).innerHTML = '<ruby>' + lowtempList[i]["name"] + '<rt>' + lowtempList[i]["name_kana"] + '</rt></ruby>';
                    document.getElementById('temp' + (a + 1)).innerHTML = lowtempList[i]["temp"] + unit;
                    document.getElementById('name' + (a + 1)).setAttribute("onclick", "clickRankingName(event)");
                    document.getElementById('temp' + (a + 1)).setAttribute("onclick", "clickRankingName(event)");
                    document.getElementById('name' + (a + 1)).setAttribute("data-key", lowtempList[i]["key"]);
                    document.getElementById('temp' + (a + 1)).setAttribute("data-key", lowtempList[i]["key"]);
                    Cookies.set('latesttemp', lowtempList[i]["temp"]);
                }
                i++;
            }
        }
        if (all0 == true) {
            document.getElementById('num1').innerHTML = 0;
            document.getElementById('name1').innerHTML = "データがありません。"
        }
    } else if (type == 'high') {
        let i = 0;
        let itemCount = 0;
        let all0 = false;
        for (let a = 0; a < 16; a++) {
            if (i == (hightempList.length)) {
                if (a == 0) {
                    all0 = true;
                }
                document.getElementById('num' + (a + 1)).innerHTML = '　';
                document.getElementById('name' + (a + 1)).innerHTML = '<ruby>　<rt>　</rt></ruby>';
                document.getElementById('temp' + (a + 1)).innerHTML = '　';

            } else {
                if (hightempList[i]["temp"] == 0 && param != "temp") {
                    a--;
                    document.getElementById('table_title').innerText = "高" + getModeName(param) + "ランキング トップ" + itemCount;
                } else {
                    itemCount++;
                    if (hightempList[i]["temp"] == Cookies.get('latesttemp')) {
                        document.getElementById('num' + (a + 1)).innerHTML = document.getElementById('num' + a).innerText;
                        itemCount--;
                    } else if (a == 0) {
                        document.getElementById('num' + (a + 1)).innerHTML = 1;
                    } else {
                        document.getElementById('num' + (a + 1)).innerHTML = Number(document.getElementById('num' + a).innerText) + 1;
                    }
                    document.getElementById('table_title').innerText = "高" + getModeName(param) + "ランキング トップ" + itemCount;
                    document.getElementById('name' + (a + 1)).innerHTML = '<ruby>' + hightempList[i]["name"] + '<rt>' + hightempList[i]["name_kana"] + '</rt></ruby>';
                    document.getElementById('temp' + (a + 1)).innerHTML = hightempList[i]["temp"] + unit;
                    document.getElementById('name' + (a + 1)).setAttribute("onclick", "clickRankingName(event)");
                    document.getElementById('temp' + (a + 1)).setAttribute("onclick", "clickRankingName(event)");
                    document.getElementById('name' + (a + 1)).setAttribute("data-key", hightempList[i]["key"]);
                    document.getElementById('temp' + (a + 1)).setAttribute("data-key", hightempList[i]["key"]);
                    Cookies.set('latesttemp', hightempList[i]["temp"]);
                }
                i++;
            }
        }
        if (all0 == true) {
            document.getElementById('num1').innerHTML = 0;
            document.getElementById('name1').innerHTML = "データがありません。"
        }
    }
}

var YesAllData = {};
var ToAllData = {};
var ToAllDatalength = 0;
var AllData = {};

function createGraph(stationID, e) {
    console.log('createGraph(' + stationID + ', ' + e.target.kjName + '(' + e.target.knName + ')' + ')');
    YesAllData = {};
    ToAllData = {};
    ToAllDatalength = 0;
    AllData = {};
    var isToDataGetFinish = false;
    var isYesDataGetFinish = false;
    var xisTooltipDisplay = false;
    document.getElementById('tempChartBacktooltip').classList.add("on");

    document.getElementById('tempChartBackreload').addEventListener("click", () => {
        createGraph(stationID, e);
        return;
    });
    document.getElementById('tempChartBacktooltip').addEventListener("click", () => {
        if (xisTooltipDisplay == false) {
            xisTooltipDisplay = true;
            document.getElementById('tempChartBacktooltip').classList.remove("on");
        } else {
            xisTooltipDisplay = false;
            document.getElementById('tempChartBacktooltip').classList.add("on");
        }
        AllDataContinue(true, true);
    });

    var Toyear = graphDate.getFullYear();
    var Tomonth = ('0' + (graphDate.getMonth() + 1)).slice(-2);
    var Todate = ('0' + graphDate.getDate()).slice(-2);
    var Tohour = ('0' + graphDate.getHours()).slice(-2);
    var Tominute = ('0' + graphDate.getMinutes()).slice(-2);
    getTodayData(stationID, Toyear, Tomonth, Todate, Tohour, Tominute);

    graphDate.setDate(graphDate.getDate() - 1);
    year = graphDate.getFullYear();
    month = ('0' + (graphDate.getMonth() + 1)).slice(-2);
    date = ('0' + graphDate.getDate()).slice(-2);
    getYesterdayData(stationID, year, month, date);
    graphDate.setDate(graphDate.getDate() + 1);

    document.getElementById('tempChartWait').classList.add('display');

    function ToAllDataWait(last) {
        if (last == "last") {
            setTimeout(() => {
                console.log("Todaygetdata successful.");
                // console.log(ToAllData);
                isToDataGetFinish = true;
                AllDataContinue(isToDataGetFinish, isYesDataGetFinish);
            }, 300);
        } else {
            setTimeout(() => {
                if (Object.keys(ToAllData).length == ToAllDatalength) {
                    ToAllDataWait("last");
                } else {
                    ToAllDataWait();
                    // console.log(ToAllData);
                }
            }, 300);
        }
    }
    ToAllDataWait();

    function YesAllDataWait(last) {
        if (last == "last") {
            setTimeout(() => {
                console.log("Yesterdaygetdata successful.");
                // console.log(YesAllData);
                isYesDataGetFinish = true;
                AllDataContinue(isToDataGetFinish, isYesDataGetFinish);
            }, 300);
        } else {
            setTimeout(() => {
                if (Object.keys(YesAllData).length == 144) {
                    YesAllDataWait("last");
                } else {
                    YesAllDataWait();
                    // console.log(YesAllData);
                }
            }, 300);
        }
    }
    YesAllDataWait();

    function AllDataContinue(To, Yes) {
        if (To != true || Yes != true) { return; }
        document.getElementById('tempChartWait').classList.remove('display');
        var ToTempData = [];
        var YesTempData = [];
        var ToTempHigh = -100000;
        var ToTempHighArr = "----";
        var ToTempLow = 100000;
        var ToTempLowArr = "----";
        var YesTempHigh = -100000;
        var YesTempHighArr = "----";
        var YesTempLow = 100000;
        var YesTempLowArr = "----";
        if (param == "snow" || param == "snow1h" || param == "snow6h" || param == "snow12h" || param == "snow24h") {
            var keys = ["0000", "0100", "0200", "0300", "0400", "0500", "0600", "0700", "0800", "0900", "1000", "1100", "1200", "1300", "1400", "1500", "1600", "1700", "1800", "1900", "2000", "2100", "2200", "2300"];
        } else {
            var keys = ["0000", "0010", "0020", "0030", "0040", "0050", "0100", "0110", "0120", "0130", "0140", "0150", "0200", "0210", "0220", "0230", "0240", "0250",
                "0300", "0310", "0320", "0330", "0340", "0350", "0400", "0410", "0420", "0430", "0440", "0450", "0500", "0510", "0520", "0530", "0540", "0550",
                "0600", "0610", "0620", "0630", "0640", "0650", "0700", "0710", "0720", "0730", "0740", "0750", "0800", "0810", "0820", "0830", "0840", "0850",
                "0900", "0910", "0920", "0930", "0940", "0950", "1000", "1010", "1020", "1030", "1040", "1050", "1100", "1110", "1120", "1130", "1140", "1150",
                "1200", "1210", "1220", "1230", "1240", "1250", "1300", "1310", "1320", "1330", "1340", "1350", "1400", "1410", "1420", "1430", "1440", "1450",
                "1500", "1510", "1520", "1530", "1540", "1550", "1600", "1610", "1620", "1630", "1640", "1650", "1700", "1710", "1720", "1730", "1740", "1750",
                "1800", "1810", "1820", "1830", "1840", "1850", "1900", "1910", "1920", "1930", "1940", "1950", "2000", "2010", "2020", "2030", "2040", "2050",
                "2100", "2110", "2120", "2130", "2140", "2150", "2200", "2210", "2220", "2230", "2240", "2250", "2300", "2310", "2320", "2330", "2340", "2350"];
        }



        for (let i = 0; i < ToAllDatalength; i++) {
            if (ToAllData[keys[i]]) {
                if (ToAllData[keys[i]][param]) {
                    ToTempData.push(ToAllData[keys[i]][param][0]);
                    if (ToAllData[keys[i]][param][0] >= ToTempHigh) {
                        ToTempHigh = ToAllData[keys[i]][param][0];
                        ToTempHighArr = keys[i];
                    }
                    if (ToAllData[keys[i]][param][0] <= ToTempLow) {
                        ToTempLow = ToAllData[keys[i]][param][0];
                        ToTempLowArr = keys[i];
                    }
                } else {
                    ToTempData.push(null);
                }
            } else {
                ToTempData.push(null);
            }
        }
        if (ToTempHigh == -100000 || ToTempHigh == null) { ToTempHigh = "--"; ToTempHighArr = "----"; } else { ToTempHigh = ToTempHigh.toFixed(1); }
        if (ToTempLow == 100000 || ToTempLow == null) { ToTempLow = "--"; ToTempLowArr = "----"; } else { ToTempLow = ToTempLow.toFixed(1) };

        let yesI = 0;
        keys.forEach(element => {
            if (YesAllData[element]) {
                if (YesAllData[element][param]) {
                    YesTempData.push(YesAllData[element][param][0]);
                    if (YesAllData[element][param][0] >= YesTempHigh) {
                        YesTempHigh = YesAllData[element][param][0];
                        YesTempHighArr = keys[yesI];
                    }
                    if (YesAllData[element][param][0] <= YesTempLow) {
                        YesTempLow = YesAllData[element][param][0];
                        YesTempLowArr = keys[yesI];
                    }
                } else {
                    YesTempData.push(null);
                }
            } else {
                YesTempData.push(null);
            }
            yesI++;
        });

        if (YesTempHigh == -100000 || YesTempHigh == null) { YesTempHigh = "--"; YesTempHighArr = "----"; } else { YesTempHigh = YesTempHigh.toFixed(1); }
        if (YesTempLow == 100000 || YesTempLow == null) { YesTempLow = "--"; YesTempLowArr = "----"; } else { YesTempLow = YesTempLow.toFixed(1) };


        document.getElementById('tempChartStaName').innerHTML = '<ruby>' + e.target.kjName + '<rt>' + e.target.knName + '</rt></ruby>';
        document.getElementById('tempChartLowHighTable').innerHTML = '<tr><td>最高</td><td>' + ToTempHighArr.substring(0, 2) + ":" + ToTempHighArr.substring(2, 4) + '</td><td>' + ToTempHigh + getUnit(param) + '</td></tr><tr><td>最低</td><td>' + ToTempLowArr.substring(0, 2) + ":" + ToTempLowArr.substring(2, 4) + '</td><td>' + ToTempLow + getUnit(param) + '</td></tr>';
        document.getElementById('tempChartStaTemp').innerText = '現在：' + e.target.tempUnit;

        if (typeof myChart !== "undefined") {
            myChart.destroy();
        }
        console.log(e.target.kjName + "(" + e.target.knName + ")" + stationID);
        document.getElementById('tempChartBack').classList.add("display");
        var ctx = document.getElementById('tempChart');
        var labels_data;
        if (param == "snow" || param == "snow1h" || param == "snow6h" || param == "snow12h" || param == "snow24h") {
            labels_data = ["00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
                "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"]
        } else {
            labels_data = ["00:00", "00:10", "00:20", "00:30", "00:40", "00:50", "01:00", "01:10", "01:20", "01:30", "01:40", "01:50",
                "02:00", "02:10", "02:20", "02:30", "02:40", "02:50", "03:00", "03:10", "03:20", "03:30", "03:40", "03:50",
                "04:00", "04:10", "04:20", "04:30", "04:40", "04:50", "05:00", "05:10", "05:20", "05:30", "05:40", "05:50",
                "06:00", "06:10", "06:20", "06:30", "06:40", "06:50", "07:00", "07:10", "07:20", "07:30", "07:40", "07:50",
                "08:00", "08:10", "08:20", "08:30", "08:40", "08:50", "09:00", "09:10", "09:20", "09:30", "09:40", "09:50",
                "10:00", "10:10", "10:20", "10:30", "10:40", "10:50", "11:00", "11:10", "11:20", "11:30", "11:40", "11:50",
                "12:00", "12:10", "12:20", "12:30", "12:40", "12:50", "13:00", "13:10", "13:20", "13:30", "13:40", "13:50",
                "14:00", "14:10", "14:20", "14:30", "14:40", "14:50", "15:00", "15:10", "15:20", "15:30", "15:40", "15:50",
                "16:00", "16:10", "16:20", "16:30", "16:40", "16:50", "17:00", "17:10", "17:20", "17:30", "17:40", "17:50",
                "18:00", "18:10", "18:20", "18:30", "18:40", "18:50", "19:00", "19:10", "19:20", "19:30", "19:40", "19:50",
                "20:00", "20:10", "20:20", "20:30", "20:40", "20:50", "21:00", "21:10", "21:20", "21:30", "21:40", "21:50",
                "22:00", "22:10", "22:20", "22:30", "22:40", "22:50", "23:00", "23:10", "23:20", "23:30", "23:40", "23:50"];
        }
        var data = {
            labels: labels_data,
            datasets: [{
                label: '今日の' + getModeName(param),
                data: ToTempData,
                lineTension: 0.1,
                borderColor: "#ffff55",
                // backgroundColor: "#ffff55",
                order: 1,
                borderWidth: 5
            }, {
                label: '昨日の' + getModeName(param),
                data: YesTempData,
                lineTension: 0.1,
                borderColor: "#ffffff",
                // backgroundColor: "#ffffff",
                borderDash: [8, 4],
                order: 2,
                borderWidth: 3
            }]
        };
        var options = {
            responsive: true,
            maintainAspectRatio: false,
            pointRadius: 0,
            pointHitRadius: 5,
            pointhoverBorderWidth: 0,
            pointHoverRadius: 0,
            plugins: {
                title: {
                    display: true,
                    color: "white",
                    font: { size: 20, family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'", weight: "500" },
                    padding: 10,
                    text: getModeName(param) + "の10分ごとの推移"
                },
                legend: {
                    position: "bottom",
                    labels: {
                        boxWidth: 16,
                        boxHeight: 16,
                        color: "white",
                        font: {
                            size: 18,
                            family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'", weight: "500"
                        }
                    }
                },
                tooltip: {
                    mode: "index",
                    intersect: xisTooltipDisplay,
                    titleFont: { size: 18, family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'", weight: "600" },
                    bodyFont: { size: 16, family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'", weight: "500" },
                    cornerRadius: 0,
                    displayColors: true,
                    boxPadding: 5,
                    multiKeyBackground: '#00000000',
                    caretSize: 0
                },
                annotation: {
                    annotations: {
                        time0jiku: {
                            type: 'line',
                            xMin: "00:00",
                            xMax: "00:00",
                            borderColor: '#ffffff',
                            borderWidth: 2,
                        },
                        time23jiku: {
                            type: 'line',
                            xMin: "23:50",
                            xMax: "23:50",
                            borderColor: '#ffffff',
                            borderWidth: 2,
                        },
                        jiku0: {
                            type: 'line',
                            yMin: "0",
                            yMax: "0",
                            borderColor: '#ffffff',
                            borderWidth: 2.5,
                        },
                        TodayHigh: {
                            type: 'line',
                            xMin: ToTempHighArr.substring(0, 2) + ":" + ToTempHighArr.substring(2, 4),
                            xMax: ToTempHighArr.substring(0, 2) + ":" + ToTempHighArr.substring(2, 4),
                            borderColor: '#ff5555',
                            borderWidth: 2,
                            z: 2
                        },
                        TodayLow: {
                            type: 'line',
                            xMin: ToTempLowArr.substring(0, 2) + ":" + ToTempLowArr.substring(2, 4),
                            xMax: ToTempLowArr.substring(0, 2) + ":" + ToTempLowArr.substring(2, 4),
                            borderColor: '#66aaff',
                            borderWidth: 2,
                            z: 2
                        },
                        HighLabel: {
                            type: 'label',
                            content: "最高",
                            font: { size: 18, family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'", weight: "600" },
                            color: '#ff5555',
                            backgroundColor: '#222222',
                            xValue: ToTempHighArr.substring(0, 2) + ":" + ToTempHighArr.substring(2, 4),
                            xAdjust: 22,
                            yValue: ToTempLow,
                            yAdjust: -6,
                            padding: 3,
                            textAlign: 'left',
                            z: 3
                        },
                        LowLabel: {
                            type: 'label',
                            content: "最低",
                            font: { size: 18, family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'", weight: "600" },
                            color: '#66aaff',
                            backgroundColor: '#222222',
                            xValue: ToTempLowArr.substring(0, 2) + ":" + ToTempLowArr.substring(2, 4),
                            xAdjust: 22,
                            yValue: ToTempHigh,
                            yAdjust: 6,
                            padding: 3,
                            textAlign: 'left',
                            z: 3
                        },
                        YesterdayHigh: {
                            type: 'line',
                            xMin: YesTempHighArr.substring(0, 2) + ":" + YesTempHighArr.substring(2, 4),
                            xMax: YesTempHighArr.substring(0, 2) + ":" + YesTempHighArr.substring(2, 4),
                            borderColor: '#ff5555',
                            borderWidth: 1,
                            borderDash: [8, 4],
                            z: 1
                        },
                        YesterdayLow: {
                            type: 'line',
                            xMin: YesTempLowArr.substring(0, 2) + ":" + YesTempLowArr.substring(2, 4),
                            xMax: YesTempLowArr.substring(0, 2) + ":" + YesTempLowArr.substring(2, 4),
                            borderColor: '#66aaff',
                            borderWidth: 1,
                            borderDash: [8, 4],
                            z: 1
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "時刻 (時)",
                        color: "#ffffff",
                        font: { size: 16, family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'", weight: "500" }
                    },
                    ticks: {
                        color: "#ffffff",
                        font: { size: 16, family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'", weight: "500" },
                        callback: function (tick) {
                            if (param == "snow" || param == "snow1h" || param == "snow6h" || param == "snow12h" || param == "snow24h") {
                                let arr2 = [0, 3, 6, 9, 12, 15, 18, 21];
                                if (tick == 24) {
                                    return 24;
                                } else {
                                    if (arr2.includes(Number(tick))) {
                                        return tick;
                                    } else {
                                        return "・";
                                    }
                                }
                            } else {
                                let arr2 = [0, 18, 36, 54, 72, 90, 108, 126];
                                if (tick == 143) {
                                    return 24;
                                } else {
                                    if (tick % 6 == 0) {
                                        if (arr2.includes(Number(tick))) {
                                            return tick / 6;
                                        } else {
                                            return "・";
                                        }
                                    } else {
                                        return;
                                    }
                                }
                            }
                        },
                        maxRotation: 0,
                        minRotation: 0
                    },
                    grid: { display: false, drawBorder: false }
                },
                y: {
                    title: {
                        display: true,
                        text: getModeName(param) + " (" + getUnit(param) + ")",
                        color: "#ffffff",
                        font: { size: 16, family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'", weight: "500" }
                    },
                    ticks: {
                        color: "#ffffff",
                        font: { size: 16, family: "'ヒラギノ角ゴ-Pro','Noto Sans JP'", weight: "500" }
                    },
                    grid: {
                        color: "#ffffff",
                        lineWidth: 1
                    },
                    suggestedMin: param == "pressure" ? 980 :
                        param == "normalPressure" ? 1000 :
                            param == "humidity" ? 0 :
                                param == "sun10m" ? 0 :
                                    param == "sun1h" ? 0 :
                                        param == "wind" ? 0 : 5,

                    suggestedMax: param == "pressure" ? 1030 :
                        param == "normalPressure" ? 1040 :
                            param == "humidity" ? 100 :
                                param == "sun10m" ? 10 :
                                    param == "sun1h" ? 1 :
                                        param == "wind" ? 5 : 25,
                }
            }
        };
        window.myChart = new Chart(ctx, {
            type: param == 'temp' ? 'line' :
                param == 'humidity' ? 'line' :
                    param == 'wind' ? 'line' :
                        param == 'snow' ? 'line' :
                            param == 'snow1h' ? 'bar' :
                                param == 'snow3h' ? 'bar' :
                                    param == 'snow12h' ? 'bar' :
                                        param == 'snow24h' ? 'bar' :
                                            param == 'sun10m' ? 'line' :
                                                param == 'sun1h' ? 'line' :
                                                    param == 'precipitation10m' ? 'bar' :
                                                        param == 'precipitation1h' ? 'bar' :
                                                            param == 'precipitation3h' ? 'bar' :
                                                                param == 'precipitation24h' ? 'bar' :
                                                                    param == 'pressure' ? 'line' :
                                                                        param == 'normalPressure' ? 'line' :
                                                                            'line',
            data: data,
            options: options
        });
        myChart.canvas.parentNode.style.width = (window.innerWidth / 1.3) + "px";
        myChart.canvas.parentNode.style.height = (window.innerHeight / 1.7) + "px";
    }
}
document.getElementById('tempChartBackClose').addEventListener("click", () => {
    document.getElementById('tempChartBack').classList.remove("display");
});
document.getElementById('tempChartWaitClose').addEventListener("click", () => {
    document.getElementById('tempChartWait').classList.remove("display");
});

function timeBefore(time) {
    if (time == "1d") {
        displayDate.setDate(displayDate.getDate() - 1);
    } else if ((time.indexOf("h")) !== -1) {
        time = time.replace("h", "");
        displayDate.setHours(displayDate.getHours() - Number(time));
    } else if (time == "10m") {
        time = time.replace("m", "");
        displayDate.setMinutes(displayDate.getMinutes() - Number(time));
    } else { console.log("引数\"time\"に不正な値が与えられました。"); }
    //if (((nowDate.getDate() - displayDate.getDate()) < 9) && ((displayDate.getHours()) != 0) && ((displayDate.getMinutes()) != 0)) {
    let year = displayDate.getFullYear();
    let month = ('0' + (displayDate.getMonth() + 1)).slice(-2);
    let day = ('0' + displayDate.getDate()).slice(-2);
    let hour = ('0' + displayDate.getHours()).slice(-2);
    let minute = ('0' + displayDate.getMinutes()).slice(-2);
    if (param == "snow" || param == "snow1h" || param == "snow6h" || param == "snow12h" || param == "snow24h") {
        latestTime = '' + year + month + day + hour + '0000';
    } else {
        latestTime = '' + year + month + day + hour + minute + '00';
    }
    document.getElementById('title_time').innerHTML = latestTime.substring(4, 6) + '<span class="small">月</span>' + latestTime.substring(6, 8) + '<span class="small">日</span> ' + latestTime.substring(8, 10) + '<span class="small">時</span>' + latestTime.substring(10, 12) + '<span class="small">分</span>現在';
    nowcastDate = new Date(year, month - 1, day, hour, minute, "00");
    graphDate = new Date(year, month - 1, day, hour, minute, "00");
    nowcastDate.setHours(nowcastDate.getHours() - 9);
    console.log(latestTime + ".json を取得中です…。");
    (async () => {
        const url = "https://www.jma.go.jp/bosai/amedas/data/map/" + latestTime + ".json";
        const response = await fetch(url)
            .then(response => response.json())
            .then(response => {
                tempJson = response;
                mapDraw(param, true, true);
            });
    })();
    //}
}
function timeAfter(time) {
    if (time == "1d") {
        displayDate.setDate(displayDate.getDate() + 1);
    } else if ((time.indexOf("h")) !== -1) {
        time = time.replace("h", "");
        displayDate.setHours(displayDate.getHours() + Number(time));
    } else if (time == "10m") {
        time = time.replace("m", "");
        displayDate.setMinutes(displayDate.getMinutes() + Number(time));
    } else { console.log("引数\"time\"に不正な値が与えられました。"); }
    //if (((nowDate.getDate() - displayDate.getDate()) >= 0) && ((nowDate.getHours() - displayDate.getHours()) >= 0) && ((nowDate.getMinutes() - displayDate.getMinutes()) >= 0)) {
    let year = displayDate.getFullYear();
    let month = ('0' + (displayDate.getMonth() + 1)).slice(-2);
    let day = ('0' + displayDate.getDate()).slice(-2);
    let hour = ('0' + displayDate.getHours()).slice(-2);
    let minute = ('0' + displayDate.getMinutes()).slice(-2);
    if (param == "snow" || param == "snow1h" || param == "snow6h" || param == "snow12h" || param == "snow24h") {
        latestTime = '' + year + month + day + hour + '0000';
    } else {
        latestTime = '' + year + month + day + hour + minute + '00';
    }
    document.getElementById('title_time').innerHTML = latestTime.substring(4, 6) + '<span class="small">月</span>' + latestTime.substring(6, 8) + '<span class="small">日</span> ' + latestTime.substring(8, 10) + '<span class="small">時</span>' + latestTime.substring(10, 12) + '<span class="small">分</span>現在';
    nowcastDate = new Date(year, month - 1, day, hour, minute, "00");
    graphDate = new Date(year, month - 1, day, hour, minute, "00");
    nowcastDate.setHours(displayDate.getHours() - 9);
    console.log(latestTime + ".json を取得中です…。");
    (async () => {
        const url = "https://www.jma.go.jp/bosai/amedas/data/map/" + latestTime + ".json";
        const response = await fetch(url)
            .then(response => response.json())
            .then(response => {
                tempJson = response;
                mapDraw(param, true, true);
            });
    })();
    //}
}

function clickRankingName(e) {
    const key = e.currentTarget.dataset.key;
    let data = PointList[key];
    document.getElementById('map').click();
    let lnglat = [(data["lon"][0] + data["lon"][1] / 60), (data["lat"][0] + data["lat"][1] / 60)];

    // ポップアップを表示するための疑似的なhover状態を作る
    let prop = {
        popup: '<ruby>' + data['kjName'] + '<rt>' + data['knName'] + '</rt></ruby>　' + e.currentTarget.innerText
    };
    window.hoverPopup.removeClassName('liden-popup');
    window.hoverPopup.setLngLat(lnglat).setHTML(prop.popup).addTo(map);

    goPoint(lnglat, key);
}

function goPoint(lnglat, key) {
    document.getElementById('ranking_table_close').click();
    map.flyTo({ center: lnglat, zoom: 8, duration: 1000 });
    console.log(key);

    // 強調表示用のマーカーを作成（LeafletのL.circleの代わり）
    let el = document.createElement('div');
    el.style.width = '100px';
    el.style.height = '100px';
    el.style.borderRadius = '50%';
    el.style.border = '6px dashed #000000';
    el.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
    el.style.pointerEvents = 'none';

    let important = new maplibregl.Marker({ element: el })
        .setLngLat(lnglat);

    // 点滅アニメーション
    let count = 0;
    let timer = setInterval(() => {
        if (count % 2 === 0) {
            important.addTo(map);
        } else {
            important.remove();
        }
        count++;
        if (count >= 10) {
            clearInterval(timer);
            important.remove();
        }
    }, 500);
}

document.getElementById('ranking_lowtemp').addEventListener("click", () => {
    document.getElementById('ranking_table').classList.add('display');
    ranking_create('low');
});
document.getElementById('ranking_hightemp').addEventListener("click", () => {
    document.getElementById('ranking_table').classList.add('display');
    ranking_create('high');
});
document.getElementById('ranking_table_close').addEventListener("click", () => {
    document.getElementById('ranking_table').classList.remove('display');
});
document.getElementById('reload').addEventListener("click", () => {
    TempInfo_get();
});
document.getElementById('amagumo_btn').addEventListener("click", () => {
    document.getElementById('amagumo_settings').classList.toggle('display');
    document.getElementById('amedas_settings').classList.remove('display');
});
document.getElementById('amagumo_settings_close').addEventListener("click", () => {
    document.getElementById('amagumo_settings').classList.remove('display');
});
document.getElementById('settings_btn').addEventListener("click", () => {
    document.getElementById('amedas_settings').classList.toggle('display');
    document.getElementById('amagumo_settings').classList.remove('display');
});
document.getElementById('amedas_settings_close').addEventListener("click", () => {
    document.getElementById('amedas_settings').classList.remove('display');
});
document.getElementById('amagumo_settings_checkbox_amedas').addEventListener("change", () => {
    let isChecked = document.getElementById('amagumo_settings_checkbox_amedas').checked;
    amedasMarkers.forEach(m => isChecked ? m.addTo(map) : m.remove());
    if (map.getLayer('amedas_circle')) {
        map.setLayoutProperty('amedas_circle', 'visibility', isChecked ? 'visible' : 'none');
    }
    if (map.getLayer('amedas_extrusion')) {
        map.setLayoutProperty('amedas_extrusion', 'visibility', isChecked ? 'visible' : 'none');
    }
});
document.getElementById('amagumo_settings_checkbox_mlit').addEventListener("change", () => {
    let isChecked = document.getElementById('amagumo_settings_checkbox_mlit').checked;
    if (map.getLayer('mlit_circle')) {
        map.setLayoutProperty('mlit_circle', 'visibility', isChecked ? 'visible' : 'none');
    }
    if (window.customAttrib) window.customAttrib.update();
});
document.getElementById('mlit_settings_zindex').addEventListener("input", () => {
    // let zindex = document.getElementById('mlit_settings_zindex').value;
});
document.getElementById('amagumo_settings_checkbox').addEventListener("change", () => {
    let isChecked = document.getElementById('amagumo_settings_checkbox').checked;
    if (map.getLayer('nowcast')) map.setLayoutProperty('nowcast', 'visibility', isChecked ? 'visible' : 'none');
    if (window.customAttrib) window.customAttrib.update();
});
document.getElementById('amagumo_settings_range').addEventListener("input", () => {
    let opacity = Number(document.getElementById('amagumo_settings_range').value).toFixed(2);
    document.getElementById('amagumo_settings_range_span').innerText = opacity;
});
document.getElementById('amagumo_settings_range').addEventListener("change", () => {
    let opacity = Number(document.getElementById('amagumo_settings_range_span').innerText);
    if (map.getLayer('nowcast')) map.setPaintProperty('nowcast', 'raster-opacity', opacity);
});
document.getElementById('amagumo_settings_zindex')?.addEventListener("input", () => {
    // let zindex = document.getElementById('amagumo_settings_zindex').value;
});

//雷設定 20240922追加
document.getElementById('liden_settings_checkbox').addEventListener("change", () => {
    let isChecked = document.getElementById('liden_settings_checkbox').checked;
    lidenMarkers.forEach(m => isChecked ? m.addTo(map) : m.remove());
    if (window.customAttrib) window.customAttrib.update();
});
document.getElementById('liden_settings_opacity').addEventListener("input", () => {
    let opacity = Number(document.getElementById('liden_settings_opacity').value).toFixed(2);
    document.getElementById('liden_settings_opacity_span').innerText = opacity;
});
document.getElementById('liden_settings_opacity').addEventListener("change", () => {
    let opacity = document.getElementById('liden_settings_opacity').value;
    lidenMarkers.forEach(m => { if (m.getElement()) m.getElement().style.opacity = opacity; });
});
document.getElementById('liden_settings_size').addEventListener("input", () => {
    let size = Number(document.getElementById('liden_settings_size').value).toFixed(0);
    document.getElementById('liden_settings_size_span').innerText = size + " px";
});
document.getElementById('liden_settings_size').addEventListener("change", () => {
    let size = document.getElementById('liden_settings_size').value;
    lidenMarkers.forEach(m => {
        if (m.getElement()) {
            m.getElement().style.width = size + "px";
            m.getElement().style.height = size + "px";
        }
    });
});
document.getElementById('liden_settings_zindex').addEventListener("input", () => {
    let zindex = document.getElementById('liden_settings_zindex').value;
    lidenMarkers.forEach(m => { if (m.getElement()) m.getElement().style.zIndex = zindex; });
});

document.getElementById('amagumo_settings_checkbox_title').addEventListener("click", () => {
    if (document.getElementById('title').classList.contains('display')) {
        document.getElementById('title').classList.remove('display');
    } else {
        document.getElementById('title').classList.add('display');
    }
});
document.getElementById('amagumo_settings_checkbox_hanrei').addEventListener("click", () => {
    if (document.getElementsByClassName('hanrei')[0].classList.contains('display')) {
        document.getElementsByClassName('hanrei')[0].classList.remove('display');
    } else {
        document.getElementsByClassName('hanrei')[0].classList.add('display');
    }
});

document.getElementById('liden_settings_period_10m').addEventListener("change", () => {
    TempInfo_get();
});
document.getElementById('liden_settings_period_all').addEventListener("change", () => {
    TempInfo_get();
});
document.getElementById('liden_settings_redraw').addEventListener("click", () => {
    mapDraw(param);
});

document.getElementById('autoreload').addEventListener("click", () => {
    if (autoreload_onoff == "on") {
        document.getElementsByClassName('autoreload_setsumei')[0].classList.remove('on');
        autoreload_onoff = "off";
    } else {
        document.getElementsByClassName('autoreload_setsumei')[0].classList.add('on');
        autoreload_onoff = "on";
    }
    if (document.getElementById('autoreload_num').value < 5) {
        autoreload_onoff_num = 5;
        document.getElementById('autoreload_num').value = 5;
    } else {
        autoreload_onoff_num = document.getElementById('autoreload_num').value;
    }
    interval();
});
document.getElementById('autoreload_num').addEventListener("change", () => {
    if (document.getElementById('autoreload_num').value < 5) {
        autoreload_onoff_num = 5;
        document.getElementById('autoreload_num').value = 5;
    } else {
        autoreload_onoff_num = document.getElementById('autoreload_num').value;
    }
    interval();
});

const btnsHeight = document.getElementById('btns').clientHeight;
document.documentElement.style.setProperty('--btns_height', `${btnsHeight}px`)
document.getElementById('btns_expand').addEventListener("click", () => {
    if (document.getElementById('btns_expand').classList.contains("close")) {
        document.getElementById('btns_expand').classList.remove("close");
        document.getElementById('btns').classList.remove("close");
    } else {
        document.getElementById('btns_expand').classList.add("close");
        document.getElementById('btns').classList.add("close");
    }
});

function interval() {
    autoreload_onoff_num = autoreload_onoff_num * 60 * 1000;
    if (autoreload_onoff == "on") {
        if (autoReloadInterval != null || autoReloadInterval != 0) {
            clearInterval(autoReloadInterval);
            autoReloadInterval = null;
        }
        autoReloadInterval = setInterval(() => {
            TempInfo_get();
        }, autoreload_onoff_num);
    } else {
        clearInterval(autoReloadInterval);
        autoReloadInterval = null;
    }
}

function getTodayData(stationID, year, month, date, hour, minute) {

    if (hour >= 1 || (hour >= 0 && minute >= 10)) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_00.json')
            .done(function (Today00) {
                ToAllDatalength += Object.keys(Today00).length;
                var keynum = 0;
                var keys = Object.keys(Today00);
                Object.keys(Today00).forEach(element => {
                    eval('ToAllData["' + keys[keynum].substring(8, 12) + '"] = Today00["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                    keynum++;
                });
            });
    }
    if (hour >= 4 || (hour >= 3 && minute >= 10)) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_03.json')
            .done(function (Today03) {
                ToAllDatalength += Object.keys(Today03).length;
                var keynum = 0;
                var keys = Object.keys(Today03);
                Object.keys(Today03).forEach(element => {
                    eval('ToAllData["' + keys[keynum].substring(8, 12) + '"] = Today03["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                    keynum++;
                });
            });
    }
    if (hour >= 7 || (hour >= 6 && minute >= 10)) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_06.json')
            .done(function (Today06) {
                ToAllDatalength += Object.keys(Today06).length;
                var keynum = 0;
                var keys = Object.keys(Today06);
                Object.keys(Today06).forEach(element => {
                    eval('ToAllData["' + keys[keynum].substring(8, 12) + '"] = Today06["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                    keynum++;
                });
            });
    }
    if (hour >= 10 || (hour >= 9 && minute >= 10)) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_09.json')
            .done(function (Today09) {
                ToAllDatalength += Object.keys(Today09).length;
                var keynum = 0;
                var keys = Object.keys(Today09);
                Object.keys(Today09).forEach(element => {
                    eval('ToAllData["' + keys[keynum].substring(8, 12) + '"] = Today09["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                    keynum++;
                });
            });
    }
    if (hour >= 12) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_12.json')
            .done(function (Today12) {
                ToAllDatalength += Object.keys(Today12).length;
                var keynum = 0;
                var keys = Object.keys(Today12);
                Object.keys(Today12).forEach(element => {
                    eval('ToAllData["' + keys[keynum].substring(8, 12) + '"] = Today12["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                    keynum++;
                });
            });
    }
    if (hour >= 15) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_15.json')
            .done(function (Today15) {
                ToAllDatalength += Object.keys(Today15).length;
                var keynum = 0;
                var keys = Object.keys(Today15);
                Object.keys(Today15).forEach(element => {
                    eval('ToAllData["' + keys[keynum].substring(8, 12) + '"] = Today15["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                    keynum++;
                });
            });
    }
    if (hour >= 18) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_18.json')
            .done(function (Today18) {
                ToAllDatalength += Object.keys(Today18).length;
                var keynum = 0;
                var keys = Object.keys(Today18);
                Object.keys(Today18).forEach(element => {
                    eval('ToAllData["' + keys[keynum].substring(8, 12) + '"] = Today18["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                    keynum++;
                });
            });
    }
    if (hour >= 21) {
        $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_21.json')
            .done(function (Today21) {
                ToAllDatalength += Object.keys(Today21).length;
                var keynum = 0;
                var keys = Object.keys(Today21);
                Object.keys(Today21).forEach(element => {
                    eval('ToAllData["' + keys[keynum].substring(8, 12) + '"] = Today21["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                    keynum++;
                });
            });
    }
}
function getYesterdayData(stationID, year, month, date) {
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_00.json')
        .done(function (Yesterday00) {
            var keynum = 0;
            var keys = Object.keys(Yesterday00);
            Object.keys(Yesterday00).forEach(element => {
                eval('YesAllData["' + keys[keynum].substring(8, 12) + '"] = Yesterday00["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                keynum++;
            });
        });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_03.json')
        .done(function (Yesterday03) {
            var keynum = 0;
            var keys = Object.keys(Yesterday03);
            Object.keys(Yesterday03).forEach(element => {
                eval('YesAllData["' + keys[keynum].substring(8, 12) + '"] = Yesterday03["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                keynum++;
            });
        });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_06.json')
        .done(function (Yesterday06) {
            var keynum = 0;
            var keys = Object.keys(Yesterday06);
            Object.keys(Yesterday06).forEach(element => {
                eval('YesAllData["' + keys[keynum].substring(8, 12) + '"] = Yesterday06["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                keynum++;
            });
        });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_09.json')
        .done(function (Yesterday09) {
            var keynum = 0;
            var keys = Object.keys(Yesterday09);
            Object.keys(Yesterday09).forEach(element => {
                eval('YesAllData["' + keys[keynum].substring(8, 12) + '"] = Yesterday09["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                keynum++;
            });
        });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_12.json')
        .done(function (Yesterday12) {
            var keynum = 0;
            var keys = Object.keys(Yesterday12);
            Object.keys(Yesterday12).forEach(element => {
                eval('YesAllData["' + keys[keynum].substring(8, 12) + '"] = Yesterday12["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                keynum++;
            });
        });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_15.json')
        .done(function (Yesterday15) {
            var keynum = 0;
            var keys = Object.keys(Yesterday15);
            Object.keys(Yesterday15).forEach(element => {
                eval('YesAllData["' + keys[keynum].substring(8, 12) + '"] = Yesterday15["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                keynum++;
            });
        });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_18.json')
        .done(function (Yesterday18) {
            var keynum = 0;
            var keys = Object.keys(Yesterday18);
            Object.keys(Yesterday18).forEach(element => {
                eval('YesAllData["' + keys[keynum].substring(8, 12) + '"] = Yesterday18["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                keynum++;
            });
        });
    $.getJSON('https://www.jma.go.jp/bosai/amedas/data/point/' + stationID + '/' + year + month + date + '_21.json')
        .done(function (Yesterday21) {
            var keynum = 0;
            var keys = Object.keys(Yesterday21);
            Object.keys(Yesterday21).forEach(element => {
                eval('YesAllData["' + keys[keynum].substring(8, 12) + '"] = Yesterday21["' + year + month + date + keys[keynum].substring(8, 12) + '00"]');
                keynum++;
            });
        });
}

// ホバー用ポップアップの初期化
window.hoverPopup = new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    anchor: 'left',
    offset: 0
});

// マーカーの拡大縮小に関するスタイルとイベントリスナー
const styleEl = document.createElement("style");
styleEl.textContent = `
    .amedas-marker {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .maplibregl-popup-content {
        background-color: rgba(255, 255, 255, 0.9);
        box-shadow: 0px 3px 5px 1px rgba(0, 0, 0, 0.2) !important;
        border-radius: 0 !important;
        font-family: "ヒラギノ角ゴ-Pro", sans-serif !important;
        font-weight: 600 !important;
        font-size: 1.4rem !important;
        padding: 20px 5px 0px 5px !important;
    }
    .maplibregl-popup-anchor-left .maplibregl-popup-tip { border-right-color: rgba(255, 255, 255, 0.9); }
    .maplibregl-popup-anchor-right .maplibregl-popup-tip { border-left-color: rgba(255, 255, 255, 0.9); }
    .maplibregl-popup-anchor-top .maplibregl-popup-tip { border-bottom-color: rgba(255, 255, 255, 0.9); }
    .maplibregl-popup-anchor-bottom .maplibregl-popup-tip { border-top-color: rgba(255, 255, 255, 0.9); }
    
    .maplibregl-popup-content rt {
        font-size: 0.7em !important;
    }
    .liden-popup .maplibregl-popup-content {
        font-size: 0.9rem !important;
        padding: 5px !important;
    }
`;
document.head.appendChild(styleEl);

// ズーム連動イベント設定
if (typeof map !== 'undefined') {
    map.on('zoomend', updateWindVisibility);
    map.on('move', () => {
        const zoomDisplay = document.getElementById('amedas_current_zoom_display');
        if (zoomDisplay) zoomDisplay.innerText = map.getZoom().toFixed(1);
    });
}

// 設定変更時
const thinningConfigs = [
    'amedas_settings_wind_thinning',
    'amedas_settings_wind_thinning_type',
    'amedas_settings_wind_thinning_value'
];
thinningConfigs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', updateWindVisibility);
});

// ズーム閾値スライダー
const zoomRange = document.getElementById('amedas_settings_wind_thinning_zoom');
if (zoomRange) {
    zoomRange.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value).toFixed(1);
        document.getElementById('amedas_settings_wind_thinning_zoom_val').innerText = val;
        updateWindVisibility();
    });
}

function updateWindVisibility() {
    const thinning = document.getElementById('amedas_settings_wind_thinning')?.checked || false;
    const showType = document.getElementById('amedas_settings_wind_thinning_type')?.checked || false;
    const showValue = document.getElementById('amedas_settings_wind_thinning_value')?.checked || false;
    const zoomThreshold = parseFloat(document.getElementById('amedas_settings_wind_thinning_zoom')?.value || 5.0);

    const zoom = map ? map.getZoom() : 0;
    const isWindMode = (typeof param !== 'undefined') && param === 'wind';

    if (typeof PointList === 'undefined' || !PointList) return;

    Object.entries(PointList).forEach(element => {
        const id = element[0];
        const marker = window['circle' + id];
        if (!marker || !marker.getElement()) return;

        const el = marker.getElement();
        const type = el.dataset.type;
        const value = parseFloat(el.dataset.value) || 0;

        if (isWindMode && thinning && zoom < zoomThreshold) {
            let visible = false;
            // 主要地点(A, B)判定
            if (showType && (type === 'A' || type === 'B')) {
                visible = true;
            }
            // 強風(5m/s以上)判定
            if (showValue && value >= 5.0) {
                visible = true;
            }

            el.style.display = visible ? '' : 'none';
        } else {
            el.style.display = '';
        }
    });
}

// 3Dグラフ設定リスナー
document.getElementById('amedas_settings_3d_enable')?.addEventListener("change", (e) => {
    if (e.target.checked) {
        let mlitCheck = document.getElementById('amagumo_settings_checkbox_mlit');
        if (mlitCheck) mlitCheck.checked = false;
    }
    mapDraw(param);
});
document.getElementById('amedas_settings_3d_shape')?.addEventListener("change", () => {
    mapDraw(param);
});
document.getElementById('amedas_settings_3d_height')?.addEventListener("input", (e) => {
    document.getElementById('amedas_settings_3d_height_val').innerText = e.target.value;
});
document.getElementById('amedas_settings_3d_height')?.addEventListener("change", (e) => {
    if (map.getLayer('amedas_extrusion')) {
        map.setPaintProperty('amedas_extrusion', 'fill-extrusion-height', ['*', ['get', 'value'], Number(e.target.value)]);
    }
});
document.getElementById('amedas_settings_3d_opacity')?.addEventListener("input", (e) => {
    document.getElementById('amedas_settings_3d_opacity_val').innerText = Number(e.target.value).toFixed(2);
});
document.getElementById('amedas_settings_3d_opacity')?.addEventListener("change", (e) => {
    if (map.getLayer('amedas_extrusion')) {
        map.setPaintProperty('amedas_extrusion', 'fill-extrusion-opacity', Number(e.target.value));
    }
});
document.getElementById('amedas_settings_3d_thickness')?.addEventListener("input", (e) => {
    document.getElementById('amedas_settings_3d_thickness_val').innerText = Number(e.target.value).toFixed(1);
});
document.getElementById('amedas_settings_3d_thickness')?.addEventListener("change", () => {
    mapDraw(param);
});


document.getElementById('amedas_settings_popup_color')?.addEventListener("change", () => {
    window.hoverPopup.remove();
});