<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Posicion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'posiciones';
    protected $primaryKey = 'id_posicion';
    
    protected $fillable = [
        'id_posicion',
        'nombre',
        'abreviatura',
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

    // Relación muchos a muchos con deportistas
    public function deportistas()
    {
        return $this->belongsToMany(Deportista::class, 'deportista_posiciones', 'id_posicion', 'id_deportista', 'id_posicion', 'id_deportista')
                    ->withPivot('id', 'principal', 'created_at', 'updated_at')
                    ->withTimestamps();
    }
}