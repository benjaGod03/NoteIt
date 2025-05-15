console.log('El archivo jsLogin.js se ha cargado correctamente');

//abrir y cerrar ojo
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeClosed.classList.add('hidden');
        eyeOpen.classList.remove('hidden');
    } else {
        passwordInput.type = 'password';
        eyeClosed.classList.remove('hidden');
        eyeOpen.classList.add('hidden');
    }
}



