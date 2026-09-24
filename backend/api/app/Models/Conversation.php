<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Conversation extends Model
{
    protected $connection = 'mongodb';

    protected $fillable = ['user_id', 'title'];
}
