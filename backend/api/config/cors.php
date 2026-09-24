<?php

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter(explode(',', env('FRONTEND_URL', 'http://localhost:5173'))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Bearer tokens, not cookies, so credentials are not needed.
    'supports_credentials' => false,

];
