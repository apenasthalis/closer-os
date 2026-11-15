<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class SalePayment extends Model {
    protected $fillable = ['sale_id','method','amount_cents','installments','gateway_fee_cents','status','received_at'];
    protected $casts = ['received_at'=>'date'];
    public function sale() { return $this->belongsTo(Sale::class); }
    public function isCash(): bool { return in_array($this->method,['pix','card']); }
}
