import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AppLayout } from '@/components/layout/AppLayout'
import { RouteErrorElement } from '@/components/layout/RouteErrorElement'
import { lazyWithRetry } from '@/lib/lazy'
import { setNavigator } from '@/lib/navigation'
import { RequireAuth } from './RequireAuth'

const HomePage = lazyWithRetry(() => import('./HomePage').then((m) => ({ default: m.HomePage })))
const LoginPage = lazyWithRetry(() => import('./LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazyWithRetry(() => import('./RegisterPage').then((m) => ({ default: m.RegisterPage })))
const ForbiddenPage = lazyWithRetry(() => import('./ForbiddenPage').then((m) => ({ default: m.ForbiddenPage })))
const NotFoundPage = lazyWithRetry(() => import('./NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const ProfilePage = lazyWithRetry(() => import('./ProfilePage').then((m) => ({ default: m.ProfilePage })))
const MoviesPage = lazyWithRetry(() => import('./MoviesPage').then((m) => ({ default: m.MoviesPage })))
const MovieDetailPage = lazyWithRetry(() => import('./MovieDetailPage').then((m) => ({ default: m.MovieDetailPage })))
const TheaterDetailPage = lazyWithRetry(() => import('./TheaterDetailPage').then((m) => ({ default: m.TheaterDetailPage })))
const ScreenDetailPage = lazyWithRetry(() => import('./ScreenDetailPage').then((m) => ({ default: m.ScreenDetailPage })))
const OwnerDashboardPage = lazyWithRetry(() => import('./OwnerDashboardPage').then((m) => ({ default: m.OwnerDashboardPage })))
const OwnerTheaterManagePage = lazyWithRetry(() => import('./OwnerTheaterManagePage').then((m) => ({ default: m.OwnerTheaterManagePage })))
const OwnerScreenManagePage = lazyWithRetry(() => import('./OwnerScreenManagePage').then((m) => ({ default: m.OwnerScreenManagePage })))
const AdminPage = lazyWithRetry(() => import('./AdminPage').then((m) => ({ default: m.AdminPage })))

const routes = [
  {
    element: <AppLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forbidden', element: <ForbiddenPage /> },

      // Any authenticated user
      {
        element: <RequireAuth />,
        children: [
          { path: 'profile', element: <ProfilePage /> },
          { path: 'movies', element: <MoviesPage /> },
          { path: 'movies/:movieId', element: <MovieDetailPage /> },
          { path: 'theaters/:theaterId', element: <TheaterDetailPage /> },
          { path: 'screens/:screenId', element: <ScreenDetailPage /> },
        ],
      },

      // Theater owners only
      {
        element: <RequireAuth roles={['ROLE_THEATER_OWNER']} />,
        children: [
          { path: 'owner', element: <OwnerDashboardPage /> },
          { path: 'owner/theaters/:theaterId', element: <OwnerTheaterManagePage /> },
          { path: 'owner/screens/:screenId', element: <OwnerScreenManagePage /> },
        ],
      },

      // Admins only
      {
        element: <RequireAuth roles={['ROLE_ADMIN']} />,
        children: [
          { path: 'admin', element: <AdminPage /> },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

const router = createBrowserRouter(routes)
setNavigator((to, opts) => router.navigate(to, opts))

export function AppRouter() {
  return <RouterProvider router={router} />
}
