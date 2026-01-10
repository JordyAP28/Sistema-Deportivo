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
        Schema::create('partidos', function (Blueprint $table) {
            $table->bigIncrements('id_partido');
            $table->unsignedBigInteger('id_campeonato');
            $table->unsignedBigInteger('id_escenario');
            $table->unsignedBigInteger('club_local_id');
            $table->unsignedBigInteger('club_visitante_id');
            $table->date('fecha');
            $table->time('hora');
            $table->integer('goles_local')->default(0);
            $table->integer('goles_visitante')->default(0);
            $table->enum('estado', ['programado', 'en_juego', 'finalizado', 'suspendido', 'cancelado'])->default('programado');
            $table->string('arbitro')->nullable();
            $table->text('observaciones')->nullable();
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('id_campeonato')->references('id_campeonato')->on('campeonatos')->onDelete('cascade');
            $table->foreign('id_escenario')->references('id_escenario')->on('escenarios')->onDelete('cascade');
            $table->foreign('club_local_id')->references('id_club')->on('clubes')->onDelete('cascade');
            $table->foreign('club_visitante_id')->references('id_club')->on('clubes')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partidos');
    }
};
