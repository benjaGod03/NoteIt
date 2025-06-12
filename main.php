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
    if(isset($_POST['id_grupo']) && !empty($_POST['id_grupo'])){
        $autor = $_POST['id_grupo'] ?? '';} 
    else{
    $autor = $_SESSION['correo'] ?? '';
    }
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
            $queryHistorial = "DELETE FROM notas_historial where uuid = :uuid AND autor = :autor";
            $stmtHistorial = $pdo->prepare($queryHistorial);
            $stmtHistorial->bindParam(':uuid', $uuid);
            $stmtHistorial->bindParam(':autor', $autor);
            $stmtHistorial->execute();
            $query = "DELETE FROM notas WHERE uuid = :uuid AND autor = :autor";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':uuid', $uuid);
            $stmt->bindParam(':autor', $autor);
            $stmt->execute();
            if ($stmt->rowCount() > 0) {
                $response['success'] = true;
                $response['message'] = 'Nota eliminada correctamente.';
            } else {
                $response['success'] = true;
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
        $editor = $_SESSION['usuario'] ?? '';
    } else {
        $autor = $_SESSION['correo'] ?? '';
        $editor = ' ';
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
                // Si existe, actualizar la nota y la fecha, ademas guardar la nota en el historial
                if($editor != ' '){ 
                $queryhistorial = "INSERT INTO notas_historial (uuid, titulo, contenido, autor, fecha,editor) 
                SELECT uuid, titulo, contenido, autor,fecha,editor  FROM notas WHERE uuid = :uuid AND autor = :autor";
                $stmtHistorial = $pdo->prepare($queryhistorial);
                $stmtHistorial->bindParam(':uuid', $uuid);
                $stmtHistorial->bindParam(':autor', $autor);
                $stmtHistorial->execute();
                }
                $query = "UPDATE notas SET titulo = :titulo, contenido = :contenido, fecha = NOW(),editor=:editor WHERE uuid = :uuid AND autor = :autor";
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(':titulo', $titulo);
                $stmt->bindParam(':contenido', $contenido);
                $stmt->bindParam(':uuid', $uuid);
                $stmt->bindParam(':autor', $autor);
                $stmt->bindParam(':editor', $editor);
                $stmt->execute();
                $response['success'] = true;
                $response['message'] = 'Nota actualizada correctamente.';
                $response['uuid'] = $uuid;
            } else {
                // Si no existe, insertar la nueva nota
                $query = "INSERT INTO notas (uuid, titulo, contenido, autor, editor) VALUES (:uuid, :titulo, :contenido, :autor, :editor)";
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(':uuid', $uuid);
                $stmt->bindParam(':titulo', $titulo);
                $stmt->bindParam(':contenido', $contenido);
                $stmt->bindParam(':autor', $autor);
                $stmt->bindParam(':editor', $editor);
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
    $usuarioActual = $_SESSION['usuario'] ??'';
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
                //Cambiar todas las referencias al nombre de usuario de los editores
                $queryBackground = "UPDATE notas SET editor = :nuevoNombre where editor =:usuarioActual";
                $stmtBackground = $pdo->prepare($queryBackground);
                $stmtBackground->bindParam('nuevoNombre', $nuevoNombre);
                $stmtBackground->bindParam('usuarioActual', $usuarioActual);
                $stmtBackground->execute();
                $queryBackgroundHistorial = "UPDATE notas_historial SET editor = :nuevoNombre where editor =:usuarioActual";
                $stmtBackgroundHistorial = $pdo->prepare($queryBackgroundHistorial);
                $stmtBackgroundHistorial->bindParam('nuevoNombre', $nuevoNombre);
                $stmtBackgroundHistorial->bindParam('usuarioActual', $usuarioActual);
                $stmtBackgroundHistorial->execute();
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
            $query = "SELECT uuid, titulo, contenido, fecha, editor FROM notas WHERE autor = :autor ORDER BY fecha DESC";
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
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'abandonar_grupo') {
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
            if (!$grupo || $grupo['creador'] == $correo) {
                $stmtM = $pdo->prepare("SELECT miembro FROM grupo_miembros WHERE id_grupo = :idGrupo");
                $stmtM->bindParam(':idGrupo', $idGrupo);
                $stmtM->execute();
                $miembros = $stmtM->fetchAll(PDO::FETCH_COLUMN);
                if (count($miembros) == 1) { $stmtEliminar = $pdo->prepare ("DELETE FROM grupo_miembros where id_grupo = :idGrupo");
                    $stmtEliminar->bindParam(':idGrupo', $idGrupo);
                    $stmtEliminar->execute();
                    $stmtNotasHistorial = $pdo->prepare('DELETE FROM notas_historial WHERE autor = :idGrupo');
                    $stmtNotasHistorial->bindParam(':idGrupo', $idGrupo);
                    $stmtNotasHistorial->execute();
                    $stmtNotas = $pdo->prepare('DELETE FROM notas WHERE autor = :idGrupo');
                    $stmtNotas->bindParam(':idGrupo', $idGrupo);
                    $stmtNotas->execute();
                    $stmtEliminar = $pdo->prepare("DELETE FROM grupos where id = :idGrupo");
                    $stmtEliminar->bindParam(':idGrupo', $idGrupo);
                    $stmtEliminar->execute();
                    $response['success'] = true;
                    $response['message'] = 'El grupo ha sido eliminado correctamente.';
                } 
                else{$response['message'] = 'El creador no puede abandonar un grupo que aun tiene miembros.';}
            } else { $stmtEliminarM = $pdo->prepare('DELETE FROM grupo_miembros WHERE id_grupo = :idGrupo and miembro = :miembro');
                $stmtEliminarM->bindParam(':miembro', $correo);
                $stmtEliminarM->bindParam(':idGrupo', $idGrupo);
                $stmtEliminarM->execute();
                $response['success'] = true;
                $response['message'] = 'Has abandonado el grupo correctamente.';
            }
        } catch (PDOException $e) {
            $response['message'] = 'Error al eliminar el grupo: ' . $e->getMessage();
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();}

