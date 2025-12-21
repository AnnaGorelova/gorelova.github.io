let currentStage = 1;
let gameScore = 0;
let timeLeft = 120;
let gameTimer;
let correctWords = 0;
let totalWords = 0;
let selectedLevel = 1;
let playerName = 'Игрок';
let hasResultsSaved = false;

let gameData = null;
let allWords = [];
let usedWords = [];
let partsOfSpeech = [];

let originalWordsMap = new Map();
let clonedWordsMap = new Map();
let movementIntervals = new Map();

let stageStates = {
    1: { completed: false, words: [], categories: {} },
    2: { completed: false, phrases: {}, source: [] },
    3: { completed: false, sentences: {}, source: [] }
};

let stageLocked = {
    1: false,
    2: false,
    3: false
};

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    if (stageLocked[currentStage]) {
        ev.preventDefault();
        return false;
    }
    
    const draggedElement = ev.target;
    const isClone = draggedElement.classList.contains('word-clone');
    const originalId = draggedElement.getAttribute('data-original-id') || draggedElement.id;
    
    ev.dataTransfer.setData("text", draggedElement.id);
    ev.dataTransfer.setData("isClone", isClone ? "true" : "false");
    ev.dataTransfer.setData("originalId", originalId);
}

function drop(ev) {
    ev.preventDefault();
    
    if (stageLocked[currentStage]) {
        return;
    }
    
    const draggedId = ev.dataTransfer.getData("text");
    const isClone = ev.dataTransfer.getData("isClone") === "true";
    const originalId = ev.dataTransfer.getData("originalId");
    const draggedElement = document.getElementById(draggedId);
    
    if (!draggedElement) return;
    
    let targetContainer = ev.target;
    
    if (!targetContainer.classList.contains('drop-zone')) {
        targetContainer = targetContainer.closest('.drop-zone');
    }
    
    if (!targetContainer) return;
    
    const sourceContainers = [
        'all-words-container',
        'stage2-words-source',
        'stage3-words-source'
    ];
    
    if (sourceContainers.includes(targetContainer.id)) {
        returnToSource(draggedElement, isClone, originalId, targetContainer.id);
        return;
    }
    
    if (!isClone && draggedElement.classList.contains('word-original')) {
        moveToTarget(draggedElement, targetContainer);
        return;
    }
    
    if (isClone) {
        if (sourceContainers.includes(targetContainer.id)) {
            returnToSource(draggedElement, true, originalId, targetContainer.id);
            return;
        }
        
        moveClone(draggedElement, targetContainer);
        return;
    }
}

function moveToTarget(originalElement, targetContainer) {
    stopWordMovement(originalElement);
    
    const wordId = originalElement.getAttribute('data-word-id');
    
    const existingWords = targetContainer.querySelectorAll('.word-card[data-word-id="' + wordId + '"]');
    if (existingWords.length > 0) return;
    
    const clone = createWordClone(originalElement);
    
    clone.style.position = 'static';
    clone.classList.remove('absolute-position');
    clone.style.transform = 'none';
    clone.style.left = '';
    clone.style.top = '';
    clone.style.width = '';
    clone.style.height = '';
    
    clone.setAttribute('data-source-id', originalElement.id);
    targetContainer.appendChild(clone);
    
    originalElement.style.display = 'none';
    
    clonedWordsMap.set(clone.id, {
        originalId: originalElement.id,
        location: targetContainer.id
    });
    
    updatePlaceholders();
    saveCurrentStageState();
}

function moveClone(cloneElement, targetContainer) {
    stopWordMovement(cloneElement);
    
    const currentContainer = cloneElement.parentNode;
    
    if (currentContainer === targetContainer) return;
    
    const wordId = cloneElement.getAttribute('data-word-id');
    const existingWords = targetContainer.querySelectorAll('.word-card[data-word-id="' + wordId + '"]');
    if (existingWords.length > 0) return;
    
    if (currentContainer) {
        currentContainer.removeChild(cloneElement);
    }
    
    cloneElement.style.position = 'static';
    cloneElement.classList.remove('absolute-position');
    cloneElement.style.transform = 'none';
    cloneElement.style.left = '';
    cloneElement.style.top = '';
    cloneElement.style.width = '';
    cloneElement.style.height = '';
    
    targetContainer.appendChild(cloneElement);
    
    const cloneInfo = clonedWordsMap.get(cloneElement.id);
    if (cloneInfo) {
        cloneInfo.location = targetContainer.id;
        clonedWordsMap.set(cloneElement.id, cloneInfo);
    }
    
    updatePlaceholders();
    saveCurrentStageState();
}

function returnToSource(element, isClone, originalId, sourceContainerId) {
    if (stageLocked[currentStage]) {
        return;
    }
    
    let sourceContainer;
    
    if (currentStage === 1) {
        sourceContainer = document.getElementById('all-words-container');
    } else if (currentStage === 2) {
        sourceContainer = document.getElementById('stage2-words-source');
    } else if (currentStage === 3) {
        sourceContainer = document.getElementById('stage3-words-source');
    }
    
    if (sourceContainerId) {
        sourceContainer = document.getElementById(sourceContainerId);
    }
    
    if (!sourceContainer) return;
    
    stopWordMovement(element);
    
    if (isClone) {
        const container = element.parentNode;
        if (container && container !== sourceContainer) {
            container.removeChild(element);
        }
        
        clonedWordsMap.delete(element.id);
        
        const originalElement = document.getElementById(originalId);
        if (originalElement) {
            originalElement.style.display = 'flex';
            if (originalElement.parentNode !== sourceContainer) {
                sourceContainer.appendChild(originalElement);
                startWordMovement(originalElement, sourceContainer);
            }
        }
    } else {
        if (element.parentNode === sourceContainer) return;
        
        element.style.position = 'absolute';
        element.classList.add('absolute-position');
        
        const containerRect = sourceContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const containerPadding = 10;
        
        const randomX = containerPadding + Math.random() * (containerRect.width - elementRect.width - containerPadding * 2);
        const randomY = containerPadding + Math.random() * (containerRect.height - elementRect.height - containerPadding * 2);
        
        element.style.left = randomX + 'px';
        element.style.top = randomY + 'px';
        
        sourceContainer.appendChild(element);
        element.style.display = 'flex';
        startWordMovement(element, sourceContainer);
    }
    
    updatePlaceholders();
    saveCurrentStageState();
}

function createWordClone(originalElement) {
    const clone = originalElement.cloneNode(true);
    const cloneId = originalElement.id + '-clone-' + Date.now();
    
    clone.id = cloneId;
    clone.classList.remove('word-original');
    clone.classList.add('word-clone');
    clone.setAttribute('data-original-id', originalElement.id);
    clone.style.display = 'flex';
    clone.style.position = 'static';
    clone.style.transform = 'none';
    clone.style.left = '';
    clone.style.top = '';
    clone.style.width = '';
    clone.style.height = '';
    
    clone.setAttribute('draggable', 'true');
    clone.addEventListener('dragstart', drag);
    
    clone.addEventListener('dblclick', function() {
        if (stageLocked[currentStage]) {
            return;
        }
        
        let sourceContainer;
        if (currentStage === 1) {
            sourceContainer = document.getElementById('all-words-container');
        } else if (currentStage === 2) {
            sourceContainer = document.getElementById('stage2-words-source');
        } else if (currentStage === 3) {
            sourceContainer = document.getElementById('stage3-words-source');
        }
        
        if (sourceContainer) {
            returnToSource(this, true, this.getAttribute('data-original-id'), sourceContainer.id);
        }
    });
    
    return clone;
}

function checkWordCategory(wordElement, targetCategory) {
    const wordId = wordElement.getAttribute('data-word-id');
    const word = getWordById(wordId);
    
    if (!word) return false;
    
    if (targetCategory === 'другие') {
        const otherBox = document.querySelector('.category-box[data-category="другие"]');
        if (otherBox) {
            const otherCategories = JSON.parse(otherBox.getAttribute('data-other-categories') || '[]');
            return otherCategories.includes(word.type);
        }
        
        const otherTypes = ['наречие', 'местоимение', 'числительное', 'причастие', 'деепричастие'];
        return otherTypes.includes(word.type);
    }
    
    return word.type === targetCategory;
}

function saveCurrentStageState() {
    if (currentStage === 1) {
        stageStates[1] = getStage1State();
    } else if (currentStage === 2) {
        stageStates[2] = getStage2State();
    } else if (currentStage === 3) {
        stageStates[3] = getStage3State();
    }
}

