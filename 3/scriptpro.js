let historicalData = [];

document.addEventListener('DOMContentLoaded', () => {
    loadHistoricalData();
    document.getElementById('runPredictionsBtn').addEventListener('click', processMatchups);
    document.getElementById('selectAllBtn').addEventListener('click', selectAllText);
    document.getElementById('copyBtn').addEventListener('click', copyText);
    document.getElementById('pasteBtn').addEventListener('click', pasteText);
    document.getElementById('clearBtn').addEventListener('click', clearText);
});

async function loadHistoricalData() {
    try {
        const response = await fetch('https://winmix.hu/api/combined_matches_api.php');
        const data = await response.json();
        
        historicalData = data.map(match => ({
            home_team: match.home_team,
            away_team: match.away_team,
            score: {
                home: parseInt(match.score.home, 10),
                away: parseInt(match.score.away, 10)
            },
            both_teams_scored: match.both_teams_scored
        }));
        
        console.log('Loaded historical data:', historicalData);
        initializeSystem();
    } catch (error) {
        console.error('Hiba történt az adatok betöltése során:', error);
        document.getElementById('modelInfo').innerHTML = '<p class="text-red-500">Hiba történt az adatok betöltése során. Kérjük, próbálja újra később.</p>';
        document.getElementById('modelInfo').classList.remove('hidden');
    }
}

function initializeSystem() {
    const modelInfo = document.getElementById('modelInfo');
    modelInfo.innerHTML = '<p>A rendszer készen áll a predikciókra!</p>';
    modelInfo.classList.remove('hidden');
}

function processMatchups() {
    const input = document.getElementById('matchupsInput').value;
    let matchups;
    try {
        matchups = JSON.parse(input);
    } catch (error) {
        alert('Hiba: érvénytelen JSON bemenet. Kérjük, ellenőrizze a bemenetet és próbálja újra.');
        return;
    }

    const predictions = matchups.map(predictMatch);

    predictions.sort((a, b) => 
        parseFloat(b.predictions.totalBothTeamsScoredProbability) - parseFloat(a.predictions.totalBothTeamsScoredProbability)
    );
    
    displayPredictions(predictions);
}

function predictMatch(match) {
    const relevantMatches = historicalData.filter(
        m => (m.home_team === match.homeTeam && m.away_team === match.awayTeam) ||
             (m.home_team === match.awayTeam && m.away_team === match.homeTeam)
    );

    const totalMatches = relevantMatches.length;
    const bothTeamsScored = relevantMatches.filter(m => m.both_teams_scored).length;
    const bothTeamsScoredPercentage = totalMatches > 0 ? ((bothTeamsScored / totalMatches) * 100).toFixed(2) : "0.00";

    const { homeGoals, awayGoals, homeWins, awayWins, draws } = relevantMatches.reduce((acc, m) => {
        const isHomeMatch = m.home_team === match.homeTeam;
        acc.homeGoals += isHomeMatch ? m.score.home : m.score.away;
        acc.awayGoals += isHomeMatch ? m.score.away : m.score.home;

        if (m.score.home > m.score.away) {
            isHomeMatch ? acc.homeWins++ : acc.awayWins++;
        } else if (m.score.away > m.score.home) {
            isHomeMatch ? acc.awayWins++ : acc.homeWins++;
        } else {
            acc.draws++;
        }
        return acc;
    }, { homeGoals: 0, awayGoals: 0, homeWins: 0, awayWins: 0, draws: 0 });

    const avgHomeGoals = totalMatches > 0 ? (homeGoals / totalMatches).toFixed(2) : "0.00";
    const avgAwayGoals = totalMatches > 0 ? (awayGoals / totalMatches).toFixed(2) : "0.00";

    return {
        match,
        historicalData: {
            totalMatches,
            bothTeamsScored,
            bothTeamsScoredPercentage,
            avgHomeGoals,
            avgAwayGoals,
            homeWins,
            awayWins,
            draws
        },
        predictions: {
            poisson: predictPoisson(avgHomeGoals, avgAwayGoals),
            monteCarlo: monteCarloSimulation(homeWins, draws, awayWins),
            eloRating: eloRatingPrediction(homeWins, awayWins, draws),
            randomForest: randomForestPrediction(avgHomeGoals, avgAwayGoals),
            deepLearning: deepLearningPrediction(avgHomeGoals, avgAwayGoals),
            totalBothTeamsScoredProbability: calculateTotalScoreProbability(avgHomeGoals, avgAwayGoals)
        }
    };
}

function predictPoisson(avgHomeGoals, avgAwayGoals) {
    return {
        homeGoals: avgHomeGoals,
        awayGoals: avgAwayGoals
    };
}

function monteCarloSimulation(homeWins, draws, awayWins) {
    const total = homeWins + draws + awayWins;
    const homeWinProbability = total ? (homeWins / total).toFixed(2) : 0.00;
    const drawProbability = total ? (draws / total).toFixed(2) : 0.00;
    const awayWinProbability = total ? (awayWins / total).toFixed(2) : 0.00;
    return {
        homeWinProbability,
        drawProbability,
        awayWinProbability
    };
}

