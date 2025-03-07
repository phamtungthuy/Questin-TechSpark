import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { BarChart as MuiBarChart } from "@mui/x-charts/BarChart";
import { useTheme } from "@mui/material/styles";
import { type BarChartProps as MuiBarChartProps } from "@mui/x-charts/BarChart/BarChart";

interface BarChartProps {
    title?: string;
    value?: string | number;
    description?: string;
    change?: {
        percentage: string;
        color: "error" | "success" | "warning" | "info";
    };
    xCategories: string[];
    series: Array<{
        id: string;
        label: string;
        data: number[];
        stack?: string;
    }>;
    colors?: string[];
    height?: number;
    margin?: MuiBarChartProps["margin"];
    showGrid?: boolean;
    showLegend?: boolean;
}

const BarChart = ({
    title,
    value,
    description,
    change,
    xCategories,
    series,
    colors,
    height = 250,
    margin = { left: 50, right: 0, top: 20, bottom: 20 },
    showGrid = true,
    showLegend = false,
}: BarChartProps) => {
    const theme = useTheme();
    const defaultColors = [
        (theme.vars || theme).palette.primary.dark,
        (theme.vars || theme).palette.primary.main,
        (theme.vars || theme).palette.primary.light,
    ];

    return (
        <Card variant="outlined" sx={{ width: "100%" }}>
            <CardContent>
                {title && (
                    <Typography component="h2" variant="subtitle2" gutterBottom>
                        {title}
                    </Typography>
                )}

                {(value || change || description) && ( 
                    <Stack sx={{ justifyContent: "space-between" }}>
                        {(value || change) && ( 
                            <Stack
                                direction="row"
                                sx={{
                                    alignContent: {
                                        xs: "center",
                                        sm: "flex-start",
                                    },
                                    alignItems: "center",
                                    gap: 1,
                                }}
                            >
                                {value && (
                                    <Typography variant="h4" component="p">
                                        {value}
                                    </Typography>
                                )}
                                {change && (
                                    <Chip
                                        size="small"
                                        color={change.color}
                                        label={change.percentage}
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
                    </Stack>
                )}

                <MuiBarChart
                    borderRadius={8}
                    colors={colors || defaultColors}
                    xAxis={[
                        {
                            scaleType: "band",
                            data: xCategories,
                        },
                    ]}
                    series={series}
                    height={height}
                    margin={margin}
                    grid={{ horizontal: showGrid }}
                    slotProps={{
                        legend: {
                            hidden: !showLegend,
                        },
                    }}
                />
            </CardContent>
        </Card>
    );
};

export default BarChart;
