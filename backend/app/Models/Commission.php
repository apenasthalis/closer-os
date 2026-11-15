<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Commission extends Model {
    protected $fillable = ['sale_id','user_id','company_id','department_id','period_month','amount_cents'];
    protected $casts = ['period_month'=>'date'];
}
