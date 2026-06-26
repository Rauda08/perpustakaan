<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends BaseApiController
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('username', $credentials['username'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['Username atau password salah.'],
            ]);
        }

        $plainToken = hash('sha256', Str::random(80));
        $user->forceFill(['api_token' => $plainToken])->save();

        return $this->ok([
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'token' => $plainToken,
            'tokenType' => 'Bearer',
        ], 'Login berhasil');
    }

    public function logout(Request $request)
    {
        if ($token = $request->bearerToken()) {
            User::where('api_token', $token)->update(['api_token' => null]);
        }

        return $this->ok(null, 'Logout berhasil');
    }

    public function me(Request $request)
    {
        $user = $request->bearerToken()
            ? User::where('api_token', $request->bearerToken())->first()
            : null;

        return $this->ok($user ? [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
        ] : null);
    }
}
