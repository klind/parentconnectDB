# ParentConnect

A platform for connecting parents and families in local communities. This Node.js application manages Firebase Firestore data for the ParentConnect platform.

## Features

- User management and profiles
- Activity and event management
- Resource sharing (playgrounds, clinics, libraries)
- Help requests and community support
- Safety alerts and notifications
- Parent matching system
- Messaging and conversations
- Admin controls and moderation

## Prerequisites

- Node.js 18.0.0 or higher
- Firebase project with Firestore enabled
- Firebase service account key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ParentConnect
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Firestore Database
   - Generate a service account key:
     - Go to Project Settings > Service Accounts
     - Click "Generate new private key"
     - Save the JSON file as `serviceAccountKey.json` in the project root

## Usage

### Import Test Data

To import the sample data into your Firestore database:

```bash
npm start
```

This will import all collections from `firestore_full_test_data.json` into your Firestore database.

### Development

For development with auto-restart:

```bash
npm run dev
```

## Data Structure

The application manages the following Firestore collections:

- **users**: Parent profiles with preferences and location
- **activities**: Events and workshops for families
- **resources**: Local resources like playgrounds and clinics
- **help_requests**: Community support requests
- **alerts**: Safety and community alerts
- **matches**: Parent matching data
- **conversations**: Messaging between parents
- **reports**: Content moderation reports
- **admin_controls**: Platform configuration
- **feedback**: User feedback and feature requests

## Security

⚠️ **Important**: Never commit your `serviceAccountKey.json` file to version control. It's already included in `.gitignore` for security.

## License

MIT License 