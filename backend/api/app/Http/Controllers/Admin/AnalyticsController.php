<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Document;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AnalyticsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $questions = Message::where('role', 'user');

        $byCategory = (clone $questions)->get(['category'])
            ->countBy(fn (Message $message) => $message->category ?? 'unanswered')
            ->sortDesc();

        $recent = (clone $questions)->orderBy('created_at', 'desc')->limit(20)->get();
        $names = User::whereIn('_id', $recent->pluck('user_id')->unique()->values()->all())
            ->get()
            ->mapWithKeys(fn (User $user) => [(string) $user->id => $user->name]);

        return response()->json([
            'totals' => [
                'questions' => (clone $questions)->count(),
                'conversations' => Conversation::count(),
                'documents' => Document::count(),
                'users' => User::count(),
            ],
            'questions_by_category' => $byCategory,
            'recent_questions' => $recent->map(fn (Message $message) => [
                'id' => (string) $message->id,
                'user' => $names[$message->user_id] ?? 'Deleted user',
                'content' => $message->content,
                'category' => $message->category,
                'created_at' => $message->created_at,
            ])->values(),
        ]);
    }
}
