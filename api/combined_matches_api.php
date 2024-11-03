<?php
header('Content-Type: application/json; charset=UTF-8');

// Read and decode JSON file
$json_file = 'combined_matches.json';
$json_data = file_get_contents($json_file);
$matches = json_decode($json_data, true)['matches'];

// Function to filter matches based on parameters
function filterMatches($matches, $params) {
    return array_filter($matches, function($match) use ($params) {
        foreach ($params as $key => $value) {
            if ($key == 'team') {
                // Check if the team is either the home or away team
                if ($match['home_team'] != $value && $match['away_team'] != $value) {
                    return false;
                }
            } else {
                // Standard filtering for other parameters
                if (isset($match[$key]) && $match[$key] != $value) {
                    return false;
                }
                // Nested fields like 'score.home'
                if (strpos($key, '.') !== false) {
                    $keys = explode('.', $key);
                    if (isset($match[$keys[0]][$keys[1]]) && $match[$keys[0]][$keys[1]] != $value) {
                        return false;
                    }
                }
            }
        }
        return true;
    });
}

// Get query parameters
$params = [];
if (isset($_GET['match_id'])) {
    $params['match_id'] = $_GET['match_id'];
}
if (isset($_GET['league_id'])) {
    $params['league_id'] = $_GET['league_id'];
}
if (isset($_GET['date'])) {
    $params['date'] = $_GET['date'];
}
if (isset($_GET['home_team'])) {
    $params['home_team'] = $_GET['home_team'];
}
if (isset($_GET['away_team'])) {
    $params['away_team'] = $_GET['away_team'];
}
if (isset($_GET['both_teams_scored'])) {
    $params['both_teams_scored'] = filter_var($_GET['both_teams_scored'], FILTER_VALIDATE_BOOLEAN);
}
if (isset($_GET['score_home'])) {
    $params['score.home'] = (int)$_GET['score_home'];
}
if (isset($_GET['score_away'])) {
    $params['score.away'] = (int)$_GET['score_away'];
}
if (isset($_GET['team'])) {
    $params['team'] = $_GET['team'];
}

// Filter matches based on parameters
$filtered_matches = filterMatches($matches, $params);

// Output filtered results without escaping Unicode characters
echo json_encode(array_values($filtered_matches), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
