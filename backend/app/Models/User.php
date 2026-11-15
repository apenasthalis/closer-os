<?php
namespace App\Models;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable {
    use HasApiTokens, Notifiable;
    protected $fillable = ['name','email','password','role'];
    protected $hidden = ['password','remember_token'];
    protected $casts = ['email_verified_at'=>'datetime','password'=>'hashed'];
    public function isAdmin(): bool { return $this->role === 'admin'; }
    public function leads() { return $this->hasMany(Lead::class); }
    public function sales() { return $this->hasMany(Sale::class); }
    public function operations() { return $this->hasMany(Operation::class); }
    public function companies() { return $this->belongsToMany(Company::class,'user_company_assignments')->withPivot('department_id'); }
}
