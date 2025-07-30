<?php

/**
 * MailService Class
 * 
 * This service handles email functionality for the application using SendGrid.
 * It provides:
 * - Email verification functionality
 * - HTML email template generation
 */

require_once(__DIR__ . '/../../vendor/autoload.php');
require_once(__DIR__ . '/../config/MailConfig.php');

class MailService
{
    private $sendgrid;

    public function __construct()
    {
        if (!class_exists('\SendGrid')) {
            throw new Exception("SendGrid library not found. Run 'composer require sendgrid/sendgrid'");
        }

        $this->sendgrid = new \SendGrid(MailConfig::SENDGRID_API_KEY);
    }

    public function sendConfirmationEmail($userEmail, $username, $confirmationToken)
    {
        try {
            $email = new \SendGrid\Mail\Mail();
            $email->setFrom(MailConfig::FROM_EMAIL, MailConfig::FROM_NAME);
            $email->setSubject("Επιβεβαίωση Διεύθυνσης Email");
            $email->addTo($userEmail);

            // Add HTML content (in Greek)
            $email->addContent(
                "text/html",
                "
                <div style='
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 30px;
                    background-color: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    text-align: center;
                '>
                    <h2 style='
                        color: #333;
                        margin-bottom: 25px;
                        font-size: 28px;
                        font-weight: 600;
                    '>Καλώς ήρθατε στο " . MailConfig::FROM_NAME . "!</h2>
                    
                    <p style='
                        color: #666;
                        font-size: 16px;
                        line-height: 1.6;
                        margin-bottom: 10px;
                    '>Γειά σου {$username},</p>
                    
                    <p style='
                        color: #666;
                        font-size: 16px;
                        line-height: 1.6;
                        margin-bottom: 25px;
                    '>Παρακαλώ χρησιμοποίηστε τον παρακάτω κωδικό για να επιβεβαιώσετε τη διεύθυνση email σας:</p>
                    
                    <div style='
                        background-color: #f8f9fa;
                        padding: 25px;
                        margin: 30px auto;
                        border-radius: 10px;
                        border: 2px dashed #dee2e6;
                        display: inline-block;
                        max-width: 300px;
                    '>
                        <div style='
                            font-family: monospace;
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 6px;
                            color: #007bff;
                            user-select: all;
                        '>{$confirmationToken}</div>
                    </div>
                    
                    <p style='
                        color: #999;
                        font-size: 14px;
                        line-height: 1.4;
                        margin-top: 25px;
                        padding: 15px;
                        background-color: #f8f9fa;
                        border-radius: 8px;
                    '>
                        Ο κωδικός αυτός λήγει σε 1 λεπτό.<br>
                        Αν δεν δημιουργήσατε αυτόν το λογαριασμό, παρακαλώ αγνοήστε αυτό το email.
                    </p>
                </div>"
            );

            $response = $this->sendgrid->send($email);

            if ($response->statusCode() !== 202) {
                throw new Exception("Failed to send email. Status code: " . $response->statusCode());
            }

            return true;
        } catch (Exception $e) {
            error_log("SendGrid Error: " . $e->getMessage());
            throw new Exception("Failed to send email: " . $e->getMessage());
        }
    }

    public function sendPasswordResetEmail($userEmail, $resetToken)
    {
        try {
            $resetUrl = "http://localhost:3000/new-password?token={$resetToken}&email={$userEmail}";

            $email = new \SendGrid\Mail\Mail();
            $email->setFrom(MailConfig::FROM_EMAIL, MailConfig::FROM_NAME);
            $email->setSubject("Επαναφορά του Κωδικού σας");
            $email->addTo($userEmail);

            $email->addContent(
                "text/html",
                "
                <div style='
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    text-align: center;
                '>
                    <h2 style='
                        color: #333;
                        margin-bottom: 20px;
                        font-size: 24px;
                        font-weight: 600;
                    '>Επαναφορά Κωδικού</h2>
                    
                    <p style='
                        color: #666;
                        font-size: 16px;
                        line-height: 1.5;
                        margin-bottom: 15px;
                    '>Γειά σας,</p>
                    
                    <p style='
                        color: #666;
                        font-size: 16px;
                        line-height: 1.5;
                        margin-bottom: 25px;
                    '>Πρόσφατα ζητήσατε να επαναφέρετε τον κωδικό σας για τον λογαριασμό σας. Κάντε κλικ στο κουμπί παρακάτω για να τον επαναφέρετε.</p>
                    
                    <div style='margin: 35px 0;'>
                        <a href='{$resetUrl}' style='
                            background-color: #007bff;
                            color: #ffffff;
                            padding: 12px 30px;
                            border-radius: 6px;
                            text-decoration: none;
                            display: inline-block;
                            font-size: 16px;
                            font-weight: 500;
                            transition: background-color 0.3s ease;
                            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        '>Επαναφορά Κωδικού</a>
                    </div>

                    <div style='
                        margin: 25px auto;
                        padding: 15px;
                        background-color: #f8f9fa;
                        border: 1px solid #dee2e6;
                        border-radius: 4px;
                        max-width: 400px;
                    '>
                        <p style='
                            color: #666;
                            margin-bottom: 10px;
                            font-size: 14px;
                        '>Ή αντιγράψτε αυτό το URL:</p>
                        <code style='
                            display: block;
                            padding: 10px;
                            background-color: #ffffff;
                            border: 1px solid #ced4da;
                            border-radius: 4px;
                            font-family: monospace;
                            font-size: 12px;
                            color: #495057;
                            word-break: break-all;
                            text-align: left;
                        '>{$resetUrl}</code>
                    </div>
                    
                    <p style='
                        color: #666;
                        font-size: 14px;
                        line-height: 1.4;
                        margin-top: 25px;
                        padding: 15px;
                        background-color: #f8f9fa;
                        border-radius: 4px;
                    '>Εάν δεν ζητήσατε επαναφορά κωδικού, παρακαλώ αγνοήστε αυτό το email.</p>
                </div>"
            );

            $response = $this->sendgrid->send($email);
            return $response->statusCode() === 202;
        } catch (Exception $e) {
            throw new Exception("Email could not be sent. SendGrid Error: {$e->getMessage()}");
        }
    }
}
