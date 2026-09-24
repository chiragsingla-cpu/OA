<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_register_always_creates_an_employee_and_returns_a_token(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'New Person',
            'email' => 'new@example.com',
            'password' => 'secret-pass',
            'password_confirmation' => 'secret-pass',
            'role' => 'admin', // must be ignored
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.role', User::ROLE_EMPLOYEE)
            ->assertJsonStructure(['token']);
    }

    public function test_login_with_valid_credentials_returns_a_token_usable_on_me(): void
    {
        User::create(['name' => 'A', 'email' => 'a@example.com', 'password' => 'password', 'role' => 'employee']);

        $token = $this->postJson('/api/auth/login', ['email' => 'a@example.com', 'password' => 'password'])
            ->assertOk()
            ->json('token');

        $this->withToken($token)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'a@example.com');
    }

    public function test_login_with_wrong_password_fails(): void
    {
        User::create(['name' => 'A', 'email' => 'a@example.com', 'password' => 'password', 'role' => 'employee']);

        $this->postJson('/api/auth/login', ['email' => 'a@example.com', 'password' => 'wrong'])
            ->assertUnprocessable();
    }

    public function test_protected_routes_return_401_json_without_a_token(): void
    {
        $this->getJson('/api/auth/me')->assertUnauthorized();
        $this->get('/api/documents')->assertUnauthorized(); // no Accept header: still JSON, not a redirect
    }
}
