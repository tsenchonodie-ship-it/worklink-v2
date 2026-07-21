<?php
final class Database
{
    private static ?PDO $pdo = null;

    public static function connect(bool $withoutDatabase = false): PDO
    {
        if (self::$pdo && !$withoutDatabase) {
            return self::$pdo;
        }

        $host = getenv('DB_HOST') ?: '127.0.0.1';
        $port = getenv('DB_PORT') ?: '3306';
        $name = getenv('DB_NAME') ?: 'orhiz_bakery';
        $user = getenv('DB_USER') ?: 'root';
        $pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
        $db = $withoutDatabase ? '' : "dbname={$name};";
        $dsn = "mysql:host={$host};port={$port};{$db}charset=utf8mb4";

        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);

        if (!$withoutDatabase) {
            self::$pdo = $pdo;
        }

        return $pdo;
    }
}
