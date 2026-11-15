<?php
namespace App\Policies;

use App\Models\User;

class AdminOnlyPolicy
{
    public function before(User $user): ?bool { return $user->isAdmin() ? true : null; }
    public function view(User $user): bool { return true; }
    public function create(User $user): bool { return false; }
    public function update(User $user): bool { return false; }
    public function delete(User $user): bool { return false; }
}