function restoreStageState(stageNumber) {
    if (!stageStates[stageNumber]) return;
    
    if (stageNumber === 1) {
        restoreStage1State();
    } else if (stageNumber === 2) {
        restoreStage2State();
    } else if (stageNumber === 3) {
        restoreStage3State();
    }
}

function getStage1State() {
    const state = {
        source: [],
        categories: {},
        completed: stageStates[1].completed,
        locked: stageLocked[1]
    };
    
    const sourceContainer = document.getElementById('all-words-container');
    if (sourceContainer) {
        const words = sourceContainer.querySelectorAll('.word-card');
        state.source = Array.from(words).map(word => ({
            id: word.id,
            wordId: word.getAttribute('data-word-id'),
            type: word.getAttribute('data-type'),
            text: word.textContent,
            isClone: word.classList.contains('word-clone'),
            originalId: word.getAttribute('data-original-id'),
            display: word.style.display,
            classes: Array.from(word.classList),
            position: {
                left: word.style.left,
                top: word.style.top,
                isAbsolute: word.classList.contains('absolute-position')
            }
        }));
    }
    
    const categoryContainers = document.querySelectorAll('.category-box');
    categoryContainers.forEach(categoryBox => {
        const categoryType = categoryBox.getAttribute('data-category');
        const container = categoryBox.querySelector('.words-container');
        
        if (container) {
            const words = container.querySelectorAll('.word-card');
            state.categories[categoryType] = Array.from(words).map(word => ({
                id: word.id,
                wordId: word.getAttribute('data-word-id'),
                type: word.getAttribute('data-type'),
                text: word.textContent,
                isClone: word.classList.contains('word-clone'),
                originalId: word.getAttribute('data-original-id'),
                classes: Array.from(word.classList)
            }));
        }
    });
    
    return state;
}

function restoreStage1State() {
    const state = stageStates[1];
    if (!state) return;
    
    const sourceContainer = document.getElementById('all-words-container');
    if (sourceContainer && state.source) {
        sourceContainer.innerHTML = '';
        sourceContainer.classList.remove('checked');
        
        state.source.forEach(wordData => {
            const wordCard = createWordCardFromState(wordData, 1);
            wordCard.style.display = wordData.display || 'flex';
            
            if (wordData.position && wordData.position.isAbsolute && 
                wordData.position.left && wordData.position.top) {
                wordCard.style.position = 'absolute';
                wordCard.style.left = wordData.position.left;
                wordCard.style.top = wordData.position.top;
                wordCard.classList.add('absolute-position');
            }
            
            sourceContainer.appendChild(wordCard);
        });
    }
    
    const categoryContainers = document.querySelectorAll('.category-box');
    categoryContainers.forEach(categoryBox => {
        const categoryType = categoryBox.getAttribute('data-category');
        const container = categoryBox.querySelector('.words-container');
        const categoryWords = state.categories[categoryType];
        
        if (container) {
            container.innerHTML = '';
            
            const placeholder = document.createElement('div');
            placeholder.className = 'placeholder';
            placeholder.textContent = 'Перетащите слова сюда';
            container.appendChild(placeholder);
            
            if (categoryWords && categoryWords.length > 0) {
                categoryWords.forEach(wordData => {
                    const wordCard = createWordCardFromState(wordData, 1);
                    wordCard.style.transform = 'none';
                    wordCard.style.left = '';
                    wordCard.style.top = '';
                    wordCard.classList.remove('absolute-position');
                    container.appendChild(wordCard);
                });
                
                placeholder.style.display = 'none';
            }
        }
    });
    
    if (state.locked) {
        lockStage1();
    } else {
        startStageMovement();
    }
    
    updatePlaceholders();
}

function initializeCategories() {
    const categoriesArea = document.querySelector('.categories-area .categories-container');
    if (categoriesArea) {
        categoriesArea.innerHTML = '';
        
        const selectedCategories = window.currentCategories?.selected || getRandomPartsOfSpeech(3);
        const otherCategories = window.currentCategories?.other || 
            partsOfSpeech.filter(category => !selectedCategories.includes(category));
        
        selectedCategories.forEach((category, index) => {
            const categoryBox = document.createElement('div');
            categoryBox.className = 'category-box';
            categoryBox.setAttribute('data-category', category);
            
            const header = document.createElement('div');
            header.className = 'category-header';
            
            const title = document.createElement('h4');
            title.textContent = getCategoryName(category);
            
            header.appendChild(title);
            
            const container = document.createElement('div');
            container.id = `category-${index}-container`;
            container.className = 'words-container drop-zone';
            
            const placeholder = document.createElement('div');
            placeholder.className = 'placeholder';
            placeholder.textContent = 'Перетащите слова сюда';
            container.appendChild(placeholder);
            
            container.ondragover = allowDrop;
            container.ondrop = drop;
            
            categoryBox.appendChild(header);
            categoryBox.appendChild(container);
            
            categoriesArea.appendChild(categoryBox);
        });
        
        const otherBox = document.createElement('div');
        otherBox.className = 'category-box';
        otherBox.setAttribute('data-category', 'другие');
        otherBox.setAttribute('data-other-categories', JSON.stringify(otherCategories));
        
        const otherHeader = document.createElement('div');
        otherHeader.className = 'category-header';
        
        const otherTitle = document.createElement('h4');
        otherTitle.textContent = 'Другие';
        
        const otherInfo = document.createElement('span');
        otherInfo.className = 'category-info';
        otherInfo.textContent = ` (${otherCategories.map(cat => getCategoryName(cat)).join(', ')})`;
        
        otherHeader.appendChild(otherTitle);
        otherHeader.appendChild(otherInfo);
        
        const otherContainer = document.createElement('div');
        otherContainer.id = 'other-container';
        otherContainer.className = 'words-container drop-zone';
        
        const otherPlaceholder = document.createElement('div');
        otherPlaceholder.className = 'placeholder';
        otherPlaceholder.textContent = 'Перетащите слова сюда';
        otherContainer.appendChild(otherPlaceholder);
        
        otherContainer.ondragover = allowDrop;
        otherContainer.ondrop = drop;
        
        otherBox.appendChild(otherHeader);
        otherBox.appendChild(otherContainer);
        
        categoriesArea.appendChild(otherBox);
        
        window.currentCategories = {
            selected: selectedCategories,
            other: otherCategories
        };
    }
}

function lockStage1() {
    stopAllMovement();
    
    const allWordsElements = document.querySelectorAll('#all-words-container .word-card, .category-box .words-container .word-card');
    allWordsElements.forEach(word => {
        word.setAttribute('draggable', 'false');
        word.classList.add('word-locked');
        word.classList.remove('absolute-position');
        word.style.cursor = 'default';
        word.style.opacity = '0.8';
        word.style.transform = 'none';
        word.style.left = '';
        word.style.top = '';
        word.style.position = 'static';
        
        const newWord = word.cloneNode(true);
        word.parentNode.replaceChild(newWord, word);
    });
    
    const sourceContainer = document.getElementById('all-words-container');
    if (sourceContainer) {
        sourceContainer.classList.add('checked');
        
        const words = Array.from(sourceContainer.querySelectorAll('.word-card'));
        words.sort((a, b) => {
            const textA = a.textContent.toLowerCase();
            const textB = b.textContent.toLowerCase();
            return textA.localeCompare(textB);
        });
        
        sourceContainer.innerHTML = '';
        words.forEach(word => {
            word.style.position = 'static';
            word.style.left = '';
            word.style.top = '';
            sourceContainer.appendChild(word);
        });
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    try {
        await loadWordsData();
        loadPlayerData();
        setupGame();
        startTimer();
        initializeStage1();
        setupEventListeners();
        startStageMovement();
        
        setTimeout(() => {
            updatePlaceholders();
        }, 500);
    } catch (error) {
        showError('Не удалось загрузить данные игры. Попробуйте обновить страницу.');
    }
});

async function loadWordsData() {
    try {
        if (typeof window.wordsData !== 'undefined') {
            gameData = window.wordsData; 
            
            if (!gameData.words || !Array.isArray(gameData.words)) {
                throw new Error('Некорректная структура данных');
            }
            
            allWords = gameData.words;
            partsOfSpeech = gameData.parts_of_speech || [
                "существительное", "глагол", "прилагательное", 
                "наречие", "местоимение", "числительное"
            ];
            
            if (allWords.length === 0) throw new Error('Нет доступных слов');
        
            return gameData;
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        throw error;
    }
}

function getRandomPartsOfSpeech(count, exclude = []) {
    const availableParts = partsOfSpeech.filter(part => !exclude.includes(part));
    if (availableParts.length < count) {
        return getRandomFromArray(partsOfSpeech, count);
    }
    return getRandomFromArray(availableParts, count);
}

function getRandomFromArray(arr, count) {
    const result = [];
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        result.push(shuffled[i]);
    }
    
    return result;
}

