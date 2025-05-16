<?php
session_start();
$usuario = isset($_SESSION['usuario']) ? $_SESSION['usuario'] : '';
include 'profile.html';
?>