<?php

// Global config helper function
if (!function_exists('config')) {
    function config($key, $default = null) {
        return \App\Helpers\Config::get($key, $default);
    }
}
