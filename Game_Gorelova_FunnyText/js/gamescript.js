class SplashScreen {
    constructor() {
        this.splashScreen = document.getElementById('splash-screen');
        this.authScreen = document.getElementById('auth-screen');
        this.pawsContainer = document.getElementById('paws-container');
        this.loadingProgress = document.querySelector('.loading-progress');
        this.playerNameInput = document.getElementById('player-name');
        this.startButton = document.getElementById('start-game-btn');
        
        this.totalPaws = 60;
        this.pawsPlaced = 0;
        this.maxPaws = 0;

        this.playersHistory = [];
        this.currentPlayer = null;
        
        this.init();
    }
    
    init() {
        this.loadPlayersHistory();
        this.calculateMaxPaws();
        this.startPawAnimation();
        this.setupAuthScreen();
    }
    
    calculateMaxPaws() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const screenArea = screenWidth * screenHeight;
        const avgPawArea = 9000;
        
        this.maxPaws = Math.ceil((screenArea * 1.1) / avgPawArea);
        this.maxPaws = Math.min(this.maxPaws, 100);
        this.maxPaws = Math.max(this.maxPaws, 50);
    }
    
    startPawAnimation() {
        const interval = setInterval(() => {
            if (this.pawsPlaced >= this.maxPaws) {
                clearInterval(interval);
                this.finalizeAnimation();
                return;
            }
            
            this.placeRandomPaw();
            this.pawsPlaced++;
            
            const progress = (this.pawsPlaced / this.maxPaws) * 100;
            this.loadingProgress.style.width = `${progress}%`;
            
        }, 40);
    }
    
    placeRandomPaw() {
        const paw = document.createElement('img');
        paw.src = 'gameimages/paw.png';
        paw.classList.add('paw');
        
        const cols = 8;
        const rows = Math.ceil(this.maxPaws / cols);
        const col = this.pawsPlaced % cols;
        const row = Math.floor(this.pawsPlaced / cols);
        
        const cellWidth = window.innerWidth / cols;
        const cellHeight = window.innerHeight / rows;
        
        let x = (col * cellWidth) + (cellWidth / 2);
        let y = (row * cellHeight) + (cellHeight / 2);
        
        x += (Math.random() - 0.5) * cellWidth * 0.6;
        y += (Math.random() - 0.5) * cellHeight * 0.6;
        
        x = Math.max(0, Math.min(x, window.innerWidth));
        y = Math.max(0, Math.min(y, window.innerHeight));
        
        const baseSize = Math.min(window.innerWidth, window.innerHeight) * 0.20;
        const sizeVariation = 0.5;
        const size = baseSize * (0.7 + Math.random() * sizeVariation);
        
        const rotation = Math.random() * 360;
        const opacity = 0.15 + (Math.random() * 0.7);
        
        paw.style.width = `${size}px`;
        paw.style.height = 'auto';
        paw.style.left = `${x}px`;
        paw.style.top = `${y}px`;
        paw.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        paw.style.opacity = '0';
        
        this.pawsContainer.appendChild(paw);
        
        setTimeout(() => {
            paw.style.transition = 'opacity 0.5s ease';
            paw.style.opacity = opacity;
        }, 10);
    }
    
    finalizeAnimation() {
        setTimeout(() => {
            this.splashScreen.style.backgroundColor = 'rgba(29, 36, 50, 1)';
            
            const paws = document.querySelectorAll('.paw');
            paws.forEach((paw, index) => {
                setTimeout(() => {
                    paw.style.opacity = '0';
                    paw.style.transform += ' scale(0.5)';
                }, index * 10);
            });
            
            setTimeout(() => {
                this.splashScreen.classList.add('hidden');
                this.authScreen.classList.remove('hidden');
                this.playerNameInput.focus();
            }, 600);
            
        }, 300);
    }
    
    loadPlayersHistory() {
        try {
            const history = localStorage.getItem('playersHistory');
            this.playersHistory = history ? JSON.parse(history) : [];
        } catch (error) {
            console.error(error);
            this.playersHistory = [];
        }
    }
    
    savePlayersHistory() {
        try {
            localStorage.setItem('playersHistory', JSON.stringify(this.playersHistory));
        } catch (error) {
            console.error(error);
        }
    }
    
    findPlayerByName(name) {
        return this.playersHistory.find(player => 
            player.name.toLowerCase() === name.toLowerCase()
        );
    }
    
    updatePlayer(name, isNew = false) {
        const existingPlayer = this.findPlayerByName(name);
        
        if (existingPlayer) {
            existingPlayer.lastLogin = new Date().toISOString();
            existingPlayer.loginCount = (existingPlayer.loginCount || 0) + 1;
            this.currentPlayer = existingPlayer;
            
            this.transferProgressToHistory(name);
        } else {
            const newPlayer = {
                name: name.trim(),
                dateJoined: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                loginCount: 1,
                stats: {
                    totalScore: 0,
                    totalTime: 0,
                    gamesPlayed: 0
                }
            };
            
            this.playersHistory.push(newPlayer);
            this.currentPlayer = newPlayer;
        }
        
        this.savePlayersHistory();
        
        this.playersHistory.sort((a, b) => 
            new Date(b.lastLogin) - new Date(a.lastLogin)
        );
        
        if (this.playersHistory.length > 10) {
            this.playersHistory = this.playersHistory.slice(0, 10);
        }
        
        this.savePlayersHistory();
    }
    
    transferProgressToHistory(playerName) {
        try {
            const stats = localStorage.getItem('playerStats');
            const player = this.findPlayerByName(playerName);
            if (!player) return;
            
            if (stats) {
                player.stats = JSON.parse(stats);
            }
            
            this.savePlayersHistory();
        } catch (error) {
            console.error(error);
        }
    }
    
    loadPlayerProgressToLocalStorage(playerName) {
        const player = this.findPlayerByName(playerName);
        if (!player) {
            const defaultStats = {
                totalScore: 0,
                totalTime: 0,
                gamesPlayed: 0,
                levels: {}
            };
            localStorage.setItem('playerStats', JSON.stringify(defaultStats));
            return;
        }
        
        try {
            if (player.stats) {
                const stats = {
                    totalScore: player.stats.totalScore || 0,
                    totalTime: player.stats.totalTime || 0,
                    gamesPlayed: player.stats.gamesPlayed || 0,
                    levels: player.stats.levels || {},
                    dateJoined: player.stats.dateJoined || player.dateJoined,
                    lastPlayed: new Date().toISOString()
                };
                localStorage.setItem('playerStats', JSON.stringify(stats));
            } else {
                const defaultStats = {
                    totalScore: 0,
                    totalTime: 0,
                    gamesPlayed: 0,
                    levels: {},
                    dateJoined: player.dateJoined,
                    lastPlayed: new Date().toISOString()
                };
                localStorage.setItem('playerStats', JSON.stringify(defaultStats));
            }
            
            this.updateGlobalLeaderboard();
            
        } catch (error) {
            console.error(error);
        }
    }
    
    updateGlobalLeaderboard() {
        try {
            const leaderboard = this.playersHistory
                .map(player => ({
                    name: player.name,
                    totalScore: player.stats.totalScore || 0,
                    gamesPlayed: player.stats.gamesPlayed || 0,
                    dateJoined: player.dateJoined
                }))
                .sort((a, b) => b.totalScore - a.totalScore);
            
            localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
        } catch (error) {
            console.error(error);
        }
    }
    
    setupAuthScreen() {
        const datalist = document.createElement('datalist');
        datalist.id = 'players-list';
        this.authScreen.appendChild(datalist);
        
        this.updatePlayersList();
        
        this.playerNameInput.setAttribute('list', 'players-list');
        
        this.playerNameInput.addEventListener('input', (e) => {
            const name = e.target.value.trim();
            const isValid = name.length >= 2 && name.length <= 20;
            
            this.startButton.disabled = !isValid;
            
            if (isValid) {
                this.startButton.innerHTML = `Играть как <strong>${name}</strong>`;
                
                const existingPlayer = this.findPlayerByName(name);
                if (existingPlayer) {
                    this.showPlayerHint(existingPlayer);
                } else {
                    this.hidePlayerHint();
                }
            } else {
                this.startButton.textContent = 'Начать игру';
                this.hidePlayerHint();
            }
        });
        
        this.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.startButton.disabled) {
                this.startGame();
            }
        });
        
        this.startButton.addEventListener('click', () => {
            if (!this.startButton.disabled) {
                this.startGame();
            }
        });
    }
    
    updatePlayersList() {
        const datalist = document.getElementById('players-list');
        datalist.innerHTML = '';
        
        this.playersHistory.forEach(player => {
            const option = document.createElement('option');
            option.value = player.name;
            datalist.appendChild(option);
        });
    }
    
    showPlayerHint(player) {
        let hintElement = document.getElementById('player-hint');
        
        if (!hintElement) {
            hintElement = document.createElement('div');
            hintElement.id = 'player-hint';
            hintElement.style.cssText = `
                margin-top: 10px;
                padding: 10px;
                background: rgba(29, 36, 50, 0.1);
                border-radius: 8px;
                font-size: 0.9rem;
                color: rgba(29, 36, 50, 0.8);
            `;
            
            this.playerNameInput.parentNode.appendChild(hintElement);
        }
        
        const lastLogin = new Date(player.lastLogin);
        const formattedDate = lastLogin.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        hintElement.innerHTML = `
            <div style="font-weight: 500; margin-bottom: 5px;">Найден существующий профиль</div>
            <div style="font-size: 0.85rem;">
                Последний вход: ${formattedDate}<br>
            </div>
        `;
    }
    
    hidePlayerHint() {
        const hintElement = document.getElementById('player-hint');
        if (hintElement) {
            hintElement.remove();
        }
    }
    
    startGame() {
        const playerName = this.playerNameInput.value.trim();
        
        localStorage.removeItem('currentGameSession');
        localStorage.removeItem('currentGameType');
        
        this.updatePlayer(playerName);
        this.loadPlayerProgressToLocalStorage(playerName);
        localStorage.setItem('playerName', playerName);
        localStorage.setItem('gameStartTime', new Date().toISOString());
        
        this.authScreen.style.opacity = '0';
        this.authScreen.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            window.location.href = 'levels.html';
        }, 500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SplashScreen();
});