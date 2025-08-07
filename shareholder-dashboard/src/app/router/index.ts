import { createBrowserRouter } from 'react-router-dom';
import React from 'react';

import { LoginPage } from '../../presentation/pages/LoginPage';
import { ShareDashboard } from '../../presentation/pages/ShareDashboard';
import { AdminDashboard } from '../../presentation/pages/AdminDashboard';

export const router = createBrowserRouter([
    {
        path: '/',
        element: React.createElement(AdminDashboard),
    },
    {
        path: '/login',
        element: React.createElement(LoginPage),
    },
    {
        path: '/admin',
        element: React.createElement(AdminDashboard),

    },
    {
        path: '/share',
        element: React.createElement(ShareDashboard),
    },
    {
        path: '*',
        element: React.createElement(AdminDashboard),

    }
]);