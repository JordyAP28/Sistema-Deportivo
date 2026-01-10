<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Club extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'clubes';
    protected $primaryKey = 'id_club';
    
    protected $fillable = [
        'id_club',
        'nombre',
        'slug',
        'fecha_creacion',
        'fecha_fundacion',
        'representante',
        'email',
        'telefono',
        'direccion',
        'logo',
        'descripcion',
        'redes_sociales',
        'estado',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'fecha_creacion' => 'date',
        'fecha_fundacion' => 'date',
        'redes_sociales' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'deleted_by' => 'integer'
    ];

    // Relación muchos a muchos con deportistas
    public function deportistas()
    {
        return $this->belongsToMany(Deportista::class, 'jugador_clubes', 'id_club', 'id_deportista', 'id_club', 'id_deportista')
                    ->withPivot('id_jugador_club', 'fecha_ingreso', 'fecha_salida', 'estado', 'numero_camiseta', 'observaciones', 'created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at')
                    ->withTimestamps();
    }

    // Relación muchos a muchos con campeonatos
    public function campeonatos()
    {
        return $this->belongsToMany(Campeonato::class, 'club_campeonatos', 'id_club', 'id_campeonato', 'id_club', 'id_campeonato')
                    ->withPivot('id_club_campeonato', 'fecha_inscripcion', 'estado', 'puntos', 'partidos_jugados', 'partidos_ganados', 'partidos_empatados', 'partidos_perdidos', 'goles_favor', 'goles_contra', 'observaciones', 'created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at')
                    ->withTimestamps();
    }

    // Relación con partidos como local
    public function partidosLocal()
    {
        return $this->hasMany(Partido::class, 'club_local_id', 'id_club');
    }

    // Relación con partidos como visitante
    public function partidosVisitante()
    {
        return $this->hasMany(Partido::class, 'club_visitante_id', 'id_club');
    }
}