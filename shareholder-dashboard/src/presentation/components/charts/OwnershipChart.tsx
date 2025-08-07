import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface OwnershipCategory {
    name: string;
    percentage: number;
    color: string;
}

interface OwnershipChartProps {
    categories: OwnershipCategory[];
}

export function OwnershipChart({ categories }: OwnershipChartProps) {
    return (
        <div className="mb-6">
            <div className="flex items-center space-x-4 mb-3">
                {categories.map((category, index) => (
                    <Text key={index} className="font-ubuntu text-sm text-gray-600">
                        {category.name}
                    </Text>
                ))}
            </div>

            <div className="flex h-8 rounded-lg overflow-hidden">
                {categories.map((category, index) => (
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
                {categories.map((category, index) => (
                    <Text key={index}>
                        {category.percentage > 0 ? `${category.percentage}%` : '0%'}
                    </Text>
                ))}
            </div>
        </div>
    );
}
