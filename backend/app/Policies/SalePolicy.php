<?php
namespace App\Policies;

use App\Models\Sale;
use App\Models\User;

class SalePolicy
{
    public function before(User $user): ?bool { return $user->isAdmin() ? true : null; }
    public function view(User $user, Sale $sale): bool { return $sale->user_id === $user->id; }
    public function update(User $user, Sale $sale): bool { return $sale->user_id === $user->id; }
    public function delete(User $user, Sale $sale): bool { return $sale->user_id === $user->id; }
}
