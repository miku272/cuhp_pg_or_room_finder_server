const otpEmailTemplate = (otp: string): string => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        .container {
            padding: 40px 20px;
            font-family: 'Segoe UI', Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            background-color: #FAFAFA;
        }
        .logo-container {
            text-align: center;
            margin-bottom: 30px;
        }
        .brand-name {
            color: #1E824C;
            font-size: 24px;
            font-weight: bold;
            margin: 10px 0;
        }
        .card {
            background-color: #FFFFFF;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            color: #333333;
            text-align: center;
            font-size: 22px;
            margin-bottom: 20px;
        }
        .description {
            color: #666666;
            text-align: center;
            margin-bottom: 25px;
            line-height: 1.6;
        }
        .otp-box {
            background-color: #1E824C;
            color: #FFFFFF;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
            font-size: 32px;
            letter-spacing: 4px;
            font-weight: bold;
        }
        .footer {
            color: #666666;
            font-size: 13px;
            text-align: center;
            margin-top: 30px;
            line-height: 1.5;
        }
        .accent-text {
            color: #FF9800;
        }
        .divider {
            height: 1px;
            background-color: #E0E0E0;
            margin: 20px 0;
        }
        @media only screen and (max-width: 480px) {
            .container {
                padding: 20px 10px;
            }
            .card {
                padding: 20px;
            }
            .otp-box {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="logo-container">
                <div class="brand-name">CUHP PG Finder</div>
            </div>
            <h2 class="header">Verify Your Email</h2>
            <p class="description">Please use the following verification code to complete your email verification process.</p>
            <div class="otp-box">
                ${otp}
            </div>
            <p class="description">This code will expire in <span class="accent-text">10 minutes</span>.</p>
            <div class="divider"></div>
            <div class="footer">
                <p>If you didn't request this verification, please ignore this email.</p>
                <p>© ${new Date().getFullYear()} CUHP PG or Room Finder. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

export default otpEmailTemplate;