function loadPlayerData() {
    playerName = localStorage.getItem('playerName') || 'Игрок';
    selectedLevel = localStorage.getItem('selectedLevel') || 1;
    
    const playerNameElement = document.getElementById('player-name');
    if (playerNameElement) {
        playerNameElement.textContent = playerName;
    }
}

function setupGame() {
    if (gameData && gameData.game_settings) {
        timeLeft = gameData.game_settings.time_limit || 120;
    }
    
    document.getElementById('score').textContent = gameScore;
    updateTimerDisplay();
    usedWords = [];
    
    originalWordsMap.clear();
    clonedWordsMap.clear();
}

function getRandomWordIds(count, excludeIds = []) {
    const availableWords = allWords.filter(word => 
        !excludeIds.includes(word.id)
    );
    
    if (availableWords.length < count) {
        return getRandomIdsFromArray(allWords, count);
    }
    
    return getRandomIdsFromArray(availableWords, count);
}

function getRandomIdsFromArray(arr, count) {
    const result = [];
    const usedIndices = new Set();
    
    while (result.length < count && result.length < arr.length) {
        const randomIndex = Math.floor(Math.random() * arr.length);
        
        if (!usedIndices.has(randomIndex)) {
            const word = arr[randomIndex];
            result.push(word.id);
            usedIndices.add(randomIndex);
        }
    }
    
    return result;
}

function getWordById(wordId) {
    return allWords.find(word => word.id === wordId);
}

function initializeStage1() {
    const allWordsContainer = document.getElementById('all-words-container');
    if (!allWordsContainer) return;
    
    allWordsContainer.innerHTML = '';
    allWordsContainer.classList.add('words-source-container', 'drop-zone');
    allWordsContainer.classList.remove('checked');
    
    if (allWords.length === 0) {
        allWordsContainer.innerHTML = '<div class="error">Нет доступных слов для игры</div>';
        return;
    }
    
    usedWords = [];
    
    initializeCategories();
    
    const wordIds = getRandomWordIds(10);
    
    wordIds.forEach((wordId, index) => {
        const word = getWordById(wordId);
        if (word) {
            const wordCard = createWordCard(word, index);
            wordCard.classList.add('word-original');
            originalWordsMap.set(wordCard.id, wordCard);
            allWordsContainer.appendChild(wordCard);
            usedWords.push(word);
        }
    });
    
    updatePlaceholders();
    saveCurrentStageState();
}

function getCategoryName(category) {
    const names = {
        "существительное": "Существительные",
        "глагол": "Глаголы",
        "прилагательное": "Прилагательные",
        "наречие": "Наречия",
        "местоимение": "Местоимения",
        "числительное": "Числительные"
    };
    return names[category] || category;
}

function getWordsForStage(count) {
    const wordIds = getRandomWordIds(count);
    
    return wordIds.map(id => getWordById(id)).filter(Boolean);
}

function initializeStage2() {
    const phrasesContainer = document.querySelector('.phrases-area');
    if (!phrasesContainer) {
        return;
    }
    
    const oldPanel = phrasesContainer.querySelector('.words-source-panel');
    if (oldPanel) oldPanel.remove();
    
    const instructions = phrasesContainer.querySelector('.phrases-instructions');
    if (instructions) {
        instructions.insertAdjacentHTML('afterend', `
            <div class="words-source-panel">
                <h3 class="words-source-title">Исходные слова</h3>
                <div id="stage2-words-source" class="words-source-container drop-zone"></div>
            </div>
        `);
    } 
    
    const phrasesListContainer = phrasesContainer.querySelector('.phrases-container');
    if (!phrasesListContainer) {
        return;
    }
    
    phrasesListContainer.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
        const phraseStructure = getRandomPartsOfSpeech(2);
        const phraseElement = createPhraseElementWithScheme(i, phraseStructure);
        phrasesListContainer.appendChild(phraseElement);
    }
    
    const wordsSourceContainer = document.getElementById('stage2-words-source');
    if (wordsSourceContainer) {
        wordsSourceContainer.innerHTML = '';
        originalWordsMap.clear();
        
        const words = getWordsForStage(20); 
        
        if (words.length === 0) {
            wordsSourceContainer.innerHTML = '<div class="error">Нет доступных слов</div>';
        } else {
            words.forEach((word, index) => {
                const wordCard = createWordCardForStage(word, index, 2);
                wordCard.classList.add('word-original');
                originalWordsMap.set(wordCard.id, wordCard);
                wordsSourceContainer.appendChild(wordCard);
            });
        }
    }
    
    saveCurrentStageState();
    startStageMovement();
}

function createPhraseElementWithScheme(index, structure) {
    const div = document.createElement('div');
    div.className = 'phrase-item';
    div.id = `phrase-${index}`;
    
    const header = document.createElement('div');
    header.className = 'phrase-header';
    
    const title = document.createElement('div');
    title.className = 'phrase-title';
    title.textContent = `Словосочетание ${index + 1}`;
    
    const type = document.createElement('div');
    type.className = 'phrase-type';
    
    const schemeText = structure.map(part => 
        `<span class="scheme-word">${getCategoryName(part)}</span>`
    ).join(' → ');
    
    type.innerHTML = `Схема: ${schemeText}`;
    
    header.appendChild(title);
    header.appendChild(type);
    
    const content = document.createElement('div');
    content.className = 'phrase-content drop-zone';
    content.id = `phrase-content-${index}`;
    content.setAttribute('data-scheme', JSON.stringify(structure));
    content.ondragover = allowDrop;
    content.ondrop = drop;
    content.innerHTML = '<div class="placeholder">Перетащите слова сюда</div>';
    
    div.appendChild(header);
    div.appendChild(content);
    
    return div;
}

function initializeStage3() {
    const sentencesContainer = document.querySelector('.sentences-area');
    if (!sentencesContainer) {
        return;
    }
    
    const oldPanel = sentencesContainer.querySelector('.words-source-panel');
    if (oldPanel) oldPanel.remove();
    
    const instructions = sentencesContainer.querySelector('.sentences-instructions');
    if (instructions) {
        instructions.insertAdjacentHTML('afterend', `
            <div class="words-source-panel">
                <h3 class="words-source-title">Исходные слова</h3>
                <div id="stage3-words-source" class="words-source-container drop-zone"></div>
            </div>
        `);
    } 
    
    const sentencesListContainer = sentencesContainer.querySelector('.sentences-container');
    if (!sentencesListContainer) {
        return;
    }
    
    sentencesListContainer.innerHTML = '';
    
    for (let i = 0; i < 2; i++) {
        const sentenceLength = Math.floor(Math.random() * 4) + 4; 
        const sentenceStructure = getRandomPartsOfSpeech(sentenceLength);
        const sentenceElement = createSentenceElementWithScheme(i, sentenceStructure);
        sentencesListContainer.appendChild(sentenceElement);
    }
    
    const wordsSourceContainer = document.getElementById('stage3-words-source');
    if (wordsSourceContainer) {
        wordsSourceContainer.innerHTML = '';
        originalWordsMap.clear();
        
        const words = getWordsForStage(30); 

        if (words.length === 0) {
            wordsSourceContainer.innerHTML = '<div class="error">Нет доступных слов</div>';
        } else {
            words.forEach((word, index) => {
                const wordCard = createWordCardForStage(word, index, 3);
                wordCard.classList.add('word-original');
                originalWordsMap.set(wordCard.id, wordCard);
                wordsSourceContainer.appendChild(wordCard);
            });
        }
    } 
    
    saveCurrentStageState();
    startStageMovement();
}

