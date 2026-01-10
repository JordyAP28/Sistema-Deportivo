<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Actividad extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'actividades';
    protected $primaryKey = 'id_actividad';
    
    protected $fillable = [
        'id_actividad',
        'nombre_actividad',
        'descripcion',
        'fecha',
        'hora_inicio',
        'hora_fin',
        'tipo',
        'estado',
        'cupo_maximo',
        'observaciones',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'fecha' => 'date',
        'cupo_maximo' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'deleted_by' => 'integer'
    ];

    // Relación con programa de actividades
    public function escenariosProgramados()
    {
        return $this->hasMany(ProgramaActividad::class, 'id_actividad', 'id_actividad');
    }

    // Relación con asistencias
    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'id_actividad', 'id_actividad');
    }
}