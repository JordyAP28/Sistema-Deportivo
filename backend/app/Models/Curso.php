<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Curso extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'cursos';
    protected $primaryKey = 'id_curso';
    
    protected $fillable = [
        'id_curso',
        'nombre',
        'slug',
        'descripcion',
        'fecha_inicio',
        'fecha_fin',
        'representante',
        'email_representante',
        'telefono_representante',
        'tipo',
        'estado',
        'cupo_maximo',
        'cupo_actual',
        'precio',
        'imagen',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'cupo_maximo' => 'integer',
        'cupo_actual' => 'integer',
        'precio' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'deleted_by' => 'integer'
    ];

    // Relación muchos a muchos con usuarios (inscripciones)
    public function usuarios()
    {
        return $this->belongsToMany(Usuario::class, 'inscripcion_cursos', 'id_curso', 'id_usuario', 'id_curso', 'id_usuario')
                    ->withPivot('id_inscripcion', 'fecha_inscripcion', 'observaciones', 'estado', 'calificacion', 'comentarios', 'created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at')
                    ->withTimestamps();
    }
}