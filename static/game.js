const gameState = {
    player: {
        time: 0,
        stance: 'stand'
    },
    enemies: [

    ]
}

// ----- Load Divs ----- //
const timeDiv = document.getElementById("time-slots");
const errDiv = document.getElementById("errors");
const radarDiv = document.getElementById("radar-svg-container");
const enemiesDiv = document.getElementById("enemy-list");
let enemiesRadar;

// ----- File URLS ----- //
const radarURL = "static/radar.svg";
const templatesURL = "static/templates.html"
const enemiesJSON = "static/enemies.json"


async function loadRadarGraphic() {
    let passed = true;

    try {
        const response = await fetch(radarURL);

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const svgData = await response.text();

        radarDiv.innerHTML = svgData;

        enemiesRadar = document.querySelector("#enemies");
    }
    catch (error) {
        errDiv.innerHTML += `<br><strong>Error:</strong> Failed to load content <br>
        Details: ${error.message}`;
        passed = false;
    }

    return passed;
}

async function loadTemplates() {
    try {
        const response = await fetch(templatesURL);

        if(!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const text = await response.text();
        const parser = new DOMParser();
        const templateDoc = parser.parseFromString(text, 'text/html');

        return [true, templateDoc];

    }
    catch (error) {
        errDiv.innerHTML += `<br><strong>Error:</strong> Failed to load content <br>
        Details: ${error.message}`;
        return [false];
    }
}

async function loadEnemiesJson() {
    try{
        const response = await fetch(enemiesJSON);

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const enemyData = await response.json();

        return [true, enemyData];
    }
    catch (error) {
        errDiv.innerHTML += `<br><strong>Error:</strong> Failed to load content <br>
        Details: ${error.message}`;
        return [false];
    }
}

function injectTimeTrack(templateDoc) {
    // ----- Time Slots ----- //
    timeDiv.innerHTML = '';
    const timeSlot = templateDoc.querySelector('#time-slots').querySelector('.slot');
    // timeDiv.innerHTML = timeSlot.outerHTML;
    for(let ii = 0; ii <= 7; ii++) {
        const clone = timeSlot.cloneNode(true);

        if (ii === 0) {
            clone.classList.add('active-slot');
            clone.querySelector('.time-label').innerHTML = "<h3>A</h3>";
        } else {
            clone.querySelector('.time-label').innerHTML = `<h3>${ii}</h3>`;
        }
        timeDiv.appendChild(clone);
    }
}

function spawnEnemy(templateDoc, enemiesDoc, index, pos){
    try {
        // errDiv.innerHTML += "In Spawn Enemy<br>"
        const enemyData = enemiesDoc.enemyData[index]
        enemyData.pos = pos;
        gameState.enemies.push(enemyData);
        addEnemyToInfo(templateDoc, gameState.enemies.at(-1), gameState.enemies.length);
    }
    catch (error) {
        errDiv.innerHTML += `<br><strong>Error:</strong> Failed to load content <br>
        Details: ${error.message}`;
    }
}

function addEnemyToInfo(templateDoc, enemyData, id) {
    // errDiv.innerHTML += "In Adding Enemy<br>"
    const enemyDiv = templateDoc.querySelector("#enemy-data").querySelector('.enemy');

    const enemyClone = enemyDiv.cloneNode(true)
    enemyClone.dataset.id = id;

    enemyClone.querySelector(".icon").innerHTML = enemyData.icon;
    enemyClone.querySelector(".name").innerHTML = enemyData.name;
    enemyClone.querySelector(".armor").innerHTML = enemyData.armor;
    
    const attackDiv = enemyClone.querySelector(".attack");
    // const clone = attackDiv
    enemyClone.querySelector(".attacks").innerHTML = '';

    for (const a of enemyData.attacks)
    {
        const attackClone = attackDiv.cloneNode(true);

        attackClone.querySelector(".attack-name").innerHTML = a.name;
        attackClone.querySelector(".attribute").innerHTML = a.attribute;
        attackClone.querySelector(".range").innerHTML = a.range;
        attackClone.querySelector(".power").innerHTML = "P" + a.power;
        attackClone.querySelector(".time").innerHTML = "T" + a.time;

        enemyClone.querySelector(".attacks").appendChild(attackClone);
    }

    enemiesDiv.appendChild(enemyClone);
}

document.addEventListener("DOMContentLoaded", async function() {
    errDiv.innerHTML = '';
    let [radarLoaded, templateData, enemiesData] = await Promise.all([loadRadarGraphic(), loadTemplates(), loadEnemiesJson()]);

    if (radarLoaded && templateData[0] && enemiesData[0])
    {
        const templateDoc = templateData[1];
        const enemyDoc = enemiesData[1];

        injectTimeTrack(templateDoc);
        spawnEnemy(templateDoc, enemyDoc, 2, [1,2]); 
        spawnEnemy(templateDoc, enemyDoc, 1, [1,2]);
        
        render();
        
    } else {
        errDiv.innerHTML += "<br>Error Loading";
    }
})

function render() {
    enemiesRadar.innerHTML = '';

    errDiv.innerHTML += "Rendering<br>";

    for (e of gameState.enemies)
    {
        errDiv.innerHTML += `${e.name}<br>`;
        enemiesRadar.innerHTML += '<circle cx="100" cy="100" r="10" fill="var(--color-enemy)"/>';
    }
}