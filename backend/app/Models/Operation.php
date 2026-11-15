<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Operation extends Model
{
    protected $fillable = ['company_id','department_id','name','commission_percent','archived_at'];
    protected $casts = ['commission_percent'=>'decimal:2','archived_at'=>'datetime'];

    public function company(): BelongsTo { return $this->belongsTo(Company::class); }
    public function department(): BelongsTo { return $this->belongsTo(Department::class); }
    public function sales(): HasMany { return $this->hasMany(Sale::class); }

    public function isArchived(): bool { return !is_null($this->archived_at); }
    public function scopeActive(Builder $q): Builder { return $q->whereNull('archived_at'); }
}
