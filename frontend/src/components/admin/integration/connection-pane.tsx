"use client"

import { useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { RootState } from "store/store"
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Toolbar,
  Typography,
  Select,
  MenuItem,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from "@mui/material"
import {
  Close as CloseIcon,
  ContentCopy as ContentCopyIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material"

interface Provider {
  id: string
  name: string
}

interface ConnectionPaneProps {
  open: boolean
  onClose: () => void
  selectedProvider: Provider | null
  setSelectedProvider: (provider: Provider | null) => void
  providers: Provider[]
  isLoading: boolean
}

const ConnectionPane: React.FC<ConnectionPaneProps> = ({
  open,
  onClose,
  selectedProvider,
  setSelectedProvider,
  providers,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<string>("connection")
  const [webhook, setWebhook] = useState<string>("")
  const [verifyCode, setVerifyCode] = useState<string>("")
  const [pageToken, setPageToken] = useState<string>("")
  const [integrationName, setIntegrationName] = useState<string>("")
  const [dialogName, setDialogName] = useState<string>("")
  const [copied, setCopied] = useState(false)

  // Lấy danh sách dialog từ Redux store
  const dialogList = useSelector((state: RootState) => state.dialog.dialogList) ?? []

  useEffect(() => {
    if (selectedProvider) {
      setWebhook(`https://6ee2-171-241-57-198.ngrok-free.app/webhook/${crypto.randomUUID()}`)
      setVerifyCode(crypto.randomUUID())
      setPageToken("")
      setDialogName(dialogList.length > 0 ? dialogList[0].name : "")
    }
  }, [selectedProvider, dialogList])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="h6">{selectedProvider?.name || "Connection Settings"}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", gap: 4, mt: 2 }}>
          <Paper sx={{ width: 200, p: 2 }}>
            <Tabs
              orientation="vertical"
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              sx={{
                "& .MuiTab-root": {
                  alignItems: "flex-start",
                  textAlign: "left",
                  pl: 0,
                },
              }}
            >
              <Tab label="Connection" value="connection" />
              <Tab label="Security" value="security" />
              <Tab label="Setting" value="setting" />
            </Tabs>
          </Paper>

          <Box sx={{ flex: 1 }}>
            {activeTab === "connection" && (
              <>
                <Box sx={{ mb: 4 }}>
                  <Typography>Webhook</Typography>
                  <TextField
                    fullWidth
                    value={webhook}
                    disabled={isLoading}
                    onChange={(e) => setWebhook(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title={copied ? "Copied!" : "Copy"}>
                            <IconButton onClick={() => handleCopy(webhook)}>
                              <ContentCopyIcon />
                            </IconButton>
                          </Tooltip>
                          <IconButton onClick={() => setWebhook(`https://6ee2-171-241-57-198.ngrok-free.app/webhook/${crypto.randomUUID()}`)}>
                            <RefreshIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography>Verify code</Typography>
                  <TextField
                    fullWidth
                    value={verifyCode}
                    disabled={isLoading}
                    onChange={(e) => setVerifyCode(e.target.value)}
                  />
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography>Page access token</Typography>
                  <TextField
                    fullWidth
                    value={integrationName}
                    disabled={isLoading}
                    onChange={(e) => setIntegrationName(e.target.value)}
                  />
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography>Integration name</Typography>
                  <TextField
                    fullWidth
                    value={integrationName}
                    disabled={isLoading}
                    onChange={(e) => setPageToken(e.target.value)}
                  />
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography>Dialog name</Typography>
                  <Select
                    fullWidth
                    value={dialogName}
                    disabled={isLoading}
                    onChange={(e) => setDialogName(e.target.value)}
                  >
                    {dialogList.length > 0 ? (
                      dialogList.map((dialog) => (
                        <MenuItem key={dialog.id} value={dialog.name}>
                          {dialog.name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled>
                        No dialogs available
                      </MenuItem>
                    )}
                  </Select>
                </Box>
              </>
            )}

            {activeTab === "security" && <Typography>Security Settings Coming Soon...</Typography>}
            {activeTab === "setting" && <Typography>Other Settings Coming Soon...</Typography>}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConnectionPane
