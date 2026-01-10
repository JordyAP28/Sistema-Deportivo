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
        Schema::create('campeonatos', function (Blueprint $table) {
            $table->bigIncrements('id_campeonato');
            $table->string('nombre');
            $table->string('slug')->unique();
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->string('categoria');
            $table->string('representante');
            $table->string('email_representante');
            $table->string('telefono_representante');
            $table->text('descripcion')->nullable();
            $table->string('imagen')->nullable();
            $table->enum('estado', ['pendiente', 'activo', 'finalizado', 'cancelado'])->default('pendiente');
            $table->json('reglas')->nullable();
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
        Schema::dropIfExists('campeonatos');
    }
};
