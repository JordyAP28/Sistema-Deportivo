<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rol extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'rols';
    protected $primaryKey = 'id_rol';
    
    protected $fillable = [
        'id_rol',
        'nombre',
        'slug',
        'descripcion',
        'activo',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'activo' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    // Relación con usuarios
    public function usuarios()
    {
        return $this->hasMany(Usuario::class, 'id_rol', 'id_rol');
    }

    // Relación muchos a muchos con permisos
    public function permisos()
    {
        return $this->belongsToMany(Permiso::class, 'rol_permisos', 'id_rol', 'id_permiso', 'id_rol', 'id_permiso');
    }
}