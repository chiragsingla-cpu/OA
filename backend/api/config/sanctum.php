<?php

// Only the keys changed from Sanctum's defaults; the package merges in the rest.
return [

    // Minutes an API token stays valid. Defaults to 7 days; null never expires.
    'expiration' => ($minutes = env('SANCTUM_TOKEN_EXPIRATION', 60 * 24 * 7)) ? (int) $minutes : null,

];
