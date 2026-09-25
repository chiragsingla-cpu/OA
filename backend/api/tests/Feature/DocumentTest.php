<?php

namespace Tests\Feature;

use App\Models\Document;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
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

    public function test_uploaded_file_is_stored_on_the_configured_disk_and_viewable_by_allowed_roles(): void
    {
        config(['documents.disk' => 's3']);
        Storage::fake('s3');
        Http::fake(['ai-service.test/ingest' => Http::response(['document_id' => 'x', 'chunks' => 1, 'text' => 'Guide'])]);
        $this->actingAsRole('admin');

        $id = $this->post('/api/documents', [
            'title' => 'Guide', 'category' => 'handbook', 'allowed_roles' => ['employee'],
            'file' => UploadedFile::fake()->createWithContent('guide.pdf', '%PDF-1.4 guide'),
        ], ['Accept' => 'application/json'])
            ->assertCreated()
            ->assertJsonPath('document.has_file', true)
            ->assertJsonMissingPath('document.stored_path')
            ->json('document.id');

        Storage::disk('s3')->assertExists("documents/{$id}.pdf");
        Http::assertSent(fn (Request $request) => $request->isMultipart()
            && collect($request->data())->contains(fn ($part) => $part['name'] === 'file' && $part['contents'] === '%PDF-1.4 guide'));

        $this->actingAsRole('employee');
        $response = $this->get("/api/documents/{$id}/file")->assertOk()->assertHeader('Content-Type', 'application/pdf');
        $this->assertSame('%PDF-1.4 guide', $response->streamedContent());
    }

    public function test_file_endpoint_hides_files_from_other_roles_and_documents_without_a_file(): void
    {
        config(['documents.disk' => 's3']);
        Storage::fake('s3')->put('documents/secret.pdf', '%PDF secret');
        $adminOnly = Document::create(['title' => 'Salary', 'category' => 'hr_policy', 'allowed_roles' => ['admin'], 'stored_path' => 'documents/secret.pdf']);
        $textOnly = Document::create(['title' => 'Handbook', 'category' => 'handbook', 'allowed_roles' => ['employee'], 'body_text' => 'hi']);
        $this->actingAsRole('employee');

        $this->get("/api/documents/{$adminOnly->id}/file")->assertNotFound();
        $this->get("/api/documents/{$textOnly->id}/file")->assertNotFound();
    }

    public function test_deleting_a_document_removes_its_file(): void
    {
        config(['documents.disk' => 's3']);
        Storage::fake('s3')->put('documents/old.pdf', '%PDF old');
        Http::fake(['ai-service.test/documents/*' => Http::response(['deleted_chunks' => 1])]);
        $document = Document::create(['title' => 'Old', 'category' => 'handbook', 'allowed_roles' => ['employee', 'admin'], 'stored_path' => 'documents/old.pdf']);
        $this->actingAsRole('admin');

        $this->deleteJson("/api/documents/{$document->id}")->assertNoContent();

        Storage::disk('s3')->assertMissing('documents/old.pdf');
    }
}
