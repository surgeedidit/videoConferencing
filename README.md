# oakpark-backend

> Backend server for the OakPark video conferencing web application.

This is a Node.js backend built with Express, TypeScript, and Docker, using `TypeDI` for dependency injection and a clean project structure for scalability.

---

## 📦 Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/OAKPARK-CONFERNCING/oakpark-backend.git
cd oakpark-backend

```

### 2. Install Dependencies

- Ensure you have yarn installed (npm install yarn) then run:

```bash

yarn install

```

Application is dependent on REDIS, MongoDB, ensure you have those or spin their containers up with docker-compose by running:

```bash

docker-compose up -d

```
The above runs docker compose in detach mode
### 3. Environment Variables

- Create a .env file using the provided .env.sample as reference

    ```bash

      cp .env.sample .env

    ```

### 4. Running the App

Start Backend server in Development Mode (with watch)

```bash

yarn start:server

```

Start Workers

```bash

yarn start:workers

```

Start both Development Server and Workers

```bash

yarn start:dev

```

start in production Mode

```bash

yarn start

```

Build for Production

```bash

yarn build

```

### 5. Code Quality

Run ESLint

```bash

yarn lint

```

Auto-fix Lint Issues

```bash

yarn lint:fix

```

Format Code with Prettier

```bash

yarn format

```

### 6. Docker Setup (Optional)

To spin up mongodb and mongo admin using docker compose:

```bash

docker compose up -d

```

Ensure Docker and Docker Compose are installed and running on your system.

#### 📁 Project Structure (Work in Progress)

```bash

.
├── api
│   ├── index.ts
│   └── routes
│       ├── authRoutes
│       │   ├── auth.ts
│       │   └── oauth.ts
│       ├── roomRoutes
│       │   └── room.ts
│       └── userRoutes
├── app.ts
├── config
│   ├── databaseConfig.ts
│   ├── dependencyInjection.ts
│   ├── emailConfig.ts
│   ├── env.ts
│   ├── redisConnection.ts
│   ├── redisSessionStore.ts
│   ├── swaggerConfig.ts
│   └── winston.logger.ts
├── controllers
│   ├── authController.ts
│   ├── oauthController.ts
│   └── roomController.ts
├── docs
│   ├── auth.yaml
│   ├── meeting.yaml
│   └── oauth.yaml
├── dtos
│   ├── auth.dto.ts
│   └── room.dto.ts
├── jobs
│   ├── queue.ts
│   └── workers.ts
├── middlewares
│   ├── authMiddleware.ts
│   ├── errorHandlerMiddleware.ts
│   └── tempAuth.ts
├── models
│   ├── AuthToken.ts
│   ├── Room.ts
│   └── User.ts
├── repositories
│   ├── meetingRepository.ts
│   ├── tokenRepository.ts
│   └── userRepository.ts
├── server.ts
├── services
│   ├── authService.ts
│   ├── emailService.ts
│   ├── googleAuthService.ts
│   ├── jwtService.ts
│   └── roomService.ts
├── templates
│   ├── layouts
│   │   └── main.handlebars
│   ├── password-reset.handlebars
│   └── verify-email.handlebars
├── types
│   └── express
│       └── index.d.ts
└── utils
    ├── bcrypt.ts
    ├── codeGenerator.ts
    ├── shared
    │   ├── customErrorClasses.ts
    │   └── CustomResponse.ts
    └── tokenExtractor.ts

```

🧰 Technologies in Used

- Node.js

- Express

- TypeScript

- Docker

- TypeDI (Dependency Injection)

- Winston (Logging)

- Prettier + ESLint

- Passport.js

- Connect-redis

- Redis

- BullMQ

📚 Helpful Links

- [Express documentation](https://expressjs.com/)
- [Typescript documentation](https://www.typescriptlang.org/docs/)
- [Learn about dependency injection](https://en.wikipedia.org/wiki/Dependency_injection)
- [Visit TypeDI on npm](https://www.npmjs.com/package/typedi)
- [Open authorization setup documentation using passport.js](https://www.passportjs.org/packages/passport-google-oauth20/)
- [Connect-redis documentation for storing express-session cookie using redis](https://www.npmjs.com/package/connect-redis)
- [Reference project](https://github.com/santiq/bulletproof-nodejs)
# Oak-Park-Backend
