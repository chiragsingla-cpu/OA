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

    public function test_register_is_refused_when_sign_up_is_disabled(): void
    {
        config(['registration.enabled' => false]);

        $this->postJson('/api/auth/register', $this->signUp('new@example.com'))->assertForbidden();
        $this->assertSame(0, User::count());
    }

    public function test_register_only_accepts_allowed_email_domains(): void
    {
        config(['registration.allowed_domains' => ['company.com']]);

        $this->postJson('/api/auth/register', $this->signUp('new@gmail.com'))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
        $this->postJson('/api/auth/register', $this->signUp('new@Company.com'))->assertCreated();
    }

    public function test_tokens_expire(): void
    {
        User::create(['name' => 'A', 'email' => 'a@example.com', 'password' => 'password', 'role' => 'employee']);
        $token = $this->postJson('/api/auth/login', ['email' => 'a@example.com', 'password' => 'password'])->json('token');

        $this->travel(config('sanctum.expiration') + 1)->minutes();

        $this->withToken($token)->getJson('/api/auth/me')->assertUnauthorized();
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

    private function signUp(string $email): array
    {
        return ['name' => 'New Person', 'email' => $email, 'password' => 'secret-pass', 'password_confirmation' => 'secret-pass'];
    }
}
