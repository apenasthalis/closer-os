<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FollowUpTemplate extends Model
{
    protected $fillable = ['user_id','situation','day_label','title','body'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
