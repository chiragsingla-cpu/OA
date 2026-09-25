<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\OnboardingProgressController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ChecklistController;
use App\Http\Controllers\DocumentController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::middleware('throttle:10,1')->group(function () {
        Route::post('register', [AuthController::class, 'register']);
        Route::post('login', [AuthController::class, 'login']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::middleware('auth:sanctum')->group(function () {
    // Onboarding content (filtered by role inside the controller).
    Route::get('documents', [DocumentController::class, 'index']);
    Route::get('documents/{document}', [DocumentController::class, 'show']);
    Route::get('documents/{document}/file', [DocumentController::class, 'file']);

    // The signed-in user's own checklist progress.
    Route::get('checklists/{document}/progress', [ChecklistController::class, 'show']);
    Route::put('checklists/{document}/progress', [ChecklistController::class, 'update']);

    // Assistant chat.
    Route::post('chat', [ChatController::class, 'store'])->middleware('throttle:chat');
    Route::get('conversations', [ChatController::class, 'conversations']);
    Route::get('conversations/{conversationId}/messages', [ChatController::class, 'messages']);

    Route::middleware('role:admin')->group(function () {
        Route::post('documents', [DocumentController::class, 'store']);
        Route::put('documents/{document}', [DocumentController::class, 'update']);
        Route::delete('documents/{document}', [DocumentController::class, 'destroy']);
        Route::post('documents/{document}/reindex', [DocumentController::class, 'reindex']);

        Route::get('admin/users', [UserController::class, 'index']);
        Route::post('admin/users', [UserController::class, 'store']);
        Route::put('admin/users/{user}', [UserController::class, 'update']);
        Route::delete('admin/users/{user}', [UserController::class, 'destroy']);

        Route::get('admin/analytics', AnalyticsController::class);
        Route::get('admin/onboarding-progress', OnboardingProgressController::class);
    });
});
