<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class CallScorecard extends Model {
    protected $fillable = ['call_id','criteria','talk_ratio','score'];
    protected $casts = ['criteria'=>'array'];
    public function call() { return $this->belongsTo(Call::class); }
}
