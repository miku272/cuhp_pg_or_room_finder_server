const routeNotFoundTemplate = (method: string, url: string): string => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 Not Found</title>
    <style>
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #FAFAFA; /* lightBackground */
            color: #333333; /* lightOnBackground */
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            background-color: #FFFFFF; /* lightSurface */
            padding: 40px 30px;
            border-radius: 12px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }
        .brand-name {
            color: #1E824C; /* lightPrimary */
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        h1 {
            color: #1E824C; /* lightPrimary */
            font-size: 24px;
            margin-bottom: 15px;
        }
        p {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        code {
            background-color: #E0E0E0; /* lightDivider */
            color: #333333; /* lightOnBackground */
            padding: 3px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
        .divider {
            height: 1px;
            background-color: #E0E0E0; /* lightDivider */
            margin: 25px 0;
        }
        .footer {
            font-size: 14px;
            color: #666666; /* Lighter text */
        }
        a {
            color: #FF9800; /* lightAccent */
            text-decoration: none;
            font-weight: bold;
        }
        a:hover {
            text-decoration: underline;
        }
         @media only screen and (max-width: 480px) {
            .container {
                padding: 30px 20px;
            }
             .brand-name {
                font-size: 24px;
            }
            h1 {
                font-size: 22px;
            }
            p {
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="brand-name">CUHP PG or Room Finder</div>
        <h1>Oops! 404 - Page Not Found</h1>
        <p>Sorry, the resource you tried to access does not exist.</p>
        <p>Cannot ${method} <code>${url}</code></p>
        <div class="divider"></div>
        <div class="footer">
            <p>If you think this is an error, please contact support.</p>
            <p>© ${new Date().getFullYear()} CUHP PG or Room Finder. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

export default routeNotFoundTemplate;
