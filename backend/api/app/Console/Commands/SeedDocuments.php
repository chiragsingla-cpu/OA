<?php

namespace App\Console\Commands;

use App\Models\Document;
use App\Models\User;
use App\Services\DocumentIndexer;
use Illuminate\Console\Command;

/**
 * Loads backend/sample-docs (described by manifest.json) and indexes each document in the AI service.
 * Safe to re-run: documents are matched by title and re-indexed.
 */
class SeedDocuments extends Command
{
    protected $signature = 'app:seed-docs {--path= : Folder containing manifest.json}';

    protected $description = 'Create sample onboarding documents and index them in the AI service';

    public function handle(DocumentIndexer $indexer): int
    {
        $path = rtrim($this->option('path') ?: config('services.sample_docs_path'), '/\\');
        $manifestPath = $path.DIRECTORY_SEPARATOR.'manifest.json';

        if (! is_file($manifestPath)) {
            $this->error("No manifest.json found in {$path}");

            return self::FAILURE;
        }

        $admin = User::where('role', User::ROLE_ADMIN)->first();
        $rows = [];

        foreach (json_decode(file_get_contents($manifestPath), true) as $entry) {
            $document = Document::updateOrCreate(
                ['title' => $entry['title']],
                [
                    'category' => $entry['category'],
                    'body_text' => file_get_contents($path.DIRECTORY_SEPARATOR.$entry['file']),
                    'allowed_roles' => array_values(array_unique([...$entry['allowed_roles'], User::ROLE_ADMIN])),
                    'status' => Document::STATUS_PENDING,
                    'uploaded_by' => $admin ? (string) $admin->id : null,
                ],
            );

            $document = $indexer->index($document);
            $rows[] = [$document->title, implode(', ', $document->allowed_roles), $document->status, $document->error ?? ''];
        }

        $this->table(['Title', 'Roles', 'Status', 'Error'], $rows);

        return collect($rows)->contains(fn ($row) => $row[2] !== Document::STATUS_INDEXED)
            ? self::FAILURE
            : self::SUCCESS;
    }
}