function createSentenceElementWithScheme(index, structure) {
    const div = document.createElement('div');
    div.className = 'sentence-item';
    div.id = `sentence-${index}`;
    
    const header = document.createElement('div');
    header.className = 'sentence-header';
    
    const title = document.createElement('div');
    title.className = 'sentence-title';
    title.textContent = `Предложение ${index + 1}`;
    
    const type = document.createElement('div');
    type.className = 'sentence-type';
    
    const schemeText = structure.map(part => 
        `<span class="scheme-word">${getCategoryName(part)}</span>`
    ).join(' → ');
    
    type.innerHTML = `Схема: ${schemeText}`;
    
    header.appendChild(title);
    header.appendChild(type);
    
    const content = document.createElement('div');
    content.className = 'sentence-content drop-zone';
    content.id = `sentence-content-${index}`;
    content.setAttribute('data-scheme', JSON.stringify(structure));
    content.ondragover = allowDrop;
    content.ondrop = drop;
    content.innerHTML = '<div class="placeholder">Перетащите слова сюда</div>';
    
    div.appendChild(header);
    div.appendChild(content);
    
    return div;
}

function createWordCardForStage(word, index, stageNumber) {
    const card = document.createElement('div');
    card.className = 'word-card';
    card.id = `stage${stageNumber}-word-${index}`;
    card.setAttribute('data-word-id', word.id);
    card.setAttribute('data-type', word.type);
    card.setAttribute('draggable', 'true');
    card.classList.add('word-original');
    card.classList.add('absolute-position');
    card.style.position = 'absolute';
    
    const container = document.getElementById(`stage${stageNumber}-words-source`);
    if (container) {
        const containerRect = container.getBoundingClientRect();
        const containerPadding = 10;
        
        const randomX = containerPadding + Math.random() * (containerRect.width - 100 - containerPadding * 2);
        const randomY = containerPadding + Math.random() * (containerRect.height - 50 - containerPadding * 2);
        
        card.style.left = randomX + 'px';
        card.style.top = randomY + 'px';
    }
    
    card.addEventListener('dragstart', drag);
    card.addEventListener('dblclick', function() {
        if (stageLocked[currentStage]) {
            return;
        }
        
        const sourceContainer = document.getElementById(`stage${stageNumber}-words-source`);
        if (sourceContainer) {
            returnToSource(this, false, this.id, sourceContainer.id);
        }
    });
    
    card.textContent = word.word;
    
    return card;
}

function createWordCard(word, index, stage = 1) {
    const card = document.createElement('div');
    card.className = 'word-card';
    
    if (stage === 1) {
        card.id = `word-${index}`;
    } else {
        card.id = `stage${stage}-word-${index}`;
    }
    
    card.setAttribute('data-word-id', word.id);
    card.setAttribute('data-type', word.type);
    card.setAttribute('draggable', 'true');
    card.classList.add('word-original');
    card.classList.add('absolute-position');
    card.style.position = 'absolute';
    
    let container;
    if (stage === 1) {
        container = document.getElementById('all-words-container');
    } else {
        container = document.getElementById(`stage${stage}-words-source`);
    }
    
    if (container) {
        const containerRect = container.getBoundingClientRect();
        const containerPadding = 10;
        
        const availableWidth = containerRect.width - 100 - containerPadding * 2;
        const availableHeight = containerRect.height - 50 - containerPadding * 2;
        
        if (availableWidth > 0 && availableHeight > 0) {
            const randomX = containerPadding + Math.random() * availableWidth;
            const randomY = containerPadding + Math.random() * availableHeight;
            
            card.style.left = randomX + 'px';
            card.style.top = randomY + 'px';
        } else {
            card.style.left = containerPadding + 'px';
            card.style.top = containerPadding + 'px';
        }
    }
    
    card.addEventListener('dragstart', drag);
    
    card.addEventListener('dblclick', function() {
        if (stageLocked[stage]) {
            return;
        }
        
        let sourceContainer;
        if (stage === 1) {
            sourceContainer = document.getElementById('all-words-container');
        } else {
            sourceContainer = document.getElementById(`stage${stage}-words-source`);
        }
        
        if (sourceContainer) {
            returnToSource(this, false, this.id, sourceContainer.id);
        }
    });
    
    card.textContent = word.word;
    
    return card;
}

function updatePlaceholders() {
    const categoryContainers = document.querySelectorAll('.category-box .words-container');
    
    categoryContainers.forEach(container => {
        if (container) {
            const placeholder = container.querySelector('.placeholder');
            if (placeholder) {
                const hasWords = container.querySelectorAll('.word-card').length > 0;
                placeholder.style.display = hasWords ? 'none' : 'flex';
            } else if (container.querySelectorAll('.word-card').length === 0) {
                const newPlaceholder = document.createElement('div');
                newPlaceholder.className = 'placeholder';
                newPlaceholder.textContent = 'Перетащите слова сюда';
                container.appendChild(newPlaceholder);
            }
        }
    });
    
    const phraseContainers = document.querySelectorAll('.phrase-content');
    phraseContainers.forEach(container => {
        if (container) {
            const placeholder = container.querySelector('.placeholder');
            if (placeholder) {
                const hasWords = container.querySelectorAll('.word-card').length > 0;
                placeholder.style.display = hasWords ? 'none' : 'flex';
            } else if (container.querySelectorAll('.word-card').length === 0) {
                const newPlaceholder = document.createElement('div');
                newPlaceholder.className = 'placeholder';
                newPlaceholder.textContent = 'Перетащите слова сюда';
                container.appendChild(newPlaceholder);
            }
        }
    });
    
    const sentenceContainers = document.querySelectorAll('.sentence-content');
    sentenceContainers.forEach(container => {
        if (container) {
            const placeholder = container.querySelector('.placeholder');
            if (placeholder) {
                const hasWords = container.querySelectorAll('.word-card').length > 0;
                placeholder.style.display = hasWords ? 'none' : 'flex';
            } else if (container.querySelectorAll('.word-card').length === 0) {
                const newPlaceholder = document.createElement('div');
                newPlaceholder.className = 'placeholder';
                newPlaceholder.textContent = 'Перетащите слова сюда';
                container.appendChild(newPlaceholder);
            }
        }
    });
}

function checkWordsStage() {
    stopAllMovement();
    
    let correct = 0;
    let total = 0;
    const feedback = document.getElementById('words-feedback');
    const checkBtn = document.getElementById('check-words-btn');
    
    if (!feedback || !checkBtn) return;
    
    checkBtn.disabled = true; 
    checkBtn.style.opacity = '0.6';
    checkBtn.style.cursor = 'not-allowed';
    
    saveCurrentStageState();
    
    stageLocked[1] = true;
    stageStates[1].completed = true;
    
    const categoryContainers = document.querySelectorAll('.category-box');
    
    categoryContainers.forEach(categoryBox => {
        const categoryType = categoryBox.getAttribute('data-category');
        const container = categoryBox.querySelector('.words-container');
        
        if (container) {
            const words = container.querySelectorAll('.word-card');
            words.forEach(wordCard => {
                total++;
                const isCorrect = checkWordCategory(wordCard, categoryType);
                
                if (isCorrect) {
                    wordCard.classList.add('correct');
                    correct++;
                } else {
                    wordCard.classList.add('incorrect');
                }
                
                wordCard.setAttribute('draggable', 'false');
                wordCard.classList.add('word-locked');
                wordCard.classList.remove('absolute-position');
                wordCard.style.cursor = 'default';
                wordCard.style.opacity = '0.8';
                wordCard.style.transform = 'none';
                wordCard.style.left = '';
                wordCard.style.top = '';
                wordCard.style.position = 'static';
                
                const newWord = wordCard.cloneNode(true);
                wordCard.parentNode.replaceChild(newWord, wordCard);
            });
        }
    });
    
    const sourceContainer = document.getElementById('all-words-container');
    if (sourceContainer) {
        const sourceWords = sourceContainer.querySelectorAll('.word-card');
        sourceWords.forEach(wordCard => {
            wordCard.setAttribute('draggable', 'false');
            wordCard.classList.add('word-locked');
            wordCard.classList.remove('absolute-position');
            wordCard.style.cursor = 'default';
            wordCard.style.opacity = '0.8';
            wordCard.style.transform = 'none';
            wordCard.style.left = '';
            wordCard.style.top = '';
            wordCard.style.position = 'static';
            
            const newWord = wordCard.cloneNode(true);
            wordCard.parentNode.replaceChild(newWord, wordCard);
        });
        
        sourceContainer.classList.add('checked');
        const words = Array.from(sourceContainer.querySelectorAll('.word-card'));
        words.sort((a, b) => {
            const textA = a.textContent.toLowerCase();
            const textB = b.textContent.toLowerCase();
            return textA.localeCompare(textB);
        });
        
        sourceContainer.innerHTML = '';
        words.forEach(word => {
            word.style.position = 'static';
            word.style.left = '';
            word.style.top = '';
            sourceContainer.appendChild(word);
        });
    }
    
    correctWords = correct;
    totalWords = total;
    
    feedback.textContent = `Правильно: ${correct} из ${total}`;
    feedback.className = 'feedback ' + (correct === total ? 'correct' : 'incorrect');
    
    const pointsPerCorrect = 1;
    const basePoints = correct * pointsPerCorrect;
    updateScore(basePoints);
    
    let nextButton = document.getElementById('next-stage-btn');
    if (!nextButton) {
        nextButton = document.createElement('button');
        nextButton.id = 'next-stage-btn';
        nextButton.className = 'next-btn';
        nextButton.textContent = 'Перейти к этапу 2 →';
        nextButton.style.marginTop = '1rem';
        
        const stageControls = document.querySelector('#stage-1 .stage-controls');
        if (stageControls) {
            stageControls.appendChild(nextButton);
        }
    }
    
    nextButton.style.display = 'block';
    nextButton.onclick = function() {
        goToStage(2);
    };
    
    checkBtn.disabled = false;
}

