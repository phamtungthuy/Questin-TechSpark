import * as React from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { areaElementClasses } from "@mui/x-charts/LineChart";

export type TrendType = "up" | "down" | "neutral" | "custom";

export type StatCardProps = {
    title?: string;
    value?: string | number;
    description?: string;
    trend?: TrendType;
    trendLabel?: string;
    trendColor?: {
        light: string;
        dark: string;
    };
    data: number[];
    xLabels?: string[];
    height?: number;
    showTrend?: boolean;
    showChart?: boolean;
    chartProps?: React.ComponentProps<typeof SparkLineChart>;
};

function AreaGradient({ color, id }: { color: string; id: string }) {
    return (
        <defs>
            <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
        </defs>
    );
}

const defaultTrendColors = {
    up: { light: "#4CAF50", dark: "#388E3C" },
    down: { light: "#F44336", dark: "#D32F2F" },
    neutral: { light: "#9E9E9E", dark: "#616161" },
    custom: { light: "#2196F3", dark: "#1976D2" },
};

export default function StatCard({
    title,
    value,
    description,
    trend = "neutral",
    trendLabel,
    trendColor,
    data,
    xLabels,
    height = 50,
    showTrend = true,
    showChart = true,
    chartProps,
}: StatCardProps) {
    const theme = useTheme();

    // Xử lý màu sắc
    const colors = trendColor || defaultTrendColors[trend];
    const chartColor =
        theme.palette.mode === "light" ? colors.light : colors.dark;

    // Xử lý label
    const trendChipColor =
        trend === "custom"
            ? "default"
            : trend === "up"
            ? "success"
            : trend === "down"
            ? "error"
            : "default";
    const defaultTrendLabels = {
        up: "+25%",
        down: "-15%",
        neutral: "0%",
        custom: trendLabel || "Custom",
    };

    return (
        <Card variant="outlined" sx={{ height: "100%", flexGrow: 1 }}>
            <CardContent>
                {title && (
                    <Typography component="h2" variant="subtitle2" gutterBottom>
                        {title}
                    </Typography>
                )}

                <Stack direction="column" spacing={1}>
                    {(value || showTrend) && (
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                        >
                            {value && (
                                <Typography variant="h4" component="p">
                                    {value}
                                </Typography>
                            )}

                            {showTrend && (
                                <Chip
                                    size="small"
                                    color={
                                        trendChipColor as
                                            | "default"
                                            | "primary"
                                            | "secondary"
                                            | "error"
                                            | "info"
                                            | "success"
                                            | "warning"
                                    }
                                    label={
                                        trendLabel || defaultTrendLabels[trend]
                                    }
                                />
                            )}
                        </Stack>
                    )}

                    {description && (
                        <Typography
                            variant="caption"
                            sx={{ color: "text.secondary" }}
                        >
                            {description}
                        </Typography>
                    )}

                    {showChart && (
                        <Box sx={{ width: "100%", height }}>
                            <SparkLineChart
                                colors={[chartColor]}
                                data={data}
                                area
                                showHighlight
                                showTooltip
                                xAxis={{
                                    scaleType: "band",
                                    data:
                                        xLabels ||
                                        Array.from(
                                            { length: data.length },
                                            (_, i) => `${i + 1}`
                                        ),
                                }}
                                sx={{
                                    [`& .${areaElementClasses.root}`]: {
                                        fill: `url(#area-gradient-${value})`,
                                    },
                                    ...chartProps?.sx,
                                }}
                                {...chartProps}
                            >
                                <AreaGradient
                                    color={chartColor}
                                    id={`area-gradient-${value}`}
                                />
                            </SparkLineChart>
                        </Box>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
