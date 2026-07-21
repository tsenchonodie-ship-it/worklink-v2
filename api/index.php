<?php
require_once __DIR__ . '/helpers.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = trim($_GET['path'] ?? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
$path = preg_replace('#^api/index\.php/?#', '', $path);
$segments = $path === '' ? [] : explode('/', $path);
$pdo = null;

try {
    if ($method === 'GET' && $path === 'health') {
        json_response(['ok' => true, 'service' => 'Orhiz Bakery API']);
    }

    $pdo = Database::connect();

    if ($method === 'POST' && $path === 'auth/register') {
        $data = read_json();
        require_fields($data, ['name', 'email', 'password']);
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            json_response(['message' => 'Enter a valid email address'], 422);
        }
        if (strlen($data['password']) < 6) {
            json_response(['message' => 'Password must be at least 6 characters'], 422);
        }

        $stmt = $pdo->prepare('INSERT INTO users (name, email, password, role, phone, address, reward_points) VALUES (?, ?, ?, "user", ?, ?, 50)');
        $stmt->execute([
            trim($data['name']),
            strtolower(trim($data['email'])),
            password_hash($data['password'], PASSWORD_DEFAULT),
            $data['phone'] ?? null,
            $data['address'] ?? null,
        ]);
        $user = ['id' => $pdo->lastInsertId(), 'name' => $data['name'], 'email' => strtolower(trim($data['email'])), 'role' => 'user'];
        json_response(['message' => 'Welcome to Orhiz Bakery', 'token' => create_token($user), 'user' => $user], 201);
    }

    if ($method === 'POST' && $path === 'auth/login') {
        $data = read_json();
        require_fields($data, ['email', 'password']);
        $stmt = $pdo->prepare('SELECT id, name, email, password, role, phone, address, avatar, reward_points, first_order_offer FROM users WHERE email = ?');
        $stmt->execute([strtolower(trim($data['email']))]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($data['password'], $user['password'])) {
            json_response(['message' => 'Invalid email or password'], 401);
        }
        unset($user['password']);
        json_response(['message' => 'Login successful', 'token' => create_token($user), 'user' => $user]);
    }

    if ($method === 'POST' && $path === 'auth/forgot') {
        $data = read_json();
        require_fields($data, ['email']);
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([strtolower(trim($data['email']))]);
        json_response(['message' => 'If this account exists, a reset instruction has been queued.']);
    }

    if ($method === 'GET' && $path === 'categories') {
        json_response($pdo->query('SELECT * FROM categories ORDER BY name')->fetchAll());
    }

    if ($method === 'GET' && $segments[0] === 'products') {
        if (isset($segments[1])) {
            $stmt = $pdo->prepare(
                'SELECT p.*, c.name category_name, COALESCE(AVG(r.rating),0) rating, COUNT(r.id) reviews_count
                 FROM products p
                 JOIN categories c ON c.id = p.category_id
                 LEFT JOIN reviews r ON r.product_id = p.id
                 WHERE p.id = ? OR p.slug = ?
                 GROUP BY p.id'
            );
            $stmt->execute([$segments[1], $segments[1]]);
            $product = $stmt->fetch();
            if (!$product) {
                json_response(['message' => 'Product not found'], 404);
            }
            $reviews = $pdo->prepare('SELECT r.*, u.name user_name FROM reviews r LEFT JOIN users u ON u.id = r.user_id WHERE product_id = ? ORDER BY r.created_at DESC');
            $reviews->execute([$product['id']]);
            $product = product_row($product);
            $product['reviews'] = $reviews->fetchAll();
            json_response($product);
        }

        $query = '%' . ($_GET['search'] ?? '') . '%';
        $category = $_GET['category'] ?? '';
        $min = $_GET['min'] ?? 0;
        $max = $_GET['max'] ?? 999999;
        $sql = 'SELECT p.*, c.name category_name, c.slug category_slug, COALESCE(AVG(r.rating),0) rating, COUNT(r.id) reviews_count
                FROM products p
                JOIN categories c ON c.id = p.category_id
                LEFT JOIN reviews r ON r.product_id = p.id
                WHERE (p.name LIKE ? OR p.flavour LIKE ? OR p.description LIKE ?)
                AND p.price BETWEEN ? AND ?';
        $params = [$query, $query, $query, $min, $max];
        if ($category !== '') {
            $sql .= ' AND c.slug = ?';
            $params[] = $category;
        }
        $sql .= ' GROUP BY p.id ORDER BY p.featured DESC, p.created_at DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        json_response(array_map('product_row', $stmt->fetchAll()));
    }

    if ($method === 'GET' && $path === 'offers') {
        $stmt = $pdo->query('SELECT * FROM offers WHERE active = 1 ORDER BY expires_at ASC');
        json_response($stmt->fetchAll());
    }

    if ($path === 'me') {
        $user = current_user(true);
        if ($method === 'GET') {
            json_response($user);
        }
        if ($method === 'PUT') {
            $data = read_json();
            if (isset($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                json_response(['message' => 'Enter a valid email address'], 422);
            }
            $stmt = $pdo->prepare('UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?');
            $stmt->execute([
                trim($data['name'] ?? $user['name']),
                strtolower(trim($data['email'] ?? $user['email'])),
                trim($data['phone'] ?? $user['phone']),
                trim($data['address'] ?? $user['address']),
                $user['id'],
            ]);
            json_response(['message' => 'Profile updated', 'user' => current_user(true)]);
        }
    }

    if ($method === 'POST' && $path === 'me/avatar') {
        $user = current_user(true);
        $avatar = save_upload('avatar');
        if (!$avatar) {
            json_response(['message' => 'Choose an image to upload'], 422);
        }
        $stmt = $pdo->prepare('UPDATE users SET avatar = ? WHERE id = ?');
        $stmt->execute([$avatar, $user['id']]);
        json_response(['message' => 'Profile picture updated', 'avatar' => $avatar]);
    }

    if ($segments[0] === 'wishlist') {
        $user = current_user(true);
        if ($method === 'GET') {
            $stmt = $pdo->prepare('SELECT p.*, c.name category_name FROM wishlists w JOIN products p ON p.id = w.product_id JOIN categories c ON c.id = p.category_id WHERE w.user_id = ? ORDER BY w.created_at DESC');
            $stmt->execute([$user['id']]);
            json_response(array_map('product_row', $stmt->fetchAll()));
        }
        if ($method === 'POST') {
            $data = read_json();
            require_fields($data, ['product_id']);
            $stmt = $pdo->prepare('INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)');
            $stmt->execute([$user['id'], $data['product_id']]);
            json_response(['message' => 'Added to wishlist']);
        }
        if ($method === 'DELETE' && isset($segments[1])) {
            $stmt = $pdo->prepare('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?');
            $stmt->execute([$user['id'], $segments[1]]);
            json_response(['message' => 'Removed from wishlist']);
        }
    }

    if ($segments[0] === 'orders') {
        $user = current_user(true);
        if ($method === 'GET') {
            $stmt = $pdo->prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC');
            $stmt->execute([$user['id']]);
            $orders = $stmt->fetchAll();
            foreach ($orders as &$order) {
                $items = $pdo->prepare('SELECT * FROM order_items WHERE order_id = ?');
                $items->execute([$order['id']]);
                $order['items'] = $items->fetchAll();
            }
            json_response($orders);
        }
        if ($method === 'POST') {
            $data = read_json();
            require_fields($data, ['items', 'delivery_date', 'delivery_time', 'delivery_address']);
            if (!is_array($data['items']) || count($data['items']) === 0) {
                json_response(['message' => 'Cart is empty'], 422);
            }

            $pdo->beginTransaction();
            $subtotal = 0;
            $items = [];
            foreach ($data['items'] as $item) {
                $stmt = $pdo->prepare('SELECT id, name, price, stock FROM products WHERE id = ?');
                $stmt->execute([$item['id']]);
                $product = $stmt->fetch();
                $qty = max(1, (int) ($item['quantity'] ?? 1));
                if (!$product || $product['stock'] < $qty) {
                    $pdo->rollBack();
                    json_response(['message' => 'One or more products are unavailable'], 422);
                }
                $subtotal += (float) $product['price'] * $qty;
                $items[] = [$product, $qty];
            }
            $discount = !empty($user['first_order_offer']) ? round($subtotal * 0.10, 2) : 0;
            $total = $subtotal - $discount;
            $points = (int) floor($total / 100) * 5;
            $stmt = $pdo->prepare('INSERT INTO orders (user_id, subtotal, discount, total, reward_points_earned, delivery_date, delivery_time, delivery_address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$user['id'], $subtotal, $discount, $total, $points, $data['delivery_date'], $data['delivery_time'], $data['delivery_address'], $data['notes'] ?? null]);
            $orderId = $pdo->lastInsertId();
            foreach ($items as [$product, $qty]) {
                $pdo->prepare('INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)')->execute([$orderId, $product['id'], $product['name'], $product['price'], $qty]);
                $pdo->prepare('UPDATE products SET stock = stock - ? WHERE id = ?')->execute([$qty, $product['id']]);
            }
            $pdo->prepare('UPDATE users SET reward_points = reward_points + ?, first_order_offer = 0 WHERE id = ?')->execute([$points, $user['id']]);
            $pdo->prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, "Order placed", ?, "order")')->execute([$user['id'], "Order #{$orderId} is pending confirmation."]);
            $pdo->commit();
            json_response(['message' => 'Order placed successfully', 'order_id' => (int) $orderId], 201);
        }
    }

    if ($segments[0] === 'notifications') {
        $user = current_user(true);
        $stmt = $pdo->prepare('SELECT * FROM notifications WHERE user_id IS NULL OR user_id = ? ORDER BY created_at DESC LIMIT 20');
        $stmt->execute([$user['id']]);
        json_response($stmt->fetchAll());
    }

    if ($segments[0] === 'admin') {
        require_admin();
        $area = $segments[1] ?? '';

        if ($method === 'GET' && $area === 'stats') {
            $stats = [
                'orders' => (int) $pdo->query('SELECT COUNT(*) FROM orders')->fetchColumn(),
                'completed' => (int) $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'Delivered'")->fetchColumn(),
                'pending' => (int) $pdo->query("SELECT COUNT(*) FROM orders WHERE status IN ('Pending','Confirmed','Preparing','Ready')")->fetchColumn(),
                'cancelled' => (int) $pdo->query("SELECT COUNT(*) FROM orders WHERE status = 'Cancelled'")->fetchColumn(),
                'customers' => (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'user'")->fetchColumn(),
                'products' => (int) $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn(),
                'sales' => (float) $pdo->query("SELECT COALESCE(SUM(total),0) FROM orders WHERE status <> 'Cancelled'")->fetchColumn(),
                'best_sellers' => $pdo->query('SELECT product_name name, SUM(quantity) quantity FROM order_items GROUP BY product_id, product_name ORDER BY quantity DESC LIMIT 5')->fetchAll(),
                'monthly_sales' => $pdo->query("SELECT DATE_FORMAT(created_at, '%b') month, SUM(total) total FROM orders GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b') ORDER BY MIN(created_at) LIMIT 6")->fetchAll(),
            ];
            json_response($stats);
        }

        if ($area === 'products') {
            if ($method === 'GET') {
                json_response(array_map('product_row', $pdo->query('SELECT p.*, c.name category_name FROM products p JOIN categories c ON c.id = p.category_id ORDER BY p.created_at DESC')->fetchAll()));
            }
            if ($method === 'POST') {
                $data = read_json();
                require_fields($data, ['category_id', 'name', 'description', 'price', 'flavour', 'ingredients', 'image']);
                $stmt = $pdo->prepare('INSERT INTO products (category_id, name, slug, description, price, flavour, ingredients, image, stock, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute([$data['category_id'], $data['name'], slugify($data['name']), $data['description'], $data['price'], $data['flavour'], $data['ingredients'], $data['image'], $data['stock'] ?? 20, !empty($data['featured']) ? 1 : 0]);
                json_response(['message' => 'Product created', 'id' => (int) $pdo->lastInsertId()], 201);
            }
            if (($method === 'PUT' || $method === 'PATCH') && isset($segments[2])) {
                $data = read_json();
                $stmt = $pdo->prepare('UPDATE products SET category_id=?, name=?, description=?, price=?, flavour=?, ingredients=?, image=?, stock=?, featured=? WHERE id=?');
                $stmt->execute([$data['category_id'], $data['name'], $data['description'], $data['price'], $data['flavour'], $data['ingredients'], $data['image'], $data['stock'], !empty($data['featured']) ? 1 : 0, $segments[2]]);
                json_response(['message' => 'Product updated']);
            }
            if ($method === 'DELETE' && isset($segments[2])) {
                $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
                $stmt->execute([$segments[2]]);
                json_response(['message' => 'Product deleted']);
            }
        }

        if ($area === 'orders') {
            if ($method === 'GET') {
                $orders = $pdo->query('SELECT o.*, u.name customer_name, u.email customer_email FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC')->fetchAll();
                json_response($orders);
            }
            if (($method === 'PATCH' || $method === 'PUT') && isset($segments[2])) {
                $data = read_json();
                require_fields($data, ['status']);
                $allowed = ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];
                if (!in_array($data['status'], $allowed, true)) {
                    json_response(['message' => 'Invalid status'], 422);
                }
                $stmt = $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?');
                $stmt->execute([$data['status'], $segments[2]]);
                json_response(['message' => 'Order status updated']);
            }
        }

        if ($method === 'GET' && $area === 'customers') {
            json_response($pdo->query("SELECT id, name, email, phone, address, reward_points, created_at FROM users WHERE role = 'user' ORDER BY created_at DESC")->fetchAll());
        }

        if ($method === 'GET' && $area === 'reports') {
            $format = $_GET['format'] ?? 'csv';
            $orders = $pdo->query('SELECT o.id, u.name customer, o.status, o.total, o.delivery_date, o.created_at FROM orders o JOIN users u ON u.id = o.user_id ORDER BY o.created_at DESC')->fetchAll();
            if ($format === 'pdf') {
                header('Content-Type: application/pdf');
                header('Content-Disposition: attachment; filename="orhiz-report.pdf"');
                echo "%PDF-1.4\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n2 0 obj <</Type /Pages /Count 1 /Kids [3 0 R]>> endobj\n3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R>> endobj\n4 0 obj <</Length 92>> stream\nBT /F1 18 Tf 72 720 Td (Orhiz Bakery Orders Report) Tj 0 -30 Td (Export generated from admin panel.) Tj ET\nendstream endobj\ntrailer <</Root 1 0 R>>\n%%EOF";
                exit;
            }
            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="orhiz-report.csv"');
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Order ID', 'Customer', 'Status', 'Total', 'Delivery Date', 'Created']);
            foreach ($orders as $order) {
                fputcsv($out, $order);
            }
            exit;
        }
    }

    json_response(['message' => 'Endpoint not found'], 404);
} catch (PDOException $e) {
    json_response(['message' => 'Database error', 'error' => $e->getMessage()], 500);
} catch (Throwable $e) {
    json_response(['message' => 'Server error', 'error' => $e->getMessage()], 500);
}
