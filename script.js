let characters = [];
let filteredCharacters = [];

// Function to initialize the application
function initApp() {
    createGrid();
    loadCharacters();
    setupButtons();
    updateTroopCounter(); // Initialize the counter
    displayFactionCounts();
    addHoverEffects();
    setupFilters();
    setupSearch();
}

function createGrid() {
    const grid = document.querySelector('.grid');
    for (let i = 0; i < 35; i++) { // 7 * 5 = 35 cells
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.ondrop = drop;
        cell.ondragover = allowDrop;
        cell.ondragstart = dragStart;
        grid.appendChild(cell);
    }
}

// Function to load characters
function loadCharacters() {
    fetch('squads.json')
        .then(response => response.json())
        .then(data => {
            characters = data;
            filteredCharacters = [...characters];
            populateFilters();
            populateCharacterPanel();
        })
        .catch(error => console.error('Error loading characters:', error));
}

function populateFilters() {
    const rarities = [...new Set(characters.map(char => char.rarity))];
    const factions = [...new Set(characters.map(char => char.faction))];
    const archetypes = [...new Set(characters.map(char => char.archetype))];

    populateSelect('rarityFilter', rarities);
    populateSelect('factionFilter', factions);
    populateSelect('archetypeFilter', archetypes);
}

function populateSelect(id, options) {
    const select = document.getElementById(id);
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
}

function setupFilters() {
    document.getElementById('rarityFilter').addEventListener('change', applyFilters);
    document.getElementById('factionFilter').addEventListener('change', applyFilters);
    document.getElementById('archetypeFilter').addEventListener('change', applyFilters);
}

function setupSearch() {
    document.getElementById('characterSearch').addEventListener('input', applyFilters);
}

function applyFilters() {
    const rarity = document.getElementById('rarityFilter').value;
    const faction = document.getElementById('factionFilter').value;
    const archetype = document.getElementById('archetypeFilter').value;
    const searchTerm = document.getElementById('characterSearch').value.toLowerCase();

    filteredCharacters = characters.filter(char =>
        (rarity === '' || char.rarity === rarity) &&
        (faction === '' || char.faction === faction) &&
        (archetype === '' || char.archetype === archetype) &&
        char.name.toLowerCase().includes(searchTerm)
    );

    populateCharacterPanel();
}

function populateCharacterPanel() {
    const characterPanel = document.getElementById('characterPanel');
    characterPanel.innerHTML = '';
    filteredCharacters.forEach(character => {
        const charElement = createCharacterElement(character);
        characterPanel.appendChild(charElement);
    });
}


function createCharacterElement(character) {
    const charElement = document.createElement('div');
    charElement.className = `character ${character.rarity.toLowerCase()} ${character.faction.toLowerCase()}`;
    charElement.draggable = true;
    charElement.id = character.id;
    charElement.ondragstart = dragStart;

    charElement.innerHTML = `
        <div class="character-name">${character.name}</div>
        </div>
    `;

    // Add double-click event listener
    charElement.addEventListener('dblclick', () => {
        placeCharacterRandomly(charElement);
    });

    return charElement;
}

function placeCharacterRandomly(characterElement) {
    const gridCells = document.querySelectorAll('.grid .cell');
    const emptyCells = Array.from(gridCells).filter(cell => !cell.querySelector('.character'));

    if (emptyCells.length === 0 || occupiedCells >= MAX_CELLS) {
        alert('No available cells or grid is full.');
        return;
    }

    // Select a random empty cell
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];

    // Clone the character element for placing in the grid
    const clonedCharacter = characterElement.cloneNode(true);
    clonedCharacter.id = characterElement.id + '-' + Date.now();

    randomCell.appendChild(clonedCharacter);
    occupiedCells++;
    updateTroopCounter();

    // Update counters based on the placed character's faction and rarity
    const character = characters.find(char => char.id === characterElement.id);
    updateFactionCounter(character.faction, 1);
    updateRarityCounter(character.rarity, 1);
}

function allowDrop(e) {
    e.preventDefault();
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.id);
    e.dataTransfer.effectAllowed = 'copy';
}

let occupiedCells = 0;
const MAX_CELLS = 12;
let factionCounts = {};
let rarityCounts = {};

function drop(e) {
    e.preventDefault();
    const characterId = e.dataTransfer.getData('text/plain');
    const draggedCharacter = document.getElementById(characterId);
    const targetCell = e.currentTarget;

    if (targetCell.classList.contains('cell')) {
        if (draggedCharacter.closest('.cell')) {
            // Moving from one cell to another
            const sourceCell = draggedCharacter.closest('.cell');
            if (targetCell !== sourceCell) {
                if (targetCell.querySelector('.character')) {
                    // Swap characters if target cell is occupied
                    const targetCharacter = targetCell.querySelector('.character');
                    sourceCell.appendChild(targetCharacter);
                    targetCell.appendChild(draggedCharacter);
                } else {
                    // Move to empty cell
                    targetCell.appendChild(draggedCharacter);
                }
            }
        } else {
            // Adding from character panel
            if (!targetCell.querySelector('.character') && occupiedCells < MAX_CELLS) {
                const clonedCharacter = draggedCharacter.cloneNode(true);
                clonedCharacter.id = characterId + '-' + Date.now();
                targetCell.appendChild(clonedCharacter);
                occupiedCells++;
                updateTroopCounter();
                const character = characters.find(char => char.id === characterId);
                updateFactionCounter(character.faction, 1);
                updateRarityCounter(character.rarity, 1);
            }
        }
    }
}

