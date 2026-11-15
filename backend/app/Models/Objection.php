<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Objection extends Model
{
    protected $fillable = ['name','category','suggested_response','reference_conversion','archived_at'];
    protected $casts = ['reference_conversion'=>'decimal:2','archived_at'=>'datetime'];

    public function occurrences(): HasMany { return $this->hasMany(CallObjection::class); }
    public function scopeActive(Builder $q): Builder { return $q->whereNull('archived_at'); }
}
