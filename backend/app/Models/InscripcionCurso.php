<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InscripcionCurso extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'inscripcion_cursos';
    protected $primaryKey = 'id_inscripcion';
    
    protected $fillable = [
        'id_inscripcion',
        'id_curso',
        'id_usuario',
        'fecha_inscripcion',
        'observaciones',
        'estado',
        'calificacion',
        'comentarios',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'fecha_inscripcion' => 'date',
        'calificacion' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_by' => 'integer',
        'updated_by' => 'integer'
    ];

    public function curso()
    {
        return $this->belongsTo(Curso::class, 'id_curso', 'id_curso');
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}