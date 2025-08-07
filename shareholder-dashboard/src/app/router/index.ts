import { createBrowserRouter } from 'react-router-dom';
import React from 'react';

import { LoginPage } from '../../presentation/pages/LoginPage';
import { AdminDashboard } from '../../presentation/pages/AdminDashboard';
import { ShareDashboard } from '../../presentation/pages/ShareDashboard';

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