<?php

namespace App\Http\Controllers;

use App\Models\User;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        abort_unless(config('registration.enabled'), 403, 'Sign-up is closed. Ask an admin to create your account.');

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email', $this->allowedDomainRule()],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Self sign-up always creates an employee. Only an admin can promote a user.
        $user = User::create([
            ...$data,
            'email' => strtolower($data['email']),
            'role' => User::ROLE_EMPLOYEE,
        ]);

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('spa')->plainTextToken,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', strtolower($data['email']))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'The provided credentials are incorrect.',
            ]);
        }

        return response()->json([
            'user' => $user,
            'token' => $user->createToken('spa')->plainTextToken,
        ]);
    }

    public function logout(Request $request): Response
    {
        $request->user()->currentAccessToken()->delete();

        return response()->noContent();
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()]);
    }

    private function allowedDomainRule(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail) {
            $domains = config('registration.allowed_domains');
            $domain = strtolower((string) Str::after((string) $value, '@'));

            if ($domains !== [] && ! in_array($domain, $domains, true)) {
                $fail('Sign-up is limited to company email addresses.');
            }
        };
    }
}
