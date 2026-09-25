<?php

return [

    // Filesystem disk for uploaded document files: "local" in development, "s3" in production.
    // The s3 disk reads AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION and AWS_BUCKET.
    'disk' => env('DOCUMENTS_DISK', 'local'),

];
