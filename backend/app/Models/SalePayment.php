<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalePayment extends Model
{
    protected $fillable = [
        'sale_id','method','amount_cents','installments','gateway_fee_cents','status','received_at',
    ];
    protected $casts = ['received_at'=>'date','amount_cents'=>'integer','gateway_fee_cents'=>'integer','installments'=>'integer'];

    public function sale(): BelongsTo { return $this->belongsTo(Sale::class); }
    public function isCash(): bool { return in_array($this->method, ['pix','card'], true); }
    public function netCents(): int { return $this->amount_cents - ($this->method === 'card' ? $this->gateway_fee_cents : 0); }
}
