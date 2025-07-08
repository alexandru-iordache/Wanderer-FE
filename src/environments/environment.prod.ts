export const environment = {
    production: true,
    apiUrl: process.env['API_URL'] || "http://localhost:5000",
    firebase: {
        apiKey: process.env['FIREBASE_API_KEY'] || 'AIzaSyD61GcNQH1DZHCyKp6x4a0P4sVuwyq1S-A',
        authDomain: process.env['FIREBASE_AUTH_DOMAIN'] || 'wanderer-2db43.firebaseapp.com',
        databaseURL: process.env['FIREBASE_DATABASE_URL'] || '',
        projectId: process.env['FIREBASE_PROJECT_ID'] || 'wanderer-2db43',
        storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || 'wanderer-2db43.appspot.com',
        messagingSenderId: process.env['FIREBASE_MESSAGING_SENDER_ID'] || '215652753193',
        appId: process.env['FIREBASE_APP_ID'] || '1:215652753193:web:90ec227ac682e5a1e7a138'
    },
    googleMapsApiKey: process.env['GOOGLE_MAPS_API_KEY'] || 'AIzaSyDkzaWrCA5MpIq3aZBePvxAnWBJQ4Vp37E',
    googleMapId: process.env['GOOGLE_MAP_ID'] || '891ee26853c57f4'
};
