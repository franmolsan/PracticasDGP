<?php
    require_once '../vendor/autoload.php';
    include_once("operaciones_api/autenticacionApi.php");
    require_once 'php/mostrarFotoPerfil.php';
    $loader = new \Twig\Loader\FilesystemLoader('templates');
    $twig = new \Twig\Environment($loader);

    session_start();

    if(isset($_SESSION['usuario'])){
        $infoFacilitador = array();
        $infoFacilitador['username'] = $_SESSION['usuario'];
        $jsoninfoFacilitador = json_encode($infoFacilitador);
        $listado_usernames = misSociosApi($jsoninfoFacilitador);
        $rol = $_SESSION['rol'];
        $listado_nombres = array();
        
        foreach($listado_usernames as $username){
            $infoUser['username'] = $username;
            $infoUserJson = json_encode($infoUser);
            $perfilSocio = obtenerInfoUsuariosApi($infoUserJson);
            $nombreSocio = $perfilSocio[0]->nombre;

            array_push($listado_nombres, $nombreSocio);
		}
    }
    
    echo $twig->render('missocios.html', ['listadoNombres' => $listado_nombres, 'listadoUsernames' => $listado_usernames, 'rol' => $rol, 'img' => fotoPerfil($_SESSION['usuario']), 'cuenta' => $_SESSION['usuario']]);
?>