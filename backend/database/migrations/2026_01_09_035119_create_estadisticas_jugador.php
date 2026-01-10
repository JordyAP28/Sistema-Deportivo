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
        Schema::create('estadisticas_jugador', function (Blueprint $table) {
            $table->bigIncrements('id_estadistica');
            $table->unsignedBigInteger('id_deportista');
            $table->unsignedBigInteger('id_partido')->nullable();
            $table->unsignedBigInteger('id_campeonato')->nullable();
            $table->integer('goles')->default(0);
            $table->integer('asistencias')->default(0);
            $table->integer('tarjetas_amarillas')->default(0);
            $table->integer('tarjetas_rojas')->default(0);
            $table->integer('minutos_jugados')->default(0);
            $table->integer('partidos_jugados')->default(0);
            $table->integer('partidos_titular')->default(0);
            $table->integer('partidos_suplente')->default(0);
            $table->bigInteger('created_by')->nullable();
            $table->timestamps();
            
            $table->foreign('id_deportista')->references('id_deportista')->on('deportistas')->onDelete('cascade');
            $table->foreign('id_partido')->references('id_partido')->on('partidos')->onDelete('cascade');
            $table->foreign('id_campeonato')->references('id_campeonato')->on('campeonatos')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estadisticas_jugador');
    }
};
