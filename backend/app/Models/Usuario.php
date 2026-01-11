<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes , HasApiTokens;

    protected $table = 'usuarios';
    protected $primaryKey = 'id_usuario';
    
    protected $fillable = [
        'id_usuario',
        'id_rol',
        'nombre',
        'apellido',
        'email',
        'telefono',
        'direccion',
        'avatar',
        'password',
        'email_verified_at',
        'remember_token',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'deleted_by' => 'integer'
    ];

    // Relación con rol
    public function rol()
    {
        return $this->belongsTo(Rol::class, 'id_rol', 'id_rol');
    }

    // Relación con deportistas
    public function deportistas()
    {
        return $this->hasMany(Deportista::class, 'id_usuario', 'id_usuario');
    }

    // Relación con inscripciones a cursos
    public function inscripcionesCursos()
    {
        return $this->hasMany(InscripcionCurso::class, 'id_usuario', 'id_usuario');
    }

    // Relación con facturas (como usuario)
    public function facturas()
    {
        return $this->hasMany(Factura::class, 'usuario_id', 'id_usuario');
    }

    // Relación con archivos subidos
    public function archivos()
    {
        return $this->hasMany(Archivo::class, 'usuario_id', 'id_usuario');
    }

    // Relación con notificaciones
    public function notificaciones()
    {
        return $this->hasMany(Notificacion::class, 'usuario_id', 'id_usuario');
    }

    // Relación con logs
    public function logs()
    {
        return $this->hasMany(LogSistema::class, 'id_usuario', 'id_usuario');
    }
}