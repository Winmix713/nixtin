<?php
header('Content-Type: application/json');

// Read the CSV file
$csv_file = 'matches.csv';
$csv_data = array_map('str_getcsv', file($csv_file));

// Get the headers
$headers = array_shift($csv_data);

// Convert CSV data to associative array
$matches = [];
foreach ($csv_data as $row) {
    $match = array_combine($headers, $row);
    $matches[] = $match;
}

// Output JSON
echo json_encode($matches);