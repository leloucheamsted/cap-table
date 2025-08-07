import React, { useState, useEffect } from 'react';
import {
    Card,
    Form,
    Input,
    Button,
    Alert,
    Typography,
    Space,
    Divider,
    Row,
    Col,
    theme
} from 'antd';
import {
    UserOutlined,
    LockOutlined,
    EyeInvisibleOutlined,
    EyeTwoTone,
    LoadingOutlined,
    LoginOutlined
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import { LoginRequest } from '../../core/entities/Auth';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { useToken } = theme;

interface LoginFormData {
    email: string;
    password: string;
}

export const LoginPage: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { token } = useToken();

    const {
        user,
        loading,
        error,
        login,
        clearError
    } = useAuth();

    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: ''
    });
    const [hasRedirected, setHasRedirected] = useState(false);
    useEffect(() => {
        if (error) {
            clearError();
        }
    }, [formData.email, formData.password]);

    const handleFormChange = (changedValues: Partial<LoginFormData>) => {
        setFormData(prev => ({ ...prev, ...changedValues }));
    };

    const isFormValid = () => {
        return formData.email.trim() !== '' &&
            formData.password.trim() !== '' &&
            formData.email.includes('@') &&
            formData.password.length >= 6;
    };

    const handleLogin = async (values: LoginFormData) => {
        try {
            const loginRequest: LoginRequest = {
                email: values.email.trim().toLowerCase(),
                password: values.password
            };

            console.log('Attempting login...'); // Debug
            const result = await login(loginRequest);
            if (result.access_token) {
                setHasRedirected(true);
                const redirectPath = result.user.is_admin ? '/admin' : '/share';
                console.log('Login successful, redirecting to:', redirectPath, 'isAdmin:', result.user.is_admin);
                navigate(redirectPath, { replace: true });
            }
            console.log('Login successful, user:', result); // Debug


        } catch (err) {
            console.error('Login failed:', err);
            setHasRedirected(false); // Reset en cas d'erreur
        }
    };

    const handleFormFinish = (values: LoginFormData) => {
        if (!loading) {
            handleLogin(values);
        }
    };

    const handleFormFinishFailed = (errorInfo: any) => {
        console.log('Form validation failed:', errorInfo);
    };


    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-5">
            <Row className="w-full max-w-[1200px]" justify="center">
                <Col xs={24} sm={20} md={16} lg={12} xl={10} xxl={8}>
                    <Card
                        className="shadow-xl rounded-xl border-0"
                        bodyStyle={{
                            padding: '40px',
                        }}
                    >
                        <Space
                            direction="vertical"
                            size="large"
                            className="w-full text-center"
                        >
                            {/* Header */}
                            <div>
                                <div className="w-[100px] h-[100px] flex items-center justify-center mx-auto mb-5 text-2xl">
                                    <img src='./logo.png' alt="EquiBoard Logo" className="max-w-full max-h-full" />
                                </div>

                                <Title level={2} className="!mb-2 text-gray-800">
                                    Welcome Back
                                </Title>

                                <Text type="secondary" className="text-base">
                                    Sign in to your EquiBoard account
                                </Text>
                            </div>

                            <Divider className="!my-2.5" />

                            {/* Error Alert */}
                            {error && (
                                <Alert
                                    message="Login Failed"
                                    description={error}
                                    type="error"
                                    showIcon
                                    closable
                                    onClose={clearError}
                                    className="!mb-2.5"
                                />
                            )}

                            {/* Login Form */}
                            <Form
                                form={form}
                                name="login"
                                layout="vertical"
                                size="large"
                                onFinish={handleFormFinish}
                                onFinishFailed={handleFormFinishFailed}
                                onValuesChange={handleFormChange}
                                autoComplete="off"
                                className="w-full"
                            >
                                <Form.Item
                                    name="email"
                                    label={<span className="text-gray-700 font-medium">Email Address</span>}
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please enter your email address'
                                        },
                                        {
                                            type: 'email',
                                            message: 'Please enter a valid email address'
                                        }
                                    ]}
                                >
                                    <Input
                                        prefix={<UserOutlined className="text-gray-400" />}
                                        placeholder="Enter your email"
                                        autoComplete="email"
                                        disabled={loading}
                                        className="!h-12 !rounded-lg"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="password"
                                    label={<span className="text-gray-700 font-medium">Password</span>}
                                    rules={[
                                        {
                                            required: true,
                                            message: 'Please enter your password'
                                        },
                                        {
                                            min: 6,
                                            message: 'Password must be at least 6 characters'
                                        }
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined className="text-gray-400" />}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        disabled={loading}
                                        iconRender={(visible) =>
                                            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                                        }
                                        className="!h-12 !rounded-lg"
                                    />
                                </Form.Item>

                                <Form.Item className="!mb-2.5">
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        block
                                        disabled={!isFormValid() || loading}
                                        className="!h-12 !rounded-lg !text-base !font-medium transition-all duration-200 hover:!scale-[1.02] active:!scale-[0.98] disabled:!cursor-not-allowed disabled:!opacity-50"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center">
                                                <LoadingOutlined spin className="mr-2" />
                                                Signing in...
                                            </span>
                                        ) : (
                                            <span className="flex items-center justify-center">
                                                <LoginOutlined className="mr-2" />
                                                Sign In
                                            </span>
                                        )}
                                    </Button>
                                </Form.Item>
                            </Form>

                            {/* Footer */}
                            <div className="text-center mt-5">
                                <Text type="secondary" className="text-sm">
                                    Having trouble signing in? Contact your administrator.
                                </Text>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default LoginPage;