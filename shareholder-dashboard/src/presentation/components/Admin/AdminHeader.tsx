import React from 'react';
import { Layout, Avatar, Typography } from 'antd';
import { ShareAltOutlined, DollarCircleOutlined, TeamOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Text } = Typography;

interface AdminHeaderProps {
    totalShares: number;
    totalCashRaised: number;
    totalShareholders: number;
}

export function AdminHeader({ totalShares, totalCashRaised, totalShareholders }: AdminHeaderProps) {
    return (
        <Header className="bg-white fixed w-full z-50 px-6 h-16 flex items-center justify-start">
            <div className="flex items-center w-[240px] space-x-18">
                <div className="flex items-center space-x-2">
                    <img className="w-40 h-40" src="./logo.png" alt="Logo" />
                </div>
            </div>

            <div className="flex justify-between pl-10 w-full items-center space-x-8">
                {/* Stats */}
                <div className='flex items-center space-x-6'>
                    <div className="flex items-center space-x-1">
                        <ShareAltOutlined className="text-lg text-primaryDark" />
                        <div className="text-start">
                            <div className="font-ubuntu font-bold text-xl text-darkText">
                                {totalShares.toLocaleString()}
                            </div>
                            <div className="font-ubuntu text-xs text-gray-500">Fully diluted shares</div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1">
                        <DollarCircleOutlined className="text-lg text-primaryDark" />
                        <div className="text-start">
                            <div className="font-ubuntu font-bold text-xl text-darkText">
                                ${totalCashRaised.toLocaleString()}
                            </div>
                            <div className="font-ubuntu text-xs text-gray-500">Total cash raised</div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-1">
                        <TeamOutlined className="text-lg text-primaryDark" />
                        <div className="text-start">
                            <div className="font-ubuntu font-bold text-xl text-darkText">{totalShareholders}</div>
                            <div className="font-ubuntu text-xs text-gray-500">Stakeholders</div>
                        </div>
                    </div>
                </div>

                <Avatar size="large" />
            </div>
        </Header>
    );
}
