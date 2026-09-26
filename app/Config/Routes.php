<?php

use CodeIgniter\Router\RouteCollection;

/** @var RouteCollection $routes */
$routes->match(['get', 'head'], '/', 'Home::index');

// API Endpoints - support both with and without 'api/' prefix for serverless environments
$routes->post('api/visualize', 'Api\Visualize::index');
$routes->post('visualize', 'Api\Visualize::index');
$routes->post('api/visualize/(:segment)/regenerate', 'Api\Regenerate::index/$1');
$routes->post('visualize/(:segment)/regenerate', 'Api\Regenerate::index/$1');
