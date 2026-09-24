<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChecklistProgress;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['users' => User::orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(User::ROLES)],
        ]);

        $user = User::create([...$data, 'email' => strtolower($data['email'])]);

        return response()->json(['user' => $user], 201);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => ['sometimes', 'required', 'email', 'max:255', Rule::unique('users', 'email')->ignore((string) $user->id, '_id')],
            'password' => ['nullable', 'string', 'min:8'], // empty = keep the current password
            'role' => ['sometimes', 'required', Rule::in(User::ROLES)],
        ]);

        if ($this->isSelf($request, $user) && isset($data['role']) && $data['role'] !== User::ROLE_ADMIN) {
            abort(422, 'You cannot remove your own admin role.');
        }

        if (empty($data['password'])) {
            unset($data['password']);
        }
        if (isset($data['email'])) {
            $data['email'] = strtolower($data['email']);
        }

        $user->update($data);

        return response()->json(['user' => $user]);
    }

    public function destroy(Request $request, User $user): Response
    {
        if ($this->isSelf($request, $user)) {
            abort(422, 'You cannot delete your own account.');
        }

        // Sign the user out everywhere. Their past chat messages stay for analytics.
        $user->tokens()->delete();
        ChecklistProgress::where('user_id', (string) $user->id)->delete();
        $user->delete();

        return response()->noContent();
    }

    private function isSelf(Request $request, User $user): bool
    {
        return (string) $user->id === (string) $request->user()->id;
    }
}
