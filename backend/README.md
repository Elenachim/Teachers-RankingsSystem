# Backend
Read Me File for the backend of the project.  
All the necessary information about the backend of the project is provided here.

## Table of Contents
- [Backend](#backend)
  - [Table of Contents](#table-of-contents)
    - [Folder Structre of the Backend](#folder-structre-of-the-backend)
      - [`controllers/`](#controllers)
      - [`models/`](#models)
      - [`routes/`](#routes)
      - [`config/`](#config)
      - [`public/` (Optional)](#public-optional)
      - [`.env`](#env)
      - [`index.php`](#indexphp)
      - [`.gitignore`](#gitignore)
      - [`README.md`](#readmemd)

### Folder Structre of the Backend

``` bash
backend/
├── controllers/     # Handles logic for requests
├── models/          # Database models (represent services, appointments, etc.)
├── routes/          # API routes definition
├── config/          # Configuration files (DB, environment settings)
├── public/          # Public assets (if needed)
├── .env             # Environment variables (database credentials, etc.)
├── index.php        # Entry point for the backend
├── .gitignore       # Git ignore file (e.g., node_modules, env files)
└── README.md        # Project description and instructions
```

#### `controllers/`
- Contains files for handling the logic of each feature, such as creating bookings and managing services.

#### `models/`
- Contains files that define how the data is structured and interact with the database (e.g., services and appointments).

#### `routes/`
- Contains the API route definitions, mapping requests (like GET, POST) to specific controller actions.

#### `config/`
- Contains configuration files, like database settings and other environment-specific details.

#### `public/` (Optional)
- Stores publicly accessible assets like images or static files (if needed).

#### `.env`
- Contains sensitive information like database credentials and other environment variables.

#### `index.php`
- The main entry point for the backend API, where routes are set up and requests are processed.

#### `.gitignore`
- Specifies files and directories to be ignored by Git, such as sensitive files and dependencies.

#### `README.md`
- Provides an overview of the project and setup instructions for developers.