fetch('https://kottaro123456.com/webapps/atsusa/source/wbgt.php', {method: 'POST',headers: { 'Content-Type': 'application/json' }})
    .then(response => response.json())
    .then(res => {
    Object.entries(res.actual.data).forEach(element => {
        var random = Math.random() * 10;
        element[1]["wbgt"] = (element[1]["wbgt"] + random).toFixed(1)
    });

    console.log(JSON.stringify(res));
});