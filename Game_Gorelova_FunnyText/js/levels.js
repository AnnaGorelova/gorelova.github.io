const STORAGE_KEYS = {
    PLAYER_NAME: 'playerName',
    GAME_SESSIONS: 'gameSessions',
    PLAYER_STATS: 'playerStats',
    SELECTED_LEVEL: 'selectedLevel'
};

let maxAvailableLevel = 1;

document.addEventListener('DOMContentLoaded', function() {
    const playerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || 'Игрок';
    document.getElementById('current-player').textContent = playerName;
    
    maxAvailableLevel = calculateMaxAvailableLevel(playerName);
    
    updateLevelButtons();
    setupEventListeners();
    animateCards();
});

function calculateMaxAvailableLevel(playerName) {
    
    const gameSessions = JSON.parse(localStorage.getItem('gameSessions') || '[]');
    const playerOfficialSessions = gameSessions.filter(session => 
        session.playerName === playerName && session.gameType === 'official'
    );
    
    let maxLevel = 1;
    
    const level1Sessions = playerOfficialSessions.filter(s => s.level === 1);
    if (level1Sessions.length > 0) {
        const bestLevel1 = Math.max(...level1Sessions.map(s => s.score || 0));
        
        if (bestLevel1 >= 20) {
            maxLevel = 2;
            
            const level2Sessions = playerOfficialSessions.filter(s => s.level === 2);
            if (level2Sessions.length > 0) {
                const bestLevel2 = Math.max(...level2Sessions.map(s => s.score || 0));
        
                if (bestLevel2 >= 28) {
                    maxLevel = 3;
                }
            } 
        }
    } 
    
    return maxLevel;
}

function getLevelRequirements(level) {
    const gameSessions = JSON.parse(localStorage.getItem('gameSessions') || '[]');
    const playerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    const playerOfficialSessions = gameSessions.filter(session => 
        session.playerName === playerName && session.gameType === 'official'
    );
    
    if (level === 1) {
        return 'Уровень 1 всегда доступен';
    }
    
    if (level === 2) {
        const level1Sessions = playerOfficialSessions.filter(s => s.level === 1);
        if (level1Sessions.length === 0) {
            return 'Сначала пройдите Уровень 1 в обычном режиме';
        }
        
        const bestLevel1 = Math.max(...level1Sessions.map(s => s.score || 0));
        if (bestLevel1 < 20) {
            return `Нужно набрать 20+ баллов в Уровне 1\nВаш лучший результат: ${bestLevel1}`;
        }
        
        return 'Уровень доступен';
    }
    
    if (level === 3) {
        const level1Sessions = playerOfficialSessions.filter(s => s.level === 1);
        const level2Sessions = playerOfficialSessions.filter(s => s.level === 2);
        
        if (level1Sessions.length === 0) {
            return 'Сначала пройдите Уровень 1 в обычном режиме';
        }
        
        const bestLevel1 = Math.max(...level1Sessions.map(s => s.score || 0));
        if (bestLevel1 < 20) {
            return `Сначала откройте Уровень 2 (нужно 20+ баллов в Уровне 1)\nВаш результат: ${bestLevel1}`;
        }
        
        if (level2Sessions.length === 0) {
            return 'Сначала пройдите Уровень 2 в обычном режиме';
        }
        
        const bestLevel2 = Math.max(...level2Sessions.map(s => s.score || 0));
        if (bestLevel2 < 28) {
            return `Нужно набрать 28+ баллов в Уровне 2\nВаш лучший результат: ${bestLevel2}`;
        }
        
        return 'Уровень доступен';
    }
    
    return '';
}

function isLevelAvailable(level) {
    if (level === 1) return true;
    
    const requirements = getLevelRequirements(level);
    return !requirements.includes('Нужно') && !requirements.includes('Сначала');
}

function updateLevelButtons() {
    const levelButtons = document.querySelectorAll('.level-btn');
    const playerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    
    levelButtons.forEach(button => {
        const levelCard = button.closest('.level-card');
        const level = parseInt(levelCard.getAttribute('data-level'));
        const levelNumberElement = levelCard.querySelector('.level-number');
        
        const gameSessions = JSON.parse(localStorage.getItem('gameSessions') || '[]');
        const playerSessions = gameSessions.filter(s => s.playerName === playerName && s.level === level);
        let bestScore = 0;
        if (playerSessions.length > 0) {
            bestScore = Math.max(...playerSessions.map(s => s.score || 0));
        }
        
        const isAvailable = isLevelAvailable(level);
        
        if (!isAvailable) {
            button.disabled = true;
            button.innerHTML = 'Заблокировано';
            button.style.opacity = '0.6';
            button.style.cursor = 'not-allowed';
            
            levelCard.style.opacity = '0.8';
            levelCard.style.filter = 'grayscale(30%)';
            levelCard.classList.add('locked');
            
            const requirements = getLevelRequirements(level);
            levelCard.title = requirements;
            
        } else {
            button.disabled = false;
            button.innerHTML = 'Начать';
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
            
            levelCard.style.opacity = '1';
            levelCard.style.filter = 'none';
            levelCard.classList.remove('locked');
            levelCard.title = '';
        }
    });
}

