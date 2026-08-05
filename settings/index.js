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
var mapUrlList = ["https://kottaro123456.github.io/geojsons/asia.geojson", "https://kottaro123456.github.io/geojsons/cities.geojson", "https://kottaro123456.github.io/geojsons/countries.geojson", "https://kottaro123456.com/webapps/atsusa/source/fukenyohoukutou.geojson", "https://kottaro123456.github.io/geojsons/pref.geojson", "https://kottaro123456.github.io/geojsons/saibun.geojson", "https://kottaro123456.github.io/geojsons/warningCities.geojson", "https://kottaro123456.github.io/geojsons/warningPref.geojson"];
var mapFamilyList = ["アジア", "市区町村", "世界(アジア除く)", "府県予報区", "都道府県", "細分区域", "市区町村(塗りつぶし用)", "都道府県(塗りつぶし用)"];
var mapSizeList = ["1.22", "10.0", "0.31", "2.42", "3.42", "6.45", "5.12", "2.42"];

async function newFont() {
    reloadON();
    await fontSettingsLF.setItem(`loadFont`, true);
    await fontSettingsLF.setItem(`loadFont_useFont`, true);

    if (typeof syncAndLoadFonts === "function") {
        await syncAndLoadFonts();
    }
    document.getElementById('set_font1_switch').checked = true;
    reloadOFF();
}

async function deleteFont() {
    if (!confirm("保存されているフォントを削除しますか？\nフォント保存設定もオフになります。")) return;

    reloadON();

    try {
        // 設定をオフにする
        await fontSettingsLF.setItem(`loadFont`, false);
        await fontSettingsLF.setItem(`loadFont_useFont`, false);
        await fontSettingsLF.removeItem('serverFontList');

        // 全てのフォントデータを削除
        await fontLF.clear();

        document.getElementById('set_font1_switch').checked = false;

        // 完了後に再読み込みして状態を反映せずにテーブルのみ更新
        if (typeof renderFontTable === "function" && typeof phpFontList !== "undefined") {
            await renderFontTable(phpFontList);
        }
        reloadOFF();
    } catch (e) {
        console.error("Font deletion failed:", e);
        alert("削除に失敗しました。");
        reloadOFF();
    }
}


// 地図部分
async function createMapTable() {
    var tableHTML = `<table class="table_1"><tr align="center"><td>地図名</td><td>管理名</td><td>サイズ</td></tr>`;

    for (let i = 0; i < mapNameList.length; i++) {

        var mapName = mapNameList[i];
        var mapFamily = mapFamilyList[i];
        var mapSize = mapSizeList[i];

        // localForageからフォントデータを取得
        var existingMapData = await mapLF.getItem(mapName);

        if (existingMapData) {
            tableHTML += `<tr><td>${mapFamily}</td><td>${mapName}</td><td>約 ${mapSize} MB</td></tr>`;
        }
    }

    tableHTML += `</table>`;
    document.getElementById('mapTable').innerHTML = tableHTML;
};
async function newMap() {
    document.getElementById('mapTable').innerHTML = "";
    reloadON();

    for (let i = 0; i < mapNameList.length; i++) {
        var mapName = mapNameList[i];
        var mapURL = mapUrlList[i];

        try {
            var response = await fetch(mapURL);
            console.log(`Map Loading completed: '${mapName}', Network`);
            var mapData = await response.json();

            await mapLF.setItem(mapName, mapData);
            console.log(`Map saved successfully: '${mapName}', IndexedDB`);
        } catch (error) {
            console.error(`Map Loading failed: '${mapName}', Network\n${error}`);
        }
    }

    createMapTable();
    reloadOFF();
}
async function deleteMap() {
    document.getElementById('mapTable').innerHTML = "";
    reloadON();

    for (let i = 0; i < mapNameList.length; i++) {

        var mapName = mapNameList[i];

        // localForageからフォントデータを取得
        await mapLF.removeItem(mapName);
    }
    createMapTable();
    reloadOFF();
}

(async () => {
    createMapTable();
})();

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
})();

// document.getElementById('set_font2_switch').addEventListener("change", () => {
//     if (document.getElementById('set_font2_switch').checked == true) {
//         fontSettingsLF.setItem(`loadFont_useFont`, true);
//     } else {
//         fontSettingsLF.setItem(`loadFont_useFont`, false);
//     }
// });
// (async () => {
//     var result = await fontSettingsLF.getItem(`loadFont_useFont`);
//     if (result == true) {
//         document.getElementById('set_font2_switch').checked = true;
//     } else {
//         document.getElementById('set_font2_switch').checked = false;
//     }
// })();

function reloadON() {
    document.getElementById('data_reload').classList.add("display");
    document.getElementById('data_reload_bg').classList.add("display");
}
function reloadOFF() {
    document.getElementById('data_reload').classList.remove("display");
    document.getElementById('data_reload_bg').classList.remove("display");
}