function updateTroopCounter() {
    const counterElement = document.getElementById('troopCounter');
    counterElement.textContent = `Troops Deployed: ${occupiedCells} / ${MAX_CELLS}`;
}

function removeElement(e) {
    if (e.target.closest('.character') && e.target.closest('.cell')) {
        const removedCharacter = e.target.closest('.character');
        const originalId = removedCharacter.id.split('-')[0];
        const character = characters.find(char => char.id === originalId);
        updateFactionCounter(character.faction, -1);
        updateRarityCounter(character.rarity, -1);
        removedCharacter.remove();
        occupiedCells--;
        updateTroopCounter();
    }
}

function setupButtons() {
    document.getElementById('clearBtn').addEventListener('click', clearGrid);
    document.getElementById('saveBtn').addEventListener('click', saveGrid);
}

function clearGrid() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        while (cell.firstChild) {
            cell.removeChild(cell.firstChild);
        }
    });
    occupiedCells = 0;
    factionCounts = {};
    rarityCounts = {};
    updateTroopCounter();
    displayFactionCounts();
    displayRarityCounts();
}

function saveGrid() {
    const saveContainer = document.getElementById('saveContainer');
    const saveGrid = document.getElementById('saveGrid');
    const saveFactionCounter = document.getElementById('saveFactionCounter');
    const saveRarityCounter = document.getElementById('saveRarityCounter');

    // Clone the current grid
    saveGrid.innerHTML = document.querySelector('.grid').innerHTML;

    // Populate faction counter
    saveFactionCounter.innerHTML = Object.entries(factionCounts).map(([faction, count]) => {
        const tier = count <= 4 ? 4 : count <= 6 ? 6 : 12;
        return `
            <div class="save-faction-count">
                <img src="assets/${faction.toLowerCase()}.png" alt="${faction}" class="save-faction-icon">
                <span><strong>${faction}</strong> ${count}/${tier}</span>
            </div>`;
    }).join('');

    // Populate rarity counter
    saveRarityCounter.innerHTML = Object.entries(rarityCounts).map(([rarity, count]) => {
        return `
            <div class="save-rarity-count">
                <img src="assets/${rarity.toLowerCase()}_icon.png" alt="${rarity}" class="save-rarity-icon">
                <span><strong>${rarity}</strong> ${count}</span>
            </div>`;
    }).join('');

    // Make the save container visible
    saveContainer.style.display = 'block';

    // Use html2canvas on the save container
    html2canvas(saveContainer, {
        width: 1200,
        height: 800,
        scale: 2, // Increase quality
    }).then(canvas => {
        const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const link = document.createElement('a');
        link.download = 'character-grid-with-info.png';
        link.href = image;
        link.click();

        // Hide the save container again
        saveContainer.style.display = 'none';
    });
}

function getCharacterFaction(characterId) {
    const character = characters.find(char => char.id === characterId);
    return character ? character.faction : null;
}

function updateFactionCounter(faction, change) {
    if (!faction) return;

    factionCounts[faction] = (factionCounts[faction] || 0) + change;
    if (factionCounts[faction] <= 0) {
        delete factionCounts[faction];
    }

    displayFactionCounts();
}

function updateRarityCounter(rarity, change) {
    if (!rarity) return;

    rarityCounts[rarity] = (rarityCounts[rarity] || 0) + change;
    if (rarityCounts[rarity] <= 0) {
        delete rarityCounts[rarity];
    }

    displayRarityCounts();
}

function displayFactionCounts() {
    const factionCounterElement = document.getElementById('factionCounter');

    if (Object.keys(factionCounts).length === 0) {
        factionCounterElement.textContent = "Add troops to see faction bonuses";
        return;
    }

    let factionHTML = '';
    for (const [faction, count] of Object.entries(factionCounts)) {
        const tier = count <= 4 ? 4 : count <= 6 ? 6 : 12;
        factionHTML += `
            <div class="faction-count">
                <img src="assets/${faction.toLowerCase()}.png" alt="${faction}" class="faction-icon">
                <div class="faction-info">
                    <div><strong>${faction}</strong></div>
                    <div>${count}/${tier}</div>
                </div>
            </div>`;
    }

    factionCounterElement.innerHTML = factionHTML;
}

function displayRarityCounts() {
    const rarityCounterElement = document.getElementById('rarityCounter');

    if (Object.keys(rarityCounts).length === 0) {
        rarityCounterElement.textContent = "Add troops to see rarity counts";
        return;
    }

    let rarityHTML = '';
    for (const [rarity, count] of Object.entries(rarityCounts)) {
        rarityHTML += `
            <div class="rarity-count">
                <img src="assets/${rarity.toLowerCase()}_icon.png" alt="${rarity}" class="rarity-icon">
                <div class="rarity-info">
                    <div><strong>${rarity}</strong></div>
                    <div>${count}</div>
                </div>
            </div>`;
    }

    rarityCounterElement.innerHTML = rarityHTML;
}

function addHoverEffects() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('dragover', function(e) {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        });
        cell.addEventListener('dragleave', function(e) {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
        });
        cell.addEventListener('drop', function(e) {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
        });
    });
}


document.addEventListener('click', removeElement);

// Call initApp when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initApp);