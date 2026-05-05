const gameState = {
    currentWave: 1,
    player: {
        time: 0,
        timeDelay: 0,
        stance: 'stand',
        mounts: {},
        bodyParts: {}
    },
    enemies: [

    ]
}

// ----- Load Divs ----- //
const timeDiv = document.getElementById("time-slots");
const waveDiv = document.getElementById("wave-container")
const errDiv = document.getElementById("errors");
const radarDiv = document.getElementById("radar-svg-container");
const enemiesDiv = document.getElementById("enemy-list");
const controlsDiv = document.getElementById("controls-container");
let enemiesRadar;

// ----- File URLS ----- //
const radarURL = "static/radar.svg";
const templatesURL = "static/templates.html"
const gameDataJSON = "static/data.json"

let gameDoc;


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
        pushMsg(`<strong>Error:</strong> Failed to load content <br>
            Details: ${error.message}`);
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
        pushMsg(`<strong>Error:</strong> Failed to load content <br>
            Details: ${error.message}`);
        return [false];
    }
}

async function loadDataJSON() {
    try{
        const response = await fetch(gameDataJSON);

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const gameData = await response.json();

        return [true, gameData];
    }
    catch (error) {
        pushMsg(`<strong>Error:</strong> Failed to load content <br>
            Details: ${error.message}`);
        return [false];
    }
}

function injectTimeTrack() {
    const timeSlot = document.getElementById('time-slot-template');
    // ----- Wave Slows ----- //
    // for(let ii=1; ii <= 4; ii++)
    // {
    //     const clone = timeSlot.content.cloneNode(true);
    //     clone.querySelector('.slot').querySelector('.time-label').innerHTML = `<h3>${ii}</h3>`

    //     waveDiv.appendChild(clone);
    // }

    // ----- Time Slots ----- //
    timeDiv.innerHTML = '';
    try{
        
        // timeDiv.innerHTML = timeSlot.outerHTML;
        for(let ii = 0; ii <= 7; ii++) {
            const clone = timeSlot.content.cloneNode(true);
            const slot = clone.querySelector('.slot');

            if (ii === 0) {
                slot.classList.add('active-slot');
                slot.querySelector('.time-label').innerHTML = "<h3>A</h3>";
            } else {
                slot.querySelector('.time-label').innerHTML = `<h3>${ii}</h3>`;
            }
            timeDiv.appendChild(clone);
        }
    }catch (error) {
        pushMsg(`<strong>Error:</strong> Failed to load content <br>
            Details: ${error.message}`);
        return [false];
    }
    
}

function spawnEnemy(index, pos){
    try {
        errDiv.innerHTML += "In Spawn Enemy<br>"
        const enemyData = gameDoc.enemyData[index]
        enemyData.pos = pos;
        gameState.enemies.push(enemyData);
        enemyData.time = 0;
        enemyData.id = gameState.enemies.length-1;
        addEnemyToInfo(gameState.enemies.at(-1), gameState.enemies.length-1);
    }
    catch (error) {
        pushMsg(`<strong>Error:</strong> Failed to load content <br>
            Details: ${error.message}<br>
            ${gameState.enemies[-1]}`);
    }
}

function removeEnemy(target) {
    const element = target.parentElement.parentElement;
    const id = element.dataset.id
    deleteEnemy(id);
}

function deleteEnemy(id) {
    const enemy = gameState.enemies[id];
    if (!enemy) return;

    // 1. Remove their token from the time track
    const token = document.querySelector(`.time-token[data-label="${enemy.icon}"]`);
    if (token) token.remove();

    // 2. Remove from gameState array
    gameState.enemies.splice(id, 1);

    // // 3. Re-index remaining enemies
    // This is vital because the dataset.id in the HTML relies on the array index
    gameState.enemies.forEach((e, index) => {
        e.id = index;
    });

    // 4. Refresh UI
    render(); // Redraws radar
    loadEnemies(); // Re-generates the enemy list with correct IDs
}

