<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('OPTIONS')) {
            return response('', 204)->withHeaders($this->headers());
        }

        $response = $next($request);

        foreach ($this->headers() as $key => $value) {
            $response->headers->set($key, $value);
        }

        return $response;
    }

    private function headers(): array
    {
        $origin = request()->header('Origin');

        return [
            'Access-Control-Allow-Origin' => $this->resolveAllowedOrigin($origin),
            'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN',
            'Access-Control-Allow-Credentials' => 'true',
            'Vary' => 'Origin',
        ];
    }

    private function resolveAllowedOrigin(?string $origin): string
    {
        if (!$origin) {
            return env('FRONTEND_URL', 'http://127.0.0.1:5173');
        }

        $allowedOrigins = array_values(array_filter(array_map('trim', explode(',', env('SANCTUM_STATEFUL_DOMAINS', '127.0.0.1:5173,localhost:5173')))));
        foreach ($allowedOrigins as $candidate) {
            $normalized = str_starts_with($candidate, 'http') ? $candidate : 'http://' . $candidate;
            if ($origin === $normalized) {
                return $origin;
            }
        }

        if (preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin)) {
            return $origin;
        }

        return env('FRONTEND_URL', 'http://127.0.0.1:5173');
    }
}
