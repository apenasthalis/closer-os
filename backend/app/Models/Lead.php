<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lead extends Model {
    protected $fillable = ['user_id','company_id','department_id','name','phone','email','description','call_at','stage','stage_changed_at','no_show_count','loss_reason','loss_note','qualification'];
    protected $casts = ['call_at'=>'datetime','stage_changed_at'=>'datetime','qualification'=>'array'];
    public function events() { return $this->hasMany(LeadEvent::class)->orderBy('created_at'); }
    public function sales() { return $this->hasMany(Sale::class); }
    public function sale() { return $this->hasOne(Sale::class); }
    public function closer() { return $this->belongsTo(User::class,'user_id'); }
    public function company() { return $this->belongsTo(Company::class); }
    public function department() { return $this->belongsTo(Department::class); }
    public function score(): int {
        $b = collect($this->qualification ?? [])->filter()->count() * 20;
        $eng = min(20, max(0, ($this->events->count() - 1) * 4));
        return $b + $eng;
    }
}
