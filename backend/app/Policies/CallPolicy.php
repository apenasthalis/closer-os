<?php
namespace App\Policies;

use App\Models\Call;
use App\Models\User;

class CallPolicy
{
    public function before(User $user): ?bool { return $user->isAdmin() ? true : null; }
    public function view(User $user, Call $call): bool { return $call->user_id === $user->id; }
    public function update(User $user, Call $call): bool { return $call->user_id === $user->id; }
    public function delete(User $user, Call $call): bool { return $call->user_id === $user->id; }
}
