<?php
namespace App\Policies;

use App\Models\FollowUpTask;
use App\Models\User;

class FollowUpTaskPolicy
{
    public function before(User $user): ?bool { return $user->isAdmin() ? true : null; }
    public function view(User $user, FollowUpTask $task): bool { return $task->user_id === $user->id; }
    public function update(User $user, FollowUpTask $task): bool { return $task->user_id === $user->id; }
    public function delete(User $user, FollowUpTask $task): bool { return $task->user_id === $user->id; }
}
