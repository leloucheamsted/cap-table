import React, { useEffect, useState } from 'react';
import {
    Card,
    Layout,
    Avatar,
    Button,
    Badge,
    Typography,
    Space,
    Divider,
    Row,
    Col,
    Table,
    Progress,
    Tag,
    Modal,
    Form,
    Input,
    message,
    Drawer,
    Statistic
} from 'antd';
import {
    SearchOutlined,
    UserOutlined,
    PlusOutlined,
    ShareAltOutlined,
    DollarCircleOutlined,
    TeamOutlined,
    ArrowRightOutlined,
    ExportOutlined,
    MailOutlined,
    LockOutlined,
    BarChartOutlined,
    CloseOutlined,
    DownloadOutlined,
    LogoutOutlined
} from '@ant-design/icons';
import { LogoutModal } from '../../shared/components/LogoutModal';
import { useAuth } from '../hooks/useAuth';
import { useAudit } from '../hooks/useAudit';
import { useAdmin } from '../hooks';
const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

interface CreateShareholderRequest {
    name: string;
    email: string;
    password: string;
    confirm_password: string;
}

export function AdminDashboard() {
    // Hook d'authentification
    const { logout } = useAuth();
    const {
        stats,
        loading: auditLoading,

        refreshAuditData
    } = useAudit();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
    const [issuanceAmounts, setIssuanceAmounts] = useState<{ [key: string]: string }>({});
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [transactionsDrawerVisible, setTransactionsDrawerVisible] = useState(false);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const { shareholders, issuances, generateCertificate, downloadCertificate, loadShareholders, loadDashboardData, assignShares, createShareholder } = useAdmin();

    const calculateOwnershipDistribution = () => {
        if (!issuances || issuances.length === 0) {
            return {
                categories: [
                    { name: 'Ordinary', percentage: 0, color: '#23555a' },
                    { name: 'Seed', percentage: 0, color: '#FDE047' },
                    { name: 'Series A', percentage: 0, color: '#000000' },
                    { name: 'Series B', percentage: 0, color: '#e1decf' }
                ],
                totalShares: 0
            };
        }

        const totalShares = issuances.reduce((total, issuance) => total + (issuance.amount || 0), 0);

        const shareholderOwnership = new Map();

        issuances.forEach(issuance => {
            const ownerId = issuance.owner?.id || issuance.user_id;
            const ownerName = issuance.owner?.name || `User ${ownerId}`;

            if (shareholderOwnership.has(ownerId)) {
                shareholderOwnership.set(ownerId, {
                    ...shareholderOwnership.get(ownerId),
                    shares: shareholderOwnership.get(ownerId).shares + (issuance.amount || 0)
                });
            } else {
                shareholderOwnership.set(ownerId, {
                    name: ownerName,
                    shares: issuance.amount || 0
                });
            }
        });

        const shareholdersWithPercentage = Array.from(shareholderOwnership.values()).map(holder => ({
            ...holder,
            percentage: totalShares > 0 ? (holder.shares / totalShares) * 100 : 0
        }));

        let ordinary = 0, seed = 0, seriesA = 0, seriesB = 0;

        shareholdersWithPercentage.forEach(holder => {
            if (holder.percentage >= 25) {
                ordinary += holder.percentage;
            } else if (holder.percentage >= 10) {
                seed += holder.percentage;
            } else if (holder.percentage >= 5) {
                seriesA += holder.percentage;
            } else {
                seriesB += holder.percentage;
            }
        });

        return {
            categories: [
                { name: 'Ordinary', percentage: Math.round(ordinary * 100) / 100, color: '#23555a' },
                { name: 'Seed', percentage: Math.round(seed * 100) / 100, color: '#FDE047' },
                { name: 'Series A', percentage: Math.round(seriesA * 100) / 100, color: '#000000' },
                { name: 'Series B', percentage: Math.round(seriesB * 100) / 100, color: '#e1decf' }
            ],
            totalShares
        };
    };

    const ownershipData = calculateOwnershipDistribution();

    useEffect(() => {
        refreshAuditData();
        loadShareholders();
        loadDashboardData()
    }, []);

    const createDynamicStakeholdersData = () => {
        if (!shareholders || shareholders.length === 0) {
            return [];
        }

        const totalShares = issuances?.reduce((total, issuance) => total + (issuance.amount || 0), 0) || 0;

        return shareholders.map((shareholder, index) => {
            const shareholderIssuances = issuances?.filter(issuance =>
                issuance.owner?.id === shareholder.id || issuance.user_id === shareholder.id
            ) || [];

            const totalSharesOwned = shareholderIssuances.reduce((total, issuance) => total + (issuance.amount || 0), 0);
            const ownershipPercentage = totalShares > 0 ? ((totalSharesOwned / totalShares) * 100).toFixed(1) : '0.0';

            // Déterminer les badges de rounds basés sur les pourcentages de détention
            const percentage = parseFloat(ownershipPercentage);
            let rounds: { ordinary: number | null, seed: string | null, seriesA: string | null, seriesB: string | null } = {
                ordinary: null,
                seed: null,
                seriesA: null,
                seriesB: null
            };

            if (percentage >= 25) {
                rounds.ordinary = 0; // Gros détenteurs
            } else if (percentage >= 10) {
                rounds.seed = 'S'; // Détenteurs moyens
            } else if (percentage >= 5) {
                rounds.seriesA = 'A'; // Petits détenteurs
            } else {
                rounds.seriesB = 'B'; // Très petits détenteurs
            }

            return {
                key: shareholder.id.toString(),
                name: shareholder.name,
                email: shareholder.email,
                rounds: rounds,
                ownership: `${ownershipPercentage}%`,
                totalShares: totalSharesOwned,
                issuanceCount: shareholderIssuances.length
            };
        });
    };

    const stakeholdersData = createDynamicStakeholdersData();



    // Calcul dynamique de la composition des actionnaires (seulement ceux avec des parts > 0)
    const calculateShareholderComposition = () => {
        if (!stakeholdersData || stakeholdersData.length === 0) {
            return { composition: [], totalActiveShareholders: 0 };
        }

        // Filtrer seulement les actionnaires avec des parts > 0
        const activeShareholders = stakeholdersData.filter(shareholder => shareholder.totalShares > 0);

        if (activeShareholders.length === 0) {
            return { composition: [], totalActiveShareholders: 0 };
        }

        // Calculer le total des actions pour les pourcentages
        const totalShares = activeShareholders.reduce((total, shareholder) => total + shareholder.totalShares, 0);

        // Couleurs disponibles pour les actionnaires
        const colors = ['#60A5FA', '#34D399', '#A78BFA', '#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#F97316'];

        // Créer la composition avec les vrais actionnaires
        const composition = activeShareholders
            .sort((a, b) => b.totalShares - a.totalShares) // Trier par nombre d'actions décroissant
            .map((shareholder, index) => {
                const percentage = totalShares > 0 ? ((shareholder.totalShares / totalShares) * 100) : 0;
                return {
                    category: shareholder.name.toUpperCase(),
                    percentage: Math.round(percentage * 100) / 100, // Arrondir à 2 décimales
                    shares: shareholder.totalShares.toLocaleString(),
                    color: colors[index % colors.length], // Rotation des couleurs
                    rawShares: shareholder.totalShares,
                    rawPercentage: percentage
                };
            });

        return {
            composition: composition,
            totalActiveShareholders: activeShareholders.length
        };
    };

    const { composition: shareholderComposition, totalActiveShareholders } = calculateShareholderComposition();

    const stakeholdersColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record: any) => (
                <div>
                    <Text className="font-ubuntu font-medium text-darkText">{name}</Text>
                    <br />
                    <Text className="font-ubuntu text-xs text-gray-500">{record.email}</Text>
                </div>
            )
        },
        {
            title: 'Category',
            key: 'category',
            render: (record: any) => {
                const percentage = parseFloat(record.ownership);
                let categoryInfo = { name: 'Other', color: '#9CA3AF' };

                if (percentage >= 25) {
                    categoryInfo = { name: 'Major Holder', color: '#166564' };
                } else if (percentage >= 10) {
                    categoryInfo = { name: 'Medium Holder', color: '#FDE047' };
                } else if (percentage >= 5) {
                    categoryInfo = { name: 'Small Holder', color: '#1F2937' };
                } else {
                    categoryInfo = { name: 'Micro Holder', color: '#D1D5DB' };
                }

                return (
                    <Badge
                        color={categoryInfo.color}
                        text={<Text className="font-ubuntu text-xs">{categoryInfo.name}</Text>}
                    />
                );
            }
        },
        {
            title: 'Shares',
            key: 'shares',
            render: (record: any) => (
                <div className="text-right">
                    <Text className="font-ubuntu font-medium text-darkText">
                        {record.totalShares.toLocaleString()}
                    </Text>
                    <br />
                    <Text className="font-ubuntu text-xs text-gray-500">
                        {record.issuanceCount} issuance{record.issuanceCount !== 1 ? 's' : ''}
                    </Text>
                </div>
            )
        },
        {
            title: 'Ownership',
            dataIndex: 'ownership',
            key: 'ownership',
            render: (ownership: string) => (
                <Text className="font-ubuntu font-medium text-primary">{ownership}</Text>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 120,
            render: (record: any) => (
                <Button
                    type="text"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => toggleIssuanceForm(record.key)}
                    className={`font-ubuntu transition-all duration-200 ${expandedRowKeys.includes(record.key)
                        ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                        : 'text-primary hover:text-primaryDark hover:bg-primary/10'
                        }`}
                >
                    {expandedRowKeys.includes(record.key) ? 'Cancel' : 'Add Issuance'}
                </Button>
            )
        }
    ];

    const transactionsColumns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: number) => <Text className="font-ubuntu font-medium">#{id}</Text>
        },
        {
            title: 'Owner',
            dataIndex: 'owner',
            key: 'owner',
            render: (owner: any) => <Text className="font-ubuntu">{owner?.name || owner?.email || 'N/A'}</Text>
        },
        {
            title: 'Date',
            dataIndex: 'issued_at',
            key: 'issued_at',
            render: (issued_at: Date) => <Text className="font-ubuntu">{new Date(issued_at).toLocaleDateString()}</Text>
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => <Text className="font-ubuntu font-medium">{amount.toLocaleString()}</Text>
        },
        {
            title: '',
            key: 'actions',
            width: 40,
            render: (record: any) => (
                <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => generateShareCertificate(record)}
                    className="text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors duration-200"
                    title="Generate Share Certificate"
                    disabled={!record.certificate_path}
                />
            )
        }
    ];

    const fullTransactionsColumns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (id: number) => (
                <Text className="font-ubuntu font-medium text-primary">#{id}</Text>
            )
        },
        {
            title: 'User ID',
            dataIndex: 'user_id',
            key: 'user_id',
            width: 100,
            render: (user_id: number) => (
                <Text className="font-ubuntu text-gray-600">User #{user_id}</Text>
            )
        },
        {
            title: 'Owner',
            dataIndex: 'owner',
            key: 'owner',
            width: 150,
            render: (owner: any) => (
                <Text className="font-ubuntu font-medium text-darkText">
                    {owner?.name || owner?.email || `User #${owner?.id}` || 'N/A'}
                </Text>
            )
        },
        {
            title: 'Issued Date',
            dataIndex: 'issued_at',
            key: 'issued_at',
            width: 120,
            render: (issued_at: Date) => <Text className="font-ubuntu text-gray-600">{new Date(issued_at).toLocaleDateString()}</Text>
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            width: 100,
            render: (amount: number) => (
                <Text className="font-ubuntu font-bold text-darkText">{amount.toLocaleString()} shares</Text>
            )
        },
        {
            title: 'Certificate',
            dataIndex: 'certificate_path',
            key: 'certificate_path',
            width: 100,
            render: (certificate_path: string) => {
                return (
                    <Tag
                        color={certificate_path ? 'success' : 'default'}
                        className="font-ubuntu font-medium"
                    >
                        {certificate_path ? 'AVAILABLE' : 'PENDING'}
                    </Tag>
                );
            }
        },
        {
            title: '',
            key: 'actions',
            width: 60,
            render: (record: any) => (
                <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => {
                        if (record.certificate_download_url) {
                            window.open(`http://localhost:8000${record.certificate_download_url}`, '_blank');
                        } else {
                            message.warning('Certificate not available for download');
                        }
                    }}
                    className="text-gray-500 hover:text-primary hover:bg-primary/10 transition-colors duration-200"
                    title="Download Share Certificate"
                    disabled={!record.certificate_download_url}
                />
            )
        }
    ];

    // Gestion de la popup
    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    // Gestion de l'issuance
    const toggleIssuanceForm = (recordKey: string) => {
        if (expandedRowKeys.includes(recordKey)) {
            setExpandedRowKeys(expandedRowKeys.filter(key => key !== recordKey));
        } else {
            setExpandedRowKeys([...expandedRowKeys, recordKey]);
        }
    };

    const handleIssuanceAmountChange = (recordKey: string, amount: string) => {
        setIssuanceAmounts({
            ...issuanceAmounts,
            [recordKey]: amount
        });
    };

    const handleSubmitIssuance = async (recordKey: string) => {
        const amount = issuanceAmounts[recordKey];
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            message.error('Please enter a valid amount');
            return;
        }

        const shareholder = stakeholdersData.find(item => item.key === recordKey);
        if (!shareholder) {
            message.error('Shareholder not found');
            return;
        }

        try {
            console.log('Submitting issuance:', {
                shareholder: shareholder.name,
                amount: Number(amount),
                user_id: shareholder.key
            });

            await assignShares(Number(shareholder.key), Number(amount));

            message.success(`Issuance of ${amount} shares added for ${shareholder.name}`);
            console.log("The shareholder will be informed about their new share issuance and can download their certificate from their dashboard.")


            // Reset form
            setExpandedRowKeys(expandedRowKeys.filter(key => key !== recordKey));
            setIssuanceAmounts({
                ...issuanceAmounts,
                [recordKey]: ''
            });
        } catch (error: any) {
            message.error(error.message || 'Failed to assign shares');
        }
    };

    const handleCancelIssuance = (recordKey: string) => {
        setExpandedRowKeys(expandedRowKeys.filter(key => key !== recordKey));
        setIssuanceAmounts({
            ...issuanceAmounts,
            [recordKey]: ''
        });
    };

    const handleSubmit = async (values: CreateShareholderRequest) => {
        try {
            setLoading(true);

            // Validation des mots de passe
            if (values.password !== values.confirm_password) {
                message.error('Les mots de passe ne correspondent pas');
                return;
            }

            // Utiliser createShareholder du hook useAdmin
            console.log('Creating shareholder:', values);
            const newShareholder = await createShareholder(values);

            message.success(`Actionnaire ${newShareholder.name} créé avec succès!`);
            setIsModalVisible(false);
            form.resetFields();

            // Recharger les données des actionnaires
            await loadShareholders();

        } catch (error: any) {
            console.error('Error creating shareholder:', error);
            message.error(error.message || 'Erreur lors de la création de l\'actionnaire');
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour générer le certificat PDF
    const generateShareCertificate = async (transaction: any) => {
        // Appel de la fonction generateCertificate du hook useAdmin
        await generateCertificate(transaction.id).then((certificate) => {
            console.log('Generated certificate:', certificate);
            downloadCertificate(transaction.id)
        });

    };

    // Fonction pour gérer la déconnexion
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

    return (
        <Layout className="min-h-screen bg-background font-ubuntu">
            {/* Header */}
            <Header className="bg-white fixed w-full z-50  px-6 h-16 flex items-center justify-start">
                <div className="flex items-center  w-[240px] space-x-18">
                    <div className="flex items-center space-x-2">
                        <img className="w-40 h-40" src="./logo.png" alt="Logo" />
                    </div>
                </div>

                <div className="flex justify-between pl-10  w-full  items-center space-x-8">
                    {/* Stats */}
                    <div className='flex items-center space-x-6'>
                        <div className="flex items-center space-x-1">
                            <ShareAltOutlined className="text-lg text-primaryDark" />
                            <div className="text-start">
                                <div className="font-ubuntu font-bold text-xl text-darkText">
                                    {issuances?.reduce((total, issuance) => total + (issuance.amount || 0), 0).toLocaleString() || '0'}
                                </div>
                                <div className="font-ubuntu text-xs text-gray-500">Fully diluted shares</div>
                            </div>
                        </div>


                        <div className="flex items-center space-x-1">
                            <DollarCircleOutlined className="text-lg text-primaryDark" />
                            <div className="text-start">
                                <div className="font-ubuntu font-bold text-xl text-darkText">
                                    ${issuances?.reduce((total, issuance) => {
                                        const pricePerShare = issuance.price_per_share || 1.0;
                                        return total + (issuance.amount * pricePerShare);
                                    }, 0).toLocaleString() || '0'}
                                </div>
                                <div className="font-ubuntu text-xs text-gray-500">Total cash raised</div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-1">
                            <TeamOutlined className="text-lg text-primaryDark" />
                            <div className="text-start">
                                <div className="font-ubuntu font-bold text-xl text-darkText">{shareholders?.length}</div>
                                <div className="font-ubuntu text-xs text-gray-500">Stakeholders</div>
                            </div>
                        </div>
                    </div>

                    <Avatar size="large" />
                </div>
            </Header>

            <Layout className="pt-16">
                {/* Sidebar */}
                <Sider
                    width={240}
                    className="bg-white fixed left-0 top-16 h-[calc(100vh-64px)] z-40 shadow-sm overflow-hidden"
                >
                    <div className="h-full flex flex-col">
                        {/* Navigation principale */}
                        <div className="p-6 flex-1">
                            <div className="space-y-1">
                                <div className="flex items-center space-x-3 px-3 py-3 rounded-lg bg-lightGray">
                                    <div className="w-2 h-2 bg-darkText rounded-full"></div>
                                    <Text className="font-ubuntu font-medium text-darkText">Overview</Text>
                                </div>

                                <div className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-lightGray cursor-pointer transition-colors">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <Text className="font-ubuntu text-gray-600">Capitalization</Text>
                                </div>

                                <div className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-lightGray cursor-pointer transition-colors">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                    <Text className="font-ubuntu text-gray-600">Company</Text>
                                </div>
                            </div>

                            <Divider className="my-6" />

                            <Button
                                type="text"
                                icon={<PlusOutlined className="text-gray-600" />}
                                className="w-full justify-start font-ubuntu text-gray-600 hover:bg-lightGray hover:text-darkText border-0 px-3 py-2 h-auto text-left"
                                onClick={showModal}
                            >
                                Add new shareholder
                            </Button>
                        </div>

                        {/* Card Logout au bas de la sidebar */}
                        <div className="p-4">
                            <Card className="bg-gradient-to-r from-background to-gray-100 border-0 shadow-sm">
                                <div className="text-center space-y-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-background to-gray-100 rounded-full flex items-center justify-center mx-auto">
                                        <UserOutlined className="text-white text-lg" />
                                    </div>

                                    <div>
                                        <Title level={5} className="!mb-1 font-ubuntu text-darkText">Welcome Admin!</Title>
                                        <Text className="font-ubuntu text-xs text-gray-600 block">
                                            Manage your cap table efficiently
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
                <Content className="ml-60 p-6 bg-white min-h-[calc(100vh-64px)] overflow-y-auto">
                    <Row gutter={[24, 4]}>
                        {/* Cap table summary */}
                        <Col span={16}>

                            <Card className="shadow-sm rounded-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <Title level={4} className="!mb-0 font-ubuntu text-darkText">Cap table summary</Title>
                                    <ExportOutlined className="text-gray-600 cursor-pointer" />
                                </div>

                                {/* Ownership chart */}
                                <div className="mb-6">
                                    <div className="flex items-center space-x-4 mb-3">
                                        {ownershipData.categories.map((category, index) => (
                                            <Text key={index} className="font-ubuntu text-sm text-gray-600">
                                                {category.name}
                                            </Text>
                                        ))}
                                    </div>

                                    <div className="flex h-8 rounded-lg overflow-hidden">
                                        {ownershipData.categories.map((category, index) => (
                                            <div
                                                key={index}
                                                className=""
                                                style={{
                                                    backgroundColor: category.color,
                                                    flex: Math.max(category.percentage, 0.1) // Minimum visible width
                                                }}
                                            ></div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between mt-2 text-sm font-ubuntu">
                                        {ownershipData.categories.map((category, index) => (
                                            <Text key={index}>
                                                {category.percentage > 0 ? `${category.percentage}%` : '0%'}
                                            </Text>
                                        ))}
                                    </div>
                                </div>

                                {/* Stakeholders table */}
                                <Table
                                    dataSource={stakeholdersData}
                                    columns={stakeholdersColumns}
                                    pagination={false}
                                    size="small"
                                    className="font-ubuntu"
                                    expandable={{
                                        expandedRowKeys,
                                        onExpand: (expanded, record) => {
                                            console.log('Expand triggered:', expanded, record.key);
                                            toggleIssuanceForm(record.key);
                                        },
                                        expandedRowRender: (record) => (
                                            <div
                                                className="animate-fade-in-down bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl border-l-4 border-primary mx-4 my-3 shadow-sm"
                                                style={{
                                                    animation: 'slideDown 0.3s ease-out forwards, fadeIn 0.3s ease-out forwards'
                                                }}
                                            >
                                                <style>{`
                                                    @keyframes slideDown {
                                                        from {
                                                            opacity: 0;
                                                            transform: translateY(-10px);
                                                            max-height: 0;
                                                        }
                                                        to {
                                                            opacity: 1;
                                                            transform: translateY(0);
                                                            max-height: 200px;
                                                        }
                                                    }
                                                    
                                                    @keyframes fadeIn {
                                                        from {
                                                            opacity: 0;
                                                        }
                                                        to {
                                                            opacity: 1;
                                                        }
                                                    }
                                                    
                                                    .animate-fade-in-down {
                                                        animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                                                    }
                                                `}</style>
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2 mb-3">
                                                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                                            <Text className="font-ubuntu text-sm font-semibold text-darkText">
                                                                Add New Issuance for {record.name}
                                                            </Text>
                                                        </div>
                                                        <div className="transition-all duration-200 transform hover:scale-[1.01]">
                                                            <Input
                                                                placeholder="Enter number of shares"
                                                                value={issuanceAmounts[record.key] || ''}
                                                                onChange={(e) => handleIssuanceAmountChange(record.key, e.target.value)}
                                                                className="font-ubuntu shadow-sm hover:shadow-md transition-shadow duration-200"
                                                                suffix={
                                                                    <span className="text-gray-500 font-ubuntu text-sm">shares</span>
                                                                }
                                                                type="number"
                                                                autoFocus
                                                                size="large"
                                                            />
                                                        </div>
                                                    </div>
                                                    <Space className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                                                        <Button
                                                            type="primary"
                                                            size="middle"
                                                            onClick={() => handleSubmitIssuance(record.key)}
                                                            disabled={!issuanceAmounts[record.key] || Number(issuanceAmounts[record.key]) <= 0}
                                                            className="font-ubuntu bg-gradient-to-r from-primary to-primaryDark border-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-md"
                                                        >
                                                            Add Shares
                                                        </Button>
                                                        <Button
                                                            size="middle"
                                                            onClick={() => handleCancelIssuance(record.key)}
                                                            className="font-ubuntu border-gray-300 hover:border-red-300 hover:text-red-500 transition-all duration-200"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </Space>
                                                </div>
                                            </div>
                                        ),
                                        showExpandColumn: false,
                                        rowExpandable: (record) => true
                                    }}
                                />
                            </Card>
                        </Col>

                        {/* Right column */}
                        <Col span={8}>
                            <Space direction="vertical" size="large" className="w-full">
                                {/* Latest transactions */}
                                <Card className="shadow-sm h-[400px] overflow-scroll rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <Title level={5} className="!mb-0 font-ubuntu text-darkText">Latest Issuances</Title>
                                        <ArrowRightOutlined
                                            className="text-gray-600 cursor-pointer hover:text-primary transition-colors duration-200"
                                            onClick={() => setTransactionsDrawerVisible(true)}
                                        />
                                    </div>

                                    <Table
                                        dataSource={issuances}
                                        columns={transactionsColumns}
                                        pagination={false}
                                        size="small"
                                        className="font-ubuntu"
                                        showHeader={false}
                                    />
                                </Card>

                                {/* Event Analytics */}
                                <Card
                                    className="shadow-sm rounded-lg bg-gradient-to-br from-primary/5 to-primaryDark/10 cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
                                    onClick={() => setDrawerVisible(true)}
                                >
                                    <div className="relative">
                                        <div className="absolute top-0 right-0">
                                            <div className="w-16 h-16 bg-gradient-to-br from-primary to-background rounded-bl-3xl opacity-20"></div>
                                        </div>
                                        <div className="absolute top-4 right-4">
                                            <BarChartOutlined className="text-2xl text-primary opacity-60" />
                                        </div>

                                        <div className="relative z-10">
                                            <Title level={5} className="!mb-2 font-ubuntu text-darkText">Event Analytics</Title>
                                            <div className="space-y-2">
                                                <div className="flex  items-center justify-between">
                                                    <Text className="font-ubuntu text-sm text-gray-600">Total Events</Text>
                                                    <Text className="font-ubuntu text-lg font-bold text-darkText">{stats?.total_events}</Text>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <Text className="font-ubuntu text-sm text-gray-600">Active Users Today</Text>
                                                    <Text className="font-ubuntu text-lg font-bold text-primary">{stats?.active_users_today}</Text>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <Text className="font-ubuntu text-sm text-gray-600">Today's Activity</Text>
                                                    <div className="flex items-center space-x-1">
                                                        <Text className="font-ubuntu text-sm font-medium text-darkText">
                                                            {stats?.today_events.length} events
                                                        </Text>
                                                        <ArrowRightOutlined className="text-sm text-primary" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Space>
                        </Col>
                    </Row>

                    {/* Shareholder composition section */}
                    <Row gutter={[24, 24]} className="mt-1">
                        <Col span={12}>
                            <Card className="shadow-sm rounded-lg">
                                <div className="flex items-center justify-between mb-6">
                                    <Title level={4} className="!mb-0 font-ubuntu text-darkText">Shareholder composition</Title>

                                </div>

                                <Row gutter={[32, 0]} align="middle">
                                    {/* Donut Chart */}
                                    <Col span={10}>
                                        <div className="relative flex items-center justify-center">
                                            {/* Donut Chart SVG */}
                                            <svg width="160" height="160" className="transform -rotate-90">
                                                {/* Background circle */}
                                                <circle
                                                    cx="80"
                                                    cy="80"
                                                    r="70"
                                                    fill="transparent"
                                                    stroke="#E5E7EB"
                                                    strokeWidth="20"
                                                />

                                                {/* Dynamic circles for each shareholder */}
                                                {shareholderComposition.map((shareholder, index) => {
                                                    // Calculer l'offset basé sur les pourcentages précédents avec espaces
                                                    const gapPercentage = 1; // 1% d'espace entre chaque arc
                                                    const adjustedPercentage = Math.max(shareholder.rawPercentage - gapPercentage, 0.5); // Minimum 0.5% pour visibilité

                                                    const previousPercentages = shareholderComposition
                                                        .slice(0, index)
                                                        .reduce((sum, prev) => sum + prev.rawPercentage, 0) + (index * gapPercentage);

                                                    const circumference = 2 * Math.PI * 70; // 2πr
                                                    const strokeDasharray = `${(adjustedPercentage / 100) * circumference} ${circumference}`;
                                                    const strokeDashoffset = -((previousPercentages / 100) * circumference);

                                                    return (
                                                        <g key={index}>
                                                            {/* Ombre pour l'arc */}
                                                            <circle
                                                                cx="82"
                                                                cy="82"
                                                                r="70"
                                                                fill="transparent"
                                                                stroke="rgba(0, 0, 0, 0.1)"
                                                                strokeWidth="20"
                                                                strokeDasharray={strokeDasharray}
                                                                strokeDashoffset={strokeDashoffset}
                                                                strokeLinecap="round"
                                                                className="blur-sm"
                                                            />
                                                            {/* Arc principal avec bords arrondis */}
                                                            <circle
                                                                cx="80"
                                                                cy="80"
                                                                r="70"
                                                                fill="transparent"
                                                                stroke={shareholder.color}
                                                                strokeWidth="18"
                                                                strokeDasharray={strokeDasharray}
                                                                strokeDashoffset={strokeDashoffset}
                                                                strokeLinecap="round"
                                                                className="transition-all duration-500 hover:stroke-[20] drop-shadow-md"
                                                                style={{
                                                                    filter: `drop-shadow(0 2px 4px ${shareholder.color}40)`
                                                                }}
                                                            />
                                                        </g>
                                                    );
                                                })}
                                            </svg>

                                            {/* Center text */}
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <Text className="font-ubuntu text-4xl font-bold text-darkText">{totalActiveShareholders}</Text>
                                                <Text className="font-ubuntu text-sm text-gray-500">ACTIVE HOLDERS</Text>
                                            </div>
                                        </div>
                                    </Col>                                    {/* Legend */}
                                    <Col span={14}>
                                        <div className="space-y-4">
                                            {shareholderComposition.map((item, index) => (
                                                <div key={index} className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: item.color }}
                                                        ></div>
                                                        <Text className="font-ubuntu text-sm font-medium text-gray-600 uppercase tracking-wider">
                                                            {item.category}
                                                        </Text>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-ubuntu text-lg font-bold text-darkText">
                                                            {item.percentage}%
                                                        </div>
                                                        <div className="font-ubuntu text-xs text-gray-500">
                                                            {item.shares} SHARES
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>
                </Content>
            </Layout>

            {/* Event Analytics Drawer */}
            <Drawer
                title={
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-background rounded-full flex items-center justify-center">
                            <BarChartOutlined className="text-white text-sm" />
                        </div>
                        <span className="font-ubuntu text-lg font-semibold text-darkText">Event Analytics</span>
                    </div>
                }
                placement="right"
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                width={480}
                className="font-ubuntu"
                headerStyle={{
                    borderBottom: '1px solid #E5E7EB',
                    padding: '16px 24px'
                }}
                bodyStyle={{
                    padding: '24px',
                    background: '#FAFAFA'
                }}
                closeIcon={<CloseOutlined className="text-gray-500 hover:text-darkText" />}
            >
                <div className="space-y-6">
                    {/* Overview Cards */}
                    <div className="grid grid-cols-2 gap-4">

                        <Card className="text-center bg-gradient-to-r from-primary to-background shadow-sm border-0">
                            <Statistic
                                title={<span className="font-ubuntu text-gray-600">Total Events</span>}
                                value={stats?.total_events || 0}
                                valueStyle={{
                                    color: '#23555a',
                                    fontFamily: 'Ubuntu',
                                    fontWeight: 'bold'
                                }}
                            />
                        </Card>
                        <Card className="text-center bg-gradient-to-r from-primary to-background shadow-sm border-0">
                            <Statistic
                                title={<span className="font-ubuntu text-gray-600">Active Users</span>}
                                value={stats?.active_users_today || 0}
                                valueStyle={{
                                    color: '#23555a',
                                    fontFamily: 'Ubuntu',
                                    fontWeight: 'bold'
                                }}
                                suffix={<span className="text-sm text-gray-500">today</span>}
                            />
                        </Card>
                    </div>

                    {/* Today's Events Detail */}
                    <Card
                        title={<span className="font-ubuntu font-semibold">Today's Events</span>}
                        className="bg-white shadow-sm border-0"
                        headStyle={{ borderBottom: '1px solid #E5E7EB' }}
                    >
                        <div className="space-y-4">
                            {Object.entries(stats?.today_events || {}).map(([eventType, count], index) => {
                                const getEventColor = (type: string) => {
                                    switch (type) {
                                        case 'login_failed':
                                        case 'share_issuance_failed':
                                            return '#EF4444';
                                        case 'user_created':
                                            return '#10B981';
                                        case 'share_issued':
                                            return '#6366F1';
                                        case 'user_login':
                                            return '#F59E0B';
                                        default:
                                            return '#6B7280';
                                    }
                                };

                                const getEventLabel = (type: string) => {
                                    return type.split('_').map(word =>
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ');
                                };

                                return (
                                    <div key={eventType} className="flex items-center justify-between py-2">
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: getEventColor(eventType) }}
                                            />
                                            <Text className="font-ubuntu text-sm font-medium text-gray-700">
                                                {getEventLabel(eventType)}
                                            </Text>
                                        </div>
                                        <Badge
                                            count={count}
                                            style={{
                                                backgroundColor: getEventColor(eventType),
                                                fontFamily: 'Ubuntu'
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Total for today */}
                        <Divider />
                        <div className="flex items-center justify-between">
                            <Text className="font-ubuntu font-semibold text-darkText">Total Today</Text>
                            <Text className="font-ubuntu text-xl font-bold text-primary">
                                {stats?.today_events.length || 0} events
                            </Text>
                        </div>
                    </Card>

                    {/* Quick Actions */}
                    <Card
                        title={<span className="font-ubuntu font-semibold">Quick Actions</span>}
                        className="bg-white shadow-sm border-0"
                        headStyle={{ borderBottom: '1px solid #E5E7EB' }}
                    >
                        <div className="space-y-3">
                            <Button
                                type="text"
                                className="w-full justify-start font-ubuntu text-left h-10"
                                onClick={() => message.info('Event logs feature coming soon')}
                            >
                                📊 View Event Logs
                            </Button>
                            <Button
                                type="text"
                                className="w-full justify-start font-ubuntu text-left h-10"
                                onClick={() => message.info('Analytics dashboard feature coming soon')}
                            >
                                📈 Analytics Dashboard
                            </Button>
                            <Button
                                type="text"
                                className="w-full justify-start font-ubuntu text-left h-10"
                                onClick={() => message.info('Export report feature coming soon')}
                            >
                                📄 Export Report
                            </Button>
                        </div>
                    </Card>
                </div>
            </Drawer>

            {/* Transactions Drawer */}
            <Drawer
                title={
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-primary to-background rounded-full flex items-center justify-center">
                            <ShareAltOutlined className="text-white text-sm" />
                        </div>
                        <span className="font-ubuntu text-lg font-semibold text-darkText">All Issuances</span>
                    </div>
                }
                placement="right"
                onClose={() => setTransactionsDrawerVisible(false)}
                open={transactionsDrawerVisible}
                width={800}
                className="font-ubuntu"
                headerStyle={{
                    borderBottom: '1px solid #E5E7EB',
                    padding: '16px 24px'
                }}
                bodyStyle={{
                    padding: '24px',
                    background: '#FAFAFA'
                }}
                closeIcon={<CloseOutlined className="text-gray-500 hover:text-darkText" />}
            >
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-4 gap-4">
                        <Card className="text-center bg-white shadow-sm border-0">
                            <Statistic
                                title={<span className="font-ubuntu text-gray-600 text-xs">Total Issuances</span>}
                                value={issuances?.length || 0}
                                valueStyle={{
                                    color: '#6366F1',
                                    fontFamily: 'Ubuntu',
                                    fontWeight: 'bold',
                                    fontSize: '20px'
                                }}
                            />
                        </Card>
                        <Card className="text-center bg-white shadow-sm border-0">
                            <Statistic
                                title={<span className="font-ubuntu text-gray-600 text-xs">Total Shares</span>}
                                value={issuances?.reduce((sum, issuance) => sum + (issuance.amount || 0), 0) || 0}
                                valueStyle={{
                                    color: '#10B981',
                                    fontFamily: 'Ubuntu',
                                    fontWeight: 'bold',
                                    fontSize: '20px'
                                }}
                            />
                        </Card>
                        <Card className="text-center bg-white shadow-sm border-0">
                            <Statistic
                                title={<span className="font-ubuntu text-gray-600 text-xs">With Certificates</span>}
                                value={issuances?.filter(issuance => issuance.certificate_path).length || 0}
                                valueStyle={{
                                    color: '#F59E0B',
                                    fontFamily: 'Ubuntu',
                                    fontWeight: 'bold',
                                    fontSize: '20px'
                                }}
                            />
                        </Card>
                        <Card className="text-center bg-white shadow-sm border-0">
                            <Statistic
                                title={<span className="font-ubuntu text-gray-600 text-xs">Active Owners</span>}
                                value={new Set(issuances?.map(issuance => issuance.owner?.id)).size || 0}
                                valueStyle={{
                                    color: '#EF4444',
                                    fontFamily: 'Ubuntu',
                                    fontWeight: 'bold',
                                    fontSize: '20px'
                                }}
                            />
                        </Card>
                    </div>

                    {/* Transactions Table */}
                    <Card
                        className="bg-white shadow-sm border-0"
                        title={
                            <div className="flex items-center justify-between">
                                <span className="font-ubuntu font-semibold text-darkText">Issuance History</span>

                            </div>
                        }
                        headStyle={{ borderBottom: '1px solid #E5E7EB' }}
                        bodyStyle={{ padding: 0 }}
                    >
                        <Table
                            dataSource={issuances}
                            columns={fullTransactionsColumns}
                            pagination={{
                                total: issuances?.length || 0,
                                pageSize: 8,
                                showSizeChanger: false,
                                showQuickJumper: true,
                                showTotal: (total, range) =>
                                    `${range[0]}-${range[1]} of ${total} issuances`
                            }}
                            size="middle"
                            className="font-ubuntu"
                            scroll={{ x: 700 }}
                            rowClassName="hover:bg-gray-50 transition-colors duration-150"
                        />
                    </Card>

                    {/* Quick Actions */}
                    <Card
                        title={<span className="font-ubuntu font-semibold">Quick Actions</span>}
                        className="bg-white shadow-sm border-0"
                        headStyle={{ borderBottom: '1px solid #E5E7EB' }}
                    >
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="text"
                                className="h-12 justify-start font-ubuntu text-left"
                                icon={<PlusOutlined />}
                                onClick={() => message.info('New transaction feature coming soon')}
                            >
                                New Issuance
                            </Button>
                            <Button
                                type="text"
                                className="h-12 justify-start font-ubuntu text-left"
                                icon={<ExportOutlined />}
                                onClick={() => message.info('Export feature coming soon')}
                            >
                                Export All Data
                            </Button>
                            <Button
                                type="text"
                                className="h-12 justify-start font-ubuntu text-left"
                                icon={<SearchOutlined />}
                                onClick={() => message.info('Advanced search feature coming soon')}
                            >
                                Advanced Search
                            </Button>
                            <Button
                                type="text"
                                className="h-12 justify-start font-ubuntu text-left"
                                icon={<BarChartOutlined />}
                                onClick={() => message.info('Analytics feature coming soon')}
                            >
                                View Analytics
                            </Button>
                        </div>
                    </Card>
                </div>
            </Drawer>

            {/* Modal for Adding New Shareholder */}
            <Modal
                title={null}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                centered
                width={520}
                destroyOnClose
                maskClosable={true}
                className="blur-modal bg-transparent"
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
                        className=" backdrop-blur-lg rounded-2xl  border border-white/20"
                        style={{
                            background: 'transparent',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                        }}
                    >
                        {/* Header */}
                        <div className="px-8 pt-8 pb-6 border-b border-gray-100/50">
                            <div className="flex items-center space-x-3 mb-2">
                                <div className="w-10 h-10 bg-gradient-to-r from-primary to-primaryDark rounded-full flex items-center justify-center">
                                    <UserOutlined className="text-white text-lg" />
                                </div>
                                <Title level={3} className="!mb-0 font-ubuntu text-darkText">
                                    Add New Shareholder
                                </Title>
                            </div>
                            <Text className="font-ubuntu text-gray-600">
                                Create a new shareholder account with secure credentials
                            </Text>
                        </div>

                        {/* Form */}
                        <div className="px-8 py-6">
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleSubmit}
                                size="large"
                                className="space-y-4"
                            >
                                <Form.Item
                                    name="name"
                                    label={<Text className="font-ubuntu font-medium text-darkText">Full Name</Text>}
                                    rules={[
                                        { required: true, message: 'Please enter the full name' },
                                        { min: 2, message: 'Name must be at least 2 characters' }
                                    ]}
                                >
                                    <Input
                                        prefix={<UserOutlined className="text-gray-400" />}
                                        placeholder="Enter full name"
                                        className="font-ubuntu rounded-lg h-12"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="email"
                                    label={<Text className="font-ubuntu font-medium text-darkText">Email Address</Text>}
                                    rules={[
                                        { required: true, message: 'Please enter email address' },
                                        { type: 'email', message: 'Please enter a valid email address' }
                                    ]}
                                >
                                    <Input
                                        prefix={<MailOutlined className="text-gray-400" />}
                                        placeholder="Enter email address"
                                        className="font-ubuntu rounded-lg h-12"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="password"
                                    label={<Text className="font-ubuntu font-medium text-darkText">Password</Text>}
                                    rules={[
                                        { required: true, message: 'Please enter password' },
                                        { min: 6, message: 'Password must be at least 6 characters' }
                                    ]}
                                >
                                    <Input.Password
                                        prefix={<LockOutlined className="text-gray-400" />}
                                        placeholder="Enter password"
                                        className="font-ubuntu rounded-lg h-12"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="confirm_password"
                                    label={<Text className="font-ubuntu font-medium text-darkText">Confirm Password</Text>}
                                    dependencies={['password']}
                                    rules={[
                                        { required: true, message: 'Please confirm password' },
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
                                        prefix={<LockOutlined className="text-gray-400" />}
                                        placeholder="Confirm password"
                                        className="font-ubuntu rounded-lg h-12"
                                    />
                                </Form.Item>

                                {/* Actions */}
                                <div className="flex items-center justify-end space-x-3 pt-4">
                                    <Button
                                        onClick={handleCancel}
                                        className="font-ubuntu px-6 h-10 rounded-lg"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        className="font-ubuntu px-6 h-10 rounded-lg bg-gradient-to-r from-primary to-primaryDark border-0 hover:shadow-lg"
                                    >
                                        {loading ? 'Creating...' : 'Create Shareholder'}
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Logout Modal */}
            <LogoutModal
                visible={logoutModalVisible}
                onClose={() => setLogoutModalVisible(false)}
                onConfirm={handleLogoutConfirm}
                userName="Admin"
            />
        </Layout>
    );
}