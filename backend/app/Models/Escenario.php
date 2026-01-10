<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Escenario extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'escenarios';
    protected $primaryKey = 'id_escenario';
    
    protected $fillable = [
        'id_escenario',
        'nombre',
        'slug',
        'tipo',
        'capacidad',
        'descripcion',
        'direccion',
        'imagen',
        'servicios',
        'estado',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'capacidad' => 'integer',
        'servicios' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'deleted_by' => 'integer'
    ];

    // Relación con programa de actividades
    public function actividadesProgramadas()
    {
        return $this->hasMany(ProgramaActividad::class, 'id_escenario', 'id_escenario');
    }

    // Relación con partidos
    public function partidos()
    {
        return $this->hasMany(Partido::class, 'id_escenario', 'id_escenario');
    }
}