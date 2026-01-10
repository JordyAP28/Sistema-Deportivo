<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Deportista extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'deportistas';
    protected $primaryKey = 'id_deportista';
    
    protected $fillable = [
        'id_deportista',
        'id_usuario',
        'id_categoria',
        'nombres',
        'apellidos',
        'fecha_nacimiento',
        'genero',
        'tipo_documento',
        'numero_documento',
        'foto',
        'direccion',
        'correo',
        'telefono',
        'altura',
        'peso',
        'pie_habil',
        'numero_camiseta',
        'estado',
        'contacto_emergencia_nombre',
        'contacto_emergencia_telefono',
        'contacto_emergencia_relacion',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'fecha_nacimiento' => 'date',
        'altura' => 'decimal:2',
        'peso' => 'decimal:2',
        'numero_camiseta' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_by' => 'integer',
        'updated_by' => 'integer',
        'deleted_by' => 'integer'
    ];

    // Relación con usuario
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    // Relación con categoría
    public function categoria()
    {
        return $this->belongsTo(Categoria::class, 'id_categoria', 'id_categoria');
    }

    // Relación muchos a muchos con posiciones
    public function posiciones()
    {
        return $this->belongsToMany(Posicion::class, 'deportista_posiciones', 'id_deportista', 'id_posicion', 'id_deportista', 'id_posicion')
                    ->withPivot('id', 'principal', 'created_at', 'updated_at')
                    ->withTimestamps();
    }

    // Relación con clubes (a través de jugador_clubes)
    public function clubes()
    {
        return $this->belongsToMany(Club::class, 'jugador_clubes', 'id_deportista', 'id_club', 'id_deportista', 'id_club')
                    ->withPivot('id_jugador_club', 'fecha_ingreso', 'fecha_salida', 'estado', 'numero_camiseta', 'observaciones', 'created_by', 'updated_by', 'created_at', 'updated_at', 'deleted_at')
                    ->withTimestamps();
    }

    // Relación con facturas
    public function facturas()
    {
        return $this->hasMany(Factura::class, 'id_deportista', 'id_deportista');
    }

    // Relación con asistencias
    public function asistencias()
    {
        return $this->hasMany(Asistencia::class, 'id_deportista', 'id_deportista');
    }

    // Relación con lesiones
    public function lesiones()
    {
        return $this->hasMany(Lesion::class, 'id_deportista', 'id_deportista');
    }

    // Relación con estadísticas
    public function estadisticas()
    {
        return $this->hasMany(EstadisticaJugador::class, 'id_deportista', 'id_deportista');
    }
}