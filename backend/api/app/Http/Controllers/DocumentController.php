<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\User;
use App\Services\AiServiceException;
use App\Services\DocumentIndexer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    private const FILE_TYPES = [
        'pdf' => 'application/pdf',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'txt' => 'text/plain; charset=utf-8',
        'md' => 'text/markdown; charset=utf-8',
    ];

    public function __construct(private readonly DocumentIndexer $indexer)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Document::query()->orderBy('category')->orderBy('title');
        if (! $user->isAdmin()) {
            $query->where('allowed_roles', $user->role); // matches any element of the array
        }

        return response()->json(['documents' => $query->get()->makeHidden('body_text')]);
    }

    public function show(Request $request, Document $document): JsonResponse
    {
        abort_unless($document->isVisibleTo($request->user()), 404);

        return response()->json(['document' => $document]);
    }

    /**
     * Streams the original uploaded file through the API, so the storage bucket stays private.
     */
    public function file(Request $request, Document $document): StreamedResponse
    {
        abort_unless($document->isVisibleTo($request->user()), 404);

        $disk = DocumentIndexer::disk();
        abort_unless($document->stored_path && $disk->exists($document->stored_path), 404);

        $extension = strtolower(pathinfo($document->stored_path, PATHINFO_EXTENSION));

        return $disk->response($document->stored_path, $document->original_filename, [
            'Content-Type' => self::FILE_TYPES[$extension] ?? 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
        ], 'inline');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules(creating: true));

        $document = Document::create([
            'title' => $data['title'],
            'category' => $data['category'],
            'body_text' => $data['body_text'] ?? null,
            'allowed_roles' => $this->withAdmin($data['allowed_roles']),
            'status' => Document::STATUS_PENDING,
            'uploaded_by' => (string) $request->user()->id,
        ]);

        $document = $this->indexer->index($document, $request->file('file'));

        return response()->json(['document' => $document], 201);
    }

    public function update(Request $request, Document $document): JsonResponse
    {
        $data = $request->validate($this->rules(creating: false));

        if (isset($data['allowed_roles'])) {
            $data['allowed_roles'] = $this->withAdmin($data['allowed_roles']);
        }
        if (isset($data['body_text'])) {
            // Typed text replaces any previously uploaded file as the document's source.
            $document->stored_path = null;
            $document->original_filename = null;
        }

        $document->fill(collect($data)->except('file')->all());
        $document->status = Document::STATUS_PENDING;
        $document->save();

        // Chunks carry title, category and roles, so any change requires re-indexing.
        $document = $this->indexer->index($document, $request->file('file'));

        return response()->json(['document' => $document]);
    }

    public function destroy(Document $document): Response|JsonResponse
    {
        try {
            $this->indexer->remove($document);
        } catch (AiServiceException $e) {
            report($e);

            return response()->json([
                'message' => 'Could not remove the document from the AI index. Please try again.',
            ], 503);
        }

        $document->delete();

        return response()->noContent();
    }

    public function reindex(Document $document): JsonResponse
    {
        return response()->json(['document' => $this->indexer->index($document)]);
    }

    private function rules(bool $creating): array
    {
        $required = $creating ? 'required' : 'sometimes';

        return [
            'title' => [$required, 'string', 'max:200'],
            'category' => [$required, Rule::in(Document::CATEGORIES)],
            'allowed_roles' => [$required, 'array', 'min:1'],
            'allowed_roles.*' => [Rule::in(User::ROLES)],
            'file' => ['nullable', 'file', 'extensions:pdf,docx,txt,md', 'max:10240'],
            'body_text' => [$creating ? 'required_without:file' : 'sometimes', 'nullable', 'string', 'max:200000'],
        ];
    }

    /**
     * Admins can always see and query every document.
     */
    private function withAdmin(array $roles): array
    {
        return array_values(array_unique([...$roles, User::ROLE_ADMIN]));
    }
}
