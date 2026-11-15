<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Sale extends Model
{
    protected $fillable = [
        'lead_id','user_id','company_id','department_id','operation_id','description',
        'closed_at','commission_percent',
    ];
    protected $casts = ['closed_at'=>'date','commission_percent'=>'decimal:2'];

    public function lead(): BelongsTo { return $this->belongsTo(Lead::class); }
    public function closer(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
    public function operation(): BelongsTo { return $this->belongsTo(Operation::class); }
    public function company(): BelongsTo { return $this->belongsTo(Company::class); }
    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
    public function payments(): HasMany { return $this->hasMany(SalePayment::class); }
    public function refund(): HasOne { return $this->hasOne(Refund::class); }
    public function refunds(): HasMany { return $this->hasMany(Refund::class); }
    public function commissions(): HasMany { return $this->hasMany(Commission::class); }

    public function isRefunded(): bool { return $this->relationLoaded('refund') ? $this->refund !== null : $this->refund()->exists(); }

    public function scopeVisibleTo(Builder $q, User $user): Builder
    {
        return $user->isAdmin() ? $q : $q->where('user_id', $user->id);
    }
}
