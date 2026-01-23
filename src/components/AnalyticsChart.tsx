import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import clsx from 'clsx';
import { formatCurrencyDefault } from '../utils/currency';

interface ChartProps {
  data: any[];
  type: 'line' | 'bar' | 'pie' | 'area' | 'dual-area' | 'dual-bar';
  title?: string;
  subtitle?: string;
  height?: number;
  color?: string;
  colors?: string[];
  dataKey?: string;
  secondaryDataKey?: string;
  xAxisKey?: string;
  yAxisKey?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  className?: string;
  valueType?: 'currency' | 'weight' | 'count' | 'percentage';
  secondaryValueType?: 'currency' | 'weight' | 'count' | 'percentage';
  secondaryColor?: string;
  unit?: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green  
  '#F59E0B', // yellow
  '#EF4444', // red
  '#8B5CF6', // purple
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16'  // lime
];

export const AnalyticsChart: React.FC<ChartProps> = ({
  data,
  type,
  title,
  subtitle,
  height = 300,
  color = '#3B82F6',
  colors = DEFAULT_COLORS,
  dataKey = 'value',
  secondaryDataKey,
  xAxisKey = 'name',
  yAxisKey,
  showLegend = true,
  showGrid = true,
  className,
  valueType = 'currency',
  secondaryValueType = 'weight',
  secondaryColor = '#F59E0B',
  unit
}) => {
  const formatValue = (value: number, type: 'currency' | 'weight' | 'count' | 'percentage' = valueType) => {
    // Handle different value types
    switch (type) {
      case 'weight':
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}t`;
        }
        return `${value.toFixed(1)}`;
      
      case 'count':
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toString();
      
      case 'percentage':
        return `${value.toFixed(1)}%`;
      
      case 'currency':
      default:
        // For Y-axis labels, show currency symbol only once at the end
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toFixed(0);
    }
  };

  const formatTooltipValue = (value: number, type: 'currency' | 'weight' | 'count' | 'percentage' = valueType) => {
    // For tooltips, show full currency formatting
    switch (type) {
      case 'weight':
        if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}t`;
        }
        return `${value.toFixed(1)}kg`;
      
      case 'count':
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toString();
      
      case 'percentage':
        return `${value.toFixed(1)}%`;
      
      case 'currency':
      default:
        return formatCurrencyDefault(value);
    }
  };

  const formatTooltip = (value: any, name: string) => {
    if (typeof value === 'number') {
      const type = name === secondaryDataKey ? secondaryValueType : valueType;
      return [formatTooltipValue(value, type), name === 'cost' ? 'Cost' : name === 'weight' ? 'Weight' : name];
    }
    return [value, name];
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
              minTickGap={5}
              height={60}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value)}
              label={valueType === 'currency' ? { 
                value: formatCurrencyDefault(0).replace(/[\d.,]/g, '').trim() || '$', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '12px', fill: '#6B7280' }
              } : undefined}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelStyle={{ color: '#374151' }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            {showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
              minTickGap={5}
              height={60}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value)}
              label={valueType === 'currency' ? { 
                value: formatCurrencyDefault(0).replace(/[\d.,]/g, '').trim() || '$', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '12px', fill: '#6B7280' }
              } : undefined}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelStyle={{ color: '#374151' }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            {showLegend && <Legend />}
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorGradient)"
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
              minTickGap={5}
              height={60}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value)}
              label={valueType === 'currency' ? { 
                value: formatCurrencyDefault(0).replace(/[\d.,]/g, '').trim() || '$', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '12px', fill: '#6B7280' }
              } : undefined}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelStyle={{ color: '#374151' }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            {showLegend && <Legend />}
            <Bar 
              dataKey={dataKey} 
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case 'dual-area':
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
              minTickGap={5}
              height={60}
            />
            <YAxis 
              yAxisId="left"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value, valueType)}
              label={valueType === 'currency' ? { 
                value: formatCurrencyDefault(0).replace(/[\d.,]/g, '').trim() || '$', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '12px', fill: '#6B7280' }
              } : undefined}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value, secondaryValueType || 'weight')}
              label={secondaryValueType === 'weight' ? { 
                value: 'kg', 
                angle: 90, 
                position: 'insideRight',
                style: { textAnchor: 'middle', fontSize: '12px', fill: '#6B7280' }
              } : undefined}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelStyle={{ color: '#374151' }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            {showLegend && <Legend />}
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="secondaryColorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey={dataKey} 
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorGradient)"
            />
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey={secondaryDataKey || 'weight'} 
              stroke={secondaryColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#secondaryColorGradient)"
            />
          </AreaChart>
        );

      case 'dual-bar':
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              interval={0}
              minTickGap={5}
              height={60}
            />
            <YAxis 
              yAxisId="left"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value, valueType)}
              label={valueType === 'currency' ? { 
                value: formatCurrencyDefault(0).replace(/[\d.,]/g, '').trim() || '$', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '12px', fill: '#6B7280' }
              } : undefined}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatValue(value, secondaryValueType || 'weight')}
              label={secondaryValueType === 'weight' ? { 
                value: 'kg', 
                angle: 90, 
                position: 'insideRight',
                style: { textAnchor: 'middle', fontSize: '12px', fill: '#6B7280' }
              } : undefined}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelStyle={{ color: '#374151' }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            {showLegend && <Legend />}
            <Bar 
              yAxisId="left"
              dataKey={dataKey} 
              fill={color}
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              yAxisId="right"
              dataKey={secondaryDataKey || 'weight'} 
              fill={secondaryColor}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={formatTooltip} />
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className={clsx(
      'bg-white rounded-xl shadow-lg border border-gray-100 p-6',
      className
    )}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        {renderChart() || <div>Chart type not supported</div>}
      </ResponsiveContainer>
    </div>
  );
};