function goToStage(stageNumber) {
    if (stageNumber < 1 || stageNumber > 3) return;
    
    if (currentStage !== stageNumber) {
        saveCurrentStageState();
        stopAllMovement();
    }
    
    currentStage = stageNumber;
    
    document.querySelectorAll('.game-stage').forEach(stage => {
        stage.classList.remove('active');
    });
    
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    for (let i = 1; i <= currentStage; i++) {
        const stepElement = document.querySelector(`.step[data-step="${i}"]`);
        if (stepElement) stepElement.classList.add('active');
    }
    
    let stageElement;
    if (stageNumber === 1) stageElement = document.getElementById('stage-1');
    else if (stageNumber === 2) stageElement = document.getElementById('stage-2');
    else if (stageNumber === 3) stageElement = document.getElementById('stage-3');
    
    if (stageElement) {
        stageElement.classList.add('active');
        
        restoreStageState(stageNumber);
        
        if (stageNumber === 2 && (!stageStates[2] || !stageStates[2].source || stageStates[2].source.length === 0)) {
            initializeStage2();
        } else if (stageNumber === 3 && (!stageStates[3] || !stageStates[3].source || stageStates[3].source.length === 0)) {
            initializeStage3();
        } else if (stageNumber === 1 && (!stageStates[1] || !stageStates[1].source || stageStates[1].source.length === 0)) {
            initializeStage1();
        }
        
        setTimeout(() => {
            updatePlaceholders();
            if (!stageLocked[stageNumber]) {
                startStageMovement();
            }
        }, 100);
    }
}

function checkPhrasesStage() {
    stopAllMovement();
    
    const phraseContainers = document.querySelectorAll('.phrase-content');
    let correctCount = 0;
    const feedback = document.getElementById('phrases-feedback');
    const checkBtn = document.getElementById('check-phrases-btn');
    
    if (!feedback || !checkBtn) return;
    
    checkBtn.disabled = true;
    
    saveCurrentStageState();
    
    stageLocked[2] = true;
    stageStates[2].completed = true;
    
    phraseContainers.forEach(container => {
        const words = container.querySelectorAll('.word-card');
        const scheme = JSON.parse(container.getAttribute('data-scheme') || '[]');
        
        if (words.length === scheme.length) {
            let isCorrect = true;
            
            words.forEach((word, index) => {
                const wordId = word.getAttribute('data-word-id');
                const wordData = getWordById(wordId);
                
                if (wordData && wordData.type === scheme[index]) {
                    word.classList.add('correct');
                } else {
                    word.classList.add('incorrect');
                    isCorrect = false;
                }
                
                word.setAttribute('draggable', 'false');
                word.classList.add('word-locked');
                word.classList.remove('absolute-position');
                word.style.cursor = 'default';
                word.style.opacity = '0.8';
                word.style.transform = 'none';
                word.style.left = '';
                word.style.top = '';
                word.style.position = 'static';
                
                const newWord = word.cloneNode(true);
                word.parentNode.replaceChild(newWord, word);
            });
            
            if (isCorrect) correctCount++;
        } else {
            words.forEach(word => {
                word.classList.add('incorrect');
                
                word.setAttribute('draggable', 'false');
                word.classList.add('word-locked');
                word.classList.remove('absolute-position');
                word.style.cursor = 'default';
                word.style.opacity = '0.8';
                word.style.transform = 'none';
                word.style.left = '';
                word.style.top = '';
                word.style.position = 'static';
                
                const newWord = word.cloneNode(true);
                word.parentNode.replaceChild(newWord, word);
            });
        }
    });
    
    const sourceContainer = document.getElementById('stage2-words-source');
    if (sourceContainer) {
        const sourceWords = sourceContainer.querySelectorAll('.word-card');
        sourceWords.forEach(word => {
            word.setAttribute('draggable', 'false');
            word.classList.add('word-locked');
            word.classList.remove('absolute-position');
            word.style.cursor = 'default';
            word.style.opacity = '0.8';
            word.style.transform = 'none';
            word.style.left = '';
            word.style.top = '';
            word.style.position = 'static';
            
            const newWord = word.cloneNode(true);
            word.parentNode.replaceChild(newWord, word);
        });
        
        sourceContainer.classList.add('checked');
        const words = Array.from(sourceContainer.querySelectorAll('.word-card'));
        words.sort((a, b) => {
            const textA = a.textContent.toLowerCase();
            const textB = b.textContent.toLowerCase();
            return textA.localeCompare(textB);
        });
        
        sourceContainer.innerHTML = '';
        words.forEach(word => {
            word.style.position = 'static';
            word.style.left = '';
            word.style.top = '';
            sourceContainer.appendChild(word);
        });
    }
    
    const totalPhrases = phraseContainers.length;
    feedback.textContent = `Правильно собрано: ${correctCount} из ${totalPhrases}`;
    feedback.className = 'feedback ' + (correctCount === totalPhrases ? 'correct' : 'incorrect');
    
    const pointsPerPhrase = 2;
    const basePoints = correctCount * pointsPerPhrase;
    updateScore(basePoints);
    
    let nextButton = document.getElementById('next-stage-btn-2');
    if (!nextButton) {
        nextButton = document.createElement('button');
        nextButton.id = 'next-stage-btn-2';
        nextButton.className = 'next-btn';
        nextButton.textContent = 'Перейти к этапу 3 →';
        nextButton.style.marginTop = '1rem';
        
        const stageControls = document.querySelector('#stage-2 .stage-controls');
        if (stageControls) {
            stageControls.appendChild(nextButton);
        }
    }
    
    nextButton.style.display = 'block';
    nextButton.onclick = function() {
        goToStage(3);
    };
    
    checkBtn.disabled = false;
}

