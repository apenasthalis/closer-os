<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Lead extends Model
{
    protected $fillable = [
        'user_id','company_id','department_id','name','phone','email','description',
        'call_at','stage','stage_changed_at','no_show_count','loss_reason','loss_note','qualification',
    ];
    protected $casts = [
        'call_at'=>'datetime','stage_changed_at'=>'datetime','qualification'=>'array',
        'no_show_count'=>'integer',
    ];

    public function closer(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
    public function company(): BelongsTo { return $this->belongsTo(Company::class); }
    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
    public function events(): HasMany { return $this->hasMany(LeadEvent::class)->orderBy('created_at'); }
    public function sales(): HasMany { return $this->hasMany(Sale::class); }
    public function sale(): HasOne { return $this->hasOne(Sale::class); }
    public function calls(): HasMany { return $this->hasMany(Call::class); }
    public function followUps(): HasMany { return $this->hasMany(FollowUpTask::class); }
    public function objections(): HasMany { return $this->hasMany(CallObjection::class); }

    public function score(): int
    {
        $bant = collect($this->qualification ?? [])->filter()->count() * 20;
        $engagement = min(20, max(0, ($this->events->count() - 1) * 4));
        return min(100, $bant + $engagement);
    }

    public function scopeVisibleTo(Builder $q, User $user): Builder
    {
        return $user->isAdmin() ? $q : $q->where('user_id', $user->id);
    }
}
