<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Configuracion extends Model
{
    use HasFactory;

    protected $table = 'configuraciones';
    protected $primaryKey = 'id_configuracion';
    
    protected $fillable = [
        'id_configuracion',
        'clave',
        'valor',
        'tipo',
        'grupo',
        'descripcion',
        'editable',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'editable' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
}