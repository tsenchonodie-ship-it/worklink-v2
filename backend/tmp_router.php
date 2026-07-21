<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$request = Illuminate\Http\Request::create('/api/landing', 'GET', [], [], [], ['HTTP_HOST' => '127.0.0.1:8000', 'HTTP_ORIGIN' => 'http://127.0.0.1:5173']);
$route = app('router')->getRoutes()->match($request);
$response = $route->run($request);
echo $response->getStatusCode(), PHP_EOL;
echo $response->headers->get('Access-Control-Allow-Origin'), PHP_EOL;
