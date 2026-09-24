<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

/**
 * Onboarding / knowledge-base document. Its searchable chunks live in the AI service's doc_chunks collection.
 *
 * @property string $title
 * @property string $category
 * @property string|null $body_text
 * @property array $allowed_roles
 * @property string $status
 */
class Document extends Model
{
    public const CATEGORIES = ['hr_policy', 'brd', 'checklist', 'handbook'];

    public const STATUS_PENDING = 'pending';
    public const STATUS_INDEXED = 'indexed';
    public const STATUS_FAILED = 'failed';

    protected $connection = 'mongodb';

    protected $fillable = [
        'title',
        'category',
        'body_text',
        'original_filename',
        'stored_path',
        'allowed_roles',
        'status',
        'chunk_count',
        'error',
        'uploaded_by',
    ];

    protected $hidden = ['stored_path'];

    public function isVisibleTo(User $user): bool
    {
        return $user->isAdmin() || in_array($user->role, $this->allowed_roles ?? [], true);
    }

    /**
     * Labels of the "- [ ] item" lines, in order. Their index is how progress is stored.
     * Must match the parsing in the frontend's Checklist component.
     *
     * @return array<int, string>
     */
    public function checklistItems(): array
    {
        preg_match_all('/^\s*[-*]\s\[[ xX]\]\s+(.+)$/m', (string) $this->body_text, $matches);

        return array_map('trim', $matches[1]);
    }
}
