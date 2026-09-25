<?php

return [

    'ai' => [
        'url' => env('AI_SERVICE_URL', 'http://localhost:8001'),
        'key' => env('AI_INTERNAL_KEY', ''),
        'timeout' => (int) env('AI_SERVICE_TIMEOUT', 60),
        'ingest_timeout' => (int) env('AI_SERVICE_INGEST_TIMEOUT', 180),
        // Number of earlier chat messages sent to the AI service for follow-up context.
        'history_limit' => 6,
        // Chat questions each user may ask per minute. Every question costs Claude tokens.
        'chat_per_minute' => (int) env('CHAT_RATE_LIMIT_PER_MINUTE', 20),
    ],

    'sample_docs_path' => env('SAMPLE_DOCS_PATH', base_path('../sample-docs')),

];