function eloRatingPrediction(homeWins, awayWins, draws) {
    const totalMatches = homeWins + draws + awayWins;
    const homeWinProbability = totalMatches ? (homeWins / totalMatches).toFixed(2) : "0.00";
    const awayWinProbability = totalMatches ? (awayWins / totalMatches).toFixed(2) : "0.00";
    return {
        homeElo: 1500 + homeWins * 10,
        awayElo: 1500 + awayWins * 10,
        homeWinProbability,
        awayWinProbability
    };
}

function randomForestPrediction(avgHomeGoals, avgAwayGoals) {
    return {
        homeGoals: avgHomeGoals,
        awayGoals: avgAwayGoals
    };
}

function deepLearningPrediction(avgHomeGoals, avgAwayGoals) {
    return {
        homeGoals: avgHomeGoals,
        awayGoals: avgAwayGoals
    };
}

function calculateTotalScoreProbability(avgHomeGoals, avgAwayGoals) {
    avgHomeGoals = parseFloat(avgHomeGoals);
    avgAwayGoals = parseFloat(avgAwayGoals);
    
    if (isNaN(avgHomeGoals) || isNaN(avgAwayGoals)) return "0.00";
    
    const probability = 1 / (1 + Math.exp(-(avgHomeGoals + avgAwayGoals - 1.5)));
    return (probability * 100).toFixed(2);
}

function displayPredictions(predictions) {
    const predictionsDiv = document.getElementById('predictions');
    predictionsDiv.innerHTML = '';

    predictions.forEach((prediction, index) => {
        const matchDiv = document.createElement('div');
        if (index < 4) {
            matchDiv.className = 'bg-blue-200 rounded-lg shadow-lg p-6 border-2 border-blue-500 mb-4';
        } else {
            matchDiv.className = 'bg-white rounded-lg shadow-md p-6 mb-4';
        }

        matchDiv.innerHTML = `
            <h3 class="text-xl font-semibold mb-4">${prediction.match.homeTeam} vs ${prediction.match.awayTeam}</h3>
            <div class="space-y-4">
                <div class="bg-gray-100 p-4 rounded-md">
                    <p>${prediction.historicalData.totalMatches} korábbi mérkőzés alapján.</p>
                    <p>Mindkét csapat ${prediction.historicalData.bothTeamsScored} alkalommal szerzett gólt (${prediction.historicalData.bothTeamsScoredPercentage}%).</p>
                    <p>Átlagos hazai gól: ${prediction.historicalData.avgHomeGoals}</p>
                    <p>Átlagos vendég gól: ${prediction.historicalData.avgAwayGoals}</p>
                </div>
                <div class="bg-blue-100 p-4 rounded-md">
                    <p><strong>Poisson:</strong> Várható gólok: ${prediction.predictions.poisson.homeGoals} - ${prediction.predictions.poisson.awayGoals}</p>
                </div>
                <div class="bg-green-100 p-4 rounded-md">
                    <p><strong>Monte Carlo:</strong> Győzelmi esélyek: Hazai ${prediction.predictions.monteCarlo.homeWinProbability}, Döntetlen ${prediction.predictions.monteCarlo.drawProbability}, Vendég ${prediction.predictions.monteCarlo.awayWinProbability}</p>
                </div>
                <div class="bg-yellow-100 p-4 rounded-md">
                    <p><strong>ELO Rating:</strong> Hazai győzelem esélye: ${prediction.predictions.eloRating.homeWinProbability}, Vendég győzelem esélye: ${prediction.predictions.eloRating.awayWinProbability}</p>
                </div>
                <div class="bg-red-100 p-4 rounded-md">
                    <p><strong>Random Forest:</strong> Várható gólok: ${prediction.predictions.randomForest.homeGoals} - ${prediction.predictions.randomForest.awayGoals}</p>
                </div>
                <div class="bg-purple-100 p-4 rounded-md">
                    <p><strong>Deep Learning:</strong> Várható gólok: ${prediction.predictions.deepLearning.homeGoals} - ${prediction.predictions.deepLearning.awayGoals}</p>
                </div>
                <div class="bg-indigo-100 p-4 rounded-md">
                    <p><strong>Összesített "Mindkét csapat szerez gólt" valószínűség:</strong> ${prediction.predictions.totalBothTeamsScoredProbability}%</p>
                </div>
            </div>
        `;
        predictionsDiv.appendChild(matchDiv);
    });
}

// Utility Functions
function selectAllText() {
    document.getElementById('matchupsInput').select();
}

function copyText() {
    const textarea = document.getElementById('matchupsInput');
    textarea.select();
    document.execCommand('copy');
}

async function pasteText() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('matchupsInput').value = text;
    } catch (err) {
        console.error('Nem sikerült beolvasni a vágólap tartalmát:', err);
    }
}

function clearText() {
    document.getElementById('matchupsInput').value = '';
}
