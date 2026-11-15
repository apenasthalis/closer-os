<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model {
    protected $fillable = ['user_id','name'];
    public function departments() { return $this->hasMany(Department::class); }
    public function operations() { return $this->hasMany(Operation::class); }
    public function leads() { return $this->hasMany(Lead::class); }
    public function sales() { return $this->hasMany(Sale::class); }
}
