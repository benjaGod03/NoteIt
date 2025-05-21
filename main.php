<?php
session_start();
// Configuración de la base de datos
$host = 'sql213.byethost7.com';
$dbname = 'b7_38669112_prueba';
$username = 'b7_38669112';
$password = 'tietoN777';

date_default_timezone_set('America/Argentina/Buenos_Aires');

// Eliminar nota si se recibe por POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'eliminar') {
    $autor = $_SESSION['correo'] ?? '';
    $uuid = $_POST['uuid'] ?? '';
    $response = ['success' => false, 'message' => ''];
    if (empty($autor) || empty($uuid)) {
        $response['message'] = 'Autor y uuid son obligatorios.';
    } else {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // Establecer zona horaria de MySQL a GMT-3 (Argentina)
            $pdo->exec("SET time_zone = '-03:00'");
            $query = "DELETE FROM notas WHERE uuid = :uuid AND autor = :autor";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':uuid', $uuid);
            $stmt->bindParam(':autor', $autor);
            $stmt->execute();
            if ($stmt->rowCount() > 0) {
                $response['success'] = true;
                $response['message'] = 'Nota eliminada correctamente.';
            } else {
                $response['message'] = 'No se encontró la nota para eliminar.';
            }
        } catch (PDOException $e) {
            $response['message'] = 'Error al eliminar la nota: ' . $e->getMessage();
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

// Guardar nota (usuario o grupo) si se recibe por POST
if (
    $_SERVER['REQUEST_METHOD'] === 'POST'
    && (!isset($_POST['accion'])
        || $_POST['accion'] === 'guardar_nota'
    )
) {
    $titulo = $_POST['titulo'] ?? '';
    $contenido = $_POST['contenido'] ?? '';
    $uuid = $_POST['uuid'] ?? '';
    // Determinar autor: si viene id_grupo, es nota de grupo; si no, es nota de usuario
    if (isset($_POST['id_grupo']) && !empty($_POST['id_grupo'])) {
        $autor = $_POST['id_grupo'];
    } else {
        $autor = $_SESSION['correo'] ?? '';
    }
    $response = ['success' => false, 'message' => ''];

    if (empty($titulo) || empty($contenido) || empty($autor) || empty($uuid)) {
        $response['message'] = 'Título, contenido, autor y uuid son obligatorios.';
    } else {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("SET time_zone = '-03:00'");
            // Verificar si ya existe una nota con ese uuid y autor
            $queryCheck = "SELECT COUNT(*) as existe FROM notas WHERE uuid = :uuid AND autor = :autor";
            $stmtCheck = $pdo->prepare($queryCheck);
            $stmtCheck->bindParam(':uuid', $uuid);
            $stmtCheck->bindParam(':autor', $autor);
            $stmtCheck->execute();
            $rowCheck = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            if ($rowCheck && $rowCheck['existe'] > 0) {
                // Si existe, actualizar la nota y la fecha
                $query = "UPDATE notas SET titulo = :titulo, contenido = :contenido, fecha = NOW() WHERE uuid = :uuid AND autor = :autor";
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(':titulo', $titulo);
                $stmt->bindParam(':contenido', $contenido);
                $stmt->bindParam(':uuid', $uuid);
                $stmt->bindParam(':autor', $autor);
                $stmt->execute();
                $response['success'] = true;
                $response['message'] = 'Nota actualizada correctamente.';
                $response['uuid'] = $uuid;
            } else {
                // Si no existe, insertar la nueva nota
                $query = "INSERT INTO notas (uuid, titulo, contenido, autor) VALUES (:uuid, :titulo, :contenido, :autor)";
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(':uuid', $uuid);
                $stmt->bindParam(':titulo', $titulo);
                $stmt->bindParam(':contenido', $contenido);
                $stmt->bindParam(':autor', $autor);
                $stmt->execute();
                $response['success'] = true;
                $response['message'] = 'Nota guardada correctamente.';
                $response['uuid'] = $uuid;
            }
        } catch (PDOException $e) {
            $response['message'] = 'Error al guardar la nota: ' . $e->getMessage();
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

// Actualizar nombre de usuario si se recibe por POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'actualizar_nombre') {
    $nuevoNombre = trim($_POST['nuevo_nombre'] ?? '');
    $correo = $_SESSION['correo'] ?? '';
    $response = ['success' => false, 'message' => ''];
    if (empty($nuevoNombre) || empty($correo)) {
        $response['message'] = 'El nombre y el correo son obligatorios.';
    } else if($nuevoNombre != $_SESSION['usuario'] && $nuevoNombre != " ") {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("SET time_zone = '-03:00'");
            // Verificar si el nombre ya existe para otro usuario
            $queryCheck = "SELECT COUNT(*) FROM datos WHERE usuario = :usuario AND correo != :correo";
            $stmtCheck = $pdo->prepare($queryCheck);
            $stmtCheck->bindParam(':usuario', $nuevoNombre);
            $stmtCheck->bindParam(':correo', $correo);
            $stmtCheck->execute();
            $existe = $stmtCheck->fetchColumn();
            if ($existe > 0) {
                $response['message'] = 'El nombre de usuario ya está en uso. Elige otro.';
            } else {
                $query = "UPDATE datos SET usuario = :usuario WHERE correo = :correo";
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(':usuario', $nuevoNombre);
                $stmt->bindParam(':correo', $correo);
                $stmt->execute();
                if ($stmt->rowCount() > 0) {
                    $_SESSION['usuario'] = $nuevoNombre;
                    $response['success'] = true;
                } else {
                    $response['message'] = 'No se pudo actualizar el nombre.';
                }
            }
        } catch (PDOException $e) {
            $response['message'] = 'Error al actualizar el nombre: ' . $e->getMessage();
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

// Crear grupo y agregar primer miembro
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'crear_grupo') {
    $nombreGrupo = trim($_POST['nombre_grupo'] ?? '');
    $creador = $_SESSION['correo'] ?? '';
    $response = ['success' => false, 'message' => ''];
    if (empty($nombreGrupo) || empty($creador)) {
        $response['message'] = 'Nombre de grupo y creador obligatorios.';
    } else {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("SET time_zone = '-03:00'");
            // Insertar grupo
            $queryGrupo = "INSERT INTO grupos (nombre, creador) VALUES (:nombre, :creador)";
            $stmtGrupo = $pdo->prepare($queryGrupo);
            $stmtGrupo->bindParam(':nombre', $nombreGrupo);
            $stmtGrupo->bindParam(':creador', $creador);
            $stmtGrupo->execute();
            $idGrupo = $pdo->lastInsertId();
            // Insertar primer miembro
            $queryMiembro = "INSERT INTO grupo_miembros (id_grupo, miembro) VALUES (:id_grupo, :miembro)";
            $stmtMiembro = $pdo->prepare($queryMiembro);
            $stmtMiembro->bindParam(':id_grupo', $idGrupo);
            $stmtMiembro->bindParam(':miembro', $creador);
            $stmtMiembro->execute();
            $response['success'] = true;
            $response['id_grupo'] = $idGrupo;
        } catch (PDOException $e) {
            $response['message'] = 'Error al crear el grupo: ' . $e->getMessage();
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

//mostrar el usuario en el perfil
$usuario = isset($_SESSION['usuario']) ? $_SESSION['usuario'] : '';

// Mostrar notas del usuario conectado
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'listar') {
    if($_GET['id_grupo']!='0'){$autor= $_GET['id_grupo'];}
    else{
        $autor = $_SESSION['correo'] ?? '';
    }
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // Establecer zona horaria de MySQL a GMT-3 (Argentina)
            $pdo->exec("SET time_zone = '-03:00'");
            $query = "SELECT uuid, titulo, contenido, fecha FROM notas WHERE autor = :autor ORDER BY fecha DESC";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':autor', $autor);
            $stmt->execute();
            $notas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $response['success'] = true;
            $response['notas'] = $notas;
        } catch (PDOException $e) {
            $response['message'] = 'Error al obtener las notas: ' . $e->getMessage();
        }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

// Obtener grupos a los que pertenece el usuario
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'listar_grupos') {
    $correo = $_SESSION['correo'] ?? '';
    $response = ['success' => false, 'grupos' => [], 'message' => ''];
    if (empty($correo)) {
        $response['message'] = 'Usuario no autenticado.';
    } else {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("SET time_zone = '-03:00'");
            $query = "SELECT g.id, g.nombre, g.creador FROM grupos g
                      INNER JOIN grupo_miembros gm ON g.id = gm.id_grupo
                      WHERE gm.miembro = :correo
                      ORDER BY g.nombre ASC";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':correo', $correo);
            $stmt->execute();
            $grupos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $response['success'] = true;
            $response['grupos'] = $grupos;
        } catch (PDOException $e) {
            $response['message'] = 'Error al obtener los grupos: ' . $e->getMessage();
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

//Enviar invitacion a grupo
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'buscar_usuario') {
    $usuario = $_POST['nombre'] ?? '';
    $idGrupo = (int)$_POST['id_grupo'];
    $correo = '';
    $remitente = $_SESSION['usuario'];
    $mensaje = "Has sido invitado a un grupo por $remitente";
    $response = ['success' => false, 'message' => '', 'debug' => ''];
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec("SET time_zone = '-03:00'");
        $query = "SELECT correo FROM datos WHERE usuario = :usuario";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':usuario', $usuario);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result && isset($result['correo'])) {
            $correo = $result['correo'];
            $queryNotif = "INSERT INTO notificaciones (correo_destino,contenido,idGrupo) VALUES (:correo,:mensaje,:idGrupo)";
            $stmtNotif = $pdo->prepare($queryNotif);
            $stmtNotif->bindParam(':correo', $correo);
            $stmtNotif->bindParam(':idGrupo', $idGrupo);
            $stmtNotif->bindParam(':mensaje', $mensaje);
            $stmtNotif->execute();
            $response['success'] = true;
            // No mostrar mensaje de éxito
        } else {
            $response['message'] = 'Usuario no encontrado.';
        }
    } catch (PDOException $e) {
        $response['message'] = 'Error al enviar la invitación: ' . $e->getMessage();
        $response['debug'] = 'Error en invitacion: ' . $e->getMessage();
    }
    // Log de depuración solo en caso de error
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

//Cargar las notificaiones al cargar la pagina
if($_SERVER['REQUEST_METHOD'] === 'GET' && $_GET['action'] === 'cargar_notificaciones'){
    $correo = $_SESSION['correo'] ?? '';
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $query = "SELECT * FROM notificaciones where correo_destino = :correo";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':correo', $correo);
    $stmt->execute();
    $notificaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $response['success'] = true;
    $response['notificaciones']= $notificaciones;
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
} 

