let currentStage = 1;
let gameScore = 0;
let timeLeft = 110;
let gameTimer;
let selectedLevel = 2;
let playerName = 'Игрок';
let hasResultsSaved = false;

let gameData = null;
let level2Words = [];
let level2Distractors = [];
let originalText = '';
let gaps = [];
let selectedWord = null;
let selectedGap = null;

let stageResults = {
    1: { correct: 0, total: 0, answers: {} },
    2: { correct: 0, total: 0, answers: {} },
    3: { correct: 0, total: 0, answers: {} }
};

let stageCompleted = {
    1: false,
    2: false,
    3: false
};

let gameLocked = false;

function extractWord(wordWithPunctuation) {
    return wordWithPunctuation.replace(/[.,!?;:"]+$/, '');
}

function extractPunctuation(wordWithPunctuation) {
    const match = wordWithPunctuation.match(/[.,!?;:"]+$/);
    return match ? match[0] : '';
}

document.addEventListener('DOMContentLoaded', async function() {
    
    try {
        await loadGameData();
        loadPlayerData();
        setupGame();
        startTimer();
        initializeStage1();
        setupEventListeners();
    } catch (error) {
        showError('Не удалось загрузить данные игры. Попробуйте обновить страницу.');
    }
});

async function loadGameData() {
    try {
        if (typeof window.wordsData !== 'undefined') {
            gameData = window.wordsData;
            
            if (!gameData.level2_words || !Array.isArray(gameData.level2_words)) {
                throw new Error('Некорректная структура данных');
            }

            level2Words = gameData.level2_words;
            level2Distractors = gameData.level2_distractors || [];
            
            if (level2Words.length < 5) {
                throw new Error('Недостаточно слов для уровня 2');
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        throw error;
    }
}

function loadPlayerData() {
    playerName = localStorage.getItem('playerName') || 'Игрок';
    selectedLevel = parseInt(localStorage.getItem('selectedLevel')) || 2;

    const playerNameElement = document.getElementById('player-name');
    if (playerNameElement) {
        playerNameElement.textContent = playerName;
    }
    
    const stageCounter = document.getElementById('stage-counter');
    if (stageCounter) {
        stageCounter.textContent = `${currentStage}/3`;
    }
}

function setupGame() {
    timeLeft = 110; 
    
    document.getElementById('score').textContent = gameScore;
    updateTimerDisplay();
    
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = "01:50";
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
    if (gameLocked) return;
    gameLocked = true;
    
    if (currentStage >= 1 && currentStage <= 3) {
        lockStageElements(currentStage);
    }
    
    for (let i = 1; i <= 3; i++) {
        const checkBtn = document.getElementById(`check-stage${i}-btn`);
        if (checkBtn) checkBtn.disabled = true;
    }
    
    if (!stageCompleted[currentStage]) {
        autoCheckCurrentStage();
    }
    
    setTimeout(() => {
        showTimeOutModal();
    }, 500);
}

function autoCheckCurrentStage() {
    const stageNumber = currentStage;
    
    const totalGaps = gaps.length;
    let correctCount = 0;
    
    gaps.forEach(gap => {
        if (gap.userAnswer !== null && gap.isCorrect) {
            correctCount++;
        }
    });
    
    stageResults[stageNumber].correct = correctCount;
    stageResults[stageNumber].total = totalGaps;
    
    const pointsPerCorrect = 10;
    const stagePoints = correctCount * pointsPerCorrect;
    updateScore(stagePoints);
    
    stageCompleted[stageNumber] = true;
}

function showTimeOutModal() {
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    for (let i = 1; i <= 3; i++) {
        totalCorrect += stageResults[i].correct || 0;
        totalQuestions += stageResults[i].total || 0;
    }
    
    const modal = document.getElementById('completion-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        const modalHeader = modal.querySelector('.modal-header h2');
        if (modalHeader) {
            modalHeader.textContent = 'Время вышло!';
        }
        
        const finalScore = document.getElementById('final-score');
        const timeLeftElement = document.getElementById('time-left');
        const correctCountElement = document.getElementById('correct-count');
        const speedBonusElement = document.getElementById('speed-bonus');
        const totalScoreElement = document.getElementById('total-score');
        
        if (finalScore) finalScore.textContent = gameScore;
        if (timeLeftElement) timeLeftElement.textContent = `0 сек`;
        if (correctCountElement) correctCountElement.textContent = `${totalCorrect}/${totalQuestions}`;
        if (speedBonusElement) speedBonusElement.textContent = `+0`;
        if (totalScoreElement) totalScoreElement.textContent = gameScore;
    }
    
    saveGameResults();
}

function initializeStage1() {
    const wordOnlyPositions = [];
    for (let i = 0; i < level2Words.length; i++) {
        const cleanWord = extractWord(level2Words[i]);
        if (cleanWord.trim().length > 0) {
            wordOnlyPositions.push(i);
        }
    }
    
    const gapPositions = generateRandomGapPositions(5, wordOnlyPositions.length);
    
    let textWithGaps = '';
    gaps = [];
    let wordIndex = 0;
    
    for (let i = 0; i < level2Words.length; i++) {
        const currentWord = level2Words[i];
        const cleanWord = extractWord(currentWord);
        const punctuation = extractPunctuation(currentWord);
        
        if (cleanWord.trim().length === 0) {
            textWithGaps += punctuation + ' ';
            continue;
        }
        
        if (gapPositions.includes(wordIndex)) {
            const gapNumber = gapPositions.indexOf(wordIndex) + 1;
            textWithGaps += `<span class="gap-number" data-gap="${gapNumber}" data-original="${cleanWord}" data-punctuation="${punctuation}">${gapNumber}</span>${punctuation} `;
            gaps.push({
                number: gapNumber,
                originalWord: cleanWord,
                punctuation: punctuation,
                userAnswer: null,
                isCorrect: false
            });
        } else {
            textWithGaps += cleanWord + punctuation + ' ';
        }
        
        wordIndex++;
    }
    
    originalText = level2Words.join(' ');
    
    const mainTextElement = document.getElementById('main-text');
    if (mainTextElement) {
        mainTextElement.innerHTML = textWithGaps;
        
        const gapElements = mainTextElement.querySelectorAll('.gap-number');
        gapElements.forEach(gap => {
            gap.addEventListener('click', function() {
                handleGapClick(this);
            });
        });
    }
    
    initializeAnswers(1);
}

function initializeStage2() {
    const wordOnlyPositions = [];
    for (let i = 0; i < level2Words.length; i++) {
        const cleanWord = extractWord(level2Words[i]);
        if (cleanWord.trim().length > 0) {
            wordOnlyPositions.push(i);
        }
    }
    
    const gapPositions = generateRandomGapPositions(5, wordOnlyPositions.length);
    
    let textWithGaps = '';
    gaps = [];
    let wordIndex = 0;
    
    for (let i = 0; i < level2Words.length; i++) {
        const currentWord = level2Words[i];
        const cleanWord = extractWord(currentWord);
        const punctuation = extractPunctuation(currentWord);
        
        if (cleanWord.trim().length === 0) {
            textWithGaps += punctuation + ' ';
            continue;
        }
        
        if (gapPositions.includes(wordIndex)) {
            const gapNumber = gapPositions.indexOf(wordIndex) + 1;
            textWithGaps += `<span class="gap-number" data-gap="${gapNumber}" data-original="${cleanWord}" data-punctuation="${punctuation}">${gapNumber}</span>${punctuation} `;
            gaps.push({
                number: gapNumber,
                originalWord: cleanWord,
                punctuation: punctuation,
                userAnswer: null,
                isCorrect: false
            });
        } else {
            textWithGaps += cleanWord + punctuation + ' ';
        }
        
        wordIndex++;
    }
    
    const mainTextElement = document.getElementById('main-text-2');
    if (mainTextElement) {
        mainTextElement.innerHTML = textWithGaps;
        
        const gapElements = mainTextElement.querySelectorAll('.gap-number');
        gapElements.forEach(gap => {
            gap.addEventListener('click', function() {
                handleGapClick(this);
            });
        });
    }
    
    initializeAnswers(2);
    
    setTimeout(() => {
        startSequentialDisappearance(2, 'slow');
    }, 1500);
}

function initializeStage3() {
    const wordOnlyPositions = [];
    for (let i = 0; i < level2Words.length; i++) {
        const cleanWord = extractWord(level2Words[i]);
        if (cleanWord.trim().length > 0) {
            wordOnlyPositions.push(i);
        }
    }
    
    const gapPositions = generateRandomGapPositions(5, wordOnlyPositions.length);
    
    let textWithGaps = '';
    gaps = [];
    let wordIndex = 0;
    
    for (let i = 0; i < level2Words.length; i++) {
        const currentWord = level2Words[i];
        const cleanWord = extractWord(currentWord);
        const punctuation = extractPunctuation(currentWord);
        
        if (cleanWord.trim().length === 0) {
            textWithGaps += punctuation + ' ';
            continue;
        }
        
        if (gapPositions.includes(wordIndex)) {
            const gapNumber = gapPositions.indexOf(wordIndex) + 1;
            textWithGaps += `<span class="gap-number" data-gap="${gapNumber}" data-original="${cleanWord}" data-punctuation="${punctuation}">${gapNumber}</span>${punctuation} `;
            gaps.push({
                number: gapNumber,
                originalWord: cleanWord,
                punctuation: punctuation,
                userAnswer: null,
                isCorrect: false
            });
        } else {
            textWithGaps += cleanWord + punctuation + ' ';
        }
        
        wordIndex++;
    }
    
    const mainTextElement = document.getElementById('main-text-3');
    if (mainTextElement) {
        mainTextElement.innerHTML = textWithGaps;
        
        const gapElements = mainTextElement.querySelectorAll('.gap-number');
        gapElements.forEach(gap => {
            gap.addEventListener('click', function() {
                handleGapClick(this);
            });
        });
    }
    
    initializeAnswers(3);
    
     setTimeout(() => {
        startSequentialDisappearance(3, 'fast');
    }, 800);
}

function generateRandomGapPositions(count, maxLength) {
    const positions = new Set();
    
    while (positions.size < Math.min(count, maxLength)) {
        const randomPos = Math.floor(Math.random() * maxLength);
        positions.add(randomPos);
    }
    
    return Array.from(positions).sort((a, b) => a - b);
}

function initializeAnswers(stageNumber) {
    const correctWords = gaps.map(gap => gap.originalWord);
    
    const shuffledDistractors = [...level2Distractors]
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);
    
    const allAnswerWords = [...correctWords, ...shuffledDistractors]
        .sort(() => Math.random() - 0.5);
    
    let containerId;
    if (stageNumber === 1) {
        containerId = 'answers-container';
    } else {
        containerId = `answers-container-${stageNumber}`;
    }
    
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Контейнер с ID ${containerId} не найден`);
        return;
    }
    
    container.innerHTML = '';
    
    allAnswerWords.forEach((word, index) => {
        const wordElement = document.createElement('div');
        wordElement.className = 'answer-word';
        wordElement.textContent = word;
        wordElement.setAttribute('data-word', word);
        
        const isCorrectWord = correctWords.includes(word);
        wordElement.setAttribute('data-correct', isCorrectWord);
        
        wordElement.addEventListener('click', function() {
            handleWordClick(this, stageNumber);
        });
        
        container.appendChild(wordElement);
    });
    
    selectedWord = null;
    selectedGap = null;
    
    let stageTextId;
    if (stageNumber === 1) {
        stageTextId = 'main-text';
    } else {
        stageTextId = `main-text-${stageNumber}`;
    }
    
    const mainTextElement = document.getElementById(stageTextId);
    if (mainTextElement) {
        const gapElements = mainTextElement.querySelectorAll('.gap-number');
        gapElements.forEach(gap => {
            gap.classList.remove('selected');
        });
    }
}

function handleWordClick(wordElement, stageNumber) {
    if (gameLocked || stageCompleted[stageNumber]) return;
    
    if (wordElement.classList.contains('used') || 
        wordElement.classList.contains('locked') ||
        wordElement.classList.contains('disabled')) {
        return;
    }
    
    let containerId;
    if (stageNumber === 1) {
        containerId = 'answers-container';
    } else {
        containerId = `answers-container-${stageNumber}`;
    }
    
    const container = document.getElementById(containerId);
    if (container) {
        const selectedWords = container.querySelectorAll('.answer-word.selected');
        selectedWords.forEach(word => {
            word.classList.remove('selected');
            if (!word.classList.contains('used') && 
                !word.classList.contains('locked') &&
                !word.classList.contains('disabled') &&
                word.classList.contains('disappearing')) {
                word.style.opacity = '1';
                word.style.transform = 'scale(1)';
            }
        });
    }
    
    wordElement.classList.add('selected');
    wordElement.classList.remove('disappearing');
    wordElement.classList.remove('will-disappear');
    wordElement.style.animation = 'none';
    wordElement.style.opacity = '1';
    wordElement.style.transform = 'scale(1)';
    
    selectedWord = {
        element: wordElement,
        word: wordElement.getAttribute('data-word'),
        isCorrect: wordElement.getAttribute('data-correct') === 'true'
    };
    
    if (selectedGap) {
        fillGap(selectedGap, stageNumber);
    }
}

function handleGapClick(gapElement) {
    const stageNumber = currentStage;
    if (gameLocked || stageCompleted[stageNumber]) return;
    
    if (gapElement.classList.contains('filled')) return;
    
    if (!selectedWord) {
        const feedbackElement = document.getElementById(`stage${stageNumber}-feedback`);
        if (feedbackElement) {
            feedbackElement.textContent = 'Сначала выберите слово из списка!';
            feedbackElement.className = 'feedback incorrect';
            setTimeout(() => {
                if (!selectedWord) {
                    feedbackElement.textContent = '';
                    feedbackElement.className = 'feedback';
                }
            }, 2000);
        }
        return;
    }
    
    fillGap(gapElement, stageNumber);
}

function fillGap(gapElement, stageNumber) {
    if (!selectedWord || gameLocked) return;
    
    const gapNumber = parseInt(gapElement.getAttribute('data-gap'));
    const originalWord = gapElement.getAttribute('data-original');
    const punctuation = gapElement.getAttribute('data-punctuation') || '';
    const userWord = selectedWord.word;
    
    gapElement.textContent = userWord;
    gapElement.classList.remove('selected');
    gapElement.classList.add('filled');
    
    gapElement.setAttribute('data-filled-word', userWord);
    
    selectedWord.element.classList.add('used');
    selectedWord.element.classList.remove('selected');
    selectedWord.element.classList.remove('disappearing');
    selectedWord.element.classList.remove('will-disappear');
    selectedWord.element.style.animation = 'none';
    selectedWord.element.style.opacity = '1';
    selectedWord.element.style.transform = 'scale(0.9)';
    
    if (stageNumber > 1) {
        selectedWord.element.classList.remove('locked');
        selectedWord.element.classList.remove('disabled');
        selectedWord.element.style.cursor = 'default';
        selectedWord.element.style.pointerEvents = 'auto';
    }

    const gapIndex = gaps.findIndex(gap => gap.number === gapNumber);
    if (gapIndex !== -1) {
        gaps[gapIndex].userAnswer = userWord;
        gaps[gapIndex].isCorrect = (userWord === originalWord);
        
        stageResults[stageNumber].answers[gapNumber] = {
            userAnswer: userWord,
            correctAnswer: originalWord,
            punctuation: punctuation,
            isCorrect: (userWord === originalWord)
        };
    }
    
    selectedWord = null;
    selectedGap = null;
    
    updateFilledGapsCount(stageNumber);
}

function updateFilledGapsCount(stageNumber) {
    const filledGaps = gaps.filter(gap => gap.userAnswer !== null).length;
    
    if (filledGaps === gaps.length) {
        const checkBtn = document.getElementById(`check-stage${stageNumber}-btn`);
        if (checkBtn) {
            checkBtn.disabled = false;
        }
    }
}

function checkStage1() {
    if (gameLocked || stageCompleted[1]) return;
    
    checkStage(1);
}

function checkStage2() {
    if (gameLocked || stageCompleted[2]) return;
    
    checkStage(2);
}

function checkStage3() {
    if (gameLocked || stageCompleted[3]) return;
    
    checkStage(3);
}

function checkStage(stageNumber) {
    if (gameLocked) return;
    
    const feedbackElement = document.getElementById(`stage${stageNumber}-feedback`);
    const checkBtn = document.getElementById(`check-stage${stageNumber}-btn`);
    
    let stageTextId;
    if (stageNumber === 1) {
        stageTextId = 'main-text';
    } else {
        stageTextId = `main-text-${stageNumber}`;
    }
    
    if (!feedbackElement || !checkBtn) return;
    
    checkBtn.disabled = true;
    stageCompleted[stageNumber] = true;
    
    lockStageElements(stageNumber);
    
    gaps.forEach(gap => {
        if (gap.userAnswer === null) {
            gap.isCorrect = false;
        }
    });
    
    let correctCount = 0;
    const mainTextElement = document.getElementById(stageTextId);
    
    if (mainTextElement) {
        const gapElements = mainTextElement.querySelectorAll('.gap-number');
        gapElements.forEach(gapElement => {
            const gapNumber = parseInt(gapElement.getAttribute('data-gap'));
            const gapIndex = gaps.findIndex(gap => gap.number === gapNumber);
            
            if (gapIndex !== -1) {
                const gapData = gaps[gapIndex];
                const punctuation = gapData.punctuation || '';
                
                if (gapData.isCorrect) {
                    gapElement.classList.add('correct');
                    correctCount++;
                } else {
                    gapElement.classList.add('incorrect');
                    if (!gapData.userAnswer) {
                        gapElement.textContent = gapData.originalWord;
                        gapElement.title = `Правильный ответ: ${gapData.originalWord}`;
                    } else {
                        const correctWord = gapData.originalWord;
                        gapElement.textContent = gapData.userAnswer;
                        gapElement.title = `Ваш ответ: ${gapData.userAnswer}. Правильно: ${correctWord}`;
                    }
                }
            }
        });
    }
    
    let containerId;
    if (stageNumber === 1) {
        containerId = 'answers-container';
    } else {
        containerId = `answers-container-${stageNumber}`;
    }
    
    const container = document.getElementById(containerId);
    if (container) {
        const answerWords = container.querySelectorAll('.answer-word');
        answerWords.forEach(word => {
            const wordText = word.getAttribute('data-word');
            const isCorrectWord = word.getAttribute('data-correct') === 'true';
            
            if (isCorrectWord) {
                word.classList.add('correct');
            } else if (word.classList.contains('used')) {
                word.classList.add('incorrect');
            }
            
            word.classList.add('locked');
            word.classList.add('disabled');
            word.style.pointerEvents = 'none';
            word.style.cursor = 'not-allowed';
        });
    }
    
    stageResults[stageNumber].correct = correctCount;
    stageResults[stageNumber].total = gaps.length;
    
    let pointsPerCorrect;
    switch(stageNumber) {
        case 1: pointsPerCorrect = 1; break;
        case 2: pointsPerCorrect = 2; break;
        case 3: pointsPerCorrect = 3; break;
        default: pointsPerCorrect = 1;
    }
    
    const stagePoints = correctCount * pointsPerCorrect;
    updateScore(stagePoints);
    
    feedbackElement.textContent = `Правильно: ${correctCount} из ${gaps.length}`;
    feedbackElement.className = 'feedback ' + (correctCount === gaps.length ? 'correct' : 'incorrect');
    
    if (stageNumber < 3) {
        showNextStageButton(stageNumber);
    } else {
        const finishBtn = document.getElementById(`finish-level-btn-${stageNumber}`);
        if (finishBtn) {
            finishBtn.disabled = false;
            finishBtn.focus();
        }
        
        setTimeout(() => {
            if (feedbackElement) {
                feedbackElement.textContent = `Проверено! Теперь нажмите "Завершить уровень"`;
                feedbackElement.className = 'feedback info';
            }
        }, 1000);
    }
}

function startSequentialDisappearance(stageNumber, speed = 'slow') {
    let containerId;
    if (stageNumber === 1) {
        containerId = 'answers-container';
    } else {
        containerId = `answers-container-${stageNumber}`;
    }
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const unusedWords = Array.from(container.querySelectorAll('.answer-word:not(.used):not(.locked)'));
    if (unusedWords.length === 0) return;
    
    const delayBetweenWords = speed === 'fast' ? 800 : 1500;
    const fadeDuration = speed === 'fast' ? 500 : 1000;
    
    
    unusedWords.forEach((word, index) => {
        setTimeout(() => {
            if (!word.classList.contains('used') && !word.classList.contains('locked')) {
                word.classList.add('will-disappear');
            }
        }, (index * delayBetweenWords) - 300);
        
        setTimeout(() => {
            if (!word.classList.contains('used') && !word.classList.contains('locked')) {
                word.classList.remove('will-disappear');
                word.classList.add('disappearing');
                
                const animationName = speed === 'fast' ? 'fadeOutFast' : 'fadeOut';
                word.style.animation = `${animationName} ${fadeDuration}ms forwards`;
                
                setTimeout(() => {
                    if (!word.classList.contains('used')) {
                        word.classList.add('locked');
                        word.classList.add('disabled');
                        word.style.opacity = '0.1';
                        word.style.transform = 'scale(0.8)';
                        word.style.cursor = 'not-allowed';
                        word.title = 'Слово исчезло и недоступно';
                        word.style.pointerEvents = 'none';
                    }
                }, fadeDuration);
            }
        }, index * delayBetweenWords);
    });
    
    setTimeout(() => {
        if (hintElement) {
            hintElement.textContent = 'Все слова исчезли! Используйте оставшиеся видимые.';
        }
    }, unusedWords.length * delayBetweenWords + fadeDuration);
}

function lockStageElements(stageNumber) {
    let containerId;
    if (stageNumber === 1) {
        containerId = 'answers-container';
    } else {
        containerId = `answers-container-${stageNumber}`;
    }
    
    const container = document.getElementById(containerId);
    if (container) {
        const answerWords = container.querySelectorAll('.answer-word');
        answerWords.forEach(word => {
            word.classList.add('locked');
            word.classList.add('disabled');
            word.style.pointerEvents = 'none';
            word.style.cursor = 'not-allowed';
        });
    }
    
    let stageTextId;
    if (stageNumber === 1) {
        stageTextId = 'main-text';
    } else {
        stageTextId = `main-text-${stageNumber}`;
    }
    
    const mainTextElement = document.getElementById(stageTextId);
    if (mainTextElement) {
        const gapElements = mainTextElement.querySelectorAll('.gap-number');
        gapElements.forEach(gap => {
            gap.style.cursor = 'default';
            gap.style.pointerEvents = 'none';
        });
    }
}

function showNextStageButton(stageNumber) {
    let nextButton = document.getElementById(`next-stage-btn-${stageNumber}`);
    if (!nextButton) {
        nextButton = document.createElement('button');
        nextButton.id = `next-stage-btn-${stageNumber}`;
        nextButton.className = 'next-btn';
        nextButton.textContent = stageNumber === 1 ? 'Перейти к этапу 2 →' : 'Перейти к этапу 3 →';
        nextButton.style.marginTop = '1rem';
        nextButton.style.order = '3';
        
        const stageControls = document.querySelector(`#stage-${stageNumber} .stage-controls`);
        if (stageControls) {
            stageControls.appendChild(nextButton);
        }
    }
    
    nextButton.style.display = 'block';
    nextButton.onclick = function() {
        if (gameLocked) return;
        goToStage(stageNumber + 1);
    };
}

function goToStage(stageNumber) {
    if (stageNumber < 1 || stageNumber > 3 || gameLocked) return;
    
    currentStage = stageNumber;
    
    const stageCounter = document.getElementById('stage-counter');
    if (stageCounter) {
        stageCounter.textContent = `${currentStage}/3`;
    }
    
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    for (let i = 1; i <= currentStage; i++) {
        const stepElement = document.querySelector(`.step[data-step="${i}"]`);
        if (stepElement) stepElement.classList.add('active');
    }
    
    document.querySelectorAll('.game-stage').forEach(stage => {
        stage.classList.remove('active');
    });
    
    const stageElement = document.getElementById(`stage-${stageNumber}`);
    if (stageElement) {
        stageElement.classList.add('active');
        
        if (stageNumber === 2 && !stageCompleted[2]) {
            initializeStage2();
        } else if (stageNumber === 3 && !stageCompleted[3]) {
            initializeStage3();
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

function finishLevel() {
    if (gameLocked) return;
    
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
    if (gameLocked) return;
    completeLevel();
}

function closeConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    if (modal) modal.classList.add('hidden');
}

function completeLevel() {
    if (currentStage === 3 && !stageCompleted[3]) {
        const feedbackElement = document.getElementById('stage3-feedback');
        if (feedbackElement) {
            feedbackElement.textContent = 'Сначала проверьте ответы нажав "Проверить"!';
            feedbackElement.className = 'feedback incorrect';
            return;
        }
    }
    
    gameLocked = true;
    clearInterval(gameTimer);
    
    if (currentStage >= 1 && currentStage <= 3) {
        lockStageElements(currentStage);
    }
    
    for (let i = 1; i <= 3; i++) {
        const checkBtn = document.getElementById(`check-stage${i}-btn`);
        if (checkBtn) checkBtn.disabled = true;
    }
    
    if (!stageCompleted[currentStage]) {
        autoCheckCurrentStage();
    }
    
    let totalCorrect = 0;
    let totalQuestions = 0;
    
    for (let i = 1; i <= 3; i++) {
        totalCorrect += stageResults[i].correct || 0;
        totalQuestions += stageResults[i].total || 0;
    }
    
    let timeBonus = 0;
    if (gameScore > 0 && timeLeft > 0) {
        timeBonus = 1;
    }
    
    updateScore(timeBonus);
    saveGameResults();
    showResults(totalCorrect, totalQuestions, timeBonus);
}

function showResults(correctCount, totalQuestions, timeBonus) {
    const modal = document.getElementById('completion-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        const finalScore = document.getElementById('final-score');
        const timeLeftElement = document.getElementById('time-left');
        const correctCountElement = document.getElementById('correct-count');
        const speedBonusElement = document.getElementById('speed-bonus');
        const totalScoreElement = document.getElementById('total-score');
        
        if (finalScore) finalScore.textContent = gameScore - timeBonus;
        if (timeLeftElement) timeLeftElement.textContent = `${timeLeft} сек`;
        if (correctCountElement) correctCountElement.textContent = `${correctCount}/${totalQuestions}`;
        if (speedBonusElement) speedBonusElement.textContent = `+${timeBonus}`;
        if (totalScoreElement) totalScoreElement.textContent = gameScore;
    }
}

function saveGameResults() {
    if (hasResultsSaved) {
        return;
    }
    
    const playerName = localStorage.getItem('playerName') || 'Игрок';
    const currentSession = JSON.parse(localStorage.getItem('currentGameSession') || '{}');
    const gameType = currentSession.gameType || 'official';
    
    const sessionData = {
        playerName: playerName,
        level: selectedLevel,
        score: gameScore,
        time: 110 - timeLeft, 
        gameType: gameType,
        stage: currentStage
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
        playerStats.totalScore = (playerStats.totalScore || 0) + gameScore;
        playerStats.totalTime = (playerStats.totalTime || 0) + (110 - timeLeft);
        playerStats.gamesPlayed = (playerStats.gamesPlayed || 0) + 1;
        playerStats.lastPlayed = new Date().toISOString();
        localStorage.setItem('playerStats', JSON.stringify(playerStats));
    }
    
    hasResultsSaved = true;
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
}

function showError(message) {
    const feedback = document.getElementById('stage1-feedback') || 
                    document.getElementById('stage2-feedback') || 
                    document.getElementById('stage3-feedback');
    if (feedback) {
        feedback.textContent = message;
        feedback.className = 'feedback incorrect';
    }
}

function goToLevels() {
    setTimeout(() => window.location.href = 'levels.html', 100);
}

function goToLevel(level) {
    localStorage.setItem('selectedLevel', level);
    setTimeout(() => {
        window.location.href = `level${level}.html`;
    }, 100);
}

function restartLevel() {
    hasResultsSaved = false;
    window.location.reload();
}

function closeCompletionModal() {
    const modal = document.getElementById('completion-modal');
    if (modal) modal.classList.add('hidden');
}