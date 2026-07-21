<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$user = App\Models\Customer::where('email', 'customer@tunatuna.test')->first();
if ($user) {
    echo $user->email, PHP_EOL;
    echo $user->password, PHP_EOL;
    echo Illuminate\Support\Facades\Hash::check('password123', $user->password) ? 'ok' : 'fail', PHP_EOL;
} else {
    echo 'none', PHP_EOL;
}