//Agregar miembro a grupo
if($_SERVER['REQUEST_METHOD'] === 'GET' && $_GET['action'] === 'agregar_miembro'){
    $correo = $_SESSION['correo'] ??'';
    $idGrupo = $_GET['id_grupo'] ?? '';
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $query = "INSERT INTO grupo_miembros(id_grupo, miembro) VALUES (:id_grupo, :miembro)";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam("miembro", $correo);
    $stmt->bindParam("id_grupo", $idGrupo);
    $stmt->execute();
    $response['success'] = true;
    exit();
}

//Eliminar notificacion de la bdd
if($_SERVER['REQUEST_METHOD'] === 'GET' && $_GET["action"] ==='eliminar_notificacion'){
    $id = $_GET['id'] ?? '';
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $query = "DELETE FROM notificaciones WHERE id = :id";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam("id", $id);
    $stmt->execute();
    $response['success'] = true;
    exit();
}
// Eliminar grupo (y sus miembros y notas)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'eliminar_grupo') {
    $idGrupo = $_POST['id_grupo'] ?? '';
    $correo = $_SESSION['correo'] ?? '';
    $response = ['success' => false, 'message' => ''];
    if (empty($idGrupo) || empty($correo)) {
        $response['message'] = 'Faltan datos para eliminar el grupo.';
    } else {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("SET time_zone = '-03:00'");
            // Solo el creador puede eliminar el grupo
            $stmt = $pdo->prepare("SELECT creador FROM grupos WHERE id = :idGrupo");
            $stmt->bindParam(':idGrupo', $idGrupo);
            $stmt->execute();
            $grupo = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$grupo || $grupo['creador'] !== $correo) {
                $response['message'] = 'Solo el creador puede eliminar el grupo.';
            } else {
                // Eliminar notas del grupo
                $stmtNotas = $pdo->prepare("DELETE FROM notas WHERE autor = :idGrupo");
                $stmtNotas->bindParam(':idGrupo', $idGrupo);
                $stmtNotas->execute();
                // Eliminar miembros del grupo
                $stmtMiembros = $pdo->prepare("DELETE FROM grupo_miembros WHERE id_grupo = :idGrupo");
                $stmtMiembros->bindParam(':idGrupo', $idGrupo);
                $stmtMiembros->execute();
                // Eliminar el grupo
                $stmtGrupo = $pdo->prepare("DELETE FROM grupos WHERE id = :idGrupo");
                $stmtGrupo->bindParam(':idGrupo', $idGrupo);
                $stmtGrupo->execute();
                $response['success'] = true;
            }
        } catch (PDOException $e) {
            $response['message'] = 'Error al eliminar el grupo: ' . $e->getMessage();
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}include 'main.html';
