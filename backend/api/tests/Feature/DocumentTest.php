<?php

namespace Tests\Feature;

use App\Models\Document;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class DocumentTest extends TestCase
{
    public function test_employee_cannot_create_documents(): void
    {
        $this->actingAsRole('employee');

        $this->postJson('/api/documents', [
            'title' => 'X', 'category' => 'hr_policy', 'allowed_roles' => ['employee'], 'body_text' => 'text',
        ])->assertForbidden();
    }

    public function test_admin_creates_document_and_it_is_indexed_with_admin_role_added(): void
    {
        Http::fake(['ai-service.test/ingest' => Http::response(['document_id' => 'x', 'chunks' => 3, 'text' => 'text'])]);
        $this->actingAsRole('admin');

        $this->postJson('/api/documents', [
            'title' => 'Leave Policy', 'category' => 'hr_policy', 'allowed_roles' => ['employee'], 'body_text' => '24 days',
        ])
            ->assertCreated()
            ->assertJsonPath('document.status', Document::STATUS_INDEXED)
            ->assertJsonPath('document.chunk_count', 3)
            ->assertJsonPath('document.allowed_roles', ['employee', 'admin']);

        Http::assertSent(fn (Request $request) => $request->url() === 'http://ai-service.test/ingest'
            && $request->hasHeader('X-Internal-Key', 'test-key'));
    }

    public function test_failed_indexing_is_recorded_on_the_document(): void
    {
        Http::fake(['ai-service.test/ingest' => Http::response(['detail' => 'boom'], 500)]);
        $this->actingAsRole('admin');

        $this->postJson('/api/documents', [
            'title' => 'Handbook', 'category' => 'handbook', 'allowed_roles' => ['employee'], 'body_text' => 'text',
        ])
            ->assertCreated()
            ->assertJsonPath('document.status', Document::STATUS_FAILED)
            ->assertJsonPath('document.error', 'boom');
    }

    public function test_employee_only_sees_documents_shared_with_their_role(): void
    {
        $shared = Document::create(['title' => 'Handbook', 'category' => 'handbook', 'allowed_roles' => ['employee', 'admin'], 'body_text' => 'hi']);
        $adminOnly = Document::create(['title' => 'Salary Bands', 'category' => 'hr_policy', 'allowed_roles' => ['admin'], 'body_text' => 'secret']);
        $this->actingAsRole('employee');

        $this->getJson('/api/documents')
            ->assertOk()
            ->assertJsonCount(1, 'documents')
            ->assertJsonPath('documents.0.title', 'Handbook');

        $this->getJson("/api/documents/{$shared->id}")->assertOk();
        $this->getJson("/api/documents/{$adminOnly->id}")->assertNotFound();
    }
}
