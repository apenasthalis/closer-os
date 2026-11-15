<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallScorecard extends Model
{
    protected $fillable = ['call_id','criteria','talk_ratio','penalty','score'];
    protected $casts = ['criteria'=>'array','talk_ratio'=>'integer','penalty'=>'integer','score'=>'integer'];

    public function call(): BelongsTo { return $this->belongsTo(Call::class); }
}
