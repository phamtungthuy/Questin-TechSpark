import {
    Box,
    Button,
    FormControl,
    Slider,
    TextField,
    Typography,
} from "@mui/material";
import useForm from "hooks/common-hook";
interface IProps {
    form: ReturnType<typeof useForm>;
}

const ParseConfiguration = ({ form }: IProps) => {

    const raptorConfig = form.getFieldValue("parser_config")["raptor"];

    const handleConfigChange = (key: string, value: any) => {
        form.setFieldValue("parser_config", {
            ...form.getFieldValue("parser_config"),
            raptor: {
                ...raptorConfig,
                [key]: value,
            },
        });
    };
    const handleSliderChange = (name: string, value: number | number[]) => {
        let parsedValue = value;
        if (name === "max_token" || name === "max_cluster" || name === "random_seed") {
            parsedValue = Math.min(Math.max(parseInt(value as unknown as string), 0), name === "max_token" ? 2048 : 1024);
        } else if (name === "threshold") {
            parsedValue = Math.min(Math.max(parseFloat(value as unknown as string), 0), 1);
        }
        handleConfigChange(name, parsedValue);
    };

    const renderSliderField = (label: string, name: string, min: number, max: number, step: number, value: number) => (
        <Box display="flex" gap="8px" justifyContent="space-between" alignItems="center">
            <Typography noWrap overflow="visible">{label}:</Typography>
            <Slider
                valueLabelDisplay="auto"
                step={step}
                min={min}
                max={max}
                value={value}
                onChange={(e, value) => handleSliderChange(name, value)}
            />
            <TextField
                name={name}
                type="number"
                sx={{ width: "100px" }}
                value={value}
                onChange={(e) => handleSliderChange(name, parseFloat(e.target.value))}
            />
        </Box>
    );

    return (
        <FormControl>
            <Box display="flex" flexDirection="column" gap="16px">
                <Box display="flex" gap="8px">
                    <span style={{ color: "red" }}>*</span>
                    <Typography>Prompt:</Typography>
                    <TextField
                        name="prompt"
                        multiline
                        rows={8}
                        value={raptorConfig.prompt}
                        fullWidth
                        onChange={(e) => handleConfigChange("prompt", e.target.value)}
                    />
                </Box>

                {renderSliderField("Max token", "max_token", 0, 2048, 1, raptorConfig.max_token)}
                {renderSliderField("Threshold", "threshold", 0, 1, 0.01, raptorConfig.threshold)}
                {renderSliderField("Max cluster", "max_cluster", 1, 1024, 1, raptorConfig.max_cluster)}

                <Box display="flex" gap="8px" justifyContent="space-between" alignItems="center">
                    <Typography noWrap>Random seed:</Typography>
                    <TextField
                        name="random_seed"
                        type="number"
                        sx={{ flex: "1" }}
                        value={raptorConfig.random_seed}
                        onChange={(e) => handleConfigChange("random_seed", e.target.value)}
                    />
                    <Button variant="contained" color="primary" size="small" />
                </Box>
            </Box>
        </FormControl>
    );
};

export default ParseConfiguration;