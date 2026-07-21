<?php

use App\Http\Controllers\Api\TunaTunaController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [TunaTunaController::class, 'health']);
Route::get('/landing', [TunaTunaController::class, 'landing']);
Route::get('/categories', [TunaTunaController::class, 'categories']);
Route::get('/workers', [TunaTunaController::class, 'workers']);
Route::get('/workers/{worker}', [TunaTunaController::class, 'worker']);
Route::get('/reviews', [TunaTunaController::class, 'reviews']);

Route::post('/auth/customer/register', [TunaTunaController::class, 'registerCustomer']);
Route::post('/auth/worker/register', [TunaTunaController::class, 'registerWorker']);
Route::post('/auth/login', [TunaTunaController::class, 'login']);
Route::post('/auth/admin/login', [TunaTunaController::class, 'adminLogin']);
Route::post('/auth/forgot-password', [TunaTunaController::class, 'forgotPassword']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [TunaTunaController::class, 'me']);
    Route::put('/me', [TunaTunaController::class, 'updateMe']);
    Route::post('/me/password', [TunaTunaController::class, 'changePassword']);
    Route::post('/logout', [TunaTunaController::class, 'logout']);
    Route::get('/notifications', [TunaTunaController::class, 'notifications']);
    Route::post('/notifications/clear', [TunaTunaController::class, 'clearNotifications']);
    Route::patch('/notifications/{notification}/read', [TunaTunaController::class, 'readNotification']);

    Route::middleware('role:customer')->group(function () {
        Route::get('/customer/dashboard', [TunaTunaController::class, 'customerDashboard']);
        Route::get('/customer/reviews', [TunaTunaController::class, 'customerReviews']);
        Route::post('/bookings', [TunaTunaController::class, 'createBooking']);
        Route::post('/reviews', [TunaTunaController::class, 'createReview']);
        Route::patch('/reviews/{review}', [TunaTunaController::class, 'updateReview']);
        Route::delete('/reviews/{review}', [TunaTunaController::class, 'deleteReview']);
    });

    Route::middleware('role:worker')->group(function () {
        Route::get('/worker/dashboard', [TunaTunaController::class, 'workerDashboard']);
        Route::patch('/worker/availability', [TunaTunaController::class, 'updateAvailability']);
    });

    Route::get('/bookings', [TunaTunaController::class, 'bookings'])->middleware('role:customer,worker,admin');
    Route::patch('/bookings/{booking}/status', [TunaTunaController::class, 'updateBookingStatus'])->middleware('role:worker,admin');
    Route::get('/payments', [TunaTunaController::class, 'payments'])->middleware('role:customer,admin');
    Route::get('/payments/{payment}', [TunaTunaController::class, 'payment'])->middleware('role:customer,admin');
    Route::get('/payments/{payment}/invoice', [TunaTunaController::class, 'invoice'])->middleware('role:customer,admin');

    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('/dashboard', [TunaTunaController::class, 'adminDashboard']);
        Route::get('/analytics', [TunaTunaController::class, 'analytics']);
        Route::get('/payment-analytics', [TunaTunaController::class, 'paymentAnalytics']);
        Route::patch('/payments/{payment}', [TunaTunaController::class, 'updatePaymentStatus']);
        Route::get('/customers', [TunaTunaController::class, 'adminCustomers']);
        Route::get('/customers/{customer}', [TunaTunaController::class, 'showCustomer']);
        Route::put('/customers/{customer}', [TunaTunaController::class, 'updateCustomer']);
        Route::patch('/customers/{customer}/status', [TunaTunaController::class, 'toggleCustomerStatus']);
        Route::delete('/customers/{customer}', [TunaTunaController::class, 'deleteCustomer']);
        Route::get('/workers', [TunaTunaController::class, 'adminWorkers']);
        Route::patch('/workers/{worker}/verify', [TunaTunaController::class, 'verifyWorker']);
        Route::patch('/workers/{worker}/reject', [TunaTunaController::class, 'rejectWorker']);
        Route::put('/users/{role}/{id}', [TunaTunaController::class, 'updateUser']);
        Route::delete('/users/{role}/{id}', [TunaTunaController::class, 'deleteUser']);
        Route::get('/categories', [TunaTunaController::class, 'adminCategories']);
        Route::post('/categories', [TunaTunaController::class, 'storeCategory']);
        Route::put('/categories/{category}', [TunaTunaController::class, 'updateCategory']);
        Route::delete('/categories/{category}', [TunaTunaController::class, 'deleteCategory']);
        Route::delete('/reviews/{review}', [TunaTunaController::class, 'deleteReview']);
        Route::patch('/bookings/{booking}/dispute', [TunaTunaController::class, 'resolveDispute']);
    });
});
