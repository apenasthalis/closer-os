<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class MonthlyCompensationSnapshot extends Model {
    protected $fillable = ['user_id','company_id','department_id','month','cash_received_cents','target_cents','fixed_cents','commission_cents','total_cents','rule_id'];
    protected $casts = ['month'=>'date'];
}
