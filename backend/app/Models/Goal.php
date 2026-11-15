<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Goal extends Model {
    protected $fillable = ['user_id','company_id','department_id','month','metric','target'];
    protected $casts = ['month'=>'date','target'=>'decimal:2'];
}
