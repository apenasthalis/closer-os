<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class FollowUpTemplate extends Model {
    protected $fillable = ['user_id','situation','title','body'];
}
