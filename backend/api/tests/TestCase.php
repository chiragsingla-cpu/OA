<?php

namespace Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $database = DB::connection('mongodb')->getDatabase();
        // Never wipe a real database, even if the environment is misconfigured.
        if (! str_ends_with($database->getDatabaseName(), '_test')) {
            $this->fail("Refusing to run tests against database '{$database->getDatabaseName()}' (name must end in _test).");
        }
        $database->drop();
        Http::preventStrayRequests();
    }

    protected function actingAsRole(string $role): User
    {
        $user = User::create([
            'name' => ucfirst($role).' Tester',
            'email' => $role.uniqid().'@example.com',
            'password' => 'password',
            'role' => $role,
        ]);

        Sanctum::actingAs($user);

        return $user;
    }
}
