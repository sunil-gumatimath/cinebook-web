import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { useAuthStore } from '@/store/auth.store'

import { ForbiddenPage } from './ForbiddenPage'
import { HomePage } from './HomePage'
import { LoginPage } from './LoginPage'
import { NotFoundPage } from './NotFoundPage'
import { PlaceholderPage } from './PlaceholderPage'
import { RequireAuth } from './RequireAuth'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <HomePage /> },
      { path: 'forbidden', element: <ForbiddenPage /> },

      // Any authenticated user
      {
        element: <RequireAuth />,
        children: [
          {
            path: 'profile',
            element: <PlaceholderPage title="Profile" hint="PUT /users/{userId}" />,
          },
          {
            path: 'movies',
            element: <PlaceholderPage title="Movies" hint="GET /movies/{movieId}" />,
          },
          {
            path: 'movies/:movieId',
            element: <PlaceholderPage title="Movie details + feedback" hint="GET /movies/{movieId}" />,
          },
        ],
      },

      // Theater owners only
      {
        element: <RequireAuth roles={['THEATER_OWNER']} />,
        children: [
          {
            path: 'owner',
            element: <PlaceholderPage title="My Theater" hint="GET /theater/{id}" />,
          },
          {
            path: 'owner/screens/:screenId',
            element: <PlaceholderPage title="Seat layout" hint="GET /screen/{screenId}" />,
          },
        ],
      },

      // Admins only
      {
        element: <RequireAuth roles={['ADMIN']} />,
        children: [
          {
            path: 'admin',
            element: <PlaceholderPage title="Admin — movies" hint="POST /movies" />,
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function AppRouter() {
  // Subscribing keeps the layout's role-aware nav in sync with logout/login.
  useAuthStore((s) => s.token)
  return <RouterProvider router={router} />
}
