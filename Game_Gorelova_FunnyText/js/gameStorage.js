const GAME_STORAGE_KEYS = {
    GAME_SESSIONS: 'gameSessions',
    PLAYER_STATS: 'playerStats',
    LEVEL_PROGRESS: 'levelProgress'
};

function initGameStorage() {
    
    if (!localStorage.getItem(GAME_STORAGE_KEYS.GAME_SESSIONS)) {
        localStorage.setItem(GAME_STORAGE_KEYS.GAME_SESSIONS, '[]');
    }
    
    if (!localStorage.getItem(GAME_STORAGE_KEYS.PLAYER_STATS)) {
        const initialStats = {
            totalScore: 0,
            totalTime: 0,
            gamesPlayed: 0,
            levels: {},
            dateJoined: new Date().toISOString()
        };
        localStorage.setItem(GAME_STORAGE_KEYS.PLAYER_STATS, JSON.stringify(initialStats));
    }
    
    if (!localStorage.getItem(GAME_STORAGE_KEYS.LEVEL_PROGRESS)) {
        localStorage.setItem(GAME_STORAGE_KEYS.LEVEL_PROGRESS, '{}');
    }
}

function saveGameSession(sessionData) {
    if (!sessionData || !sessionData.playerName || sessionData.score === undefined || sessionData.level === undefined) {
        console.error(sessionData);
        return null;
    }
    
    initGameStorage();
    
    const session = {
        id: Date.now() + Math.random(), 
        playerName: sessionData.playerName,
        level: parseInt(sessionData.level),
        score: parseInt(sessionData.score),
        time: parseInt(sessionData.time || 0),
        date: new Date().toISOString(),
        gameType: sessionData.gameType || 'official',
        stage: sessionData.stage || 1
    };
    
    const allSessions = JSON.parse(localStorage.getItem(GAME_STORAGE_KEYS.GAME_SESSIONS));
    allSessions.push(session);
    localStorage.setItem(GAME_STORAGE_KEYS.GAME_SESSIONS, JSON.stringify(allSessions));
    
    updatePlayerStats(session);
    
    if (session.gameType === 'official') {
        updateLevelProgress(session);
    }
    
    return session.id;
}

function updatePlayerStats(session) {
    
    const stats = JSON.parse(localStorage.getItem(GAME_STORAGE_KEYS.PLAYER_STATS));
    
    stats.totalScore = (stats.totalScore || 0) + session.score;
    stats.totalTime = (stats.totalTime || 0) + session.time;
    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    stats.lastPlayed = new Date().toISOString();
    
    if (!stats.levels) stats.levels = {};
    const levelKey = `level${session.level}`;
    
    if (!stats.levels[levelKey]) {
        stats.levels[levelKey] = {
            bestScore: 0,
            timesPlayed: 0,
            totalScore: 0,
            lastPlayed: null
        };
    }
    
    const levelStats = stats.levels[levelKey];
    levelStats.timesPlayed += 1;
    levelStats.totalScore += session.score;
    
    if (session.score > levelStats.bestScore) {
        levelStats.bestScore = session.score;
    }
    
    levelStats.lastPlayed = new Date().toISOString();
    
    localStorage.setItem(GAME_STORAGE_KEYS.PLAYER_STATS, JSON.stringify(stats));
}

function updateLevelProgress(session) {
    
    const progress = JSON.parse(localStorage.getItem(GAME_STORAGE_KEYS.LEVEL_PROGRESS) || '{}');
    const levelKey = `level${session.level}`;
    
    const currentProgress = progress[levelKey] || {
        completed: false,
        score: 0,
        time: 0,
        bestTime: Infinity,
        lastPlayed: null,
        gameType: 'official'
    };
    
    if (session.score > currentProgress.score) {
        progress[levelKey] = {
            completed: true,
            score: session.score,
            time: session.time,
            bestTime: Math.min(currentProgress.bestTime, session.time),
            lastPlayed: new Date().toISOString(),
            gameType: 'official'
        };
        
        localStorage.setItem(GAME_STORAGE_KEYS.LEVEL_PROGRESS, JSON.stringify(progress));
    }
}

function getPlayerSessions(playerName) {
    const allSessions = JSON.parse(localStorage.getItem(GAME_STORAGE_KEYS.GAME_SESSIONS) || '[]');
    return allSessions.filter(session => session.playerName === playerName);
}

function getPlayerLevelStats(playerName) {
    const playerSessions = getPlayerSessions(playerName);
    const stats = {1: {}, 2: {}, 3: {}};
    
    for (let level = 1; level <= 3; level++) {
        const levelSessions = playerSessions.filter(s => s.level === level);
        
        stats[level] = {
            totalPlayed: levelSessions.length,
            officialPlayed: levelSessions.filter(s => s.gameType === 'official').length,
            practicePlayed: levelSessions.filter(s => s.gameType === 'practice').length,
            bestScore: levelSessions.length > 0 ? Math.max(...levelSessions.map(s => s.score || 0)) : 0,
            totalScore: levelSessions.reduce((sum, s) => sum + (s.score || 0), 0)
        };
    }
    
    return stats;
}

function hasSavedSessions() {
    const sessions = JSON.parse(localStorage.getItem(GAME_STORAGE_KEYS.GAME_SESSIONS) || '[]');
    return sessions.length > 0;
}

initGameStorage();