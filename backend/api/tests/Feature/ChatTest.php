<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChatTest extends TestCase
{
    private function fakeAi(): void
    {
        Http::fake(['ai-service.test/chat' => Http::response([
            'answer' => 'You get 24 days. (Source: Leave Policy)',
            'category' => 'general_docs',
            'sources' => [['document_id' => 'doc1', 'title' => 'Leave Policy']],
        ])]);
    }

    public function test_chat_forwards_the_authenticated_users_role_not_the_request_body(): void
    {
        $this->fakeAi();
        $this->actingAsRole('employee');

        $this->postJson('/api/chat', ['message' => 'How many leave days?', 'role' => 'admin'])
            ->assertOk()
            ->assertJsonPath('message.content', 'You get 24 days. (Source: Leave Policy)')
            ->assertJsonPath('message.sources.0.title', 'Leave Policy');

        Http::assertSent(fn (Request $request) => $request['role'] === 'employee'
            && $request['question'] === 'How many leave days?');
    }

    public function test_follow_up_sends_previous_messages_as_history(): void
    {
        $this->fakeAi();
        $this->actingAsRole('employee');

        $conversationId = $this->postJson('/api/chat', ['message' => 'How many leave days?'])->json('conversation.id');
        $this->postJson('/api/chat', ['message' => 'Can I carry them over?', 'conversation_id' => $conversationId])->assertOk();

        Http::assertSent(fn (Request $request) => $request['question'] === 'Can I carry them over?'
            && count($request['history']) === 2
            && $request['history'][0] === ['role' => 'user', 'content' => 'How many leave days?']);

        $this->assertSame(4, Message::where('conversation_id', $conversationId)->count());
    }

    public function test_users_cannot_access_other_users_conversations(): void
    {
        $conversation = Conversation::create(['user_id' => 'someone-else', 'title' => 'Private']);
        $this->actingAsRole('employee');

        $this->getJson("/api/conversations/{$conversation->id}/messages")->assertNotFound();
        $this->postJson('/api/chat', ['message' => 'hi', 'conversation_id' => (string) $conversation->id])->assertNotFound();
    }

    public function test_ai_outage_returns_503_and_keeps_the_question(): void
    {
        Http::fake(['ai-service.test/chat' => Http::response(['detail' => 'down'], 503)]);
        $this->actingAsRole('employee');

        $this->postJson('/api/chat', ['message' => 'Hello?'])->assertStatus(503);

        $this->assertSame(1, Message::count());
    }

    public function test_chat_is_rate_limited_per_user(): void
    {
        config(['services.ai.chat_per_minute' => 2]);
        $this->fakeAi();
        $this->actingAsRole('employee');

        $this->postJson('/api/chat', ['message' => 'One'])->assertOk();
        $this->postJson('/api/chat', ['message' => 'Two'])->assertOk();
        $this->postJson('/api/chat', ['message' => 'Three'])->assertTooManyRequests();
    }
}
