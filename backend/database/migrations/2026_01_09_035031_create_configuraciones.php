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
        Schema::create('configuraciones', function (Blueprint $table) {
            $table->bigIncrements('id_configuracion');
            $table->string('clave')->unique();
            $table->text('valor')->nullable();
            $table->enum('tipo', ['string', 'integer', 'boolean', 'json', 'array']);
            $table->string('grupo')->nullable();
            $table->text('descripcion')->nullable();
            $table->boolean('editable')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('configuraciones');
    }
};
