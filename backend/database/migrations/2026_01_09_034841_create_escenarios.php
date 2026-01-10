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
        Schema::create('escenarios', function (Blueprint $table) {
            $table->bigIncrements('id_escenario');
            $table->string('nombre')->unique();
            $table->string('slug')->unique();
            $table->string('tipo');
            $table->integer('capacidad');
            $table->text('descripcion')->nullable();
            $table->string('direccion');
            $table->string('imagen')->nullable();
            $table->json('servicios')->nullable();
            $table->enum('estado', ['disponible', 'mantenimiento', 'ocupado', 'cerrado'])->default('disponible');
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->bigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('escenarios');
    }
};
