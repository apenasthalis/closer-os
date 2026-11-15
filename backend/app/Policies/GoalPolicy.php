<?php
namespace App\Policies;

use App\Models\Goal;
use App\Models\User;

class GoalPolicy
{
    public function before(User $user): ?bool { return $user->isAdmin() ? true : null; }
    public function view(User $user, Goal $goal): bool { return $goal->user_id === $user->id; }
    public function update(User $user, Goal $goal): bool { return false; }
    public function delete(User $user, Goal $goal): bool { return false; }
}
