<?php

namespace App\Http\Middleware;

use App\Models\Admin;
use App\Models\Customer;
use App\Models\Worker;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        $role = match (true) {
            $user instanceof Admin => 'admin',
            $user instanceof Worker => 'worker',
            $user instanceof Customer => 'customer',
            default => null,
        };

        abort_unless($role && in_array($role, $roles, true), 403, 'You do not have permission to perform this action.');

        return $next($request);
    }
}
