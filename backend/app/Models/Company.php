<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = ['name','archived_at','user_id'];
    protected $casts = ['archived_at'=>'datetime'];

    public function departments(): HasMany { return $this->hasMany(Department::class); }
    public function operations(): HasMany { return $this->hasMany(Operation::class); }
    public function leads(): HasMany { return $this->hasMany(Lead::class); }
    public function sales(): HasMany { return $this->hasMany(Sale::class); }
    public function goals(): HasMany { return $this->hasMany(Goal::class); }
    public function compensationRules(): HasMany { return $this->hasMany(CompensationRule::class); }
}
