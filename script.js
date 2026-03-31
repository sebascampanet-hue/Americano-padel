/**
 * Padel Pro Americano - Lògica del Projecte
 */

// Estat global de l'aplicació
let estat = {
    nomTorneig: "",
    jugadors: [],
    rondes: [],
    rondaActual: 0,
    vistaActual: "start-view"
};

// Inicialització dels inputs quan s'obre la pàgina
const nomsInit = ["Pau G.", "Marc R.", "Jordi M.", "Albert B.", "Marta S.", "Laia F.", "Anna V.", "Carme T.", "Xavi H.", "Dani A.", "Biel L.", "Sara P."];
const inputsContainer = document.getElementById('player-inputs');

if (inputsContainer) {
    for (let i = 0; i < 12; i++) {
        inputsContainer.innerHTML += `
            <div class="player-input">
                <input type="text" id="name-${i}" value="${nomsInit[i]}" spellcheck="false" onchange="guardarEstat()">
                <div class="pos-selector">
                    <button class="pos-btn ${i % 2 === 0 ? 'active' : ''}" data-pos="D" onclick="setPos(${i}, 'D')">Dreta</button>
                    <button class="pos-btn ${i % 2 !== 0 ? 'active' : ''}" data-pos="E" onclick="setPos(${i}, 'E')">Esq.</button>
                    <button class="pos-btn" data-pos="C" onclick="setPos(${i}, 'C')">Amb.</button>
                </div>
            </div>
        `;
    }
}

// Carregar dades guardades al localStorage
window.onload = function() {
    carregarEstat();
};

/**
 * Persistència de dades
 */
function guardarEstat() {
    const tournamentInput = document.getElementById('tournament-name-input');
    if (tournamentInput) {
        estat.nomTorneig = tournamentInput.value;
    }
    
    // Guardem llista de jugadors actual dels inputs si no estem a la pantalla inicial
    if (estat.vistaActual !== "start-view") {
        estat.jugadors = [];
        for (let i = 0; i < 12; i++) {
            const nom = document.getElementById(`name-${i}`).value;
            const pos = document.querySelector(`.player-input:nth-child(${i+1}) .pos-btn.active`).getAttribute('data-pos');
            estat.jugadors.push({ id: i, nom, pos, punts: 0 });
        }
    }

    localStorage.setItem('padel_pro_save', JSON.stringify(estat));
    actualitzarCapçalera();
}

function carregarEstat() {
    const saved = localStorage.getItem('padel_pro_save');
    if (saved) {
        estat = JSON.parse(saved);
        
        const tournamentInput = document.getElementById('tournament-name-input');
        if (tournamentInput) tournamentInput.value = estat.nomTorneig;
        
        if (estat.jugadors.length > 0) {
            estat.jugadors.forEach((j, i) => {
                const nameInput = document.getElementById(`name-${i}`);
                if (nameInput) nameInput.value = j.nom;
                setPos(i, j.pos, false); 
            });
        }

        mostrarVista(estat.vistaActual);
        if (estat.vistaActual === "tournament-view") {
            actualitzarInterficieTorneig();
        }
    }
    actualitzarCapçalera();
}

function actualitzarCapçalera() {
    const title = document.getElementById('dynamic-title');
    if (title) {
        title.innerText = estat.nomTorneig || "PADEL PRO SERIES";
    }
}

/**
 * Gestió de Vistes
 */
function mostrarVista(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    estat.vistaActual = id;
    window.scrollTo(0, 0);
}

function anarAJugadors() {
    const input = document.getElementById('tournament-name-input');
    estat.nomTorneig = (input && input.value) ? input.value : "TORNEIG SENSE NOM";
    guardarEstat();
    mostrarVista('setup-view');
}

function tornarAInici() {
    mostrarVista('start-view');
}

function tornarAJugadors() {
    mostrarVista('setup-view');
    guardarEstat();
}

