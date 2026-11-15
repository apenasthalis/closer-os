<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    protected $fillable = ['company_id','name','archived_at'];
    protected $casts = ['archived_at'=>'datetime'];

    public function company(): BelongsTo { return $this->belongsTo(Company::class); }
    public function operations(): HasMany { return $this->hasMany(Operation::class); }
    public function leads(): HasMany { return $this->hasMany(Lead::class); }
    public function sales(): HasMany { return $this->hasMany(Sale::class); }
    public function goals(): HasMany { return $this->hasMany(Goal::class); }
}
