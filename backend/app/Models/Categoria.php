<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Categoria extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'categorias';
    protected $primaryKey = 'id_categoria';
    
    protected $fillable = [
        'id_categoria',
        'nombre',
        'edad_minima',
        'edad_maxima',
        'genero',
        'descripcion',
        'activo',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'activo' => 'boolean',
        'edad_minima' => 'integer',
        'edad_maxima' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    // Relación con deportistas
    public function deportistas()
    {
        return $this->hasMany(Deportista::class, 'id_categoria', 'id_categoria');
    }
}