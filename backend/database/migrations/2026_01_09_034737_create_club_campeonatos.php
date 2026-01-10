<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('club_campeonatos', function (Blueprint $table) {
            $table->bigIncrements('id_club_campeonato');
            $table->unsignedBigInteger('id_club');
            $table->unsignedBigInteger('id_campeonato');
            $table->date('fecha_inscripcion');
            $table->enum('estado', ['inscrito', 'activo', 'descalificado', 'retirado'])->default('inscrito');
            $table->integer('puntos')->default(0);
            $table->integer('partidos_jugados')->default(0);
            $table->integer('partidos_ganados')->default(0);
            $table->integer('partidos_empatados')->default(0);
            $table->integer('partidos_perdidos')->default(0);
            $table->integer('goles_favor')->default(0);
            $table->integer('goles_contra')->default(0);
            $table->text('observaciones')->nullable();
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('id_club')->references('id_club')->on('clubes')->onDelete('cascade');
            $table->foreign('id_campeonato')->references('id_campeonato')->on('campeonatos')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('club_campeonatos');
    }
};
