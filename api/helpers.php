<?php
require_once __DIR__ . '/config/Database.php';

function json_response(mixed $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}

function read_json(): array
{
    $raw = file_get_contents('php://input');
    if (!$raw) {
        return [];
    }

    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function require_fields(array $data, array $fields): void
{
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
            json_response(['message' => "{$field} is required"], 422);
        }
    }
}

function base64_url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function base64_url_decode(string $value): string|false
{
    return base64_decode(strtr($value, '-_', '+/'));
}

function app_secret(): string
{
    return getenv('APP_SECRET') ?: 'orhiz-local-dev-secret';
}

function create_token(array $user): string
{
    $payload = [
        'id' => (int) $user['id'],
        'role' => $user['role'],
        'email' => $user['email'],
        'exp' => time() + 60 * 60 * 24 * 7,
    ];
    $body = base64_url_encode(json_encode($payload));
    $sig = hash_hmac('sha256', $body, app_secret());
    return "{$body}.{$sig}";
}

function current_user(bool $required = true): ?array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    $queryToken = $_GET['token'] ?? '';
    if (!preg_match('/Bearer\s+(.+)/', $header, $matches) && $queryToken === '') {
        if ($required) {
            json_response(['message' => 'Authentication required'], 401);
        }
        return null;
    }

    $token = $matches[1] ?? $queryToken;
    [$body, $sig] = array_pad(explode('.', $token, 2), 2, '');
    if (!$body || !$sig || !hash_equals(hash_hmac('sha256', $body, app_secret()), $sig)) {
        json_response(['message' => 'Invalid token'], 401);
    }

    $payload = json_decode(base64_url_decode($body), true);
    if (!$payload || ($payload['exp'] ?? 0) < time()) {
        json_response(['message' => 'Session expired'], 401);
    }

    $pdo = Database::connect();
    $stmt = $pdo->prepare('SELECT id, name, email, role, phone, address, avatar, reward_points, first_order_offer FROM users WHERE id = ?');
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();
    if (!$user && $required) {
        json_response(['message' => 'User not found'], 401);
    }

    return $user ?: null;
}

function require_admin(): array
{
    $user = current_user(true);
    if (($user['role'] ?? '') !== 'admin') {
        json_response(['message' => 'Admin access required'], 403);
    }
    return $user;
}

function slugify(string $value): string
{
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $value), '-'));
    return $slug ?: uniqid('item-');
}

function product_row(array $row): array
{
    $row['id'] = (int) $row['id'];
    $row['category_id'] = (int) $row['category_id'];
    $row['price'] = (float) $row['price'];
    $row['stock'] = (int) $row['stock'];
    $row['featured'] = (bool) $row['featured'];
    $row['rating'] = isset($row['rating']) ? round((float) $row['rating'], 1) : 0;
    $row['reviews_count'] = isset($row['reviews_count']) ? (int) $row['reviews_count'] : 0;
    return $row;
}

function save_upload(string $field = 'avatar'): ?string
{
    if (!isset($_FILES[$field]) || $_FILES[$field]['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    $type = mime_content_type($_FILES[$field]['tmp_name']);
    if (!isset($allowed[$type])) {
        json_response(['message' => 'Only JPG, PNG, or WEBP images are allowed'], 422);
    }

    $name = uniqid($field . '-', true) . '.' . $allowed[$type];
    $dir = __DIR__ . '/storage/uploads';
    if (!is_dir($dir)) {
        mkdir($dir, 0775, true);
    }
    move_uploaded_file($_FILES[$field]['tmp_name'], "{$dir}/{$name}");
    return "/storage/uploads/{$name}";
}
