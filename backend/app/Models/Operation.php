<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Operation extends Model {
    protected $fillable = ['user_id','company_id','department_id','name','commission_percent','archived_at'];
    protected $casts = ['commission_percent'=>'decimal:2','archived_at'=>'datetime'];
    public function isArchived(): bool { return !is_null($this->archived_at); }
    public function sales() { return $this->hasMany(Sale::class); }
}
