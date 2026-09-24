<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

/**
 * Which items of a checklist document a user has ticked (`completed` holds item indexes).
 */
class ChecklistProgress extends Model
{
    protected $connection = 'mongodb';

    protected $table = 'checklist_progress';

    protected $fillable = ['user_id', 'document_id', 'completed'];
}