function loadEnemies() {
    enemiesDiv.innerHTML = ''; // Clear current list
    var ind = 0;
    
    gameState.enemies.forEach((enemy) => {
        addEnemyToInfo(enemy, ind);
        ind++;
    });
}

function addEnemyToInfo(enemyData, id) {
    // pushMsg(`In Adding Enemy<br>${enemyData.name}`);
    const enemyTemplate = document.getElementById('enemy-data-template');
    const enemyFragment = enemyTemplate.content.cloneNode(true);
    const enemyCard = enemyFragment.querySelector('.enemy');

    enemyCard.dataset.id = id;

    enemyCard.querySelector(".icon").innerHTML = enemyData.icon;
    enemyCard.querySelector(".name").innerHTML = enemyData.name;
    enemyCard.querySelector(".armor").innerHTML = enemyData.armor;
    
    const attackDiv = document.getElementById('enemy-attack-template').cloneNode(true);

    for (const a of enemyData.attacks)
    {
        const attackClone = attackDiv.cloneNode(true).content;

        attackClone.querySelector(".attack-name").innerHTML = a.name;
        attackClone.querySelector(".attribute").innerHTML = a.attribute;
        attackClone.querySelector(".range").innerHTML = a.range;
        attackClone.querySelector(".power").innerHTML = "P" + a.power;
        attackClone.querySelector(".time").innerHTML = "T" + a.time;

        for (let p = 0; p < a.pips; p++) {
            addPip(attackClone.querySelector('.pips'))
            // attackClone.querySelector(".pips").innerHTML += "<div class='pip'></div>";
        }

        enemyCard.querySelector(".attacks").appendChild(attackClone);
    }

    enemiesDiv.appendChild(enemyFragment);
}

function loadPlayer() {
    // Mount Torso
    const torsoFrag = document.getElementById('torso-row-template').content;
    const torso = document.getElementById('torso')
    torso.querySelector('.armor').innerHTML = gameState.player.bodyParts.torso.armor;

    gameState.player.bodyParts.torso.injuries.forEach((a) => {
        const torsoRowClone = torsoFrag.cloneNode(true);
        torsoRowClone.querySelector('.effect').innerHTML = a;
        
        addPip(torsoRowClone.querySelector('.pips'))

        torso.querySelector('.body-slot').appendChild(torsoRowClone);
    });

    // Mount Legs
    const legsFrag = document.getElementById('leg-row-template').content;
    const legs = document.getElementById('legs')
    legs.querySelector('.armor').innerHTML = gameState.player.bodyParts.legs.armor;

    gameState.player.bodyParts.legs.actions.forEach((a) => {
        const legsRowClone = legsFrag.cloneNode(true);
        legsRowClone.querySelector('.name').innerHTML = a.name;
        legsRowClone.querySelector('.time').innerHTML = "T"+a.time;
        for(let p = 0; p < a.pips; p++)
        {
            addPip(legsRowClone.querySelector('.pips'))
        }
        legs.querySelector('.body-slot').appendChild(legsRowClone);
    });
    

    // Mount Weapons
    Object.keys(gameState.player.mounts).forEach(function(key) {
        const mountDiv = document.getElementById(`${key}`).querySelector('.weapon-slot')
        const weaponSlotFrag = document.getElementById('weapon-slot-template').content.cloneNode(true);
        
        w = gameState.player.mounts[key];

        weaponSlotFrag.querySelector('.weapon-header').querySelector('.name').innerHTML = w.name;
        weaponSlotFrag.querySelector('.weapon-header').querySelector('.attribute').innerHTML = w.attribute;
        weaponSlotFrag.querySelector('.weapon-header').querySelector('.armor').innerHTML = w.armor;
        
        weaponSlotFrag.querySelector('.info-sidebar').querySelector('.weight').innerHTML = w.weight;
        weaponSlotFrag.querySelector('.info-sidebar').querySelector('.arc').innerHTML = w.arc;
        weaponSlotFrag.querySelector('.info-sidebar').querySelector('.range').innerHTML = w.range;

        const attackTemplate = document.getElementById('attack-row-template').content;

        for (const a of w.attacks) {
            const attackFrag = attackTemplate.cloneNode(true);
            const attackDiv = attackFrag.querySelector('.attack');

            attackDiv.querySelector('.attack-name').innerHTML = a.name;
            attackDiv.querySelector('.power').innerHTML = `P${a.power}`;
            attackDiv.querySelector('.time').innerHTML = `T${a.time}`;

            for (let p = 0; p < a.pips; p++) {
                addPip(attackDiv.querySelector('.pips'))
                // attackDiv.querySelector('.pips').innerHTML += "<div class='pip'></div>";
            }
            weaponSlotFrag.querySelector('.attacks-container').appendChild(attackDiv);
        }

        mountDiv.appendChild(weaponSlotFrag);
    });
}

