<?php
require 'vendor/autoload.php';
$r = new ReflectionClass('App\\Http\\Controllers\\Api\\TunaTunaController');
echo $r->getFileName(), PHP_EOL;