//Recuperar miembros de un grupo.
if($_SERVER['REQUEST_METHOD'] === 'GET' && isset ( $_GET['action'] ) && $_GET['action'] === 'miembros_grupo') {
    $idGrupo = $_GET['id_grupo'] ?? '';
    $response = ['success' => false, 'miembros' => [], 'message' => ''];
    if (empty($idGrupo)) {
        $response['message'] = 'ID de grupo es obligatorio.';
    } else {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("SET time_zone = '-03:00'");
            $query = "SELECT d.usuario,d.correo FROM datos d JOIN grupo_miembros g ON d.correo=g.miembro WHERE g.id_grupo = :idGrupo";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':idGrupo', $idGrupo);
            $stmt->execute();
            $miembros = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if ($miembros) {
                $response['success'] = true;
                $response['miembros'] = $miembros;
            } else {
                $response['message'] = 'No se encontraron miembros para este grupo.';
            }
        } catch (PDOException $e) {
            $response['message'] = 'Error al obtener los miembros del grupo: ' . $e->getMessage();
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();}

//Expulsar a un miembro de un grupo, siempre que seas el creador.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'expulsar_miembro') {
    $correo = $_SESSION['correo'] ?? '';
    $idGrupo = $_GET['id_grupo'] ?? '';
    $miembro = $_GET['miembro'] ?? '';
    $response = ['success' => false, 'message' => ''];
    if (empty($correo) || empty($idGrupo) || empty($miembro)) {
        $response['message'] = 'Faltan datos para expulsar al miembro.';
    } else {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("SET time_zone = '-03:00'");
            // Solo el creador del grupo puede expulsar miembros
            $stmt = $pdo->prepare("SELECT creador FROM grupos WHERE id = :idGrupo");
            $stmt->bindParam(':idGrupo', $idGrupo);
            $stmt->execute();
            $grupo = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$grupo || $grupo['creador'] !== $correo) {
                $response['message'] = 'Solo el creador puede expulsar miembros.';
            } else {
                // Eliminar al miembro del grupo
                $stmtMiembro = $pdo->prepare("DELETE FROM grupo_miembros WHERE id_grupo = :idGrupo AND miembro = :miembro");
                $stmtMiembro->bindParam(':idGrupo', $idGrupo);
                $stmtMiembro->bindParam(':miembro', $miembro);
                if ($stmtMiembro->execute()) {
                    if ($stmtMiembro->rowCount() > 0) {
                        $response['success'] = true;
                    } else {
                        $response['message'] = 'El miembro no pertenece a este grupo.';
                    }
                } else {
                    $response['message'] = 'Error al expulsar al miembro.';
                }
            }
        } catch (PDOException $e) {
            $response['message'] = 'Error al expulsar al miembro: ' . $e->getMessage();
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

//Obtener todas las notas del historial de una nota
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'historial_nota'){
    $uuid = $_GET['uuid'] ?? '';
    $response = ['success' => false, 'historial' => [], 'message' => ''];
    if (empty($uuid)) {
        $response['message'] = 'UUID de la nota es obligatorio.';
    } else {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("SET time_zone = '-03:00'");
            $query = "SELECT * FROM notas_historial WHERE uuid = :uuid ORDER BY fecha DESC";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':uuid', $uuid);
            $stmt->execute();
            $historial = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if ($historial) {
                $response['success'] = true;
                $response['historial'] = $historial;
            } else {
                $response['message'] = 'No se encontró historial para esta nota.';
            }
        } catch (PDOException $e) {
            $response['message'] = 'Error al obtener el historial de la nota: ' . $e->getMessage();
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

//Guardar la nueva foto de perfil del usuario y eliminar la anterior.
if($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'guardar_foto'){
   $usuario = $_SESSION['correo'] ?? '';
   $response = ['success' => false];
   if(empty($usuario) || !isset($_FILES['foto'])){
       $response['message'] = 'Foto y usuario son obligatorios.';
   } else {
        $uploadsDir = __DIR__ . '/uploads/';
        if (!is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0777, true);
        }
        $fileTmp = $_FILES['foto']['tmp_name'];
        $fileName = uniqid('foto_') . '_' . basename($_FILES['foto']['name']);
        $destPath = $uploadsDir . $fileName;
        $rutaRelativa = 'uploads/' . $fileName;
        if (move_uploaded_file($fileTmp, $destPath)) {
            try {
                $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $pdo->exec("SET time_zone = '-03:00'");
                $queryeliminar = "SELECT foto from datos WHERE correo = :correo";
                $stmteliminar = $pdo->prepare($queryeliminar);
                $stmteliminar->bindParam(':correo', $usuario);
                $stmteliminar->execute();
                $fotoActual = $stmteliminar->fetchColumn();
                if (!empty($fotoActual)) {
                    $rutaCompleta = __DIR__ . '/' . $fotoActual;
                    if (file_exists($rutaCompleta)) {
                        unlink($rutaCompleta);
                    }
                }
                $query = "UPDATE datos SET foto = :foto WHERE correo = :correo";
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(':foto', $rutaRelativa);
                $stmt->bindParam(':correo', $usuario);
                if ($stmt->execute()) {
                    $_SESSION['foto'] = $rutaRelativa;
                    $response['success'] = true;
                    $response['fotoPerfil'] = $rutaRelativa;
                } else {
                    $response['message'] = 'Error al actualizar la ruta en la base de datos.';
                }
            } catch (PDOException $e) {
                $response['message'] = 'Error al guardar la foto: ' . $e->getMessage();
            }
        } else {
            $response['message'] = 'Error al mover el archivo al servidor.';
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

//Obtener foto del usuario conectado
if($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'obtener_foto'){
    $usuario = $_SESSION['correo'] ?? '';
    $response = ['success' => false, 'foto' => '', 'message' => ''];
    if (empty($usuario)) {
        $response['message'] = 'Usuario no autenticado.';
    } else {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("SET time_zone = '-03:00'");
            $query = "SELECT foto FROM datos WHERE correo = :correo";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':correo', $usuario);
            $stmt->execute();
            $foto = $stmt->fetchColumn();
            if ($foto) {
                $response['success'] = true;
                $response['foto'] = $foto;
            } else {
                $response['message'] = 'No se encontró la foto del usuario.';
            }
        } catch (PDOException $e) {
            $response['message'] = 'Error al obtener la foto: ' . $e->getMessage();
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}


//Restaurar la nota a la version seleccionada
if($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST) && $_POST['accion'] === 'restaurar_version'){
    $uuid = $_POST['uuid'] ?? '';
    $fecha = $_POST['fecha'] ?? '';
    $response = ['success' => false, 'message' => ''];
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->exec("SET time_zone = '-03:00'");
        // Verificar si existe una versión en el historial
        $queryHistorial = "SELECT titulo, contenido, editor FROM notas_historial WHERE uuid = :uuid AND fecha = :fecha";
        $stmtHistorial = $pdo->prepare($queryHistorial);
        $stmtHistorial->bindParam(':uuid', $uuid);
        $stmtHistorial->bindParam(':fecha', $fecha);
        $stmtHistorial->execute();
        $version = $stmtHistorial->fetch(PDO::FETCH_ASSOC);
        if ($version) {
            // Actualizar la nota con la versión restaurada y la fecha original
            $queryUpdate = "UPDATE notas SET titulo = :titulo, contenido = :contenido, fecha = :fecha, editor =:editor WHERE uuid = :uuid";
            $stmtUpdate = $pdo->prepare($queryUpdate);
            $stmtUpdate->bindParam(':titulo', $version['titulo']);
            $stmtUpdate->bindParam(':contenido', $version['contenido']);
            $stmtUpdate->bindParam(':fecha', $fecha);
            $stmtUpdate->bindParam(':editor', $version['editor']);
            $stmtUpdate->bindParam(':uuid', $uuid);
            if ($stmtUpdate->execute()) {
                $response['success'] = true;
                $response['message'] = 'Nota restaurada correctamente.';
            } else {
                $response['message'] = 'Error al restaurar la nota.';
            }
            $queryeliminar = "DELETE FROM notas_historial WHERE uuid = :uuid AND fecha = :fecha";
            $stmteliminar = $pdo->prepare($queryeliminar);
            $stmteliminar->bindParam(':uuid', $uuid);
            $stmteliminar->bindParam(':fecha', $fecha);
            $stmteliminar->execute();
        } else {
            $response['message'] = 'No se encontró la versión especificada en el historial.';
        }
    } catch (PDOException $e) {
        $response['message'] = 'Error al restaurar la versión: ' . $e->getMessage();
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

//Compartir nota a un grupo
if($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'mover_nota'){
    $uuid = $_POST['uuid'] ?? '';
    $id_grupo = $_POST['id_grupo'] ?? '';
    $editor = $_SESSION['usuario'] ?? '';
    $nuevoUuid = $_POST['nuevo_uuid'] ?? '';
    $response = ['success' => false, 'message' => ''];
    if(empty($uuid) || empty($id_grupo)){
        $response['message'] = 'UUID y ID de grupo son obligatorios.';
    } else {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("SET time_zone = '-03:00'");
            //Insertar la nota en el grupo con un nuevo UUID
            $queryInsert = "INSERT INTO notas (uuid, titulo, contenido, autor, editor) SELECT :nuevoUuid,titulo,contenido,:id_grupo,:editor FROM notas WHERE uuid = :uuid";
            $stmtInsert = $pdo->prepare($queryInsert);
            $stmtInsert->bindParam(':uuid', $uuid);
            $stmtInsert->bindParam(':id_grupo', $id_grupo);
            $stmtInsert->bindParam(':editor', $editor);
            $stmtInsert->bindParam(':nuevoUuid', $nuevoUuid);
            if ($stmtInsert->execute()) {
                if ($stmtInsert->rowCount() > 0) {
                    $response['success'] = true;
                    $response['message'] = 'Nota compartida correctamente en el grupo.';
                } else {
                    $response['message'] = 'No se pudo compartir la nota en el grupo.';
                }
            } 
        }catch (PDOException $e) {
            $response['message'] = 'Error al compartir la nota: ' . $e->getMessage();
        }
    } 
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}

if($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['accion']) && $_GET['accion'] === 'foto_editor'){
    $editor = $_GET['editor'] ?? '';
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); 
    $queryInsert = "SELECT foto FROM datos WHERE usuario = :editor";
    $stmtInsert = $pdo->prepare($queryInsert);
    $stmtInsert->bindParam(":editor", $editor);
    $stmtInsert->execute();
    $foto = $stmtInsert->fetchColumn();
    $response["success"] = true;
    $response["foto"] = $foto;
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}
include 'main.html';
