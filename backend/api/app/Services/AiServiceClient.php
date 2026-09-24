<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * HTTP client for the Python AI service. Laravel is the only caller, so the browser never talks to it directly.
 */
class AiServiceClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly string $internalKey,
        private readonly int $timeout,
        private readonly int $ingestTimeout,
    ) {
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $history
     * @return array{answer: string, category: string, sources: array<int, array{document_id: string, title: string}>}
     */
    public function chat(string $question, string $role, array $history): array
    {
        return $this->send(fn () => $this->http()->post('/chat', [
            'question' => $question,
            'role' => $role,
            'history' => $history,
        ]));
    }

    /**
     * Send a document to be chunked, embedded and stored.
     *
     * @return array{document_id: string, chunks: int, text: string}
     */
    public function ingest(Document $document, ?string $filePath = null): array
    {
        $request = $this->http()->timeout($this->ingestTimeout)->asMultipart();

        $fields = [
            'document_id' => (string) $document->id,
            'title' => $document->title,
            'category' => $document->category,
            'allowed_roles' => implode(',', $document->allowed_roles ?? []),
        ];

        if ($filePath !== null) {
            $request = $request->attach(
                'file',
                file_get_contents($filePath),
                $document->original_filename ?? basename($filePath),
            );
        } else {
            $fields['text'] = (string) $document->body_text;
        }

        return $this->send(fn () => $request->post('/ingest', $fields));
    }

    public function deleteDocument(string $documentId): void
    {
        $this->send(fn () => $this->http()->delete('/documents/'.rawurlencode($documentId)));
    }

    private function http(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->withHeaders(['X-Internal-Key' => $this->internalKey])
            ->acceptJson()
            ->timeout($this->timeout);
    }

    /**
     * @param  callable(): Response  $request
     */
    private function send(callable $request): array
    {
        try {
            $response = $request();
        } catch (ConnectionException $e) {
            throw new AiServiceException('The AI service is unreachable.', 0, $e);
        }

        if ($response->failed()) {
            $detail = $response->json('detail');
            $message = is_string($detail) ? $detail : 'The AI service returned an error.';

            throw new AiServiceException($message, $response->status());
        }

        return $response->json() ?? [];
    }
}
