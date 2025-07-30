# Frontend
Read Me file to help getting started with React (frontend).  
This file contains all the necessary information about the frontend of the project.

## Table of Contents
- [Frontend](#frontend)
  - [Table of Contents](#table-of-contents)
  - [Folder Structure](#folder-structure)
  - [Folder Breakdown](#folder-breakdown)
    - [`public/`](#public)
    - [`src/`](#src)
      - [`assets/`](#assets)
      - [`components/`](#components)
      - [`pages/`](#pages)
      - [`services/`](#services)
      - [`styles/`](#styles)
      - [`utils/`](#utils)
    - [Root Files](#root-files)
      - [`App.js`](#appjs)
      - [`index.js`](#indexjs)
      - [`.env`](#env)
      - [`.gitignore`](#gitignore)
      - [`package.json`](#packagejson)
      - [`README.md`](#readmemd)
    - [Available Scripts](#available-scripts)
      - [`npm start`](#npm-start)
      - [`npm test`](#npm-test)
      - [`npm run build`](#npm-run-build)

## Folder Structure

``` bash
frontend/
├── public/            # Public assets (index.html, images, etc.)
├── src/               # All source code for the application
│   ├── assets/        # Static assets like images, fonts, and icons
│   ├── components/    # Reusable components (buttons, headers, etc.)
│   ├── pages/         # Pages that represent views/screens (Home, Bookings, etc.)
│   ├── services/      # API calls and logic (e.g., booking system)
│   ├── App.js         # Root component
│   ├── index.js       # Main entry point of the app
│   ├── styles/        # Global CSS/SCSS styles and Bootstrap overrides
│   ├── utils/         # Utility functions or custom hooks
│   └── App.css        # App-specific styles
├── .env               # Environment variables (API URLs, etc.)
├── .gitignore         # Git ignore file
├── package.json       # Project metadata and dependencies
└── README.md          # Project description and instructions
```


## Folder Breakdown

### `public/`
- Contains static files that are publicly accessible.
- Includes `index.html`, the main HTML file for the React app.

### `src/`
- Contains all source code for the frontend application.

#### `assets/`
- Stores static resources such as images, icons, and fonts.

#### `components/`
- Reusable UI elements used across different parts of the application.
- Example: `Button.js`, `Header.js`, `Modal.js`.

#### `pages/`
- Represents different views or pages in the application.
- Example: `HomePage.js`, `BookingPage.js`.

#### `services/`
- Handles API calls and backend interactions.
- Example: `bookingService.js` (handles booking requests).

#### `styles/`
- Contains global styles and Bootstrap overrides.
- Example: `main.css` or `main.scss`.

#### `utils/`
- Utility functions or custom hooks for the application.
- Example: `dateHelper.js` (for formatting dates).

### Root Files

#### `App.js`
- The main React component where routing and layout are managed.

#### `index.js`
- Entry point of the application, rendering the `App.js` component.

#### `.env`
- Stores environment variables like API URLs and configurations.

#### `.gitignore`
- Specifies files and folders to ignore when using Git.

#### `package.json`
- Defines project dependencies and scripts for development.

#### `README.md`
- Provides project setup instructions and documentation.



### Available Scripts

In the project directory, you can run:

#### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

#### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
