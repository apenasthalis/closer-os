<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model {
    protected $fillable = ['lead_id','user_id','company_id','department_id','operation_id','description','closed_at','commission_percent','receipt_path'];
    protected $casts = ['closed_at'=>'date','commission_percent'=>'decimal:2'];
    public function lead() { return $this->belongsTo(Lead::class); }
    public function closer() { return $this->belongsTo(User::class,'user_id'); }
    public function operation() { return $this->belongsTo(Operation::class); }
    public function payments() { return $this->hasMany(SalePayment::class); }
    public function refunds() { return $this->hasMany(Refund::class); }
    public function company() { return $this->belongsTo(Company::class); }
    public function department() { return $this->belongsTo(Department::class); }
}
