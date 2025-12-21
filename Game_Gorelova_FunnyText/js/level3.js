let currentStage = 1;
let gameScore = 0;
let timeLeft = 100;
let gameTimer;
let selectedLevel = 3;
let playerName = 'Игрок';
let hasResultsSaved = false;

let gameData = null;
let allWords = [];

let stage1 = {
    words: [],
    currentIndex: 0,
    totalWords: 0,
    correct: 0,
    answered: 0,
    decisions: [],
    completed: false,
    targetPartOfSpeech: ''
};

let stage2 = {
    words: [],
    currentIndex: 0,
    totalWords: 0,
    correct: 0,
    answered: 0,
    decisions: [],
    intervalId: null,
    completed: false,
    targetPartOfSpeech: ''
};

let stage3 = {
    words: [],
    currentIndex: 0,
    totalWords: 0,
    correct: 0,
    answered: 0,
    decisions: [],
    intervalId: null,
    completed: false,
    targetPartOfSpeech: ''
};

let gameLocked = false;

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

function loadPlayerData() {
    playerName = localStorage.getItem('playerName') || 'Игрок';
    selectedLevel = parseInt(localStorage.getItem('selectedLevel')) || 3;
}

function setupGame() {
    timeLeft = 100;
    
    document.getElementById('score').textContent = gameScore;
    updateTimerDisplay();
    
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = "01:40";
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
    
    if (currentStage === 1 && !stage1.completed) {
        checkStage(1);
    } else if (currentStage === 2 && !stage2.completed) {
        checkStage(2);
    } else if (currentStage === 3 && !stage3.completed) {
        checkStage(3);
    }
    
    setTimeout(() => {
        showTimeOutModal();
    }, 1000);
}

function showTimeOutModal() {
    const modal = document.getElementById('completion-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        const modalHeader = modal.querySelector('.modal-header h2');
        if (modalHeader) {
            modalHeader.textContent = 'Время вышло!';
        }
        
        showResultsInModal();
    }
}

function getRandomPartOfSpeech() {
    const partsOfSpeech = gameData.parts_of_speech || [
        "существительное", "глагол", "прилагательное", 
        "наречие", "местоимение", "числительное"
    ];
    
    const randomIndex = Math.floor(Math.random() * partsOfSpeech.length);
    return partsOfSpeech[randomIndex];
}

