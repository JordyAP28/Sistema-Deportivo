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
        Schema::create('archivos', function (Blueprint $table) {
            $table->bigIncrements('id_archivo');
            $table->string('archivable_type');
            $table->unsignedBigInteger('archivable_id');
            $table->enum('tipo', ['documento', 'imagen', 'video', 'audio', 'otro']);
            $table->string('nombre_original');
            $table->string('nombre_archivo');
            $table->string('ruta');
            $table->string('extension');
            $table->string('mime_type');
            $table->bigInteger('tamaño');
            $table->text('descripcion')->nullable();
            $table->unsignedBigInteger('usuario_id');
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('usuario_id')->references('id_usuario')->on('usuarios')->onDelete('cascade');
            $table->index(['archivable_type', 'archivable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('archivos');
    }
};
