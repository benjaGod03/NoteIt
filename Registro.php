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
    $correo = $_POST['correo'] ?? '';
    $confirmarCorreo = $_POST['confirmar_correo'] ?? '';
    $contrasena = $_POST['contrasena'] ?? '';
    $confirmarContrasena = $_POST['confirmar_contrasena'] ?? '';

    $error = '';

    // Validar que los campos no estén vacíos
    if (empty($usuario) || empty($correo) || empty($confirmarCorreo) || empty($contrasena) || empty($confirmarContrasena)) {
        $error = 'Por favor, complete todos los campos.';
    } elseif ($correo !== $confirmarCorreo) {
        $error = 'Los correos electrónicos no coinciden.';
    } elseif ($contrasena !== $confirmarContrasena) {
        $error = 'Las contraseñas no coinciden.';
    } elseif (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        $error = 'El correo electrónico no es válido.';
    } else {
        // Verificar si el usuario ya existe en la base de datos
        $query = "SELECT COUNT(*) FROM datos WHERE usuario = :usuario";
        $stmt = $pdo->prepare($query);
        $stmt->bindParam(':usuario', $usuario);
        $stmt->execute();

        $usuarioExiste = $stmt->fetchColumn();

        if ($usuarioExiste) {
            $error = 'El nombre de usuario ya está en uso. Por favor, elija otro.';
        } else {
            // Cifrar la contraseña
            $contrasenaCifrada = password_hash($contrasena, PASSWORD_DEFAULT);

            // Insertar el nuevo usuario en la base de datos
            $query = "INSERT INTO datos (usuario, correo, contrasena) VALUES (:usuario, :correo, :contrasena)";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':usuario', $usuario);
            $stmt->bindParam(':correo', $correo);
            $stmt->bindParam(':contrasena', $contrasenaCifrada);

            if ($stmt->execute()) {
                echo 'Registro exitoso';
                header('Location: index.html');
                exit();
            } else {
                $error = 'Error al registrar el usuario.';
            }
        }
    }

    if (!empty($error)) {
        // Redirigir al formulario de registro con el mensaje de error en la URL
        header('Location: registrarse.html?error=' . urlencode($error));
        exit();
    }
}
?>