function addPip(div){
    const pip = document.getElementById('pip-template');
    const pipClone = pip.content.cloneNode(true)


    // pipClone.querySelector('.pip').addEventListener('click', (e) => togglePipClass(e));

    div.appendChild(pipClone);
}

function placeTokenOnTrack(slotIndex, label, color) {
    const allSlots = document.querySelectorAll('#time-slots .time-slot');
    const targetSlot = allSlots[slotIndex];

    if (!targetSlot) return;

    // Check if a token for this entity already exists on the track and remove it
    const existingToken = document.querySelector(`.time-token[data-label="${label}"]`);
    if (existingToken) existingToken.remove();

    // Create new token
    const token = document.createElement('div');
    token.className = 'time-token';
    token.dataset.label = label;
    token.innerText = label;
    token.style.background = 'black';
    token.style.border = `1px solid ${color}`;
    token.style.color = color;
    token.style.width = '20px';
    token.style.height = '20px';
    token.style.borderRadius = '50%';
    token.style.display = 'inline-flex';
    token.style.alignItems = 'center';
    token.style.justifyContent = 'center';
    token.style.fontSize = '12px';
    token.style.margin = '2px';

    targetSlot.appendChild(token);
}

function controlClickEvent(event) {
    const target = event.target;

    // 1. Handle Pips
    if (target.classList.contains('pip')) {
        target.classList.toggle('filled');
        event.stopPropagation();
        return;
    }

    // 2. Handle Attack Clicks
    const attackRow = target.closest('.attack');
    if (attackRow) {
        const timeElement = attackRow.querySelector('.time');
        if (!timeElement) return;

        // Parse "TX" into integer X
        const actionTime = parseInt(timeElement.innerText.replace('T', ''));
        
        // Check if this attack belongs to an enemy
        const enemyContainer = target.closest('.enemy');

        if (enemyContainer) {
            // ENEMY LOGIC: Place specific enemy token at exactly ActionTime slot
            const enemyId = enemyContainer.dataset.id;
            const enemyIcon = gameState.enemies[enemyId].icon;
            gameState.enemies[enemyId].time = actionTime;

            enemyContainer.querySelectorAll('.active-indicator').forEach(el => el.classList.remove('active'));
            attackRow.querySelector('.active-indicator').classList.add('active');

            placeTokenOnTrack(actionTime, enemyIcon, 'var(--color-enemy)');
        } else {
            // PLAYER LOGIC: Current Time + Action Time + Delay
            const scheduledSlot = actionTime + gameState.player.timeDelay;
            gameState.player.time = scheduledSlot;

            document.querySelectorAll('#controls-container .active-indicator').forEach(el => {
                // Check if this indicator is NOT inside an enemy container
                if (!el.closest('.enemy')) el.classList.remove('active');
            });
            attackRow.querySelector('.active-indicator').classList.add('active');

            placeTokenOnTrack(scheduledSlot, 'P', 'var(--color-console-green)');
        }
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    sendMsg('');
    let [radarLoaded, templateData, gameData] = await Promise.all([loadRadarGraphic(), loadTemplates(), loadDataJSON()]);

    document.getElementById('controls').addEventListener('click', (e) => controlClickEvent(e));

    if (radarLoaded && templateData[0] && gameData[0])
    {
        const templateDoc = templateData[1];
        gameDoc = gameData[1];

        gameState.player.mounts = gameDoc.weaponData;
        gameState.player.bodyParts = gameDoc.body;

        injectTimeTrack();
        loadPlayer();

        render();
        
    } else {
        pushMsg("Error Loading");
    }
})

