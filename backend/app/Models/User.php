<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name','email','password','role','active'];
    protected $hidden = ['password','remember_token'];
    protected $casts = ['email_verified_at'=>'datetime','password'=>'hashed','active'=>'boolean'];

    public function isAdmin(): bool { return $this->role === 'admin'; }

    public function leads(): HasMany { return $this->hasMany(Lead::class); }
    public function sales(): HasMany { return $this->hasMany(Sale::class); }
    public function calls(): HasMany { return $this->hasMany(Call::class); }
    public function goals(): HasMany { return $this->hasMany(Goal::class); }
    public function followUps(): HasMany { return $this->hasMany(FollowUpTask::class); }
    public function companies(): BelongsToMany {
        return $this->belongsToMany(Company::class, 'user_company_assignments')
            ->withPivot('department_id')->withTimestamps();
    }
}