function startLevel(level) {
    const playerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    
    if (!isLevelAvailable(level)) {
        return;
    }
    
    const gameSession = {
        type: 'official',
        level: level,
        playerName: playerName,
        startTime: new Date().toISOString(),
        gameType: 'official'
    };
    
    localStorage.setItem('currentGameSession', JSON.stringify(gameSession));
    localStorage.setItem('currentGameType', 'official');
    localStorage.setItem(STORAGE_KEYS.SELECTED_LEVEL, level.toString());
    
    setTimeout(() => {
        window.location.href = `level${level}.html`;
    }, 300);
}

function startPractice() {
    const level = document.getElementById('practice-level').value;
    const playerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    
    const practiceSession = {
        type: 'practice',
        level: parseInt(level),
        playerName: playerName,
        startTime: new Date().toISOString(),
        gameType: 'practice'
    };
    
    localStorage.setItem('currentGameSession', JSON.stringify(practiceSession));
    localStorage.setItem('currentGameType', 'practice');
    localStorage.setItem(STORAGE_KEYS.SELECTED_LEVEL, level);
    
    closePracticeModal();
    
    setTimeout(() => {
        window.location.href = `level${level}.html`;
    }, 300);
}

function showPracticeModal() {
    const modal = document.getElementById('practice-modal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        document.querySelector('.levels-screen').classList.add('modal-open');
        document.getElementById('practice-level').value = '1';
    }
}

function closePracticeModal() {
    const modal = document.getElementById('practice-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('modal-open');
        document.querySelector('.levels-screen').classList.remove('modal-open');
    }
}

function setupEventListeners() {
    const practiceBtn = document.getElementById('practice-btn');
    if (practiceBtn) {
        practiceBtn.addEventListener('click', showPracticeModal);
    }
    
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', showProfile);
    }
    
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', showLeaderboard);
    }
    
    const practiceModal = document.getElementById('practice-modal');
    if (practiceModal) {
        practiceModal.addEventListener('click', function(e) {
            if (e.target === this) {
                closePracticeModal();
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const practiceModal = document.getElementById('practice-modal');
            if (practiceModal && !practiceModal.classList.contains('hidden')) {
                closePracticeModal();
                e.preventDefault();
            }
            
            const profileModal = document.getElementById('profile-modal');
            if (profileModal) {
                closeProfileModal();
                e.preventDefault();
            }
            
            const instructionsModal = document.getElementById('instructions-modal');
            if (instructionsModal) {
                closeInstructionsModal();
                e.preventDefault();
            }
        }
    });
}