function checkSentencesStage() {
    stopAllMovement();
    
    const sentenceContainers = document.querySelectorAll('.sentence-content');
    let correctCount = 0;
    const feedback = document.getElementById('sentences-feedback');
    const checkBtn = document.getElementById('check-sentences-btn');
    const finishBtn = document.getElementById('finish-level-btn-3');
    
    if (!feedback || !checkBtn) return;
    
    checkBtn.disabled = true;
    
    saveCurrentStageState();
    
    stageLocked[3] = true;
    stageStates[3].completed = true;
    
    sentenceContainers.forEach(container => {
        const words = container.querySelectorAll('.word-card');
        const scheme = JSON.parse(container.getAttribute('data-scheme') || '[]');
        
        if (words.length === scheme.length) {
            let isCorrect = true;
            
            words.forEach((word, index) => {
                const wordId = word.getAttribute('data-word-id');
                const wordData = getWordById(wordId);
                
                if (wordData && wordData.type === scheme[index]) {
                    word.classList.add('correct');
                } else {
                    word.classList.add('incorrect');
                    isCorrect = false;
                }
                
                word.setAttribute('draggable', 'false');
                word.classList.add('word-locked');
                word.classList.remove('absolute-position');
                word.style.cursor = 'default';
                word.style.opacity = '0.8';
                word.style.transform = 'none';
                word.style.left = '';
                word.style.top = '';
                word.style.position = 'static';
                
                const newWord = word.cloneNode(true);
                word.parentNode.replaceChild(newWord, word);
            });
            
            if (isCorrect) correctCount++;
        } else {
            words.forEach(word => {
                word.classList.add('incorrect');
                
                word.setAttribute('draggable', 'false');
                word.classList.add('word-locked');
                word.classList.remove('absolute-position');
                word.style.cursor = 'default';
                word.style.opacity = '0.8';
                word.style.transform = 'none';
                word.style.left = '';
                word.style.top = '';
                word.style.position = 'static';
                
                const newWord = word.cloneNode(true);
                word.parentNode.replaceChild(newWord, word);
            });
        }
    });
    
    const sourceContainer = document.getElementById('stage3-words-source');
    if (sourceContainer) {
        const sourceWords = sourceContainer.querySelectorAll('.word-card');
        sourceWords.forEach(word => {
            word.setAttribute('draggable', 'false');
            word.classList.add('word-locked');
            word.classList.remove('absolute-position');
            word.style.cursor = 'default';
            word.style.opacity = '0.8';
            word.style.transform = 'none';
            word.style.left = '';
            word.style.top = '';
            word.style.position = 'static';
            
            const newWord = word.cloneNode(true);
            word.parentNode.replaceChild(newWord, word);
        });
        
        sourceContainer.classList.add('checked');
        const words = Array.from(sourceContainer.querySelectorAll('.word-card'));
        words.sort((a, b) => {
            const textA = a.textContent.toLowerCase();
            const textB = b.textContent.toLowerCase();
            return textA.localeCompare(textB);
        });
        
        sourceContainer.innerHTML = '';
        words.forEach(word => {
            word.style.position = 'static';
            word.style.left = '';
            word.style.top = '';
            sourceContainer.appendChild(word);
        });
    }
    
    const totalSentences = sentenceContainers.length;
    feedback.textContent = `Правильно собрано: ${correctCount} из ${totalSentences}`;
    feedback.className = 'feedback ' + (correctCount === totalSentences ? 'correct' : 'incorrect');
    
    const pointsPerSentence = 3;
    const basePoints = correctCount * pointsPerSentence;
    updateScore(basePoints);
    
    if (finishBtn) {
        finishBtn.disabled = false;
        finishBtn.focus();
    }
    
    setTimeout(() => {
        feedback.textContent = `Проверено! Теперь нажмите "Завершить уровень"`;
    }, 1000);
    
    checkBtn.disabled = false;
}

function finishLevel() {
    const modal = document.getElementById('confirmation-modal');
    if (!modal) {
        const confirmationModal = document.createElement('div');
        confirmationModal.id = 'confirmation-modal';
        confirmationModal.className = 'modal';
        confirmationModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Завершение уровня</h3>
                    <button class="modal-close" onclick="closeConfirmationModal()">×</button>
                </div>
                <div class="modal-body">
                    <p>Вы действительно хотите завершить уровень досрочно?</p>
                    <div class="modal-buttons">
                        <button class="confirm-btn" onclick="confirmFinishLevel()">Завершить</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(confirmationModal);
    }
    
    document.getElementById('confirmation-modal').classList.remove('hidden');
}

function confirmFinishLevel() {
    closeConfirmationModal();
    
    if (currentStage === 3 && !stageStates[3].completed) {
        const feedbackElement = document.getElementById('sentences-feedback');
        if (feedbackElement) {
            feedbackElement.textContent = 'Сначала проверьте ответы нажав "Проверить"!';
            feedbackElement.className = 'feedback incorrect';
            return;
        }
    }
    
    completeLevel();
}

function closeConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    if (modal) modal.classList.add('hidden');
}

function completeLevel() {
    if (hasResultsSaved) {
        showResultsModal();
        return;
    }
    
    if (currentStage === 3 && !stageStates[3].completed) {
        const feedbackElement = document.getElementById('sentences-feedback');
        if (feedbackElement) {
            feedbackElement.textContent = 'Сначала проверьте ответы нажав "Проверить"!';
            feedbackElement.className = 'feedback incorrect';
            return;
        }
    }
    
    clearInterval(gameTimer);
    stopAllMovement();
    
    saveGameResults();
    
    showResultsModal();
}

function saveGameResults() {
    if (hasResultsSaved) {
        return;
    }
    
    const playerName = localStorage.getItem('playerName') || 'Игрок';
    const currentSession = JSON.parse(localStorage.getItem('currentGameSession') || '{}');
    const gameType = currentSession.gameType || 'official';
    
    let timeBonus = 0;
    if (gameScore > 0 && timeLeft > 0) {
        timeBonus = 1; 
    }
    
    const finalScore = gameScore + timeBonus;
    
    const sessionData = {
        playerName: playerName,
        level: selectedLevel,
        score: finalScore,
        time: 120 - timeLeft,
        gameType: gameType,
        stage: currentStage,
        baseScore: gameScore,
        timeBonus: timeBonus, 
        correctWords: correctWords,
        totalWords: totalWords
    };
    
    if (typeof saveGameSession === 'function') {
        saveGameSession(sessionData);
    } else {
        const gameSessions = JSON.parse(localStorage.getItem('gameSessions') || '[]');
        gameSessions.push({
            id: Date.now(),
            ...sessionData,
            date: new Date().toISOString()
        });
        localStorage.setItem('gameSessions', JSON.stringify(gameSessions));
        
        const playerStats = JSON.parse(localStorage.getItem('playerStats') || '{}');
        playerStats.totalScore = (playerStats.totalScore || 0) + finalScore; 
        playerStats.totalTime = (playerStats.totalTime || 0) + (120 - timeLeft);
        playerStats.gamesPlayed = (playerStats.gamesPlayed || 0) + 1;
        playerStats.lastPlayed = new Date().toISOString();
        localStorage.setItem('playerStats', JSON.stringify(playerStats));
    }
    
    hasResultsSaved = true;
}

function showResultsModal() {
    const modal = document.getElementById('completion-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        const finalScore = document.getElementById('final-score');
        const timeLeftElement = document.getElementById('time-left');
        const speedBonusElement = document.getElementById('speed-bonus');
        const totalScoreElement = document.getElementById('total-score');
        
        if (finalScore) finalScore.textContent = gameScore;
        if (timeLeftElement) timeLeftElement.textContent = `${timeLeft} сек`;
        
        let timeBonus = 0;
        if (gameScore > 0 && timeLeft > 0) {
            timeBonus = 1;
        }
        
        if (speedBonusElement) speedBonusElement.textContent = `+${timeBonus}`;
        if (totalScoreElement) totalScoreElement.textContent = gameScore + timeBonus;
        
        const correctCountElement = document.getElementById('correct-count');
        if (correctCountElement && correctWords !== undefined && totalWords !== undefined) {
            correctCountElement.textContent = `${correctWords}/${totalWords}`;
        }
    }
}

function updateScore(points) {
    gameScore += points;
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = gameScore;
        scoreElement.classList.add('score-update');
        setTimeout(() => scoreElement.classList.remove('score-update'), 500);
    }
}

function startTimer() {
    updateTimerDisplay();
    
    gameTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(gameTimer);
            timeOut();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerElement.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 30) {
            timerElement.style.color = '#e74c3c';
        } else {
            timerElement.style.color = '';
        }
    }
}

function timeOut() {
    if (currentStage === 3 && !stageStates[3].completed) {
        checkSentencesStage();
        
        setTimeout(() => {
            completeLevel();
        }, 1500);
    } else {
        completeLevel();
    }
}

function setupEventListeners() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeCompletionModal();
            closeConfirmationModal();
        }
    });
    
    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('click', function() {
            const stepNumber = parseInt(this.getAttribute('data-step'));
            goToStage(stepNumber);
        });
    });
    
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('drop', function(e) {
        e.preventDefault();
    });
    
    const finishBtn2 = document.getElementById('finish-level-btn-2');
    if (finishBtn2) finishBtn2.addEventListener('click', finishLevel);
}

function showError(message) {
    const feedback = document.getElementById('words-feedback') || 
                    document.getElementById('phrases-feedback') || 
                    document.getElementById('sentences-feedback');
    if (feedback) {
        feedback.textContent = message;
        feedback.className = 'feedback incorrect';
    }
}

function goToLevels() {
    stopAllMovement();
    setTimeout(() => window.location.href = 'levels.html', 100);
}

function goToLevel(level) {
    stopAllMovement();
    localStorage.setItem('selectedLevel', level);
    setTimeout(() => {
        window.location.href = `level${level}.html`;
    }, 100);
}

function restartLevel() {
    stopAllMovement();
    hasResultsSaved = false;
    window.location.reload();
}

function closeCompletionModal() {
    const modal = document.getElementById('completion-modal');
    if (modal) modal.classList.add('hidden');
}

