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
        Schema::create('lesiones', function (Blueprint $table) {
            $table->bigIncrements('id_lesion');
            $table->unsignedBigInteger('id_deportista');
            $table->string('tipo_lesion');
            $table->string('zona_afectada');
            $table->date('fecha_lesion');
            $table->date('fecha_recuperacion_estimada')->nullable();
            $table->date('fecha_alta')->nullable();
            $table->text('descripcion')->nullable();
            $table->text('tratamiento')->nullable();
            $table->enum('gravedad', ['leve', 'moderada', 'grave', 'muy_grave']);
            $table->enum('estado', ['activa', 'en_recuperacion', 'curada', 'cronica'])->default('activa');
            $table->string('medico_tratante')->nullable();
            $table->text('observaciones')->nullable();
            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('id_deportista')->references('id_deportista')->on('deportistas')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lesiones');
    }
};
