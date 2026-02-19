/// <reference types="expo/types" />

declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  const value: any;
  export default value;
}

declare module 'react-native-chart-kit' {
  import { ComponentType } from 'react';
  import { ViewStyle } from 'react-native';

  export interface ChartConfig {
    backgroundGradientFrom?: string;
    backgroundGradientTo?: string;
    color?: (opacity?: number) => string;
    strokeWidth?: number;
    barPercentage?: number;
    useShadowColorFromDataset?: boolean;
    decimalPlaces?: number;
    style?: ViewStyle;
  }

  export interface AbstractChartProps {
    data: any;
    width: number;
    height: number;
    chartConfig: ChartConfig;
    style?: ViewStyle;
  }

  export const LineChart: ComponentType<AbstractChartProps>;
  export const BarChart: ComponentType<AbstractChartProps>;
  export const PieChart: ComponentType<AbstractChartProps>;
  export const ProgressChart: ComponentType<AbstractChartProps>;
}