function createWordCardFromState(wordData, stageNumber) {
    const card = document.createElement('div');
    card.className = 'word-card';
    card.id = wordData.id;
    card.setAttribute('data-word-id', wordData.wordId);
    card.setAttribute('data-type', wordData.type);
    card.textContent = wordData.text;
    
    if (wordData.classes) {
        wordData.classes.forEach(cls => card.classList.add(cls));
    }
    
    if (wordData.position && wordData.position.isAbsolute && 
        wordData.position.left && wordData.position.top) {
        card.style.position = 'absolute';
        card.style.left = wordData.position.left;
        card.style.top = wordData.position.top;
        card.classList.add('absolute-position');
    }
    
    if (wordData.isClone) {
        card.setAttribute('data-original-id', wordData.originalId);
        card.setAttribute('draggable', !stageLocked[stageNumber]);
        card.classList.add('word-clone');
        
        card.addEventListener('dragstart', drag);
        card.addEventListener('dblclick', function() {
            if (stageLocked[stageNumber]) {
                return;
            }
            
            let sourceContainer;
            if (stageNumber === 1) {
                sourceContainer = document.getElementById('all-words-container');
            } else if (stageNumber === 2) {
                sourceContainer = document.getElementById('stage2-words-source');
            } else if (stageNumber === 3) {
                sourceContainer = document.getElementById('stage3-words-source');
            }
            
            if (sourceContainer) {
                returnToSource(this, true, this.getAttribute('data-original-id'), sourceContainer.id);
            }
        });
    } else {
        card.classList.add('word-original');
        card.setAttribute('draggable', !stageLocked[stageNumber]);
        
        card.addEventListener('dragstart', drag);
        card.addEventListener('dblclick', function() {
            if (stageLocked[stageNumber]) {
                return;
            }
            
            let sourceContainer;
            if (stageNumber === 1) {
                sourceContainer = document.getElementById('all-words-container');
            } else if (stageNumber === 2) {
                sourceContainer = document.getElementById('stage2-words-source');
            } else if (stageNumber === 3) {
                sourceContainer = document.getElementById('stage3-words-source');
            }
            
            if (sourceContainer) {
                returnToSource(this, false, this.id, sourceContainer.id);
            }
        });
    }
    
    if (stageLocked[stageNumber]) {
        card.setAttribute('draggable', 'false');
        card.classList.add('word-locked');
        card.classList.remove('absolute-position');
        card.style.cursor = 'default';
        card.style.opacity = '0.8';
        card.style.position = 'static';
        card.style.transform = 'none';
        card.style.left = '';
        card.style.top = '';
    }
    
    return card;
}

function getStage2State() {
    const state = {
        source: [],
        phrases: {},
        completed: stageStates[2].completed || false,
        locked: stageLocked[2] || false
    };
    
    const sourceContainer = document.getElementById('stage2-words-source');
    if (sourceContainer) {
        const words = sourceContainer.querySelectorAll('.word-card');
        state.source = Array.from(words).map(word => ({
            id: word.id,
            wordId: word.getAttribute('data-word-id'),
            type: word.getAttribute('data-type'),
            text: word.textContent,
            isClone: word.classList.contains('word-clone'),
            originalId: word.getAttribute('data-original-id'),
            display: word.style.display,
            classes: Array.from(word.classList),
            position: {
                left: word.style.left,
                top: word.style.top,
                isAbsolute: word.classList.contains('absolute-position')
            }
        }));
    }
    
    const phraseContainers = document.querySelectorAll('.phrase-item');
    phraseContainers.forEach((phrase, index) => {
        const content = phrase.querySelector('.phrase-content');
        if (content) {
            const words = content.querySelectorAll('.word-card');
            state.phrases[`phrase-${index}`] = {
                id: phrase.id,
                scheme: content.getAttribute('data-scheme') || JSON.stringify(getRandomPartsOfSpeech(2)),
                words: Array.from(words).map(word => ({
                    id: word.id,
                    wordId: word.getAttribute('data-word-id'),
                    type: word.getAttribute('data-type'),
                    text: word.textContent,
                    isClone: word.classList.contains('word-clone'),
                    originalId: word.getAttribute('data-original-id'),
                    classes: Array.from(word.classList)
                }))
            };
        }
    });
    
    return state;
}

function restoreStage2State() {
    const state = stageStates[2];
    if (!state) return;
    
    const phrasesContainer = document.querySelector('.phrases-area .phrases-container');
    if (!phrasesContainer) return;
    phrasesContainer.innerHTML = '';
    
    if (state.phrases && Object.keys(state.phrases).length > 0) {
        Object.values(state.phrases).forEach((phraseData, index) => {
            let scheme;
            try {
                scheme = JSON.parse(phraseData.scheme);
            } catch (e) {
                scheme = getRandomPartsOfSpeech(2);
            }
            
            const phraseElement = createPhraseElementWithScheme(index, scheme);
            phrasesContainer.appendChild(phraseElement);
        });
    } else {
        for (let i = 0; i < 3; i++) {
            const phraseStructure = getRandomPartsOfSpeech(2);
            const phraseElement = createPhraseElementWithScheme(i, phraseStructure);
            phrasesContainer.appendChild(phraseElement);
        }
    }
    
    const sourceContainer = document.getElementById('stage2-words-source');
    if (sourceContainer && state.source) {
        sourceContainer.innerHTML = '';
        sourceContainer.classList.remove('checked');
        
        state.source.forEach(wordData => {
            const wordCard = createWordCardFromState(wordData, 2);
            wordCard.style.display = wordData.display || 'flex';
            sourceContainer.appendChild(wordCard);
        });
    }
    
    if (state.phrases && Object.keys(state.phrases).length > 0) {
        Object.values(state.phrases).forEach((phraseData, index) => {
            const phraseElement = document.getElementById(`phrase-${index}`);
            if (phraseElement) {
                const content = phraseElement.querySelector('.phrase-content');
                if (content && phraseData.words) {
                    content.innerHTML = '';
                    phraseData.words.forEach(wordData => {
                        const wordCard = createWordCardFromState(wordData, 2);
                        content.appendChild(wordCard);
                    });
                }
            }
        });
    }
    
    if (state.locked) {
        document.querySelectorAll('#stage2-words-source .word-card, .phrase-content .word-card').forEach(card => {
            card.classList.add('word-locked');
            card.classList.remove('absolute-position');
            card.style.cursor = 'default';
            card.style.opacity = '0.8';
            card.style.position = 'static';
            card.style.transform = 'none';
            card.style.left = '';
            card.style.top = '';
            
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
        });
        
        const sourceContainer = document.getElementById('stage2-words-source');
        if (sourceContainer) {
            sourceContainer.classList.add('checked');
            const words = Array.from(sourceContainer.querySelectorAll('.word-card'));
            words.sort((a, b) => {
                const textA = a.textContent.toLowerCase();
                const textB = b.textContent.toLowerCase();
                return textA.localeCompare(textB);
            });
            
            sourceContainer.innerHTML = '';
            words.forEach(word => {
                word.style.position = 'static';
                word.style.left = '';
                word.style.top = '';
                sourceContainer.appendChild(word);
            });
        }
    } else {
        startStageMovement();
    }
}

function getStage3State() {
    const state = {
        source: [],
        sentences: {},
        completed: stageStates[3].completed || false,
        locked: stageLocked[3] || false
    };
    
    const sourceContainer = document.getElementById('stage3-words-source');
    if (sourceContainer) {
        const words = sourceContainer.querySelectorAll('.word-card');
        state.source = Array.from(words).map(word => ({
            id: word.id,
            wordId: word.getAttribute('data-word-id'),
            type: word.getAttribute('data-type'),
            text: word.textContent,
            isClone: word.classList.contains('word-clone'),
            originalId: word.getAttribute('data-original-id'),
            display: word.style.display,
            classes: Array.from(word.classList),
            position: {
                left: word.style.left,
                top: word.style.top,
                isAbsolute: word.classList.contains('absolute-position')
            }
        }));
    }
    
    const sentenceContainers = document.querySelectorAll('.sentence-item');
    sentenceContainers.forEach((sentence, index) => {
        const content = sentence.querySelector('.sentence-content');
        if (content) {
            const words = content.querySelectorAll('.word-card');
            state.sentences[`sentence-${index}`] = {
                id: sentence.id,
                scheme: content.getAttribute('data-scheme') || JSON.stringify(getRandomPartsOfSpeech(4)),
                words: Array.from(words).map(word => ({
                    id: word.id,
                    wordId: word.getAttribute('data-word-id'),
                    type: word.getAttribute('data-type'),
                    text: word.textContent,
                    isClone: word.classList.contains('word-clone'),
                    originalId: word.getAttribute('data-original-id'),
                    classes: Array.from(word.classList)
                }))
            };
        }
    });
    
    return state;
}

