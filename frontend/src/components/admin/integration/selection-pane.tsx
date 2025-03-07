import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

// Định nghĩa type cho Provider
interface Provider {
  id: string;
  name: string;
}

// Định nghĩa type cho props của DialogBox
interface SelectionPaneProps {
  open: boolean;
  onClose: () => void;
  selectedProvider: Provider | null;
  setSelectedProvider: (provider: Provider | null) => void;
  providers: Provider[];
  isLoading: boolean;
  onContinue?: () => void;
}

const SelectionPane: React.FC<SelectionPaneProps> = ({
  open,
  onClose,
  selectedProvider,
  setSelectedProvider,
  providers,
  isLoading,
  onContinue,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add your credentials</DialogTitle>
      <DialogContent sx={{ color: "#737373", minHeight: 200 }}>
        Select an app or service to connect to
        <TextField
          select
          fullWidth
          variant="outlined"
          margin="dense"
          value={selectedProvider?.id || ""}
          onChange={(e) => {
            const provider =
              providers.find((p) => p.id === e.target.value) || null;
            setSelectedProvider(provider);
          }}
          placeholder="Choose an app"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          SelectProps={{
            displayEmpty: true,
            renderValue: selectedProvider
              ? () => selectedProvider.name
              : undefined,
            MenuProps: {
              PaperProps: {
                style: { maxHeight: 200 },
              },
            },
          }}
        >
          {isLoading ? (
            <MenuItem disabled>Loading...</MenuItem>
          ) : providers.length > 0 ? (
            providers.map((provider: Provider) => (
              <MenuItem key={provider.id} value={provider.id}>
                {provider.name}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled>No providers available</MenuItem>
          )}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          onClick={() => {
            if (onContinue) onContinue();
            onClose();
          }}
          // disabled={!selectedProvider}
          sx={{
            backgroundColor: "black",
            color: "white",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              opacity: 0.7,
              backgroundColor: "black",
              color: "white",
            },
          }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SelectionPane;
