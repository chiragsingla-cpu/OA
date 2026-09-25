<?php

return [

    // Self sign-up on /api/auth/register. Turn off to let only admins create accounts.
    'enabled' => filter_var(env('REGISTRATION_ENABLED', true), FILTER_VALIDATE_BOOL),

    // Comma-separated email domains allowed to self sign-up (e.g. "company.com,company.in"). Empty allows any.
    'allowed_domains' => array_values(array_filter(array_map(
        fn (string $domain) => strtolower(trim($domain)),
        explode(',', (string) env('REGISTRATION_ALLOWED_DOMAINS', '')),
    ))),

];