function getRandomWords(count) {
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

function initializeStage1() {
    stage1 = {
        words: [],
        currentIndex: 0,
        totalWords: 0,
        correct: 0,
        answered: 0,
        decisions: [],
        completed: false,
        targetPartOfSpeech: getRandomPartOfSpeech() 
    };
    
    const targetPartElement1 = document.getElementById('target-part-1');
    if (targetPartElement1) {
        targetPartElement1.textContent = stage1.targetPartOfSpeech;
    }
    
    const wordCount = 15;
    stage1.words = getRandomWords(wordCount);
    stage1.totalWords = stage1.words.length;
    
    const totalWordsElement1 = document.getElementById('total-words-1');
    if (totalWordsElement1) {
        totalWordsElement1.textContent = stage1.totalWords;
    }
    
    updateWordCounter(1);
    updateCorrectCounter(1);
    
    const yesBtn1 = document.getElementById('yes-btn-1');
    const noBtn1 = document.getElementById('no-btn-1');
    if (yesBtn1) yesBtn1.disabled = false;
    if (noBtn1) noBtn1.disabled = false;
    
    const checkBtn1 = document.getElementById('check-stage1-btn');
    if (checkBtn1) checkBtn1.disabled = true;
    
    showCurrentWord(1);
    
}

function initializeStage2() {
    stage2 = {
        words: [],
        currentIndex: 0,
        totalWords: 0,
        correct: 0,
        answered: 0,
        decisions: [],
        intervalId: null,
        completed: false,
        targetPartOfSpeech: getRandomPartOfSpeech() 
    };
    
    const targetPartElement2 = document.getElementById('target-part-2');
    if (targetPartElement2) {
        targetPartElement2.textContent = stage2.targetPartOfSpeech;
    }
    
    const wordCount = 20;
    stage2.words = getRandomWords(wordCount);
    stage2.totalWords = stage2.words.length;
    
    const totalWordsElement2 = document.getElementById('total-words-2');
    if (totalWordsElement2) {
        totalWordsElement2.textContent = stage2.totalWords;
    }
    
    updateWordCounter(2);
    updateCorrectCounter(2);
    
    const yesBtn2 = document.getElementById('yes-btn-2');
    const noBtn2 = document.getElementById('no-btn-2');
    if (yesBtn2) yesBtn2.disabled = false;
    if (noBtn2) noBtn2.disabled = false;
    
    const checkBtn2 = document.getElementById('check-stage2-btn');
    if (checkBtn2) checkBtn2.disabled = true;
    
    if (stage2.intervalId) {
        clearInterval(stage2.intervalId);
        stage2.intervalId = null;
    }
    
    showCurrentWord(2);
    
    startWordAutoChange(2, 800); 
}

function initializeStage3() {
    stage3 = {
        words: [],
        currentIndex: 0,
        totalWords: 0,
        correct: 0,
        answered: 0,
        decisions: [],
        intervalId: null,
        completed: false,
        targetPartOfSpeech: getRandomPartOfSpeech() 
    };
    
    const targetPartElement3 = document.getElementById('target-part-3');
    if (targetPartElement3) {
        targetPartElement3.textContent = stage3.targetPartOfSpeech;
    }
    
    const wordCount = 25;
    stage3.words = getRandomWords(wordCount);
    stage3.totalWords = stage3.words.length;
    
    const totalWordsElement3 = document.getElementById('total-words-3');
    if (totalWordsElement3) {
        totalWordsElement3.textContent = stage3.totalWords;
    }
    
    updateWordCounter(3);
    updateCorrectCounter(3);
    
    const yesBtn3 = document.getElementById('yes-btn-3');
    const noBtn3 = document.getElementById('no-btn-3');
    if (yesBtn3) yesBtn3.disabled = false;
    if (noBtn3) noBtn3.disabled = false;
    
    const checkBtn3 = document.getElementById('check-stage3-btn');
    if (checkBtn3) checkBtn3.disabled = true;
    
    if (stage3.intervalId) {
        clearInterval(stage3.intervalId);
        stage3.intervalId = null;
    }
    
    showCurrentWord(3);
    
    startWordAutoChange(3, 500); 
}

function showCurrentWord(stageNumber) {
    let stageData, displayId, currentWordId, totalWordsId;
    
    if (stageNumber === 1) {
        stageData = stage1;
        displayId = 'current-word-display-1';
        currentWordId = 'current-word-1';
        totalWordsId = 'total-words-1';
    } else if (stageNumber === 2) {
        stageData = stage2;
        displayId = 'current-word-display-2';
        currentWordId = 'current-word-2';
        totalWordsId = 'total-words-2';
    } else if (stageNumber === 3) {
        stageData = stage3;
        displayId = 'current-word-display-3';
        currentWordId = 'current-word-3';
        totalWordsId = 'total-words-3';
    } else {
        return;
    }
    
    if (stageData.currentIndex < stageData.totalWords) {
        const word = stageData.words[stageData.currentIndex];
        const displayElement = document.getElementById(displayId);
        if (displayElement) {
            displayElement.textContent = word.word;
        }
        
        const currentWordElement = document.getElementById(currentWordId);
        if (currentWordElement) {
            currentWordElement.textContent = stageData.currentIndex + 1;
        }
        
    } else {
        const displayElement = document.getElementById(displayId);
        if (displayElement) {
            displayElement.textContent = "Этап завершен!";
        }
        
        const yesBtn = document.getElementById(`yes-btn-${stageNumber}`);
        const noBtn = document.getElementById(`no-btn-${stageNumber}`);
        if (yesBtn) yesBtn.disabled = true;
        if (noBtn) noBtn.disabled = true;
        
        if (stageNumber === 2 && stage2.intervalId) {
            clearInterval(stage2.intervalId);
            stage2.intervalId = null;
        } else if (stageNumber === 3 && stage3.intervalId) {
            clearInterval(stage3.intervalId);
            stage3.intervalId = null;
        }
        
        const checkBtn = document.getElementById(`check-stage${stageNumber}-btn`);
        if (checkBtn) checkBtn.disabled = false;
    }
}

function startWordAutoChange(stageNumber, intervalTime) {
    let stageData;
    
    if (stageNumber === 2) {
        stageData = stage2;
    } else if (stageNumber === 3) {
        stageData = stage3;
    } else {
        return;
    }
    
    if (stageData.intervalId) {
        clearInterval(stageData.intervalId);
    }
    
    stageData.intervalId = setInterval(() => {
        if (stageData.currentIndex < stageData.totalWords - 1) {
            stageData.currentIndex++;
            
            showCurrentWord(stageNumber);
            
            const currentWordElement = document.getElementById(`current-word-${stageNumber}`);
            if (currentWordElement) {
                currentWordElement.textContent = stageData.currentIndex + 1;
            }
            
        } else {
            stageData.currentIndex = stageData.totalWords - 1;
            
            showCurrentWord(stageNumber);
            
            const currentWordElement = document.getElementById(`current-word-${stageNumber}`);
            if (currentWordElement) {
                currentWordElement.textContent = stageData.totalWords;
            }
            
            clearInterval(stageData.intervalId);
            stageData.intervalId = null;
            
            document.getElementById(`yes-btn-${stageNumber}`).disabled = true;
            document.getElementById(`no-btn-${stageNumber}`).disabled = true;
            
            const checkBtn = document.getElementById(`check-stage${stageNumber}-btn`);
            if (checkBtn) checkBtn.disabled = false;
            
        }
    }, intervalTime);
}

function makeDecision(isYes, stageNumber) {
    if (gameLocked) return;
    
    let stageData;
    
    if (stageNumber === 1) {
        stageData = stage1;
    } else if (stageNumber === 2) {
        stageData = stage2;
    } else if (stageNumber === 3) {
        stageData = stage3;
    } else {
        return;
    }
    
    if (stageData.currentIndex >= stageData.totalWords) return;
    
    const currentWord = stageData.words[stageData.currentIndex];
    if (!currentWord) return;
    
    const isTarget = (currentWord.type === stageData.targetPartOfSpeech);
    
    let isCorrect = false;
    if ((isYes && isTarget) || (!isYes && !isTarget)) {
        isCorrect = true;
    }
    
    const existingDecisionIndex = stageData.decisions.findIndex(d => d.wordIndex === stageData.currentIndex);
    
    if (existingDecisionIndex === -1) {
        stageData.decisions.push({
            wordIndex: stageData.currentIndex,
            word: currentWord.word,
            userAnswer: isYes,
            correctAnswer: isTarget,
            isCorrect: isCorrect,
            skipped: false
        });
        
        stageData.answered++;
        if (isCorrect) {
            stageData.correct++;
        }
        
        updateCorrectCounter(stageNumber);
        
        showFeedback(isCorrect, stageNumber);
        
        if (stageNumber === 1) {
            stageData.currentIndex++;
            setTimeout(() => {
                showCurrentWord(stageNumber);
            }, 500);
        }
    }
}

function updateWordCounter(stageNumber) {
    let currentIndex;
    
    if (stageNumber === 1) {
        currentIndex = stage1.currentIndex;
    } else if (stageNumber === 2) {
        currentIndex = stage2.currentIndex;
    } else if (stageNumber === 3) {
        currentIndex = stage3.currentIndex;
    } else {
        return;
    }
    
    document.getElementById(`current-word-${stageNumber}`).textContent = currentIndex + 1;
}

function updateCorrectCounter(stageNumber) {
    let correct, answered;
    
    if (stageNumber === 1) {
        correct = stage1.correct;
        answered = stage1.answered;
    } else if (stageNumber === 2) {
        correct = stage2.correct;
        answered = stage2.answered;
    } else if (stageNumber === 3) {
        correct = stage3.correct;
        answered = stage3.answered;
    } else {
        return;
    }
    
    const correctElement = document.getElementById(`correct-${stageNumber}`);
    const answeredElement = document.getElementById(`answered-${stageNumber}`);
    
    if (correctElement) correctElement.textContent = correct;
    if (answeredElement) answeredElement.textContent = answered;
}

function showFeedback(isCorrect, stageNumber) {
    const feedbackElement = document.getElementById(`stage${stageNumber}-feedback`);
    if (feedbackElement) {
        feedbackElement.textContent = isCorrect ? "✓ Правильно" : "✗ Неправильно";
        feedbackElement.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        
        setTimeout(() => {
            feedbackElement.textContent = '';
            feedbackElement.className = 'feedback';
        }, 800);
    }
}

function checkStage(stageNumber) {
    if (gameLocked) return;
    
    let stageData;
    
    if (stageNumber === 1) {
        stageData = stage1;
    } else if (stageNumber === 2) {
        stageData = stage2;
    } else if (stageNumber === 3) {
        stageData = stage3;
    } else {
        return;
    }
    
    if (stageData.intervalId) {
        clearInterval(stageData.intervalId);
        stageData.intervalId = null;
    }
    
    const feedbackElement = document.getElementById(`stage${stageNumber}-feedback`);
    const checkBtn = document.getElementById(`check-stage${stageNumber}-btn`);
    
    if (!feedbackElement || !checkBtn) return;
    
    checkBtn.disabled = true;
    stageData.completed = true;
    
    lockStageElements(stageNumber);
    
    if (stageNumber === 2 || stageNumber === 3) {
        stageData.currentIndex = Math.min(stageData.currentIndex, stageData.totalWords - 1);
        
        for (let i = 0; i < stageData.totalWords; i++) {
            const existingDecision = stageData.decisions.find(d => d.wordIndex === i);
            
            if (!existingDecision) {
                const word = stageData.words[i];
                if (word) {
                    const isTarget = (word.type === stageData.targetPartOfSpeech);
                    stageData.decisions.push({
                        wordIndex: i,
                        word: word.word,
                        userAnswer: null,
                        correctAnswer: isTarget,
                        isCorrect: false,
                        skipped: true
                    });
                    stageData.answered++;
                }
            }
        }
        
        updateCorrectCounter(stageNumber);
    }
    
    const percentage = stageData.answered > 0 ? (stageData.correct / stageData.answered) * 100 : 0;

    let stageBonus = 0;
    if (percentage > 85) {
        switch(stageNumber) {
            case 1: stageBonus = 5; break;
            case 2: stageBonus = 10; break;
            case 3: stageBonus = 15; break;
        }
        updateScore(stageBonus);
    }
    
    feedbackElement.textContent = `Правильно: ${stageData.correct} из ${stageData.answered} (${Math.round(percentage)}%)`;
    feedbackElement.className = 'feedback ' + (percentage >= 85 ? 'correct' : 'incorrect');
    
    if (stageNumber < 3) {
        showNextStageButton(stageNumber);
    } else {
        const finishBtn = document.getElementById(`finish-level-btn${stageNumber === 1 ? '' : `-${stageNumber}`}`);
        if (finishBtn) {
            finishBtn.disabled = false;
            finishBtn.focus();
        }
        
        setTimeout(() => {
            if (feedbackElement) {
                feedbackElement.textContent = `Проверено! Теперь нажмите "Завершить уровень"`;
                feedbackElement.className = 'feedback info';
            }
        }, 1500);
    }
}

function lockStageElements(stageNumber) {
    document.getElementById(`yes-btn-${stageNumber}`).disabled = true;
    document.getElementById(`no-btn-${stageNumber}`).disabled = true;
    
    if (stageNumber === 2 && stage2.intervalId) {
        clearInterval(stage2.intervalId);
    } else if (stageNumber === 3 && stage3.intervalId) {
        clearInterval(stage3.intervalId);
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
    
    if (currentStage === 2 && stage2.intervalId) {
        clearInterval(stage2.intervalId);
    } else if (currentStage === 3 && stage3.intervalId) {
        clearInterval(stage3.intervalId);
    }
    
    currentStage = stageNumber;
    
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
        
        if (stageNumber === 2 && !stage2.completed) {
            initializeStage2();
        } else if (stageNumber === 3 && !stage3.completed) {
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

function showConfirmationModal() {
    let modal = document.getElementById('confirmation-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'confirmation-modal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Завершение уровня</h3>
                    <button class="modal-close" onclick="closeConfirmationModal()">×</button>
                </div>
                <div class="modal-body">
                    <p>Вы уверены, что хотите завершить уровень досрочно?</p>
                    <div class="modal-buttons">
                        <button class="confirm-btn" onclick="confirmFinishLevel()">Завершить</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    modal.classList.remove('hidden');
}

function closeConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    if (modal) modal.classList.add('hidden');
}

function confirmFinishLevel() {
    closeConfirmationModal();
    
    if (currentStage === 1 && !stage1.completed) {
        checkStage(1);
        setTimeout(completeLevel, 1500);
    } else if (currentStage === 2 && !stage2.completed) {
        checkStage(2);
        setTimeout(completeLevel, 1500);
    } else if (currentStage === 3 && !stage3.completed) {
        checkStage(3);
        setTimeout(completeLevel, 1500);
    } else {
        completeLevel();
    }
}

function completeLevel() {
    gameLocked = true;
    clearInterval(gameTimer);
    
    if (stage2.intervalId) clearInterval(stage2.intervalId);
    if (stage3.intervalId) clearInterval(stage3.intervalId);
    
    saveGameResults();
    showResultsInModal();
}

function showResultsInModal() {
    let totalCorrect = stage1.correct + stage2.correct + stage3.correct;
    let totalAnswered = stage1.answered + stage2.answered + stage3.answered;
    
    const modal = document.getElementById('completion-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        const finalScore = document.getElementById('final-score');
        const timeLeftElement = document.getElementById('time-left');
        const correctCountElement = document.getElementById('correct-count');
        const speedBonusElement = document.getElementById('speed-bonus');
        const totalScoreElement = document.getElementById('total-score');
        
        if (finalScore) finalScore.textContent = gameScore;
        if (timeLeftElement) timeLeftElement.textContent = `${timeLeft} сек`;
        if (correctCountElement) correctCountElement.textContent = `${totalCorrect}/${totalAnswered}`;
        
        let timeBonus = 0;
        if (gameScore > 0 && timeLeft > 0) {
            timeBonus = 1;
        }
        
        if (speedBonusElement) speedBonusElement.textContent = `+${timeBonus}`;
        if (totalScoreElement) totalScoreElement.textContent = gameScore + timeBonus;
    }
}

function saveGameResults() {
    if (hasResultsSaved) return;
    
    const playerName = localStorage.getItem('playerName') || 'Игрок';
    const currentSession = JSON.parse(localStorage.getItem('currentGameSession') || '{}');
    const gameType = currentSession.gameType || 'official';
    
    const sessionData = {
        playerName: playerName,
        level: selectedLevel,
        score: gameScore,
        time: 100 - timeLeft,
        gameType: gameType,
        stage: currentStage,
        stage1Correct: stage1.correct,
        stage1Total: stage1.answered,
        stage2Correct: stage2.correct,
        stage2Total: stage2.answered,
        stage3Correct: stage3.correct,
        stage3Total: stage3.answered
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
        playerStats.totalTime = (playerStats.totalTime || 0) + (100 - timeLeft);
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
        
        if (!gameLocked) {
            if (e.key === 'ArrowLeft') {
                const yesBtn = document.getElementById(`yes-btn-${currentStage}`);
                if (yesBtn && !yesBtn.disabled) {
                    yesBtn.click();
                }
            } else if (e.key === 'ArrowRight') {
                const noBtn = document.getElementById(`no-btn-${currentStage}`);
                if (noBtn && !noBtn.disabled) {
                    noBtn.click();
                }
            }
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

function restartLevel() {
    hasResultsSaved = false;
    window.location.reload();
}

function closeCompletionModal() {
    const modal = document.getElementById('completion-modal');
    if (modal) modal.classList.add('hidden');
}