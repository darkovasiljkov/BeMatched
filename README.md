# BeMatched

**Discover people. Find mutual interest. Make a connection.**

BeMatched is a full-stack dating app built with Angular and ASP.NET Core. It brings member discovery, profile management, and mutual likes together in a clean, responsive interface.

![BeMatched landing page artwork](Client/public/landing-page-hero.png)

## Highlights

- Register and sign in with JWT authentication.
- Browse member profiles with server-side pagination, age and gender filters, and sorting by recent activity or join date. Filters are remembered in the browser.
- Edit a profile and manage photos through Cloudinary.
- Like or unlike a member, then explore **Mutual**, **Liked**, and **Liked me** lists with pagination.
- Navigate to the Messages page or a member's Messages tab from their profile.

The API uses Entity Framework Core with SQLite, and the client uses Angular standalone components, Tailwind CSS, and DaisyUI.

## Run locally

You'll need the **.NET 10 SDK**, **Node.js with npm**, and a trusted local HTTPS certificate. Cloudinary credentials are needed if you want to upload or delete photos.

1. From the repository root, start the API:

   ```bash
   dotnet run --project API --launch-profile https
   ```

   The API runs at `https://localhost:5001`. On first start it applies EF Core migrations and seeds demo members if the database is empty. The included development configuration supplies the local SQLite connection and a development JWT key; use your own secrets outside local development.

2. In another terminal, start the client:

   ```bash
   cd Client
   npm ci
   npm start
   ```

   Open `https://localhost:4200`. The Angular development server expects `Client/ssl/localhost.pem` and `Client/ssl/localhost-key.pem`; replace them with your own locally trusted certificate and key if your browser rejects the included development certificate.

3. Sign in with a seeded account such as `lisa@test.com` / `Pa$$w0rd`, or register a new account. The seeded credentials are for local development only.

For photo uploads, configure `CloudinarySettings:CloudName`, `CloudinarySettings:ApiKey`, and `CloudinarySettings:ApiSecret` for the API using local user secrets or environment variables. The API request examples in [`API/likesRequests.http`](API/likesRequests.http) can be run with the VS Code REST Client extension.

## Where the code lives

| Area | Purpose |
| --- | --- |
| [`API/Controllers`](API/Controllers) | HTTP endpoints for accounts, members, and likes |
| [`API/Data`](API/Data) | EF Core context, repositories, migrations, and demo seed data |
| [`Client/src/features`](Client/src/features) | Pages and member-facing UI |
| [`Client/src/core`](Client/src/core) | API services, authentication guard, and interceptors |

## TODO

- ASP.NET Core Identity
- SignalR
- Unit of Work
