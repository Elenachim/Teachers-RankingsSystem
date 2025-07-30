<?php
//Handles different server configurations and ways Authorization headers might be sent.

function getAuthorizationHeader()
{
    $headers = null;

    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["REDIRECT_HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }

    return $headers;
}

function validateApiKey($conn)
{
    $apiKey = getAuthorizationHeader();

    if (!$apiKey) {
        http_response_code(401);
        echo json_encode(["error" => "Missing Authorization header"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT * FROM apikey WHERE apikey = ? AND isactive = 1");
    $stmt->bind_param("s", $apiKey);
    $stmt->execute();
    $result = $stmt->get_result();

    if (!$result || $result->num_rows === 0) {
        http_response_code(403);
        echo json_encode(["error" => "Invalid or inactive API key"]);
        exit;
    }

    return $result->fetch_assoc();
}
