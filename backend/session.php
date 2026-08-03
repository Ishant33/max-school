<?php
session_start();
header('Content-Type: application/json');
echo json_encode(['logged' => !empty($_SESSION['cms_logged'])]);
