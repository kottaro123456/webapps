const mapLF = localforage.createInstance({
    driver   : localforage.INDEXEDDB,
    name     : 'webappData',
    storeName: 'map',
    version  : 1
});

L.Map.addInitHook('addHandler', 'smoothWheelZoom', L.Map.SmoothWheelZoom );

var map = L.map('map', {
    zoomSnap: 0,
    center: [37.575, 137.984],
    zoom: 5.6,
    //minZoom: 4,
    scrollWheelZoom: false,
    smoothWheelZoom: true,
    smoothSensitivity: 1.5,
    preferCanvas:false,
});
//L.control.scale({maxWidth:150,position:'bottomright',imperial:false}).addTo(map);  // スケールを表示
map.zoomControl.setPosition('topright');
map.attributionControl.addAttribution(
    "<a href='https://www.jma.go.jp/jma/index.html' target='_blank'>気象庁</a>"
);
map.attributionControl.addAttribution(
    "<a href='https://www.wbgt.env.go.jp/' target='_blank'>環境省</a>"
);

map.createPane("pane_map").style.zIndex = 1;
map.createPane("nowcast").style.zIndex = 10;
map.createPane("pane_map_2").style.zIndex = 50;
map.createPane("important").style.zIndex = 70;
map.createPane("wbgt").style.zIndex = 100;

(async () => {
    await fukenyohoukutouGet();
    await wbgtDraw();
})();

var fukenyohoukutou;

//地図データ読み込み
async function fukenyohoukutouGet() {
    await mapLF.getItem("fukenyohoukutou").then(async function(value) {
        if (value !== null) {
            // キーが存在し、値が取得できた場合
            // ストレージからデータを取得し新しく取得しない
            fukenyohoukutou = value;
            console.log("Map Loading completed: 'fukenyohoukutou', IndexedDB");
        } else {
            // キーが存在しない場合
            // 新しくデータを取得
            const response = await fetch("source/fukenyohoukutou.geojson");
            const data = await response.json();
            fukenyohoukutou = data;
            console.log("Map Loading completed: 'fukenyohoukutou', Network");
            await mapLF.setItem("fukenyohoukutou", fukenyohoukutou);
            console.log("Map Saved successfully: 'fukenyohoukutou', IndexedDB");
        }
    });

    L.geoJson(fukenyohoukutou,{
        pane: "pane_map",
        style: {
        "color": "#333533",
        "weight": 0,
        "opacity": 1,
        "fillColor": "#ffffff",
        "fillOpacity": 1,
        }
    }).addTo(map);
    L.geoJson(fukenyohoukutou,{
        pane: "pane_map_2",
        style: {
        "color": "#333533",
        "weight": 1,
        "opacity": 1,
        "fillOpacity": 0,
        }
    }).addTo(map);
}

var wbgt = L.layerGroup();

async function wbgtDraw() {
    $.getJSON("source/wbgt.php", function(data) {
        var latestTime = data.actual.time;
        document.getElementById('title_time').innerHTML = latestTime.substring(5,7)+'<span class="small">月</span>'+latestTime.substring(8,10)+'<span class="small">日</span> '+latestTime.substring(11,13)+'<span class="small">時</span>'+latestTime.substring(14,16)+'<span class="small">分</span>現在';

        map.removeLayer(wbgt);
        wbgt = L.layerGroup();
    
        // console.log(data.actual.data);
        Object.entries(data.actual.data).forEach(element => {
            var wbgt_latlng = new L.LatLng(element[1]["lat"], element[1]["lon"]);
            var circle = L.circle(wbgt_latlng, {pane: "wbgt", radius:8000, weight: 1.5,opacity:1,popupAnchor: [0,-50],fillColor: getColor_wbgtBack(element[1]['wbgt']),fillOpacity:1,color:getColor_wbgtFore(element[1]['wbgt'])});
            circle.bindTooltip('<ruby>'+element[1]["name"] + '<rt>' + moji(element[1]['yomi']).convert("HKtoZK").convert("KKtoHG").toString() + '</rt></ruby>　'+element[1]['wbgt'].toFixed(1),{direction: 'auto', permanent: false, sticky: false, className: "tooltip_wbgt"+getNum_wbgtTooltip(element[1]['wbgt'])});
            wbgt.addLayer(circle);
        });
    
        map.addLayer(wbgt);
    });
}


var koushin_ok;
var koushin;
document.getElementById('reload').addEventListener("click",()=>{
    clearTimeout(koushin);
    clearTimeout(koushin_ok);
    wbgtDraw();
    document.getElementById('reload').innerText = "更新中…";
    koushin = setTimeout(() => {
        document.getElementById('reload').innerText = "更新完了";
        koushin_ok = setTimeout(() => {
            document.getElementById('reload').innerText = "情報更新";
        }, 1000);
    }, 1000);
});

function getColor_wbgtBack(d) {
    return d >= 31 ? '#FF1100' :
            d >= 28  ? '#FF8800' :
            d >= 25  ? '#FAF000' :
            d >= 21  ? '#7BD0FF' :
                        '#1952ff';
}
function getColor_wbgtFore(d) {
    return d >= 31 ? '#000000' :
            d >= 28  ? '#000000' :
            d >= 25  ? '#000000' :
            d >= 21  ? '#000000' :
                        '#000000';
}
function getNum_wbgtTooltip(d) {
    return d >= 31 ? 1 :
            d >= 28  ? 2 :
            d >= 25  ? 3 :
            d >= 21  ? 4 :
                        5;
}