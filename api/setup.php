<?php
require_once __DIR__ . '/config/Database.php';

header('Content-Type: application/json');

try {
    $schema = file_get_contents(__DIR__ . '/../database/schema.sql');
    $pdo = Database::connect(true);
    $pdo->exec($schema);
    echo json_encode(['message' => 'Orhiz Bakery database installed and seeded.']);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Setup failed', 'error' => $e->getMessage()]);
}
