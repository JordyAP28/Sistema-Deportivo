<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notificacion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'notificaciones';
    protected $primaryKey = 'id_notificacion';
    
    protected $fillable = [
        'id_notificacion',
        'usuario_id',
        'tipo',
        'titulo',
        'mensaje',
        'data',
        'url',
        'leida',
        'fecha_lectura',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'leida' => 'boolean',
        'fecha_lectura' => 'datetime',
        'data' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id_usuario');
    }
}