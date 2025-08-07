import React from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface CreateShareholderRequest {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
}

interface CreateShareholderModalProps {
    visible: boolean;
    loading: boolean;
    onCancel: () => void;
    onSubmit: (values: CreateShareholderRequest) => void;
}

export function CreateShareholderModal({ visible, loading, onCancel, onSubmit }: CreateShareholderModalProps) {
    const [form] = Form.useForm();

    const handleSubmit = async (values: CreateShareholderRequest) => {
        await onSubmit(values);
        form.resetFields();
    };

    const handleCancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            title={null}
            open={visible}
            onCancel={handleCancel}
            footer={null}
            centered
            width={520}
            destroyOnClose
            maskClosable={true}
            className="blur-modal bg-transparent"
            style={{ background: 'transparent' }}
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
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
                {/* Header avec gradient */}
                <div className="bg-gradient-to-r from-primary to-primaryDark px-8 py-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <UserAddOutlined className="text-2xl text-white" />
                        </div>
                        <div>
                            <Title level={3} className="!mb-1 text-white font-ubuntu">
                                Add New Shareholder
                            </Title>
                            <Text className="text-white/80 font-ubuntu">
                                Create a new shareholder account
                            </Text>
                        </div>
                    </div>
                </div>

                {/* Formulaire */}
                <div className="px-8 py-6">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        className="space-y-1"
                        requiredMark={false}
                    >
                        <Form.Item
                            name="name"
                            label={<Text className="font-ubuntu font-medium text-darkText">Full Name</Text>}
                            rules={[{ required: true, message: 'Please enter the full name' }]}
                        >
                            <Input
                                placeholder="Enter full name"
                                className="font-ubuntu h-11 border-gray-200 hover:border-primary focus:border-primary"
                            />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label={<Text className="font-ubuntu font-medium text-darkText">Email Address</Text>}
                            rules={[
                                { required: true, message: 'Please enter the email address' },
                                { type: 'email', message: 'Please enter a valid email address' }
                            ]}
                        >
                            <Input
                                placeholder="Enter email address"
                                className="font-ubuntu h-11 border-gray-200 hover:border-primary focus:border-primary"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<Text className="font-ubuntu font-medium text-darkText">Password</Text>}
                            rules={[
                                { required: true, message: 'Please enter a password' },
                                { min: 6, message: 'Password must be at least 6 characters' }
                            ]}
                        >
                            <Input.Password
                                placeholder="Enter password"
                                className="font-ubuntu h-11 border-gray-200 hover:border-primary focus:border-primary"
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirm_password"
                            label={<Text className="font-ubuntu font-medium text-darkText">Confirm Password</Text>}
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Please confirm the password' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Passwords do not match'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                placeholder="Confirm password"
                                className="font-ubuntu h-11 border-gray-200 hover:border-primary focus:border-primary"
                            />
                        </Form.Item>

                        {/* Buttons */}
                        <div className="flex space-x-3 pt-4">
                            <Button
                                onClick={handleCancel}
                                className="flex-1 h-11 font-ubuntu border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="flex-1 h-11 font-ubuntu bg-gradient-to-r from-primary to-primaryDark border-0 shadow-md hover:shadow-lg"
                            >
                                Create Shareholder
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        </Modal>
    );
}