function render() {
    enemiesRadar.innerHTML = '';

    for (let ii = 0; ii < gameState.enemies.length; ii++) // e of gameState.enemies)
    {
        const e = gameState.enemies[ii];
        const arc = e.pos[0];
        const rng = e.pos[1];
        l = rng*50 + 25;
        a = (-45*arc) + 257.5 - ii*10;
        x = 200 + l * Math.cos((Math.PI / 180) * a)
        y = 200 - l * Math.sin((Math.PI / 180) * a)
        enemiesRadar.innerHTML += `<circle cx="${x}" cy="${y}" r="10" fill="var(--color-enemy)" filter="url(#glow)"/>`;
        enemiesRadar.innerHTML += `
        <text 
            x="${x}" 
            y="${y}" 
            text-anchor="middle" 
            dy=".35em" 
            font-size="12" 
            font-weight="bold" 
            fill="black">
            ${e.icon}
        </text>`;
    }
}

function enemyMove(target, direction){
    
    const enemy = target.parentElement.parentElement;
    const id = enemy.dataset.id;

    enemyMoveID(id, direction);
}

function adjustEnemyTime(target, delta){
    
    const enemy = target.parentElement.parentElement;
    const id = enemy.dataset.id;
    gameState.enemies[id].time = Math.max(0, Math.min(gameState.enemies[id].time + delta))
    
    placeTokenOnTrack(gameState.enemies[id].time, gameState.enemies[id].icon, 'var(--color-enemy)');
}

function enemyMoveID(id, direction) {
    const pos = gameState.enemies[id].pos;

    if (direction === 'forward') {
        gameState.enemies[id].pos[1] -= pos[1] > 0 ? 1 : 0;
    } else if (direction === 'backward') {
        gameState.enemies[id].pos[1] += pos[1] < 3 ? 1 : 0;
    } else if (direction === 'clws') {
        gameState.enemies[id].pos[0] = pos[0] < 8 ? pos[0] + 1 : 1;
    } else if (direction === 'cclws') {
        gameState.enemies[id].pos[0] = pos[0] > 1 ? pos[0] - 1 : 8;
    }

    render();
}

function advanceTime() {

    if (gameState.enemies.length > 0) {
            gameState.player.time -= gameState.player.time > 0 ? 1 : 0;
        placeTokenOnTrack(gameState.player.time, 'P', 'var(--color-console-green)');

        for (const e of gameState.enemies) {
            e.time -= e.time > 0 ? 1 : 0
            placeTokenOnTrack(e.time, e.icon, 'var(--color-enemy)');
        }
    } else {
        const waveNumber = parseInt(document.getElementById('wave-number').innerText) + 1;
        generateWave(waveNumber);
    }

};

function movePlayer(direction){
    if(direction === 'forward') {
        for (const e of gameState.enemies) {
            if ((e.pos[0] === 3) || (e.pos[0] === 4))
            {
                enemyMoveID(e.id, 'forward')
            } else if ((e.pos[0] === 7) || (e.pos[0] === 8)) {
                enemyMoveID(e.id, 'backward')
            } else if ((e.pos[0] === 1) || (e.pos[0] === 2)) {
                enemyMoveID(e.id, 'cclws')
            }else if ((e.pos[0] === 5) || (e.pos[0] === 6)) {
                enemyMoveID(e.id, 'clws')
            }
            
        }
    } else if(direction === 'backward') {
        for (const e of gameState.enemies) {
            if ((e.pos[0] === 3) || (e.pos[0] === 4))
            {
                enemyMoveID(e.id, 'backward')
            } else if ((e.pos[0] === 7) || (e.pos[0] === 8)) {
                enemyMoveID(e.id, 'forward')
            } else if ((e.pos[0] === 1) || (e.pos[0] === 2)) {
                enemyMoveID(e.id, 'clws')
            }else if ((e.pos[0] === 5) || (e.pos[0] === 6)) {
                enemyMoveID(e.id, 'cclws')
            }
        }
    } else if(direction === 'clws') {
        for (const e of gameState.enemies) {
                enemyMoveID(e.id, 'cclws')
        }
    } else if(direction === 'cclws') {
        for (const e of gameState.enemies) {
                enemyMoveID(e.id, 'clws')
        }
    } 
}

