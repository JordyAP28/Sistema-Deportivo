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
        Schema::create('asistencias', function (Blueprint $table) {
            $table->bigIncrements('id_asistencia');
            $table->unsignedBigInteger('id_deportista');
            $table->unsignedBigInteger('id_actividad');
            $table->date('fecha');
            $table->time('hora_llegada')->nullable();
            $table->enum('estado', ['presente', 'ausente', 'justificado', 'tardanza'])->default('presente');
            $table->text('observaciones')->nullable();
            $table->bigInteger('created_by')->nullable();
            $table->timestamps();
            
            $table->foreign('id_deportista')->references('id_deportista')->on('deportistas')->onDelete('cascade');
            $table->foreign('id_actividad')->references('id_actividad')->on('actividades')->onDelete('cascade');
            
            $table->unique(['id_deportista', 'id_actividad', 'fecha']);
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asistencias');
    }
};
