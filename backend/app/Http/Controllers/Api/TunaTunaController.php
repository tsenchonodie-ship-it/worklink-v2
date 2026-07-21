<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AppNotification;
use App\Models\Booking;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Review;
use App\Models\ServiceCategory;
use App\Models\Worker;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TunaTunaController extends Controller
{
    private array $statuses = ['pending', 'confirmed', 'accepted', 'in_progress', 'completed', 'reviewed', 'cancelled', 'rejected'];

    public function health()
    {
        return response()->json(['ok' => true, 'service' => 'TunaTuna API', 'stack' => 'Laravel 12 + Sanctum'])
            ->withHeaders($this->corsHeaders());
    }

    public function landing()
    {
        return response()->json([
            'categories' => ServiceCategory::where('active', true)->withCount('workers')->orderBy('name')->get(),
            'featuredWorkers' => Worker::with('category')->where('verified', true)->orderByDesc('rating')->limit(6)->get(),
            'stats' => [
                'customers' => Customer::count(),
                'workers' => Worker::count(),
                'bookings' => Booking::count(),
                'completed' => Booking::whereIn('status', ['completed', 'reviewed'])->count(),
            ],
            'testimonials' => Review::with(['customer:id,full_name', 'worker:id,full_name'])->latest()->limit(5)->get(),
        ])->withHeaders($this->corsHeaders());
    }

    public function categories()
    {
        return response()->json(ServiceCategory::where('active', true)->withCount('workers')->orderBy('name')->get())
            ->withHeaders($this->corsHeaders());
    }

    public function adminCategories(Request $request)
    {
        $query = ServiceCategory::query()->latest();

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function (Builder $inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json($query->get())->withHeaders($this->corsHeaders());
    }

    public function workers(Request $request)
    {
        $query = Worker::query()->with('category')->whereHas('category', fn (Builder $q) => $q->where('active', true));

        $query->when($request->search, function (Builder $q, string $search) {
            $q->where(function (Builder $inner) use ($search) {
                $inner->where('full_name', 'like', "%{$search}%")
                    ->orWhere('skills', 'like', "%{$search}%")
                    ->orWhereHas('category', fn (Builder $cat) => $cat->where('name', 'like', "%{$search}%"));
            });
        });

        $query->when($request->category, fn (Builder $q, string $category) => $q->whereHas('category', fn (Builder $cat) => $cat->where('slug', $category)));
        $query->when($request->availability, fn (Builder $q, string $availability) => $q->where('availability', 'like', "%{$availability}%"));

        match ($request->sort) {
            'price_low' => $query->orderBy('price'),
            'price_high' => $query->orderByDesc('price'),
            'experience' => $query->orderByDesc('experience'),
            default => $query->orderByDesc('rating'),
        };

        return response()->json($query->paginate(24))->withHeaders($this->corsHeaders());
    }

    public function worker(Worker $worker)
    {
        return response()->json($worker->load(['category', 'bookings.review']))->withHeaders($this->corsHeaders());
    }

    public function reviews(Request $request)
    {
        return response()->json(Review::with(['customer:id,full_name', 'worker:id,full_name,service_category_id', 'worker.category'])
            ->when($request->worker_id, fn (Builder $q, $id) => $q->where('worker_id', $id))
            ->latest()
            ->limit(40)
            ->get())->withHeaders($this->corsHeaders());
    }

    public function registerCustomer(Request $request)
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160', 'unique:customers,email'],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'address' => ['nullable', 'string', 'max:255'],
        ]);

        $customer = Customer::create([
            ...$data,
            'password' => Hash::make($data['password']),
            'latitude' => 28.6139,
            'longitude' => 77.2090,
        ]);
        $this->notify($customer, 'Welcome to TunaTuna', 'Your customer account is ready to book trusted local services.', 'announcement');

        return response()->json([
            'message' => 'Customer registered successfully.',
            'user' => $this->userResource($customer, 'customer'),
        ], 201)->withHeaders($this->corsHeaders());
    }

    public function registerWorker(Request $request)
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160', 'unique:workers,email'],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'address' => ['required', 'string', 'max:255'],
            'service_category_id' => ['required', 'exists:service_categories,id'],
            'experience' => ['required', 'integer', 'min:0', 'max:40'],
            'skills' => ['required'],
            'price' => ['nullable', 'numeric', 'min:99', 'max:50000'],
        ]);

        if ($request->hasFile('profile_photo')) {
            $path = $request->file('profile_photo')->store('worker-photos', 'public');
            $data['profile_photo'] = Storage::url($path);
        }

        $data['skills'] = is_array($data['skills']) ? $data['skills'] : array_values(array_filter(array_map('trim', explode(',', $data['skills']))));
        $data['password'] = Hash::make($data['password']);
        $data['latitude'] = 28.6139 + random_int(-90, 90) / 1000;
        $data['longitude'] = 77.2090 + random_int(-90, 90) / 1000;
        $data['verified'] = false;
        $data['status'] = 'pending';
        $worker = Worker::create($data);
        $this->notify($worker, 'Verification pending', 'Your worker profile is under admin review.', 'announcement');

        return response()->json([
            'message' => 'Your application has been submitted successfully. Please wait for Admin approval before logging in.',
            'user' => $this->userResource($worker, 'worker'),
        ], 201)->withHeaders($this->corsHeaders());
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'role' => ['required', Rule::in(['customer', 'worker'])],
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $model = $data['role'] === 'customer' ? Customer::class : Worker::class;
        $user = $model::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => ['Invalid login credentials.']]);
        }

        return $this->authPayload($user, $data['role']);
    }

    public function adminLogin(Request $request)
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        if (!Schema::hasTable('admins')) {
            Schema::create('admins', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('username')->unique();
                $table->string('password');
                $table->timestamps();
            });
        }

        $admin = Admin::where('username', $data['username'])->first();

        if (!$admin && $data['username'] === 'admin' && $data['password'] === 'password123') {
            $admin = Admin::create([
                'name' => 'TunaTuna Admin',
                'username' => 'admin',
                'password' => Hash::make('password123'),
            ]);
        }

        if (!$admin) {
            throw ValidationException::withMessages(['username' => ['Invalid admin credentials.']]);
        }

        $passwordMatches = Hash::check($data['password'], $admin->password) || $admin->password === $data['password'];
        if (!$passwordMatches) {
            throw ValidationException::withMessages(['username' => ['Invalid admin credentials.']]);
        }

        if ($admin->password === $data['password']) {
            $admin->forceFill(['password' => Hash::make($data['password'])])->save();
        }

        return $this->authPayload($admin, 'admin');
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);
        return ['message' => 'If this account exists, a reset instruction has been queued for local delivery.'];
    }

    public function me(Request $request)
    {
        return $this->userResource($request->user());
    }

    public function updateMe(Request $request)
    {
        $user = $request->user();

        if ($user instanceof Admin) {
            $data = $request->validate(['name' => ['required', 'string', 'max:120']]);
        } else {
            $data = $request->validate([
                'full_name' => ['required', 'string', 'max:120'],
                'email' => ['nullable', 'email', 'max:160', Rule::unique('customers', 'email')->ignore($user->id)],
                'phone' => ['required', 'string', 'max:30'],
                'address' => ['nullable', 'string', 'max:255'],
                'skills' => ['nullable'],
                'availability' => ['nullable', 'string', 'max:80'],
                'price' => ['nullable', 'numeric', 'min:99'],
                'booking_notifications' => ['nullable', 'boolean'],
                'email_notifications' => ['nullable', 'boolean'],
                'theme_preference' => ['nullable', 'string', 'in:dark,light'],
                'profile_photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            ]);
            if (isset($data['skills']) && !is_array($data['skills'])) {
                $data['skills'] = array_values(array_filter(array_map('trim', explode(',', $data['skills']))));
            }
            if ($request->hasFile('profile_photo')) {
                $file = $request->file('profile_photo');
                $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
                $extension = $file->getClientOriginalExtension() ?: 'png';
                $storedName = $originalName !== '' ? $originalName : 'avatar';
                $path = $file->storeAs('profile-photos', $storedName.'-'.Str::random(8).'.'.$extension, 'public');
                $data['profile_photo'] = '/storage/' . $path;
            }
        }

        $user->update($data);
        return ['message' => 'Profile updated.', 'user' => $this->userResource($user->fresh())];
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        abort_unless(Hash::check($data['current_password'], $request->user()->password), 422, 'Current password is incorrect.');
        $request->user()->update(['password' => Hash::make($data['password'])]);

        return ['message' => 'Password changed.'];
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return ['message' => 'Logged out.'];
    }

    public function customerDashboard(Request $request)
    {
        $customer = $request->user();
        $bookings = Booking::with(['worker.category', 'review', 'payment'])->where('customer_id', $customer->id)->latest()->get();

        return [
            'overview' => [
                'totalBookings' => $bookings->count(),
                'upcomingServices' => $bookings->whereIn('status', ['pending', 'confirmed', 'accepted', 'in_progress'])->count(),
                'completedJobs' => $bookings->whereIn('status', ['completed', 'reviewed'])->count(),
                'notifications' => $this->notificationQuery($customer)->whereNull('read_at')->count(),
                'payments' => Payment::where('customer_id', $customer->id)->count(),
            ],
            'nearbyWorkers' => Worker::with('category')->where('verified', true)->orderByDesc('rating')->limit(8)->get(),
            'bookings' => $bookings,
            'notifications' => $this->notificationQuery($customer)->latest()->limit(8)->get(),
            'recentActivity' => $bookings->take(5)->values(),
        ];
    }

    public function workerDashboard(Request $request)
    {
        $worker = $request->user();
        $bookings = Booking::with(['customer', 'category', 'review', 'payment'])->where('worker_id', $worker->id)->latest()->get();
        $today = now()->toDateString();

        return [
            'overview' => [
                'todaysJobs' => $bookings->where('booking_date', $today)->count(),
                'upcomingBookings' => $bookings->whereIn('status', ['pending', 'confirmed', 'accepted'])->count(),
                'monthlyEarnings' => (float) Payment::where('worker_id', $worker->id)->where('payment_status', 'successful')->where('created_at', '>=', now()->startOfMonth())->sum('amount'),
                'completedJobs' => $bookings->whereIn('status', ['completed', 'reviewed'])->count(),
            ],
            'bookings' => $bookings,
            'reviews' => Review::with('customer:id,full_name')->where('worker_id', $worker->id)->latest()->limit(8)->get(),
            'notifications' => $this->notificationQuery($worker)->latest()->limit(8)->get(),
        ];
    }

    public function bookings(Request $request)
    {
        $user = $request->user();
        $query = Booking::with(['customer', 'worker.category', 'category', 'review', 'payment'])->latest();

        if ($user instanceof Customer) {
            $query->where('customer_id', $user->id);
        } elseif ($user instanceof Worker) {
            $query->where('worker_id', $user->id);
        }

        return $query->get();
    }

    public function createBooking(Request $request)
    {
        $data = $request->validate([
            'worker_id' => ['required', 'exists:workers,id'],
            'booking_date' => ['required', 'date', 'after_or_equal:today'],
            'booking_time' => ['required', 'date_format:H:i'],
            'address' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'payment_method' => ['required', Rule::in(['upi', 'card', 'wallet', 'cash'])],
        ]);

        $worker = Worker::with('category')->findOrFail($data['worker_id']);
        abort_unless($worker->availability !== 'Unavailable', 422, 'This worker is currently unavailable.');

        [$booking, $payment] = DB::transaction(function () use ($data, $request, $worker) {
            $paymentMethod = $data['payment_method'];
            unset($data['payment_method']);

            $booking = Booking::create($data + [
                'customer_id' => $request->user()->id,
                'service_category_id' => $worker->service_category_id,
                'price' => $worker->price,
                'status' => 'confirmed',
            ]);

            $payment = Payment::create([
                'booking_id' => $booking->id,
                'customer_id' => $request->user()->id,
                'worker_id' => $worker->id,
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentMethod === 'cash' ? 'pending' : 'successful',
                'amount' => $worker->price,
                'transaction_id' => $this->uniquePaymentCode('TTX'),
                'payment_id' => $this->uniquePaymentCode('PAY'),
                'invoice_number' => $this->uniquePaymentCode('INV'),
                'paid_at' => $paymentMethod === 'cash' ? null : now(),
                'metadata' => [
                    'gateway' => 'localhost-demo',
                    'service' => $worker->category->name,
                    'worker' => $worker->full_name,
                    'note' => $paymentMethod === 'cash' ? 'Cash will be collected after service.' : 'Demo payment simulated successfully. No real money was transferred.',
                ],
            ]);

            return [$booking, $payment];
        });

        $this->notify($worker, 'Confirmed booking', "{$request->user()->full_name} confirmed {$worker->category->name}.", 'booking_request');
        $this->notify($request->user(), 'Booking confirmed', "Booking #{$booking->id} is confirmed. Invoice {$payment->invoice_number} is ready.", 'booking_accepted');

        return $booking->load(['worker.category', 'customer', 'payment']);
    }

    public function updateBookingStatus(Request $request, Booking $booking)
    {
        $data = $request->validate(['status' => ['required', Rule::in($this->statuses)]]);
        $user = $request->user();

        if ($user instanceof Worker) {
            abort_unless($booking->worker_id === $user->id, 403);
            abort_if($data['status'] === 'reviewed', 422, 'Customers create reviews after completion.');
        }

        $booking->status = $data['status'];
        if ($data['status'] === 'in_progress') {
            $booking->started_at = Carbon::now();
        }
        if ($data['status'] === 'completed') {
            $booking->completed_at = Carbon::now();
        }
        $booking->save();

        $title = Str::headline(str_replace('_', ' ', $data['status']));
        $this->notify($booking->customer, "Booking {$title}", "Booking #{$booking->id} is now {$title}.", $data['status'] === 'cancelled' ? 'booking_cancelled' : 'booking_update');

        return ['message' => 'Booking status updated.', 'booking' => $booking->fresh()->load(['customer', 'worker.category', 'review'])];
    }

    public function customerReviews(Request $request)
    {
        return Review::with(['customer:id,full_name', 'worker:id,full_name,service_category_id', 'worker.category'])
            ->where('customer_id', $request->user()->id)
            ->latest()
            ->get();
    }

    public function createReview(Request $request)
    {
        $data = $request->validate([
            'booking_id' => ['required', 'exists:bookings,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        $booking = Booking::with('worker')->where('customer_id', $request->user()->id)->findOrFail($data['booking_id']);
        abort_unless($booking->status === 'completed', 422, 'Only completed bookings can be reviewed.');

        $review = Review::create($data + [
            'customer_id' => $request->user()->id,
            'worker_id' => $booking->worker_id,
        ]);

        $booking->update(['status' => 'reviewed']);
        $booking->worker->update(['rating' => round(Review::where('worker_id', $booking->worker_id)->avg('rating'), 2)]);
        $this->notify($booking->worker, 'New review received', "{$request->user()->full_name} rated your service {$data['rating']} stars.", 'review');

        return $review->load(['customer', 'worker']);
    }

    public function updateReview(Request $request, Review $review)
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'max:1000'],
        ]);

        abort_unless((int) $review->customer_id === (int) $request->user()->id, 403, 'You can only edit your own reviews.');

        $review->update($data);

        return $review->fresh()->load(['customer', 'worker']);
    }

    public function updateAvailability(Request $request)
    {
        $data = $request->validate(['availability' => ['required', 'string', 'max:80']]);
        $request->user()->update($data);
        return ['message' => 'Availability updated.', 'user' => $this->userResource($request->user()->fresh())];
    }

    public function notifications(Request $request)
    {
        return $this->notificationQuery($request->user())->latest()->limit(50)->get();
    }

    public function readNotification(Request $request, AppNotification $notification)
    {
        $user = $request->user();
        abort_unless($notification->notifiable_type === $user::class && (int) $notification->notifiable_id === (int) $user->id, 403);
        $notification->update(['read_at' => now()]);
        return ['message' => 'Notification marked as read.'];
    }

    public function clearNotifications(Request $request)
    {
        $this->notificationQuery($request->user())->delete();
        return ['message' => 'Notifications cleared.'];
    }

    public function adminDashboard()
    {
        return [
            'totals' => [
                'customers' => Customer::count(),
                'workers' => Worker::count(),
                'bookings' => Booking::count(),
                'completedJobs' => Booking::whereIn('status', ['completed', 'reviewed'])->count(),
                'pendingJobs' => Booking::where('status', 'pending')->count(),
                'monthlyRevenue' => (float) Payment::where('payment_status', 'successful')->where('created_at', '>=', now()->startOfMonth())->sum('amount'),
                'successfulPayments' => Payment::where('payment_status', 'successful')->count(),
                'pendingPayments' => Payment::where('payment_status', 'pending')->count(),
            ],
            'recentActivities' => Booking::with(['customer', 'worker.category'])->latest()->limit(8)->get(),
            'charts' => $this->analytics(),
            'payments' => $this->paymentAnalytics(),
        ];
    }

    public function analytics()
    {
        $months = collect(range(5, 0))->map(fn ($i) => now()->subMonths($i));

        return [
            'monthlyBookings' => $months->map(fn (Carbon $month) => [
                'label' => $month->format('M'),
                'value' => Booking::whereYear('created_at', $month->year)->whereMonth('created_at', $month->month)->count(),
            ])->values(),
            'customerGrowth' => $months->map(fn (Carbon $month) => [
                'label' => $month->format('M'),
                'value' => Customer::whereYear('created_at', $month->year)->whereMonth('created_at', $month->month)->count(),
            ])->values(),
            'workerGrowth' => $months->map(fn (Carbon $month) => [
                'label' => $month->format('M'),
                'value' => Worker::whereYear('created_at', $month->year)->whereMonth('created_at', $month->month)->count(),
            ])->values(),
            'mostBookedServices' => ServiceCategory::query()
                ->select('service_categories.name')
                ->selectRaw('COUNT(bookings.id) as value')
                ->leftJoin('bookings', 'bookings.service_category_id', '=', 'service_categories.id')
                ->groupBy('service_categories.id', 'service_categories.name')
                ->orderByDesc('value')
                ->limit(8)
                ->get(),
            'topRatedWorkers' => Worker::with('category')->orderByDesc('rating')->limit(6)->get(),
            'workerPerformance' => Worker::query()
                ->select('workers.full_name as label')
                ->selectRaw('COUNT(bookings.id) as value')
                ->leftJoin('bookings', 'bookings.worker_id', '=', 'workers.id')
                ->groupBy('workers.id', 'workers.full_name')
                ->orderByDesc('value')
                ->limit(8)
                ->get(),
            'paymentMethods' => $this->paymentAnalytics()['methods'],
            'paymentStatuses' => $this->paymentAnalytics()['statuses'],
        ];
    }

    public function payments(Request $request)
    {
        $user = $request->user();
        $query = Payment::with(['booking.category', 'customer:id,full_name,email,phone', 'worker:id,full_name,service_category_id', 'worker.category'])->latest();

        if ($user instanceof Customer) {
            $query->where('customer_id', $user->id);
        }

        $query->when($request->status, fn (Builder $q, string $status) => $q->where('payment_status', $status));
        $query->when($request->input('method'), fn (Builder $q, string $method) => $q->where('payment_method', $method));

        return $query->get();
    }

    public function payment(Request $request, Payment $payment)
    {
        $this->authorizePaymentAccess($request, $payment);

        return $payment->load(['booking.category', 'customer:id,full_name,email,phone,address', 'worker:id,full_name,service_category_id,phone', 'worker.category']);
    }

    public function updatePaymentStatus(Request $request, Payment $payment)
    {
        $data = $request->validate(['payment_status' => ['required', Rule::in(['pending', 'successful', 'failed', 'refunded'])]]);
        $payment->update([
            'payment_status' => $data['payment_status'],
            'paid_at' => $data['payment_status'] === 'successful' ? now() : $payment->paid_at,
        ]);

        if ($data['payment_status'] === 'successful') {
            $payment->booking()->update(['status' => 'confirmed']);
        }

        return ['message' => 'Payment status updated.', 'payment' => $payment->fresh()->load(['booking.category', 'customer', 'worker.category'])];
    }

    public function paymentAnalytics()
    {
        $months = collect(range(5, 0))->map(fn ($i) => now()->subMonths($i));

        return [
            'totalCollected' => (float) Payment::where('payment_status', 'successful')->sum('amount'),
            'pendingAmount' => (float) Payment::where('payment_status', 'pending')->sum('amount'),
            'successfulCount' => Payment::where('payment_status', 'successful')->count(),
            'pendingCount' => Payment::where('payment_status', 'pending')->count(),
            'monthlyRevenue' => $months->map(fn (Carbon $month) => [
                'label' => $month->format('M'),
                'value' => (float) Payment::where('payment_status', 'successful')->whereYear('created_at', $month->year)->whereMonth('created_at', $month->month)->sum('amount'),
            ])->values(),
            'methods' => Payment::query()
                ->select('payment_method as label')
                ->selectRaw('COUNT(*) as value')
                ->groupBy('payment_method')
                ->orderByDesc('value')
                ->get(),
            'statuses' => Payment::query()
                ->select('payment_status as label')
                ->selectRaw('COUNT(*) as value')
                ->groupBy('payment_status')
                ->orderByDesc('value')
                ->get(),
        ];
    }

    public function invoice(Request $request, Payment $payment)
    {
        $this->authorizePaymentAccess($request, $payment);
        $payment->load(['booking.category', 'customer', 'worker.category']);

        $html = view('invoice', ['payment' => $payment])->render();

        return response($html, 200, [
            'Content-Type' => 'text/html',
            'Content-Disposition' => 'attachment; filename="'.$payment->invoice_number.'.html"',
        ]);
    }

    public function adminCustomers(Request $request)
    {
        $query = Customer::query()->withCount('bookings')->latest();

        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function (Builder $inner) use ($search) {
                $inner->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'disabled') {
                $query->where('is_active', false);
            }
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        return $query->get()->map(function (Customer $customer) {
            $customer->is_active = (bool) $customer->is_active;
            return $customer;
        });
    }

    public function showCustomer(Customer $customer)
    {
        $customer->loadCount('bookings');
        return $customer;
    }

    public function updateCustomer(Request $request, Customer $customer)
    {
        $data = $request->validate([
            'full_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160', Rule::unique('customers', 'email')->ignore($customer->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $customer->update($data);

        return ['message' => 'Customer updated.', 'customer' => $customer->fresh()->loadCount('bookings')];
    }

    public function toggleCustomerStatus(Customer $customer)
    {
        $customer->update(['is_active' => !$customer->is_active]);

        return ['message' => 'Customer status updated.', 'customer' => $customer->fresh()->loadCount('bookings')];
    }

    public function deleteCustomer(Customer $customer)
    {
        $customer->delete();

        return ['message' => 'Customer deleted.'];
    }

    public function adminWorkers(Request $request)
    {
        $query = Worker::query()->with('category')->withCount('bookings')->latest();

        if ($request->filled('status')) {
            $status = $request->input('status');
            if ($status === 'pending') {
                $query->where('verified', false)->where(function (Builder $inner) {
                    $inner->whereNull('status')->orWhere('status', 'pending');
                });
            } elseif ($status === 'approved') {
                $query->where('verified', true);
            } elseif ($status === 'rejected') {
                $query->where('status', 'rejected');
            }
        }

        return $query->get()->map(function (Worker $worker) {
            $worker->status = $worker->status ?: ($worker->verified ? 'approved' : 'pending');
            return $worker;
        });
    }

    public function verifyWorker(Worker $worker)
    {
        $worker->update(['verified' => true, 'status' => 'approved']);
        $this->notify($worker, 'Profile verified', 'Your TunaTuna worker profile is now verified.', 'announcement');
        return ['message' => 'Worker approved.', 'worker' => $worker->fresh('category')];
    }

    public function rejectWorker(Worker $worker)
    {
        $worker->update(['verified' => false, 'status' => 'rejected']);
        $this->notify($worker, 'Profile rejected', 'Your TunaTuna worker profile was not approved.', 'announcement');
        return ['message' => 'Worker rejected.', 'worker' => $worker->fresh('category')];
    }

    public function updateUser(Request $request, string $role, int $id)
    {
        abort_unless(in_array($role, ['customer', 'worker'], true), 404);
        $model = $role === 'customer' ? Customer::class : Worker::class;
        $user = $model::findOrFail($id);

        if ($role === 'customer') {
            $data = $request->validate([
                'full_name' => ['required', 'string', 'max:120'],
                'email' => ['required', 'email', 'max:160', Rule::unique('customers', 'email')->ignore($user->id)],
                'phone' => ['nullable', 'string', 'max:30'],
                'address' => ['nullable', 'string', 'max:255'],
                'is_active' => ['nullable', 'boolean'],
            ]);
            $user->update($data);
            return ['message' => 'Customer updated.', 'user' => $user->fresh()];
        }

        $user->update($request->only(['full_name', 'phone', 'address', 'availability', 'price', 'experience']));
        return ['message' => 'User updated.', 'user' => $this->userResource($user->fresh())];
    }

    public function deleteUser(string $role, int $id)
    {
        abort_unless(in_array($role, ['customer', 'worker'], true), 404);
        ($role === 'customer' ? Customer::class : Worker::class)::findOrFail($id)->delete();
        return ['message' => 'User deleted.'];
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:service_categories,name'],
            'description' => ['nullable', 'string'],
            'base_price' => ['required', 'numeric', 'min:99'],
        ]);
        $category = ServiceCategory::create($data + ['slug' => Str::slug($data['name'])]);
        return response()->json($category, 201);
    }

    public function updateCategory(Request $request, ServiceCategory $category)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', Rule::unique('service_categories', 'name')->ignore($category->id)],
            'description' => ['nullable', 'string'],
            'base_price' => ['required', 'numeric', 'min:99'],
            'active' => ['boolean'],
        ]);
        $category->update($data + ['slug' => Str::slug($data['name'])]);
        return $category;
    }

    public function deleteCategory(ServiceCategory $category)
    {
        abort_if($category->workers()->exists(), 422, 'Move workers before deleting this category.');
        $category->delete();
        return ['message' => 'Category deleted.'];
    }

    public function deleteReview(Request $request, Review $review)
    {
        if ($request->user() instanceof Customer) {
            abort_unless((int) $review->customer_id === (int) $request->user()->id, 403, 'You can only delete your own reviews.');
        }

        $review->delete();

        return ['message' => 'Review deleted.'];
    }

    public function resolveDispute(Request $request, Booking $booking)
    {
        $data = $request->validate(['dispute_note' => ['required', 'string', 'max:1000']]);
        $booking->update($data + ['status' => 'cancelled']);
        $this->notify($booking->customer, 'Dispute resolved', "Booking #{$booking->id} has been resolved by admin.", 'announcement');
        return ['message' => 'Dispute resolved.', 'booking' => $booking->fresh()];
    }

    private function authPayload($user, string $role, int $status = 200)
    {
        $user->tokens()->delete();
        $token = $user->createToken("{$role}-token", [$role])->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userResource($user->fresh(), $role),
        ], $status)->withHeaders($this->corsHeaders());
    }

    private function userResource($user, ?string $role = null): array
    {
        $role ??= match (true) {
            $user instanceof Admin => 'admin',
            $user instanceof Worker => 'worker',
            default => 'customer',
        };

        $data = $user->toArray();
        $data['role'] = $role;
        if ($user instanceof Worker) {
            $data['category'] = $user->category;
        }

        return $data;
    }

    private function corsHeaders(): array
    {
        return [
            'Access-Control-Allow-Origin' => $this->resolveAllowedOrigin(request()->header('Origin')),
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

    private function notify($user, string $title, string $message, string $type): void
    {
        AppNotification::create([
            'notifiable_type' => $user::class,
            'notifiable_id' => $user->id,
            'title' => $title,
            'message' => $message,
            'type' => $type,
        ]);
    }

    private function notificationQuery($user)
    {
        return AppNotification::query()
            ->where(function (Builder $query) use ($user) {
                $query->whereNull('notifiable_type')
                    ->orWhere(fn (Builder $inner) => $inner->where('notifiable_type', $user::class)->where('notifiable_id', $user->id));
            });
    }

    private function uniquePaymentCode(string $prefix): string
    {
        do {
            $code = $prefix.'-'.now()->format('Ymd').'-'.Str::upper(Str::random(8));
        } while (Payment::where('transaction_id', $code)->orWhere('payment_id', $code)->orWhere('invoice_number', $code)->exists());

        return $code;
    }

    private function authorizePaymentAccess(Request $request, Payment $payment): void
    {
        $user = $request->user();

        if ($user instanceof Admin) {
            return;
        }

        abort_unless($user instanceof Customer && (int) $payment->customer_id === (int) $user->id, 403);
    }
}
