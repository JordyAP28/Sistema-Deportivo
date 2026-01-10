<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EstadisticaJugador extends Model
{
    use HasFactory;

    protected $table = 'estadisticas_jugador';
    protected $primaryKey = 'id_estadistica';
    
    protected $fillable = [
        'id_estadistica',
        'id_deportista',
        'id_partido',
        'id_campeonato',
        'goles',
        'asistencias',
        'tarjetas_amarillas',
        'tarjetas_rojas',
        'minutos_jugados',
        'partidos_jugados',
        'partidos_titular',
        'partidos_suplente',
        'created_by',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'goles' => 'integer',
        'asistencias' => 'integer',
        'tarjetas_amarillas' => 'integer',
        'tarjetas_rojas' => 'integer',
        'minutos_jugados' => 'integer',
        'partidos_jugados' => 'integer',
        'partidos_titular' => 'integer',
        'partidos_suplente' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'created_by' => 'integer'
    ];

    public function deportista()
    {
        return $this->belongsTo(Deportista::class, 'id_deportista', 'id_deportista');
    }

    public function partido()
    {
        return $this->belongsTo(Partido::class, 'id_partido', 'id_partido');
    }

    public function campeonato()
    {
        return $this->belongsTo(Campeonato::class, 'id_campeonato', 'id_campeonato');
    }
}