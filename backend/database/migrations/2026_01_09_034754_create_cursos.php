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
        Schema::create('cursos', function (Blueprint $table) {
            $table->bigIncrements('id_curso');
            $table->string('nombre');
            $table->string('slug')->unique();
            $table->text('descripcion')->nullable();
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->string('representante');
            $table->string('email_representante');
            $table->string('telefono_representante');
            $table->enum('tipo', ['teorico', 'practico', 'mixto']);
            $table->enum('estado', ['planificado', 'activo', 'finalizado', 'cancelado'])->default('planificado');
            $table->integer('cupo_maximo');
            $table->integer('cupo_actual')->default(0);
            $table->decimal('precio', 10, 2);
            $table->string('imagen')->nullable();
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
        Schema::dropIfExists('cursos');
    }
};
