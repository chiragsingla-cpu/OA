<?php

// Merged over Laravel's default database config; only the MongoDB parts are defined here.
return [

    'default' => env('DB_CONNECTION', 'mongodb'),

    'connections' => [
        'mongodb' => [
            'driver' => 'mongodb',
            'dsn' => env('MONGODB_URI', 'mongodb://localhost:27017/?directConnection=true'),
            'database' => env('MONGODB_DB', 'onboarding_assistant'),
        ],
    ],

    'migrations' => [
        'table' => 'migrations',
        'update_date_on_publish' => true,
    ],

];
