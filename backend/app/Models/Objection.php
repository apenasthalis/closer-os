<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Objection extends Model {
    protected $fillable = ['user_id','name','category','suggested_response','reference_conversion'];
    protected $casts = ['reference_conversion'=>'decimal:2'];
    public function occurrences() { return $this->hasMany(CallObjection::class); }
}
