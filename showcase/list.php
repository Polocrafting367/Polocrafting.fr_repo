<?php
header('Content-Type: application/json; charset=utf-8');

$allowedExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];
$entries = scandir(__DIR__) ?: [];
$projects = [];

foreach ($entries as $entry) {
    if ($entry === '.' || $entry === '..') {
        continue;
    }

    $projectPath = __DIR__ . DIRECTORY_SEPARATOR . $entry;
    if (!is_dir($projectPath)) {
        continue;
    }

    $projectEntries = scandir($projectPath) ?: [];
    $images = [];
    $txtFile = null;

    foreach ($projectEntries as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }

        $fullPath = $projectPath . DIRECTORY_SEPARATOR . $file;
        if (!is_file($fullPath)) {
            continue;
        }

        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (in_array($ext, $allowedExtensions, true)) {
            $images[] = $file;
            continue;
        }

        if ($ext === 'txt' && $txtFile === null) {
            $txtFile = $file;
        }
    }

    if (count($images) === 0) {
        continue;
    }

    sort($images, SORT_NATURAL | SORT_FLAG_CASE);

    $projects[] = [
        'name' => $entry,
        'folder' => $entry,
        'txt' => $txtFile,
        'images' => $images
    ];
}

usort($projects, static function ($a, $b) {
    $nameA = (string) ($a['name'] ?? '');
    $nameB = (string) ($b['name'] ?? '');

    $hasNumberA = preg_match('/\d+/', $nameA, $matchA) === 1;
    $hasNumberB = preg_match('/\d+/', $nameB, $matchB) === 1;

    if ($hasNumberA && $hasNumberB) {
        $numA = (int) $matchA[0];
        $numB = (int) $matchB[0];
        if ($numA !== $numB) {
            return $numA <=> $numB;
        }
        return strcasecmp($nameA, $nameB);
    }

    if ($hasNumberA && !$hasNumberB) {
        return -1;
    }

    if (!$hasNumberA && $hasNumberB) {
        return 1;
    }

    return strcasecmp($nameA, $nameB);
});

echo json_encode(['projects' => $projects], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
