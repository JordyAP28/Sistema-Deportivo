<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Gates de roles basados en el modelo Usuario->rol->nombre
        Gate::define('admin', function ($user) {
            return optional($user->rol)->nombre === 'admin';
        });

        Gate::define('secretaria', function ($user) {
            return optional($user->rol)->nombre === 'secretaria';
        });

        Gate::define('admin-o-secretaria', function ($user) {
            $nombreRol = optional($user->rol)->nombre;
            return in_array($nombreRol, ['admin', 'secretaria'], true);
        });
    }
}
