<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JugadorClub extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'jugador_clubes';
    protected $primaryKey = 'id_jugador_club';
    
    protected $fillable = [
        'id_jugador_club',
        'id_deportista',
        'id_club',
        'fecha_ingreso',
        'fecha_salida',
        'estado',
        'numero_camiseta',
        'observaciones',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'fecha_ingreso' => 'date',
        'fecha_salida' => 'date',
        'numero_camiseta' => 'integer',
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

    public function club()
    {
        return $this->belongsTo(Club::class, 'id_club', 'id_club');
    }
}