function restoreStage3State() {
    const state = stageStates[3];
    if (!state) return;
    
    const sentencesContainer = document.querySelector('.sentences-area .sentences-container');
    if (!sentencesContainer) return;
    
    sentencesContainer.innerHTML = '';
    
    if (state.sentences && Object.keys(state.sentences).length > 0) {
        Object.values(state.sentences).forEach((sentenceData, index) => {
            let scheme;
            try {
                scheme = JSON.parse(sentenceData.scheme);
            } catch (e) {
                const sentenceLength = Math.floor(Math.random() * 4) + 4;
                scheme = getRandomPartsOfSpeech(sentenceLength);
            }
            
            const sentenceElement = createSentenceElementWithScheme(index, scheme);
            sentencesContainer.appendChild(sentenceElement);
        });
    } else {
        for (let i = 0; i < 2; i++) {
            const sentenceLength = Math.floor(Math.random() * 4) + 4;
            const sentenceStructure = getRandomPartsOfSpeech(sentenceLength);
            const sentenceElement = createSentenceElementWithScheme(i, sentenceStructure);
            sentencesContainer.appendChild(sentenceElement);
        }
    }
    
    const sourceContainer = document.getElementById('stage3-words-source');
    if (sourceContainer && state.source) {
        sourceContainer.innerHTML = '';
        sourceContainer.classList.remove('checked');
        
        state.source.forEach(wordData => {
            const wordCard = createWordCardFromState(wordData, 3);
            wordCard.style.display = wordData.display || 'flex';
            sourceContainer.appendChild(wordCard);
        });
    }
    
    if (state.sentences && Object.keys(state.sentences).length > 0) {
        Object.values(state.sentences).forEach((sentenceData, index) => {
            const sentenceElement = document.getElementById(`sentence-${index}`);
            if (sentenceElement) {
                const content = sentenceElement.querySelector('.sentence-content');
                if (content && sentenceData.words) {
                    content.innerHTML = '';
                    sentenceData.words.forEach(wordData => {
                        const wordCard = createWordCardFromState(wordData, 3);
                        content.appendChild(wordCard);
                    });
                }
            }
        });
    }
    
    if (state.locked) {
        const checkBtn = document.getElementById('check-sentences-btn');
        if (checkBtn) checkBtn.disabled = true;
        
        document.querySelectorAll('#stage3-words-source .word-card, .sentence-content .word-card').forEach(card => {
            card.classList.add('word-locked');
            card.classList.remove('absolute-position');
            card.style.cursor = 'default';
            card.style.opacity = '0.8';
            card.style.position = 'static';
            card.style.transform = 'none';
            card.style.left = '';
            card.style.top = '';
            
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
        });
        
        const sourceContainer = document.getElementById('stage3-words-source');
        if (sourceContainer) {
            sourceContainer.classList.add('checked');
            const words = Array.from(sourceContainer.querySelectorAll('.word-card'));
            words.sort((a, b) => {
                const textA = a.textContent.toLowerCase();
                const textB = b.textContent.toLowerCase();
                return textA.localeCompare(textB);
            });
            
            sourceContainer.innerHTML = '';
            words.forEach(word => {
                word.style.position = 'static';
                word.style.left = '';
                word.style.top = '';
                sourceContainer.appendChild(word);
            });
        }
        
        const finishBtn = document.getElementById('finish-level-btn-3');
        if (finishBtn) finishBtn.disabled = false;
    } else {
        startStageMovement();
    }
}

function startStageMovement() {
    if (currentStage === 1) {
        startStage1Movement();
    } else if (currentStage === 2) {
        startStage2Movement();
    } else if (currentStage === 3) {
        startStage3Movement();
    }
}

function stopAllMovement() {
    movementIntervals.forEach((intervalId, wordId) => {
        clearInterval(intervalId);
    });
    movementIntervals.clear();
}

function stopWordMovement(wordElement) {
    const intervalId = movementIntervals.get(wordElement.id);
    if (intervalId) {
        clearInterval(intervalId);
        movementIntervals.delete(wordElement.id);
    }
}

function startWordMovement(wordElement, container) {
    if (stageLocked[currentStage] || 
        wordElement.classList.contains('word-locked') || 
        wordElement.style.display === 'none' ||
        !wordElement.classList.contains('absolute-position')) {
        return;
    }
    
    stopWordMovement(wordElement);
    
    const intervalId = setInterval(() => {
        if (stageLocked[currentStage] || 
            wordElement.classList.contains('word-locked') || 
            wordElement.style.display === 'none') {
            clearInterval(intervalId);
            movementIntervals.delete(wordElement.id);
            return;
        }
        
        moveWordInContainer(wordElement, container);
    }, 1500 + Math.random() * 1500);
    
    movementIntervals.set(wordElement.id, intervalId);
}

function startStage1Movement() {
    const container = document.getElementById('all-words-container');
    if (!container) return;
    
    const wordCards = container.querySelectorAll('.word-card.absolute-position:not(.word-locked)');
    
    wordCards.forEach(wordCard => {
        startWordMovement(wordCard, container);
    });
}

function startStage2Movement() {
    const sourceContainer = document.getElementById('stage2-words-source');
    const phraseContainers = document.querySelectorAll('.phrase-content');
    
    if (sourceContainer && !stageLocked[2]) {
        const sourceWords = sourceContainer.querySelectorAll('.word-card.absolute-position:not(.word-locked)');
        
        sourceWords.forEach(wordCard => {
            startWordMovement(wordCard, sourceContainer);
        });
    }
    
    if (!stageLocked[2]) {
        phraseContainers.forEach(phraseContainer => {
            const wordsInPhrase = phraseContainer.querySelectorAll('.word-card:not(.word-locked)');
            
            wordsInPhrase.forEach(wordCard => {
                wordCard.classList.remove('absolute-position');
                wordCard.style.position = 'static';
                wordCard.style.left = '';
                wordCard.style.top = '';
            });
        });
    }
}

function startStage3Movement() {
    const sourceContainer = document.getElementById('stage3-words-source');
    const sentenceContainers = document.querySelectorAll('.sentence-content');
    
    if (sourceContainer && !stageLocked[3]) {
        const sourceWords = sourceContainer.querySelectorAll('.word-card.absolute-position:not(.word-locked)');
        
        sourceWords.forEach(wordCard => {
            startWordMovement(wordCard, sourceContainer);
        });
    }
    
    if (!stageLocked[3]) {
        sentenceContainers.forEach(sentenceContainer => {
            const wordsInSentence = sentenceContainer.querySelectorAll('.word-card:not(.word-locked)');
            
            wordsInSentence.forEach(wordCard => {
                wordCard.classList.remove('absolute-position');
                wordCard.style.position = 'static';
                wordCard.style.left = '';
                wordCard.style.top = '';
            });
        });
    }
}

function moveWordInContainer(wordElement, container) {
    if (stageLocked[currentStage] || 
        wordElement.classList.contains('word-locked') || 
        wordElement.style.display === 'none' ||
        !wordElement.classList.contains('absolute-position')) {
        return;
    }
    
    const containerRect = container.getBoundingClientRect();
    const wordRect = wordElement.getBoundingClientRect();
    const containerPadding = 10;
    
    const wordWidth = wordRect.width;
    const wordHeight = wordRect.height;
    
    const maxX = containerRect.width - wordWidth - containerPadding * 2;
    const maxY = containerRect.height - wordHeight - containerPadding * 2;
    
    if (maxX <= 0 || maxY <= 0) {
        wordElement.style.left = containerPadding + 'px';
        wordElement.style.top = containerPadding + 'px';
        return;
    }
    
    const newX = Math.floor(Math.random() * maxX) + containerPadding;
    const newY = Math.floor(Math.random() * maxY) + containerPadding;
    
    wordElement.style.left = newX + 'px';
    wordElement.style.top = newY + 'px';
}

document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        stopAllMovement();
    } else if (document.visibilityState === 'visible' && !stageLocked[currentStage]) {
        setTimeout(() => startStageMovement(), 500);
    }
});

window.addEventListener('beforeunload', function() {
    stopAllMovement();
});