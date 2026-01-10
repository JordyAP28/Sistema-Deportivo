<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Campeonato extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'campeonatos';
    protected $primaryKey = 'id_campeonato';
    
    protected $fillable = [
        'id_campeonato',
        'nombre',
        'slug',
        'fecha_inicio',
        'fecha_fin',
        'categoria',
        'representante',
        'email_representante',
        'telefono_representante',
        'descripcion',
        'imagen',
        'estado',
        'reglas',
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
        'reglas' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'deleted_by' => 'integer'
    ];

    // Relación muchos a muchos con clubes
    public function clubes()
    {
        return $this->belongsToMany(Club::class, 'club_campeonatos', 'id_campeonato', 'id_club', 'id_campeonato', 'id_club')
                    ->withPivot('id_club_campeonato', 'fecha_inscripcion', 'estado', 'puntos', 'partidos_jugados', 'partidos_ganados', 'partidos_empatados', 'partidos_perdidos', 'goles_favor', 'goles_contra', 'observaciones', 'created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at')
                    ->withTimestamps();
    }

    // Relación con partidos
    public function partidos()
    {
        return $this->hasMany(Partido::class, 'id_campeonato', 'id_campeonato');
    }

    // Relación con estadísticas
    public function estadisticas()
    {
        return $this->hasMany(EstadisticaJugador::class, 'id_campeonato', 'id_campeonato');
    }
}