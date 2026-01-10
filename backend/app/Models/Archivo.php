<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Archivo extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'archivos';
    protected $primaryKey = 'id_archivo';
    
    protected $fillable = [
        'id_archivo',
        'archivable_type',
        'archivable_id',
        'tipo',
        'nombre_original',
        'nombre_archivo',
        'ruta',
        'extension',
        'mime_type',
        'tamaño',
        'descripcion',
        'usuario_id',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'tamaño' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    // Relación polimórfica
    public function archivable()
    {
        return $this->morphTo();
    }

    // Relación con usuario
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id', 'id_usuario');
    }
}