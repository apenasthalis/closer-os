<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FollowUpTask extends Model
{
    protected $fillable = ['lead_id','user_id','scheduled_at','message','status','result','completed_at'];
    protected $casts = ['scheduled_at'=>'datetime','completed_at'=>'datetime'];

    public function lead(): BelongsTo { return $this->belongsTo(Lead::class); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }

    public function scopeVisibleTo(Builder $q, User $user): Builder
    {
        return $user->isAdmin() ? $q : $q->where('user_id', $user->id);
    }
}
