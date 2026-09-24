<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Services\AiServiceClient;
use App\Services\AiServiceException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function store(Request $request, AiServiceClient $ai): JsonResponse
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'conversation_id' => ['nullable', 'string'],
        ]);
        $user = $request->user();

        $conversation = isset($data['conversation_id'])
            ? $this->ownedConversation($request, $data['conversation_id'])
            : Conversation::create(['user_id' => (string) $user->id, 'title' => Str::limit($data['message'], 60)]);

        $history = Message::where('conversation_id', (string) $conversation->id)
            ->orderBy('created_at', 'desc')
            ->orderBy('_id', 'desc') // tie-breaker for messages saved in the same millisecond
            ->limit(config('services.ai.history_limit'))
            ->get()
            ->reverse()
            ->map(fn (Message $message) => ['role' => $message->role, 'content' => $message->content])
            ->values()
            ->all();

        $question = Message::create([
            'conversation_id' => (string) $conversation->id,
            'user_id' => (string) $user->id,
            'role' => 'user',
            'content' => $data['message'],
        ]);

        try {
            // The role always comes from the authenticated user, never from the request body.
            $result = $ai->chat($data['message'], $user->role, $history);
        } catch (AiServiceException $e) {
            report($e);

            return response()->json([
                'message' => 'The assistant is temporarily unavailable. Please try again in a moment.',
                'conversation' => $conversation,
            ], 503);
        }

        $question->update(['category' => $result['category']]);

        $answer = Message::create([
            'conversation_id' => (string) $conversation->id,
            'user_id' => (string) $user->id,
            'role' => 'assistant',
            'content' => $result['answer'],
            'category' => $result['category'],
            'sources' => $result['sources'] ?? [],
        ]);

        $conversation->touch();

        return response()->json(['conversation' => $conversation, 'message' => $answer]);
    }

    public function conversations(Request $request): JsonResponse
    {
        $conversations = Conversation::where('user_id', (string) $request->user()->id)
            ->orderBy('updated_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json(['conversations' => $conversations]);
    }

    public function messages(Request $request, string $conversationId): JsonResponse
    {
        $conversation = $this->ownedConversation($request, $conversationId);

        $messages = Message::where('conversation_id', (string) $conversation->id)
            ->orderBy('created_at')
            ->orderBy('_id')
            ->get();

        return response()->json(['conversation' => $conversation, 'messages' => $messages]);
    }

    private function ownedConversation(Request $request, string $conversationId): Conversation
    {
        return Conversation::where('user_id', (string) $request->user()->id)->findOrFail($conversationId);
    }
}
