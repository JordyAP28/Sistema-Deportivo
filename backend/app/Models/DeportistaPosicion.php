<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeportistaPosicion extends Model
{
    use HasFactory;

    protected $table = 'deportista_posiciones';
    protected $primaryKey = 'id';
    
    protected $fillable = [
        'id',
        'id_deportista',
        'id_posicion',
        'principal',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'principal' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function deportista()
    {
        return $this->belongsTo(Deportista::class, 'id_deportista', 'id_deportista');
    }

    public function posicion()
    {
        return $this->belongsTo(Posicion::class, 'id_posicion', 'id_posicion');
    }
}