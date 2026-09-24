<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Message extends Model
{
    protected $connection = 'mongodb';

    protected $fillable = ['conversation_id', 'user_id', 'role', 'content', 'category', 'sources'];
}
