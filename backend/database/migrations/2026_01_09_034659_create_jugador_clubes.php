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
        Schema::create('jugador_clubes', function (Blueprint $table) {
            $table->bigIncrements('id_jugador_club');
            $table->unsignedBigInteger('id_deportista');
            $table->unsignedBigInteger('id_club');
            $table->date('fecha_ingreso');
            $table->date('fecha_salida')->nullable();
            $table->enum('estado', ['activo', 'inactivo', 'transferido', 'retirado'])->default('activo');
            $table->integer('numero_camiseta')->nullable();
            $table->text('observaciones')->nullable();
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('id_deportista')->references('id_deportista')->on('deportistas')->onDelete('cascade');
            $table->foreign('id_club')->references('id_club')->on('clubes')->onDelete('cascade');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('jugador_clubes');
    }
};
