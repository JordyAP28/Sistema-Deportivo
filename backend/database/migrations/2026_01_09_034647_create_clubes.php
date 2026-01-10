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
        Schema::create('clubes', function (Blueprint $table) {
            $table->bigIncrements('id_club');
            $table->string('nombre')->unique();
            $table->string('slug')->unique();
            $table->date('fecha_creacion');
            $table->date('fecha_fundacion')->nullable();
            $table->string('representante');
            $table->string('email');
            $table->string('telefono');
            $table->string('direccion')->nullable();
            $table->string('logo')->nullable();
            $table->text('descripcion')->nullable();
            $table->json('redes_sociales')->nullable();
            $table->enum('estado', ['activo', 'inactivo', 'suspendido'])->default('activo');
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
        Schema::dropIfExists('clubes');
    }
};
