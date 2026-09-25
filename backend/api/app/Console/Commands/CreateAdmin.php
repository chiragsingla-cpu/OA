<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

/**
 * Creates (or promotes) an admin account for a fresh deployment, in place of the demo seeder's
 * well-known passwords. Prints a random password when none is given.
 */
class CreateAdmin extends Command
{
    protected $signature = 'app:create-admin {email} {--name=Admin} {--password= : At least 12 characters; random if omitted}';

    protected $description = 'Create or promote an admin user';

    public function handle(): int
    {
        $email = strtolower($this->argument('email'));
        $password = $this->option('password') ?: Str::password(20, symbols: false);

        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 12) {
            $this->error('Give a valid email and a password of at least 12 characters.');

            return self::FAILURE;
        }

        User::updateOrCreate(
            ['email' => $email],
            ['name' => $this->option('name'), 'password' => $password, 'role' => User::ROLE_ADMIN],
        );

        $this->info("Admin ready: {$email}");
        if (! $this->option('password')) {
            $this->line("Password: {$password}  (shown once; it can be changed later in the Users tab)");
        }

        return self::SUCCESS;
    }
}
