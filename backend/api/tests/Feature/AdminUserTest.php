<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    public function test_employee_cannot_manage_users(): void
    {
        $this->actingAsRole('employee');

        $this->getJson('/api/admin/users')->assertForbidden();
        $this->postJson('/api/admin/users', [])->assertForbidden();
    }

    public function test_admin_creates_user_with_chosen_role(): void
    {
        $this->actingAsRole('admin');

        $this->postJson('/api/admin/users', [
            'name' => 'New Admin', 'email' => 'New.Admin@Example.com', 'password' => 'secret-pass', 'role' => 'admin',
        ])
            ->assertCreated()
            ->assertJsonPath('user.email', 'new.admin@example.com')
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonMissingPath('user.password');
    }

    public function test_create_rejects_duplicate_email(): void
    {
        $this->actingAsRole('admin');
        User::create(['name' => 'A', 'email' => 'a@example.com', 'password' => 'password', 'role' => 'employee']);

        $this->postJson('/api/admin/users', [
            'name' => 'B', 'email' => 'a@example.com', 'password' => 'secret-pass', 'role' => 'employee',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_update_keeps_password_when_blank_and_allows_same_email(): void
    {
        $this->actingAsRole('admin');
        $user = User::create(['name' => 'A', 'email' => 'a@example.com', 'password' => 'password', 'role' => 'employee']);

        $this->putJson("/api/admin/users/{$user->id}", [
            'name' => 'Renamed', 'email' => 'a@example.com', 'password' => '', 'role' => 'admin',
        ])
            ->assertOk()
            ->assertJsonPath('user.name', 'Renamed')
            ->assertJsonPath('user.role', 'admin');

        $this->assertTrue(Hash::check('password', $user->fresh()->password));
    }

    public function test_update_can_reset_password(): void
    {
        $this->actingAsRole('admin');
        $user = User::create(['name' => 'A', 'email' => 'a@example.com', 'password' => 'password', 'role' => 'employee']);

        $this->putJson("/api/admin/users/{$user->id}", ['password' => 'brand-new-pass'])->assertOk();

        $this->assertTrue(Hash::check('brand-new-pass', $user->fresh()->password));
    }

    public function test_admin_cannot_demote_or_delete_themselves(): void
    {
        $admin = $this->actingAsRole('admin');

        $this->putJson("/api/admin/users/{$admin->id}", ['role' => 'employee'])->assertUnprocessable();
        $this->deleteJson("/api/admin/users/{$admin->id}")->assertUnprocessable();
    }

    public function test_delete_removes_user_and_their_tokens(): void
    {
        $this->actingAsRole('admin');
        $user = User::create(['name' => 'A', 'email' => 'a@example.com', 'password' => 'password', 'role' => 'employee']);
        $user->createToken('spa');

        $this->deleteJson("/api/admin/users/{$user->id}")->assertNoContent();

        $this->assertNull(User::find($user->id));
        $this->assertSame(0, $user->tokens()->count());
    }
}
