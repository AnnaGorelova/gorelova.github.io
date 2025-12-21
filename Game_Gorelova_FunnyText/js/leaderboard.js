const STORAGE_KEYS = {
    PLAYER_NAME: 'playerName',
    PLAYER_STATS: 'playerStats',
    GAME_SESSIONS: 'gameSessions'
};

document.addEventListener('DOMContentLoaded', function() {
    const playerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || 'Игрок';
    document.getElementById('current-player').textContent = playerName;
    
    loadLeaderboard();
    setupEventListeners();
});

function loadLeaderboard() {
    try {
        const leaderboard = getLeaderboard();
        const playerName = localStorage.getItem(STORAGE_KEYS.PLAYER_NAME) || 'Игрок';
        const playerStats = getPlayerStats();
        
        document.getElementById('total-players').textContent = leaderboard.length;
        document.getElementById('player-score').textContent = playerStats.totalScore || 0;
        
        const playerIndex = leaderboard.findIndex(player => player.name === playerName);
        if (playerIndex !== -1) {
            document.getElementById('player-rank').textContent = playerIndex + 1;
        } else {
            document.getElementById('player-rank').textContent = '-';
        }
        
        displayLeaderboard(leaderboard, playerName);
        
    } catch (error) {
        console.error(error);
    }
}

function getLeaderboard() {
    try {
        const gameSessions = JSON.parse(localStorage.getItem('gameSessions') || '[]');
        const playersMap = {};
        
        gameSessions.forEach(session => {
            if (!session || !session.playerName || session.score === undefined) {
                console.warn('Пропускаем некорректную сессию:', session);
                return;
            }
            
            if (!playersMap[session.playerName]) {
                playersMap[session.playerName] = {
                    name: session.playerName,
                    totalScore: 0, 
                    gamesPlayed: 0,
                    bestScores: {},
                    dateJoined: session.date,
                    officialGames: 0,
                    practiceGames: 0,
                    levelStats: {}
                };
            }
            
            const player = playersMap[session.playerName];
            
            player.totalScore += (session.score || 0);
            player.gamesPlayed++;
            
            if (session.gameType === 'official') {
                player.officialGames++;
            } else if (session.gameType === 'practice') {
                player.practiceGames++;
            }
            
            if (!player.levelStats[session.level]) {
                player.levelStats[session.level] = {
                    totalScore: 0,
                    gamesPlayed: 0,
                    bestScore: 0
                };
            }
            
            const levelStat = player.levelStats[session.level];
            levelStat.totalScore += (session.score || 0);
            levelStat.gamesPlayed++;
            if ((session.score || 0) > levelStat.bestScore) {
                levelStat.bestScore = session.score || 0;
            }
            
            if (!player.bestScores[session.level] || 
                player.bestScores[session.level] < (session.score || 0)) {
                player.bestScores[session.level] = session.score || 0;
            }

            if (!player.dateJoined || new Date(session.date) < new Date(player.dateJoined)) {
                player.dateJoined = session.date;
            }
        });
        
        const leaderboard = Object.values(playersMap).sort((a, b) => 
            b.totalScore - a.totalScore
        );
        
        return leaderboard;
        
    } catch (error) {
        console.error(error);
        return [];
    }
}

function getPlayerStats() {
    try {
        const stats = localStorage.getItem(STORAGE_KEYS.PLAYER_STATS);
        const parsedStats = stats ? JSON.parse(stats) : {
            totalScore: 0,
            totalTime: 0,
            gamesPlayed: 0,
            dateJoined: new Date().toISOString()
        };
        
        return parsedStats;
    } catch (error) {
        console.error(error);
        return {
            totalScore: 0,
            totalTime: 0,
            gamesPlayed: 0,
            dateJoined: new Date().toISOString()
        };
    }
}

function displayLeaderboard(leaderboard, currentPlayerName) {
    const container = document.getElementById('leaderboard-content');
    
    if (leaderboard.length === 0) {
        container.innerHTML = `
            <div class="empty-leaderboard">
                <p>Рейтинг пока пуст</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="leaderboard-table-container">
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Место</th>
                        <th>Игрок</th>
                        <th>Общий счёт</th>
                        <th>Игр сыграно</th>
                        <th>Дата регистрации</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    leaderboard.forEach((player, index) => {
        const isCurrentPlayer = player.name === currentPlayerName;
        const rowClass = isCurrentPlayer ? 'current-player' : '';
        
        const joinDate = new Date(player.dateJoined);
        const formattedDate = joinDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        const levelDetails = [];
        for (let level = 1; level <= 3; level++) {
            if (player.levelStats && player.levelStats[level]) {
                const stats = player.levelStats[level];
                levelDetails.push(`У${level}: ${stats.bestScore}`);
            }
        }
        
        html += `
            <tr class="${rowClass}">
                <td class="number-win">
                    ${index + 1}
                </td>
                <td class="player-name">
                    ${player.name}
                    ${isCurrentPlayer ? '<span class="you-badge">(Вы)</span>' : ''}
                    </td>
                <td class="score">${formatNumber(player.totalScore)}</td>
                <td class="games">${player.gamesPlayed}</td>
                <td class="date">${formattedDate}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function goBack() {
    window.location.href = 'levels.html';
}

function goToHome() {
    window.location.href = '../index.html';
}