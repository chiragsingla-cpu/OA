<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use App\Services\AiServiceClient;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AiServiceClient::class, fn () => new AiServiceClient(
            baseUrl: config('services.ai.url'),
            internalKey: (string) config('services.ai.key'),
            timeout: config('services.ai.timeout'),
            ingestTimeout: config('services.ai.ingest_timeout'),
        ));
    }

    public function boot(): void
    {
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        RateLimiter::for('chat', fn (Request $request) => Limit::perMinute(config('services.ai.chat_per_minute'))
            ->by((string) $request->user()?->id ?: $request->ip()));
    }
}
