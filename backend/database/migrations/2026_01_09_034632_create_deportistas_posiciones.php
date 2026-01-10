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
        Schema::create('deportista_posiciones', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('id_deportista');
            $table->unsignedBigInteger('id_posicion');
            $table->boolean('principal')->default(false);
            $table->timestamps();
            
            $table->foreign('id_deportista')->references('id_deportista')->on('deportistas')->onDelete('cascade');
            $table->foreign('id_posicion')->references('id_posicion')->on('posiciones')->onDelete('cascade');
            
            $table->unique(['id_deportista', 'id_posicion']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deportistas_posiciones');
    }
};
