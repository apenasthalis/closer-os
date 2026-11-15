<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Call extends Model
{
    protected $fillable = ['user_id','lead_id','company_id','department_id','call_at','status','notes'];
    protected $casts = ['call_at'=>'datetime'];

    public function closer(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
    public function lead(): BelongsTo { return $this->belongsTo(Lead::class); }
    public function company(): BelongsTo { return $this->belongsTo(Company::class); }
    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
    public function scorecard(): HasOne { return $this->hasOne(CallScorecard::class); }
    public function objections(): HasMany { return $this->hasMany(CallObjection::class); }

    public function scopeVisibleTo(Builder $q, User $user): Builder
    {
        return $user->isAdmin() ? $q : $q->where('user_id', $user->id);
    }
}