function rollDice() {
    const count = document.getElementById('dice-count').value;
    const container = document.getElementById('dice-pool');
    container.innerHTML = ''; // Clear old dice

    for (let i = 0; i < count; i++) {
        createDie(container);
    }
}

// Mapping of die values to grid positions (0-8)
const pipPositions = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
};

function createDie(container) {
    const die = document.createElement('div');
    die.className = 'die';
    
    const rollValue = () => {
        const val = Math.floor(Math.random() * 6) + 1;
        renderPips(die, val);
        updateDieSuccess(die, val);
    };

    die.onclick = rollValue;
    rollValue(); // Initial roll
    container.appendChild(die);
}

function renderPips(dieElement, value) {
    dieElement.innerHTML = ''; // Clear current pips
    
    // Create 9 potential slots
    for (let i = 0; i < 9; i++) {
        const slot = document.createElement('div');
        if (pipPositions[value].includes(i)) {
            const pip = document.createElement('div');
            pip.className = 'die-pip';
            slot.appendChild(pip);
        }
        dieElement.appendChild(slot);
    }
}

function updateDieSuccess(dieElement, value) {
    const threshold = document.getElementById('armor-threshold').value;
    if (value >= threshold) {
        dieElement.classList.add('success');
    } else {
        dieElement.classList.remove('success');
    }
}

function updateDieSuccess(dieElement, value) {
    const threshold = document.getElementById('armor-threshold').value;
    if (value >= threshold) {
        dieElement.classList.add('success');
    } else {
        dieElement.classList.remove('success');
    }
}

// The current pool of available tokens
let tokenPool = [0, 1, 2]; 

function generateWave(waveNumber) {
    gameState.currentWave = waveNumber;
    document.getElementById('wave-number').innerText = waveNumber;
    gameState.enemies = []; // Clear existing enemies
    
    let tokensToDraw = [];
    
    if (waveNumber === 1) {
        tokenPool = [0, 1, 2]; // [cite: 284]
        tokensToDraw = drawTokens(1);
    } else if (waveNumber === 2) {
        tokenPool = [0, 1, 2, 3, 4]; // [cite: 306]
        tokensToDraw = drawTokens(2);
    } else if (waveNumber === 3) {
        // tokenPool = ["H", "F", "J", "R"]; // Remove B [cite: 311]
        tokensToDraw = [5, ...drawTokens(2)]; // Tank is guaranteed [cite: 312]
    } else if (waveNumber === 4) {  
        tokenPool = [1, 2, 3, 4, 5]; // [cite: 316]
        tokensToDraw = [6, ...drawTokens(2)]; // Boss Mech is guaranteed [cite: 317]
    }

    tokensToDraw.forEach(tokenId => {
        const arc = Math.round(5*Math.random())+1;
        spawnEnemy(tokenId, [arc, 3]);
    });
    
    render();
}

function drawTokens(count) {
    let drawn = [];
    for (let i = 0; i < count; i++) {
        let selection = tokenPool[Math.floor(Math.random() * tokenPool.length)];
        drawn.push(selection);
        
        // "If you drew the 'B' token you must draw an additional token" [cite: 288, 308]
        if (selection === 0) {
            let bonus = tokenPool[Math.floor(Math.random() * tokenPool.length)];
            drawn.push(bonus);
        }
    }
    return drawn;
}

function sendMsg(string) {
    errDiv.innerHTML = string; 
}

function pushMsg(string) {
    errDiv.innerHTML += `${string}\n`;
}