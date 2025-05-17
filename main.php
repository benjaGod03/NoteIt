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
    $correo = $_SESSION['correo'] ?? '';
    $uuid = $_POST['uuid'] ?? '';
    $response = ['success' => false, 'message' => ''];
    if (empty($correo) || empty($uuid)) {
        $response['message'] = 'Correo y uuid son obligatorios.';
    } else {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // Establecer zona horaria de MySQL a GMT-3 (Argentina)
            $pdo->exec("SET time_zone = '-03:00'");
            $query = "DELETE FROM notas WHERE uuid = :uuid AND correo = :correo";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':uuid', $uuid);
            $stmt->bindParam(':correo', $correo);
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

// Guardar nota si se recibe por POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && (!isset($_POST['accion']) || $_POST['accion'] !== 'eliminar')) {
    $titulo = $_POST['titulo'] ?? '';
    $contenido = $_POST['contenido'] ?? '';
    $correo = $_SESSION['correo'] ?? '';
    $uuid = $_POST['uuid'] ?? '';
    $response = ['success' => false, 'message' => ''];

    if (empty($titulo) || empty($contenido) || empty($correo) || empty($uuid)) {
        $response['message'] = 'Título, contenido, correo y uuid son obligatorios.';
    } else {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // Establecer zona horaria de MySQL a GMT-3 (Argentina)
            $pdo->exec("SET time_zone = '-03:00'");
            // Verificar si ya existe una nota con ese uuid y correo
            $queryCheck = "SELECT COUNT(*) as existe FROM notas WHERE uuid = :uuid AND correo = :correo";
            $stmtCheck = $pdo->prepare($queryCheck);
            $stmtCheck->bindParam(':uuid', $uuid);
            $stmtCheck->bindParam(':correo', $correo);
            $stmtCheck->execute();
            $rowCheck = $stmtCheck->fetch(PDO::FETCH_ASSOC);
            if ($rowCheck && $rowCheck['existe'] > 0) {
                // Si existe, actualizar la nota y la fecha
                $query = "UPDATE notas SET titulo = :titulo, contenido = :contenido, fecha = NOW() WHERE uuid = :uuid AND correo = :correo";
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(':titulo', $titulo);
                $stmt->bindParam(':contenido', $contenido);
                $stmt->bindParam(':uuid', $uuid);
                $stmt->bindParam(':correo', $correo);
                $stmt->execute();
                $response['success'] = true;
                $response['message'] = 'Nota actualizada correctamente.';
                $response['uuid'] = $uuid;
            } else {
                // Si no existe, insertar la nueva nota
                $query = "INSERT INTO notas (uuid, titulo, contenido, correo) VALUES (:uuid, :titulo, :contenido, :correo)";
                $stmt = $pdo->prepare($query);
                $stmt->bindParam(':uuid', $uuid);
                $stmt->bindParam(':titulo', $titulo);
                $stmt->bindParam(':contenido', $contenido);
                $stmt->bindParam(':correo', $correo);
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

// Mostrar notas del usuario conectado
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'listar') {
    $correo = $_SESSION['correo'] ?? '';
    $response = ['success' => false, 'notas' => [], 'message' => ''];
    if (empty($correo)) {
        $response['message'] = 'Usuario no autenticado.';
    } else {
        try {
            $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            // Establecer zona horaria de MySQL a GMT-3 (Argentina)
            $pdo->exec("SET time_zone = '-03:00'");
            $query = "SELECT uuid, titulo, contenido, fecha FROM notas WHERE correo = :correo ORDER BY fecha DESC";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':correo', $correo);
            $stmt->execute();
            $notas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $response['success'] = true;
            $response['notas'] = $notas;
        } catch (PDOException $e) {
            $response['message'] = 'Error al obtener las notas: ' . $e->getMessage();
        }
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit();
}
include 'main.html';

