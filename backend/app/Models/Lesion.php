<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lesion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'lesiones';
    protected $primaryKey = 'id_lesion';
    
    protected $fillable = [
        'id_lesion',
        'id_deportista',
        'tipo_lesion',
        'zona_afectada',
        'fecha_lesion',
        'fecha_recuperacion_estimada',
        'fecha_alta',
        'descripcion',
        'tratamiento',
        'gravedad',
        'estado',
        'medico_tratante',
        'observaciones',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'fecha_lesion' => 'date',
        'fecha_recuperacion_estimada' => 'date',
        'fecha_alta' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_by' => 'integer',
        'updated_by' => 'integer'
    ];

    public function deportista()
    {
        return $this->belongsTo(Deportista::class, 'id_deportista', 'id_deportista');
    }
}