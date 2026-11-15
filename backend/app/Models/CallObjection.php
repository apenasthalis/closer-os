<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallObjection extends Model
{
    protected $fillable = ['call_id','objection_id','lead_id','closer_user_id','resolved','sale_happened','notes'];
    protected $casts = ['resolved'=>'boolean','sale_happened'=>'boolean'];

    public function objection(): BelongsTo { return $this->belongsTo(Objection::class); }
    public function call(): BelongsTo { return $this->belongsTo(Call::class); }
    public function lead(): BelongsTo { return $this->belongsTo(Lead::class); }
    public function closer(): BelongsTo { return $this->belongsTo(User::class, 'closer_user_id'); }
}
