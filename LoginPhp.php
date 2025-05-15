<?php
// Configuración de la base de datos
$host = 'sql213.byethost7.com'; // Cambia esto por tu host
$dbname = 'b7_38669112_prueba'; // Cambia esto por el nombre de tu base de datos
$username = 'b7_38669112'; // Cambia esto por tu usuario de la base de datos
$password = 'tietoN777'; // Cambia esto por tu contraseña de la base de datos

try {
    // Crear una conexión a la base de datos usando PDO
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Error al conectar con la base de datos: " . $e->getMessage());
}

// Verificar si se envió el formulario
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtener los datos del formulario
    $usuario = $_POST['usuario'] ?? '';
    $contrasena = $_POST['contrasena'] ?? '';

    // Verificar si el usuario existe en la base de datos
    $query = "SELECT * FROM datos WHERE usuario = :usuario";
    $stmt = $pdo->prepare($query);
    $stmt->bindParam(':usuario', $usuario);
    $stmt->execute();

    $usuarioEncontrado = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($usuarioEncontrado) {
        // Verificar la contraseña
        if (password_verify($contrasena, $usuarioEncontrado['contrasena'])) {
            echo 'Inicio de sesión exitoso';
            header('Location: main.html'); // Redirigir a la página principal
            exit();
        } else {
            echo 'Contraseña incorrecta';
        }
    } else {
        echo 'Usuario no encontrado';
    }
}