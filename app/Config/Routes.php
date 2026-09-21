<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->get('/', 'Home::index');

// API Endpoints
$routes->post('api/visualize', 'Api\Visualize::index');
$routes->post('api/visualize/(:segment)/regenerate', 'Api\Regenerate::index/$1');
