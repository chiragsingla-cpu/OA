<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        Schema::create('checklist_progress', function (Blueprint $collection) {
            $collection->unique(['user_id', 'document_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checklist_progress');
    }
};
