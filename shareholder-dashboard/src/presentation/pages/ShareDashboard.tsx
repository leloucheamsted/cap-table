import React, { useEffect, useState, useMemo } from 'react';
import {
    Card,
    Layout,
    Avatar,
    Button,
    Typography,
    Space,
    Divider,
    Row,
    Col,
    Table,
    message,
    Statistic
} from 'antd';
import {
    UserOutlined,
    DownloadOutlined,
    LogoutOutlined,
    MailOutlined,
    CalendarOutlined,
    DollarCircleOutlined,
    ShareAltOutlined
} from '@ant-design/icons';
import { LogoutModal } from '../../shared/components/LogoutModal';
import { useAuth } from '../hooks/useAuth';
import { useShare } from '../hooks/useShares';
import { ShareIssuance } from '../../domain/models/share';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;




export function ShareDashboard() {

    const { user, getCurrentUser, logout } = useAuth();

    const { statsData, dashboard, issuances, downloadCertificate, loadShareholderIssuances, getIssuanceStats, loading } = useShare();


    const [logoutModalVisible, setLogoutModalVisible] = useState(false);

    const downloadCert = (issuance: ShareIssuance) => {
        console.log('Downloading certificate for issuance:', issuance);
        message.loading('Downloading certificate...', 1.5);
        downloadCertificate(issuance.id.toString())
            .then(() => {
                message.success(`Certificate for ${issuance.owner?.name} shares downloaded successfully!`);
            })
            .catch(err => {
                console.error('Download error:', err);
                message.error('Failed to download certificate. Please try again.');
            });
    };
    useEffect(() => {
        getCurrentUser();
        getIssuanceStats()
    }, []);
    const handleLogout = () => {
        setLogoutModalVisible(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            console.log('Logout confirmed from modal');

            // Appel du usecase de déconnexion
            await logout();

            message.success('Successfully logged out!');

            // Redirection vers la page de login après déconnexion
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            message.error('Failed to logout. Please try again.');
        }

    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const issuancesColumns = [
        {
            title: 'Issuance ID',
            dataIndex: 'id',
            key: 'id',
            width: 120,
            render: (id: number) => (
                <Text className="font-ubuntu font-medium text-primary">#{id.toString().padStart(3, '0')}</Text>
            )
        },
        {
            title: 'Number of Shares',
            dataIndex: 'amount',
            key: 'amount',
            width: 150,
            render: (amount: number) => (
                <Text className="font-ubuntu font-bold text-darkText">{amount.toLocaleString()}</Text>
            )
        },
        {
            title: 'Date Issued',
            dataIndex: 'issued_at',
            key: 'issued_at',
            width: 150,
            render: (date: Date) => (
                <Text className="font-ubuntu text-gray-600">{formatDate(date.toString())}</Text>
            )
        },
        {
            title: 'Price per Share',
            dataIndex: 'price_per_share',
            key: 'price_per_share',
            width: 120,
            render: (price: number) => (
                <Text className="font-ubuntu text-gray-600">
                    ${price ? price.toFixed(2) : '1.00'}
                </Text>
            )
        },
        {
            title: 'Certificate',
            key: 'certificate',
            width: 120,
            render: (record: ShareIssuance) => (
                <Button
                    type="primary"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => downloadCert(record)}
                    disabled={!record.certificate_available}
                    className="font-ubuntu bg-primary border-0 hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                >
                    Download
                </Button>
            )
        }
    ];

    return (
        <Layout className="min-h-screen bg-background font-ubuntu">
            <Layout>
                {/* Sidebar */}
                <Sider
                    width={320}
                    className="bg-white fixed left-0 top-0 h-screen z-40  overflow-hidden"
                >
                    <div className="h-screen flex flex-col">
                        {/* Profil utilisateur */}
                        <div className="p-6 flex-1">
                            <div className="text-center space-y-4 mb-8">


                                <div>
                                    <Title level={3} className="!mb-1 font-ubuntu text-darkText">{user?.name}</Title>
                                    <div className="flex items-center justify-center space-x-2 text-gray-600">
                                        <MailOutlined className="text-sm" />
                                        <Text className="font-ubuntu text-sm">{user?.email}</Text>
                                    </div>
                                    <div className="flex items-center justify-center space-x-2 text-gray-500 mt-1">
                                        <CalendarOutlined className="text-sm" />
                                        <Text className="font-ubuntu text-darkText text-xs">
                                            Member since {formatDate(user?.created_at.toString() ?? '')}
                                        </Text>
                                    </div>
                                </div>
                            </div>

                            <Divider className="my-3" />

                            {/* Statistiques personnelles */}
                            <div className="space-y-4">
                                <Card className="bg-gradient-to-r from-primary to-background shadow-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-transparent rounded-full flex items-center justify-center">
                                            <ShareAltOutlined className="text-white text-lg" />
                                        </div>
                                        <div>
                                            <Text className="font-ubuntu text-sm text-white block">Total Shares</Text>
                                            <Text className="font-ubuntu text-2xl font-bold text-darkText">
                                                {dashboard?.statistics.total_shares}
                                            </Text>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="bg-gradient-to-r from-primary to-background shadow-2xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-transparent rounded-full flex items-center justify-center">
                                            <DollarCircleOutlined className="text-white text-lg" />
                                        </div>
                                        <div>
                                            <Text className="font-ubuntu text-sm text-white block">Capital Amount</Text>
                                            <Text className="font-ubuntu text-2xl font-bold text-darkText">
                                                ${dashboard?.statistics.total_value}
                                            </Text>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="bg-gradient-to-r from-primary to-background shadow-xl">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-transparent rounded-full flex items-center justify-center">
                                            <Text className="text-white font-bold text-lg">{statsData.totalIssuances}</Text>
                                        </div>
                                        <div>
                                            <Text className="font-ubuntu text-sm text-white block">Total Issuances</Text>
                                            <Text className="font-ubuntu text-lg font-bold text-darkText">
                                                {dashboard?.statistics.total_issuances} Certificates
                                            </Text>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Card Logout au bas de la sidebar */}
                        <div className="px-6 py-3">
                            <Card className="bg-gradient-to-r from-[#e1decf] to-gray-100 border-0 shadow-sm">
                                <div className="text-center space-y-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-[#e1decf] to-gray-100 rounded-full flex items-center justify-center mx-auto">
                                        <UserOutlined className="text-white text-lg" />
                                    </div>

                                    <div>
                                        <Title level={5} className="!mb-1 font-ubuntu text-darkText">Shareholder Portal</Title>
                                        <Text className="font-ubuntu text-xs text-gray-600 block">
                                            View your shares and certificates
                                        </Text>
                                    </div>

                                    <Button
                                        type="text"
                                        icon={<LogoutOutlined />}
                                        onClick={handleLogout}
                                        className="w-full font-ubuntu text-gray-600 hover:text-red-500 hover:bg-red-50 border-0 transition-all duration-200 rounded-lg h-8 text-sm"
                                    >
                                        Logout
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    </div>
                </Sider>

                {/* Content */}
                <Content className="ml-80 p-8 bg-white min-h-screen">
                    <div className="max-w-6xl mx-auto">
                        {/* En-tête de la page */}
                        <div className="mb-8">
                            <Title level={2} className="!mb-2 font-ubuntu text-darkText">
                                Welcome back, {user?.name.split(' ')[0]}!
                            </Title>
                            <Text className="font-ubuntu text-gray-600 text-lg">
                                Here's an overview of your shareholding and certificates.
                            </Text>
                        </div>

                        {/* Tableau des émissions d'actions */}
                        <Card className="shadow-sm rounded-lg">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <Title level={4} className="!mb-1 font-ubuntu text-darkText">My Share Issuances</Title>
                                    <Text className="font-ubuntu text-gray-600">
                                        View and download certificates for all your share issuances
                                    </Text>
                                </div>
                                <div className="text-right">
                                    <Text className="font-ubuntu text-sm text-gray-500 block">Total Value</Text>
                                    <Text className="font-ubuntu text-xl font-bold text-primary">
                                        ${dashboard?.statistics.total_value}
                                    </Text>
                                </div>
                            </div>

                            <Table
                                dataSource={dashboard?.recent_issuances || issuances}
                                columns={issuancesColumns}
                                pagination={false}
                                className="font-ubuntu"
                                rowClassName="hover:bg-gray-50 transition-colors duration-150"
                                locale={{
                                    emptyText: (
                                        <div className="py-8">
                                            <Text className="font-ubuntu text-gray-500">No share issuances found</Text>
                                        </div>
                                    )
                                }}
                            />
                            {/* Résumé en bas du tableau */}
                            <div className="mt-6 p-4 bg-primaryDark rounded-lg">
                                <Row gutter={[32, 16]}>
                                    <Col span={8}>
                                        <Statistic
                                            title={<span className="font-ubuntu text-gray-600">Total Shares</span>}
                                            value={dashboard?.statistics.total_shares}
                                            valueStyle={{
                                                color: '#000',
                                                fontFamily: 'Ubuntu',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <Statistic
                                            title={<span className="font-ubuntu text-gray-600">Number of Issuances</span>}
                                            value={dashboard?.statistics.total_issuances}
                                            valueStyle={{
                                                color: '#000',
                                                fontFamily: 'Ubuntu',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    </Col>
                                    <Col span={8}>
                                        <Statistic
                                            title={<span className="font-ubuntu text-gray-600">Average per Issuance</span>}
                                            value={dashboard?.recent_issuances?.length ?? 0 > 0 ? Math.round(dashboard!.statistics!.total_shares / dashboard!.statistics!.total_issuances) : 0}
                                            valueStyle={{
                                                color: '#000',
                                                fontFamily: 'Ubuntu',
                                                fontWeight: 'bold'
                                            }}
                                            suffix="shares"
                                        />
                                    </Col>
                                </Row>
                            </div>
                        </Card>

                        {/* Section d'aide */}
                        <Card className="mt-8 bg-gradient-to-r from-background to-indigo-50 ">
                            <Row gutter={[32, 0]} align="middle">
                                <Col span={18}>
                                    <Title level={4} className="!mb-2 font-ubuntu text-darkText">Need Help?</Title>
                                    <Text className="font-ubuntu text-gray-600">
                                        If you have questions about your shares or need assistance with downloading certificates,
                                        please contact our support team.
                                    </Text>
                                </Col>
                                <Col span={6} className="text-right">
                                    <Button
                                        type="primary"
                                        size="large"
                                        className="font-ubuntu bg-darkText border-0"
                                        onClick={() => message.info('Support feature coming soon')}
                                    >
                                        Contact Support
                                    </Button>
                                </Col>
                            </Row>
                        </Card>
                    </div>
                </Content>
            </Layout>

            <LogoutModal
                visible={logoutModalVisible}
                onClose={() => setLogoutModalVisible(false)}
                onConfirm={handleLogoutConfirm}
                userName="Admin"
            />
        </Layout>
    );
}