function showProfile() {
    closePracticeModal();
    closeInstructionsModal();
    
    const oldModal = document.getElementById('profile-modal');
    if (oldModal) oldModal.remove();
    
    const playerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    const gameSessions = JSON.parse(localStorage.getItem('gameSessions') || '[]');
    const playerSessions = gameSessions.filter(s => s.playerName === playerName);
    const playerStats = JSON.parse(localStorage.getItem('playerStats') || '{}');
    
    const availableLevel = calculateMaxAvailableLevel(playerName);
    
    const levelStats = {};
    for (let level = 1; level <= 3; level++) {
        const levelSessions = playerSessions.filter(s => s.level === level);
        
        const officialSessions = levelSessions.filter(s => s.gameType === 'official');
        const practiceSessions = levelSessions.filter(s => s.gameType === 'practice');
        
        let bestScore = 0;
        if (levelSessions.length > 0) {
            bestScore = Math.max(...levelSessions.map(s => s.score || 0));
        }
        
        levelStats[level] = {
            totalPlayed: levelSessions.length,
            officialPlayed: officialSessions.length,
            practicePlayed: practiceSessions.length,
            bestScore: bestScore,
            isAvailable: isLevelAvailable(level)
        };
    }
    
    const profileHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Профиль игрока</h2>
                <button class="modal-close" onclick="window.closeProfileModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="profile-info">
                    <div class="profile-item">
                        <span class="profile-label">Имя:</span>
                        <span class="profile-value">${playerName}</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-label">Доступный уровень:</span>
                        <span class="profile-value">${availableLevel}</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-label">Общий счёт:</span>
                        <span class="profile-value">${playerStats.totalScore || 0}</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-label">Сыграно игр:</span>
                        <span class="profile-value">${playerStats.gamesPlayed || 0}</span>
                    </div>
                    <div class="profile-item">
                        <span class="profile-label">Требования для уровней:</span>
                        <span class="profile-value">
                            <div style="font-size: 0.9rem;">
                                <div>• Уровень 2: ≥20 баллов в Уровне 1 (обычная игра)</div>
                                <div>• Уровень 3: ≥28 баллов в Уровне 2 (обычная игра)</div>
                            </div>
                        </span>
                    </div>
                </div>
                
                <h3 style="margin-top: 1.5rem;">Статистика по уровням:</h3>
                <div class="levels-progress">
                    ${[1, 2, 3].map(level => {
                        const stats = levelStats[level];
                        const status = stats.isAvailable ? 'Доступен' : 'Заблокирован';
                        const statusClass = stats.isAvailable ? 'completed' : 'not-completed';
                        
                        return `
                            <div class="level-progress-item">
                                <span class="level-name">Уровень ${level}:</span>
                                <span class="level-status ${statusClass}">${status}</span>
                                <span class="level-details">
                                    Лучший результат: ${stats.bestScore} баллов<br>
                                    Всего сыграно: ${stats.totalPlayed} 
                                    (обычных: ${stats.officialPlayed}, практика: ${stats.practicePlayed})
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <h3 style="margin-top: 1.5rem;">Последние игры:</h3>
                <div class="recent-games">
                    ${playerSessions.slice(-5).reverse().map(session => {
                        const date = new Date(session.date);
                        const formattedDate = date.toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        const gameTypeBadge = session.gameType === 'official' 
                            ? '<span style="background: rgba(29, 36, 50, 0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">обычная</span>'
                            : '<span style="background: rgba(193, 185, 192, 0.2); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem;">практика</span>';
                        
                        return `
                            <div class="recent-game-item">
                                <div>Уровень ${session.level} - ${session.score} баллов ${gameTypeBadge}</div>
                                <small>${formattedDate}</small>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = profileHTML;
    modal.id = 'profile-modal';
    
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeProfileModal();
        }
    };
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    
    const levelsScreen = document.querySelector('.levels-screen');
    if (levelsScreen) {
        levelsScreen.classList.add('modal-open');
    }
    
    window.closeProfileModal = closeProfileModal;
    modal.focus();
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    if (modal) {
        modal.remove();
        document.body.classList.remove('modal-open');
        
        const levelsScreen = document.querySelector('.levels-screen');
        if (levelsScreen) {
            levelsScreen.classList.remove('modal-open');
        }
        
        delete window.closeProfileModal;
    }
}

function animateCards() {
    const cards = document.querySelectorAll('.level-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

function showInstructions() {
    closePracticeModal();
    closeProfileModal();
    
    const instructionsHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Правила игры</h2>
                <button class="modal-close" onclick="window.closeInstructionsModal()">×</button>
            </div>
            <div class="modal-body">
                <h3>Как играть:</h3>
                <ol style="margin-left: 1.5rem; margin-bottom: 1rem;">
                    <li>Выберите уровень сложности</li>
                    <li>Уровень 1 открыт всегда, остальные - по результатам предыдущего</li>
                    <li>В каждом уровне 3 этапа, идущие на усложнение</li>
                    <li>Набирайте очки за правильность и скорость</li>
                </ol>
                
                <h3>Система уровней:</h3>
                <ul style="margin-left: 1.5rem; margin-bottom: 1rem;">
                    <li><strong>Уровень 1:</strong> Перетаскивание слов в блоки ответов, разделённых частями речи</li>
                    <li><strong>Уровень 2:</strong> Подбор недостающих слов в тексте</li>
                    <li><strong>Уровень 3:</strong> Определение части речи слов</li>
                </ul>
                
                <h3>Режимы игры:</h3>
                <ul style="margin-left: 1.5rem;">
                    <li><strong>Обычная игра:</strong> Влияет на открытие следующих уровней</li>
                    <li><strong>Практика:</strong> Любой уровень без ограничений, результаты идут в общий рейтинг</li>
                </ul>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = instructionsHTML;
    modal.id = 'instructions-modal';
    
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeInstructionsModal();
        }
    };
    
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
    
    const levelsScreen = document.querySelector('.levels-screen');
    if (levelsScreen) {
        levelsScreen.classList.add('modal-open');
    }
    
    window.closeInstructionsModal = closeInstructionsModal;
    modal.focus();
}

function closeInstructionsModal() {
    const modal = document.getElementById('instructions-modal');
    if (modal) {
        modal.remove();
        document.body.classList.remove('modal-open');
        
        const levelsScreen = document.querySelector('.levels-screen');
        if (levelsScreen) {
            levelsScreen.classList.remove('modal-open');
        }
        
        delete window.closeInstructionsModal;
    }
}

function showLeaderboard() {
    window.location.href = 'leaderboard.html';
}

function goBack() {
    window.location.href = '../index.html';
}