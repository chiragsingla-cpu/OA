<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChecklistProgress;
use App\Models\Document;
use App\Models\User;
use Illuminate\Http\JsonResponse;

/**
 * Every employee's progress on every employee-visible checklist.
 */
class OnboardingProgressController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checklists = Document::where('category', 'checklist')
            ->where('allowed_roles', User::ROLE_EMPLOYEE)
            ->orderBy('title')
            ->get();

        $employees = User::where('role', User::ROLE_EMPLOYEE)->orderBy('name')->get();

        $progressByUser = ChecklistProgress::whereIn('user_id', $employees->map(fn (User $u) => (string) $u->id)->all())
            ->get()
            ->groupBy('user_id');

        return response()->json([
            'checklists' => $checklists->map(fn (Document $document) => [
                'id' => (string) $document->id,
                'title' => $document->title,
                'items' => $document->checklistItems(),
            ])->values(),
            'employees' => $employees->map(fn (User $user) => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                // { document_id: [completed item indexes] }
                'completed' => (object) ($progressByUser[(string) $user->id] ?? collect())
                    ->mapWithKeys(fn (ChecklistProgress $p) => [$p->document_id => $p->completed ?? []])
                    ->all(),
            ])->values(),
        ]);
    }
}
