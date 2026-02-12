

import 'react-native-gesture-handler';
import React, { Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import main screens that are used frequently
import DashboardScreen from './screens/DashboardScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ProfileScreen from './screens/ProfileScreen';

// Lazy load screens that are used less frequently
// This improves initial app load time
const SearchScreen = React.lazy(() => import('./screens/SearchScreen'));
const LibraryScreen = React.lazy(() => import('./screens/LibraryScreen'));
const PlayerScreen = React.lazy(() => import('./screens/PlayerScreen'));

// Create the stack navigator for handling screen navigation
const Stack = createStackNavigator();

// Main App component that sets up the navigation structure
const App = () => {
  return (
    // NavigationContainer is required as the root component for React Navigation
    <NavigationContainer>
      {/* Suspense handles the loading state of lazy-loaded screens */}
      <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" /></View>}>
        {/* Stack.Navigator defines the navigation structure and screen transitions */}
        <Stack.Navigator 
          // Start with the Login screen
          initialRouteName="Login"
          // Global screen options for all screens
          screenOptions={{
            // Hide the default header
            headerShown: false,
            // Set transparent background
            cardStyle: { backgroundColor: 'transparent' },
            // Enable overlay for transitions
            cardOverlayEnabled: true,
            // Custom animation for screen transitions
            cardStyleInterpolator: ({ current: { progress } }) => ({
              cardStyle: {
                opacity: progress,
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0], // Slide from right to left
                    }),
                  },
                ],
              },
              // Fade effect for the overlay
              overlayStyle: {
                opacity: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            }),
            // Spring animation configuration for smooth transitions
            transitionSpec: {
              // Opening animation
              open: {
                animation: 'spring',
                config: {
                  stiffness: 1000,    // Animation speed
                  damping: 500,       // Bounce effect
                  mass: 3,            // Animation weight
                  overshootClamping: true,
                  restDisplacementThreshold: 0.01,
                  restSpeedThreshold: 0.01,
                },
              },
              // Closing animation
              close: {
                animation: 'spring',
                config: {
                  stiffness: 1000,
                  damping: 500,
                  mass: 3,
                  overshootClamping: true,
                  restDisplacementThreshold: 0.01,
                  restSpeedThreshold: 0.01,
                },
              },
            },
          }}
        >
          {/* Define all screens in the navigation stack */}
          {/* Authentication screens */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          
          {/* Main app screens */}
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="Library" component={LibraryScreen} />
          <Stack.Screen name="Player" component={PlayerScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </Stack.Navigator>
      </Suspense>
    </NavigationContainer>
  );
};

// Export the App component
export default App;