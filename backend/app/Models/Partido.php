<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Partido extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'partidos';
    protected $primaryKey = 'id_partido';
    
    protected $fillable = [
        'id_partido',
        'id_campeonato',
        'id_escenario',
        'club_local_id',
        'club_visitante_id',
        'fecha',
        'hora',
        'goles_local',
        'goles_visitante',
        'estado',
        'arbitro',
        'observaciones',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'fecha' => 'date',
        'goles_local' => 'integer',
        'goles_visitante' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_by' => 'integer',
        'updated_by' => 'integer'
    ];

    public function campeonato()
    {
        return $this->belongsTo(Campeonato::class, 'id_campeonato', 'id_campeonato');
    }

    public function escenario()
    {
        return $this->belongsTo(Escenario::class, 'id_escenario', 'id_escenario');
    }

    public function clubLocal()
    {
        return $this->belongsTo(Club::class, 'club_local_id', 'id_club');
    }

    public function clubVisitante()
    {
        return $this->belongsTo(Club::class, 'club_visitante_id', 'id_club');
    }

    public function estadisticas()
    {
        return $this->hasMany(EstadisticaJugador::class, 'id_partido', 'id_partido');
    }
}