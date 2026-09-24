<?php

namespace App\Http\Controllers;

use App\Models\ChecklistProgress;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The signed-in user's own progress on a checklist document.
 */
class ChecklistController extends Controller
{
    public function show(Request $request, Document $document): JsonResponse
    {
        $this->ensureChecklistVisible($request, $document);
        $total = count($document->checklistItems());

        $progress = $this->progressQuery($request, $document)->first();
        // Ignore indexes that no longer exist if the checklist text was edited.
        $completed = array_values(array_filter($progress?->completed ?? [], fn (int $i) => $i < $total));

        return response()->json(['completed' => $completed, 'total' => $total]);
    }

    public function update(Request $request, Document $document): JsonResponse
    {
        $this->ensureChecklistVisible($request, $document);
        $total = count($document->checklistItems());

        $data = $request->validate([
            'completed' => ['present', 'array'],
            'completed.*' => ['integer', 'min:0', 'max:'.max(0, $total - 1)],
        ]);

        $completed = array_values(array_unique(array_map('intval', $data['completed'])));
        sort($completed);

        ChecklistProgress::updateOrCreate(
            ['user_id' => (string) $request->user()->id, 'document_id' => (string) $document->id],
            ['completed' => $completed],
        );

        return response()->json(['completed' => $completed, 'total' => $total]);
    }

    private function ensureChecklistVisible(Request $request, Document $document): void
    {
        abort_unless($document->category === 'checklist' && $document->isVisibleTo($request->user()), 404);
    }

    private function progressQuery(Request $request, Document $document)
    {
        return ChecklistProgress::where('user_id', (string) $request->user()->id)
            ->where('document_id', (string) $document->id);
    }
}
