import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface ShareholderComposition {
    category: string;
    percentage: number;
    shares: string;
    color: string;
    rawShares: number;
    rawPercentage: number;
}

interface DonutChartProps {
    composition: ShareholderComposition[];
    totalActiveShareholders: number;
}

export function DonutChart({ composition, totalActiveShareholders }: DonutChartProps) {
    const renderDonutChart = () => {
        if (composition.length === 0) {
            return (
                <div className="relative flex items-center justify-center">
                    <svg width="160" height="160">
                        <circle
                            cx="80"
                            cy="80"
                            r="70"
                            fill="transparent"
                            stroke="#E5E7EB"
                            strokeWidth="20"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <Text className="font-ubuntu text-2xl font-bold text-gray-400">0</Text>
                        <Text className="font-ubuntu text-xs text-gray-400">Active Shareholders</Text>
                    </div>
                </div>
            );
        }

        const circumference = 2 * Math.PI * 70;
        let currentOffset = 0;

        return (
            <div className="relative flex items-center justify-center">
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
                    {composition.map((shareholder, index) => {
                        const gapPercentage = 1;
                        const adjustedPercentage = Math.max(shareholder.rawPercentage - gapPercentage, 0.5);
                        const strokeDasharray = `${(adjustedPercentage / 100) * circumference} ${circumference}`;
                        const strokeDashoffset = -currentOffset * circumference / 100;

                        currentOffset += adjustedPercentage + gapPercentage;

                        return (
                            <circle
                                key={index}
                                cx="80"
                                cy="80"
                                r="70"
                                fill="transparent"
                                stroke={shareholder.color}
                                strokeWidth="20"
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-in-out"
                            />
                        );
                    })}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Text className="font-ubuntu text-2xl font-bold text-darkText">
                        {totalActiveShareholders}
                    </Text>
                    <Text className="font-ubuntu text-xs text-gray-500">
                        Active Shareholders
                    </Text>
                </div>
            </div>
        );
    };

    const renderLegend = () => (
        <div className="space-y-4">
            {composition.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                        ></div>
                        <div>
                            <Text className="font-ubuntu font-medium text-darkText text-sm">
                                {item.category}
                            </Text>
                            <br />
                            <Text className="font-ubuntu text-xs text-gray-500">
                                {item.shares} shares
                            </Text>
                        </div>
                    </div>
                    <Text className="font-ubuntu font-bold text-darkText">
                        {item.percentage}%
                    </Text>
                </div>
            ))}
        </div>
    );

    return (
        <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
                {renderDonutChart()}
            </div>
            <div className="flex-1">
                {renderLegend()}
            </div>
        </div>
    );
}
