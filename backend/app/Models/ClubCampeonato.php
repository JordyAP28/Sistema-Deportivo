<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClubCampeonato extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'club_campeonatos';
    protected $primaryKey = 'id_club_campeonato';
    
    protected $fillable = [
        'id_club_campeonato',
        'id_club',
        'id_campeonato',
        'fecha_inscripcion',
        'estado',
        'puntos',
        'partidos_jugados',
        'partidos_ganados',
        'partidos_empatados',
        'partidos_perdidos',
        'goles_favor',
        'goles_contra',
        'observaciones',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'fecha_inscripcion' => 'date',
        'puntos' => 'integer',
        'partidos_jugados' => 'integer',
        'partidos_ganados' => 'integer',
        'partidos_empatados' => 'integer',
        'partidos_perdidos' => 'integer',
        'goles_favor' => 'integer',
        'goles_contra' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_by' => 'integer',
        'updated_by' => 'integer'
    ];

    public function club()
    {
        return $this->belongsTo(Club::class, 'id_club', 'id_club');
    }

    public function campeonato()
    {
        return $this->belongsTo(Campeonato::class, 'id_campeonato', 'id_campeonato');
    }
}