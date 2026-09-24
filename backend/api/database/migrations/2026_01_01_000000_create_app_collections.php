<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;
use MongoDB\Laravel\Schema\Blueprint;

/**
 * MongoDB is schemaless; this only creates the collections and their indexes.
 * The doc_chunks collection and its vector index are owned by the AI service.
 */
return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        Schema::create('users', function (Blueprint $collection) {
            $collection->unique('email');
        });

        Schema::create('personal_access_tokens', function (Blueprint $collection) {
            $collection->unique('token');
            $collection->index('tokenable_id');
        });

        Schema::create('documents', function (Blueprint $collection) {
            $collection->index('allowed_roles');
            $collection->index('category');
        });

        Schema::create('conversations', function (Blueprint $collection) {
            $collection->index('user_id');
        });

        Schema::create('messages', function (Blueprint $collection) {
            $collection->index('conversation_id');
            $collection->index('role');
        });
    }

    public function down(): void
    {
        foreach (['messages', 'conversations', 'documents', 'personal_access_tokens', 'users'] as $collection) {
            Schema::dropIfExists($collection);
        }
    }
};
