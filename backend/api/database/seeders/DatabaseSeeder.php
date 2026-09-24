<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Demo accounts. Change these passwords for anything other than a local demo.
     */
    public function run(): void
    {
        $accounts = [
            ['name' => 'Admin User', 'email' => 'admin@example.com', 'role' => User::ROLE_ADMIN],
            ['name' => 'Employee User', 'email' => 'employee@example.com', 'role' => User::ROLE_EMPLOYEE],
        ];

        foreach ($accounts as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [...$account, 'password' => 'password'],
            );
        }

        $this->command?->info('Demo users: admin@example.com / employee@example.com (password: "password")');
    }
}
