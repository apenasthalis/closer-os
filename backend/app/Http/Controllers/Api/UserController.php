<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorizeAdmin($request);
        $query = User::query()->orderBy('name');
        if ($request->q) {
            $query->where(fn ($q) => $q->where('name','like','%'.$request->q.'%')->orWhere('email','like','%'.$request->q.'%'));
        }
        if ($request->role) $query->where('role', $request->role);
        if ($request->has('active')) $query->where('active', $request->boolean('active'));
        return $query->get();
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'email' => ['required','email','unique:users,email'],
            'password' => ['required','string','min:6'],
            'role' => ['required', Rule::in(['admin','closer'])],
            'active' => ['sometimes','boolean'],
        ]);
        $data['active'] = $data['active'] ?? true;
        $user = User::create($data);
        return response()->json($user, 201);
    }

    public function update(Request $request, User $user)
    {
        $this->authorizeAdmin($request);
        $data = $request->validate([
            'name' => ['sometimes','string','max:255'],
            'email' => ['sometimes','email', Rule::unique('users','email')->ignore($user->id)],
            'password' => ['sometimes','nullable','string','min:6'],
            'role' => ['sometimes', Rule::in(['admin','closer'])],
            'active' => ['sometimes','boolean'],
        ]);
        if (empty($data['password'])) unset($data['password']);
        if ($request->user()->id === $user->id && isset($data['active']) && !$data['active']) {
            return response()->json(['message' => 'Você não pode desativar o próprio usuário.'], 422);
        }
        $user->update($data);
        return $user->fresh();
    }

    public function destroy(Request $request, User $user)
    {
        $this->authorizeAdmin($request);
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'Você não pode excluir o próprio usuário.'], 422);
        }
        $user->update(['active' => false]);
        return response()->json(['message' => 'Usuário desativado.', 'user' => $user->fresh()]);
    }

    private function authorizeAdmin(Request $request): void
    {
        if (!$request->user()->isAdmin()) abort(403, 'Apenas administradores podem gerenciar usuários.');
    }
}
