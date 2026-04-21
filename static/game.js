const gameState = {
    player: { 
        time: 0, 
        zone: 1, 
        range: 0, 
        stance: 'stand', 
        reflex: true 
    },
    enemies: [
        { id: 'H', zone: 1, range: 3, time: 2, color: 'red' },
        { id: 'F', zone: 6, range: 2, time: 5, color: 'orange' }
    ],
    history: []
};

function advanceTime() {
    // Find how many steps to the next activation
    const minTime = Math.min(gameState.player.time, ...gameState.enemies.map(e => e.time));
    
    // Move all cubes down
    gameState.player.time -= minTime;
    gameState.enemies.forEach(e => e.time -= minTime);

    // Check for collisions
    if (gameState.player.time === 0) {
        if (gameState.player.reflex) {
            log("Player activates first via Reflex!");
        } else if (gameState.enemies.some(e => e.time === 0)) {
            log("Enemies activate before Player.");
        }
    }
    render();
}

function movePlayer(type) {
    gameState.enemies.forEach(enemy => {
        if (type === 'forward') {
            console.log("Moving Forward");
            // Zone 3 & 4 move toward center
            if ([3, 4].includes(enemy.zone) && enemy.range > 0) enemy.range--;
            // Zone 7 & 8 move further away or stay
            else if ([7, 8].includes(enemy.zone) && enemy.range < 3) enemy.range++;
        }
        else if (type === 'backward') {
            console.log("Moving Forward");
            // Zone 3 & 4 move toward center
            if ([3, 4].includes(enemy.zone) && enemy.range < 3) enemy.range++;
            // Zone 7 & 8 move further away or stay
            else if ([7, 8].includes(enemy.zone) && enemy.range > 0) enemy.range--;
        }
        else if (type === 'turn-cw') {
            console.log("Turning CW");
            // Turn all enemies clockwise
            enemy.zone = enemy.zone === 1 ? 8 : enemy.zone - 1;
            
        }
        else if (type === 'turn-ccw') {
            console.log("Turning CCW");
            // Turn all enemies clockwise
            enemy.zone = enemy.zone === 8 ? 1 : enemy.zone + 1;
        }
    });
    // Action has a T-cost (example T2)
    gameState.player.time = 2; 
    render();
}

function render() {
    const enemyContainer = document.getElementById('enemies');
    enemyContainer.innerHTML = '';
    
    gameState.enemies.forEach(e => {
        const token = document.createElement('div');
        token.className = 'enemy-token';
        token.style.backgroundColor = e.color;
        
        // Convert Radial (zone/range) to XY for CSS positioning
        const angle = (-45 * (e.zone - 1) + 22.5) * (Math.PI / 180);
        const dist = e.range * 12.5 + 6.25;
        token.style.left = `${50 - Math.cos(angle) * dist}%`;
        token.style.top = `${50 + Math.sin(angle) * dist}%`;
        
        enemyContainer.appendChild(token);
    });
}

function log(msg) {
    const l = document.getElementById('log');
    l.innerHTML = `<div>> ${msg}</div>` + l.innerHTML;
}

render();