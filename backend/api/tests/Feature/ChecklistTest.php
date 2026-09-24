<?php

namespace Tests\Feature;

use App\Models\Document;
use Tests\TestCase;

class ChecklistTest extends TestCase
{
    private function checklist(array $roles = ['employee', 'admin']): Document
    {
        return Document::create([
            'title' => 'Day 1',
            'category' => 'checklist',
            'allowed_roles' => $roles,
            'body_text' => "# Day 1\n- [ ] Get laptop\n- [ ] Set up MFA\nSome text\n- [ ] Meet buddy\n",
        ]);
    }

    public function test_employee_saves_and_reads_own_progress(): void
    {
        $document = $this->checklist();
        $this->actingAsRole('employee');

        $this->getJson("/api/checklists/{$document->id}/progress")
            ->assertOk()
            ->assertJson(['completed' => [], 'total' => 3]);

        $this->putJson("/api/checklists/{$document->id}/progress", ['completed' => [2, 0, 2]])
            ->assertOk()
            ->assertJson(['completed' => [0, 2]]);

        $this->getJson("/api/checklists/{$document->id}/progress")->assertJson(['completed' => [0, 2]]);
    }

    public function test_out_of_range_items_are_rejected(): void
    {
        $document = $this->checklist();
        $this->actingAsRole('employee');

        $this->putJson("/api/checklists/{$document->id}/progress", ['completed' => [3]])->assertUnprocessable();
    }

    public function test_hidden_or_non_checklist_documents_return_404(): void
    {
        $adminOnly = $this->checklist(['admin']);
        $policy = Document::create(['title' => 'Policy', 'category' => 'hr_policy', 'allowed_roles' => ['employee'], 'body_text' => '- [ ] x']);
        $this->actingAsRole('employee');

        $this->getJson("/api/checklists/{$adminOnly->id}/progress")->assertNotFound();
        $this->putJson("/api/checklists/{$policy->id}/progress", ['completed' => [0]])->assertNotFound();
    }

    public function test_admin_sees_each_employees_progress(): void
    {
        $document = $this->checklist();
        $employee = $this->actingAsRole('employee');
        $this->putJson("/api/checklists/{$document->id}/progress", ['completed' => [1]])->assertOk();

        $this->actingAsRole('admin');

        $this->getJson('/api/admin/onboarding-progress')
            ->assertOk()
            ->assertJsonPath('checklists.0.items', ['Get laptop', 'Set up MFA', 'Meet buddy'])
            ->assertJsonPath('employees.0.id', (string) $employee->id)
            ->assertJsonPath("employees.0.completed.{$document->id}", [1]);
    }
}
