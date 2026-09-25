<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Keeps a Document and its AI search index in sync, and records the outcome on the document's status.
 */
class DocumentIndexer
{
    public function __construct(private readonly AiServiceClient $ai)
    {
    }

    /**
     * Index the document. A new upload replaces the stored file. Without one, the stored file is re-sent,
     * or the document's text is used when there is no file.
     */
    public function index(Document $document, ?UploadedFile $upload = null): Document
    {
        if ($upload !== null) {
            $this->storeUpload($document, $upload);
        }

        $fileContents = $document->stored_path && $this->disk()->exists($document->stored_path)
            ? $this->disk()->get($document->stored_path)
            : null;

        try {
            $result = $this->ai->ingest($document, $fileContents);

            $document->fill([
                'status' => Document::STATUS_INDEXED,
                'chunk_count' => $result['chunks'] ?? 0,
                'error' => null,
            ]);

            if ($fileContents !== null) {
                // Keep the extracted text so the onboarding view can display uploaded files.
                $document->body_text = $result['text'] ?? '';
            }
        } catch (AiServiceException $e) {
            report($e);
            $document->fill(['status' => Document::STATUS_FAILED, 'error' => $e->getMessage()]);
        }

        $document->save();

        return $document;
    }

    public function remove(Document $document): void
    {
        $this->ai->deleteDocument((string) $document->id);

        if ($document->stored_path) {
            $this->disk()->delete($document->stored_path);
        }
    }

    public static function disk(): FilesystemAdapter
    {
        return Storage::disk(config('documents.disk'));
    }

    private function storeUpload(Document $document, UploadedFile $upload): void
    {
        if ($document->stored_path) {
            $this->disk()->delete($document->stored_path);
        }

        $extension = strtolower($upload->getClientOriginalExtension());

        $document->original_filename = $upload->getClientOriginalName();
        $document->stored_path = $upload->storeAs('documents', $document->id.'.'.$extension, config('documents.disk'));
        $document->save();
    }
}