function setPos(idx, pos, triggerSave = true) {
    const btns = document.querySelectorAll(`.player-input:nth-child(${idx+1}) .pos-btn`);
    if (btns.length > 0) {
        btns.forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.player-input:nth-child(${idx+1}) .pos-btn[data-pos="${pos}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }
    if (triggerSave) guardarEstat();
}

/**
 * Lògica del Torneig
 */
function iniciarTorneig() {
    estat.jugadors = [];
    for (let i = 0; i < 12; i++) {
        const nom = document.getElementById(`name-${i}`).value || `Jugador ${i+1}`;
        const pos = document.querySelector(`.player-input:nth-child(${i+1}) .pos-btn.active`).getAttribute('data-pos');
        estat.jugadors.push({ id: i, nom, pos, punts: 0 });
    }
    
    generarCalendari();
    mostrarVista('tournament-view');
    actualitzarInterficieTorneig();
    guardarEstat();
}

function generarCalendari() {
    estat.rondes = [];
    for (let r = 0; r < 4; r++) {
        let pool = shuffle([...estat.jugadors]);
        let partits = [];
        for (let p = 0; p < 3; p++) {
            partits.push(assignarEnfrontament(pool));
        }
        estat.rondes.push({ partits, resultats: [[0,0], [0,0], [0,0]] });
    }
}

function assignarEnfrontament(pool) {
    const agafar = (pref) => {
        let idx = pool.findIndex(j => j.pos === pref || j.pos === 'C');
        if (idx === -1) idx = 0;
        return pool.splice(idx, 1)[0];
    };
    return { 
        t1: [agafar('D'), agafar('E')], 
        t2: [agafar('D'), agafar('E')] 
    };
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * Interfície de Resultats
 */
function actualitzarInterficieTorneig() {
    const title = document.getElementById('round-title');
    if (title) title.innerText = `RONDA ${estat.rondaActual + 1}`;
    renderMatchCards();
    renderRanking();
}

function renderMatchCards() {
    const container = document.getElementById('match-list');
    if (!container) return;
    container.innerHTML = '';
    const rData = estat.rondes[estat.rondaActual];

    rData.partits.forEach((p, i) => {
        container.innerHTML += `
            <div class="match-card">
                <div class="match-header">
                    <span>PISTA ${i+1}</span>
                    <span>LIVE SCORE</span>
                </div>
                <div class="match-body">
                    <div class="team-row">
                        <div class="team-players">
                            ${renderPlayerLine(p.t1[0], 'D')}
                            ${renderPlayerLine(p.t1[1], 'E')}
                        </div>
                        <div class="score-box">
                            <input type="number" class="score-input" value="${rData.resultats[i][0]}" onchange="guardarPunts(${i}, 0, this.value)">
                        </div>
                    </div>
                    <div class="team-row">
                        <div class="team-players">
                            ${renderPlayerLine(p.t2[0], 'D')}
                            ${renderPlayerLine(p.t2[1], 'E')}
                        </div>
                        <div class="score-box">
                            <input type="number" class="score-input" value="${rData.resultats[i][1]}" onchange="guardarPunts(${i}, 1, this.value)">
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function renderPlayerLine(j, ideal) {
    const color = j.pos === 'D' ? 'var(--right-color)' : (j.pos === 'E' ? 'var(--left-color)' : 'var(--both-color)');
    const warn = (j.pos !== ideal && j.pos !== 'C') ? '<span style="margin-left:5px">⚠️</span>' : '';
    return `
        <div class="player-line">
            <div class="pos-indicator" style="background:${color}"></div>
            <div class="player-name">${j.nom}${warn}</div>
            <div class="pos-tag">${j.pos}</div>
        </div>
    `;
}

function guardarPunts(pIdx, teamIdx, val) {
    estat.rondes[estat.rondaActual].resultats[pIdx][teamIdx] = parseInt(val) || 0;
    renderRanking();
    guardarEstat();
}

function canviarRonda(d) {
    estat.rondaActual = Math.max(0, Math.min(3, estat.rondaActual + d));
    actualitzarInterficieTorneig();
    guardarEstat();
}

function renderRanking() {
    estat.jugadors.forEach(j => j.punts = 0);
    estat.rondes.forEach(r => {
        r.partits.forEach((p, i) => {
            p.t1.forEach(j => estat.jugadors[j.id].punts += r.resultats[i][0]);
            p.t2.forEach(j => estat.jugadors[j.id].punts += r.resultats[i][1]);
        });
    });
    
    const sorted = [...estat.jugadors].sort((a,b) => b.punts - a.punts);
    const container = document.getElementById('ranking-list');
    if (!container) return;
    container.innerHTML = '';
    
    sorted.forEach((j, i) => {
        const isTop = i < 4;
        container.innerHTML += `
            <div class="ranking-row ${isTop ? 'rank-top' : ''}">
                <div class="rank-pos">${i+1}</div>
                <div class="rank-name">${j.nom}</div>
                <div class="rank-points">${j.punts}</div>
            </div>
        `;
    });
}

function resetTorneigComplet() {
    if(confirm("Segur que vols esborrar totes les dades del torneig actual?")) {
        localStorage.removeItem('padel_pro_save');
        location.reload();
    }
}
