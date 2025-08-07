import React from 'react';
import { Modal, Button, Typography, message } from 'antd';
import { LogoutOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface LogoutModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    userName?: string;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
    visible,
    onClose,
    onConfirm,
    userName = "User"
}) => {
    const handleLogout = () => {
        console.log('Logout confirmed');
        message.loading('Logging out...', 1);

        setTimeout(() => {
            message.success('Successfully logged out!');
            if (onConfirm) {
                onConfirm();
            } else {
                // Redirection par défaut
                // window.location.href = '/login';
                console.log('User logged out successfully');
            }
            onClose();
        }, 1000);
    };

    return (
        <Modal
            title={null}
            open={visible}
            onCancel={onClose}
            footer={null}
            centered
            width={480}
            destroyOnClose
            maskClosable={true}
            className="logout-modal bg-transparent"
            style={{
                background: 'transparent',
            }}
            maskStyle={{
                backdropFilter: 'blur(8px)',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
            }}
            bodyStyle={{
                padding: 0,
                background: 'transparent',
            }}
            wrapClassName="modal-wrap"
        >
            <div className="relative bg-transparent">
                {/* Glassmorphism Card */}
                <div
                    className="backdrop-blur-lg rounded-2xl border border-white/20"
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                    }}
                >
                    {/* Header */}
                    <div className="px-8 pt-8 pb-6 border-b border-gray-100/50">
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center">
                                <ExclamationCircleOutlined className="text-white text-xl" />
                            </div>
                            <Title level={3} className="!mb-0 font-ubuntu text-darkText">
                                Confirm Logout
                            </Title>
                        </div>
                        <Text className="font-ubuntu text-gray-600 text-base">
                            Are you sure you want to log out, {userName}?
                        </Text>
                    </div>

                    {/* Content */}
                    <div className="px-8 py-6">
                        <div className="mb-6">
                            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start space-x-3">
                                    <LogoutOutlined className="text-red-500 text-lg mt-0.5" />
                                    <div>
                                        <Text className="font-ubuntu font-medium text-red-800 block mb-1">
                                            You will be signed out
                                        </Text>
                                        <Text className="font-ubuntu text-red-600 text-sm">
                                            You'll need to sign in again to access your account and continue managing your cap table.
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end space-x-3">
                            <Button
                                onClick={onClose}
                                className="font-ubuntu px-6 h-10 rounded-lg border-gray-300 hover:border-gray-400"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                danger
                                onClick={handleLogout}
                                icon={<LogoutOutlined />}
                                className="font-ubuntu px-6 h-10 rounded-lg bg-gradient-to-r from-red-500 to-red-600 border-0 hover:shadow-lg"
                            >
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
