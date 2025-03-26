import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Button,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    secondary: {
      main: "#f48fb1",
    },
  },
});

interface Settings {
  enabled: boolean;
  sensitivity: number;
  blockedKeywords: string[];
  platforms: {
    facebook: boolean;
    twitter: boolean;
    youtube: boolean;
  };
}

const Popup: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    enabled: true,
    sensitivity: 0.7,
    blockedKeywords: [],
    platforms: {
      facebook: true,
      twitter: true,
      youtube: true,
    },
  });
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    blocked: 0,
    analyzed: 0,
  });

  useEffect(() => {
    // Load settings from Chrome storage
    chrome.storage.sync.get(["settings", "stats"], (result) => {
      if (result.settings) {
        setSettings(result.settings);
      }
      if (result.stats) {
        setStats(result.stats);
      }
    });
  }, []);

  const handleSettingChange = (key: keyof Settings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    chrome.storage.sync.set({ settings: newSettings });
  };

  const handlePlatformToggle = (platform: keyof Settings["platforms"]) => {
    const newPlatforms = {
      ...settings.platforms,
      [platform]: !settings.platforms[platform],
    };
    handleSettingChange("platforms", newPlatforms);
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      const newKeywords = [...settings.blockedKeywords, newKeyword.trim()];
      handleSettingChange("blockedKeywords", newKeywords);
      setNewKeyword("");
    }
  };

  const handleDeleteKeyword = (index: number) => {
    const newKeywords = settings.blockedKeywords.filter((_, i) => i !== index);
    handleSettingChange("blockedKeywords", newKeywords);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            TheBatSonar
          </Typography>
          <Typography variant="body2" color="text.secondary">
            See Everything, Block What Matters
          </Typography>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.enabled}
                onChange={(e) =>
                  handleSettingChange("enabled", e.target.checked)
                }
              />
            }
            label="Enable Content Filtering"
          />
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Platforms
          </Typography>
          {Object.entries(settings.platforms).map(([platform, enabled]) => (
            <FormControlLabel
              key={platform}
              control={
                <Switch
                  checked={enabled}
                  onChange={() =>
                    handlePlatformToggle(
                      platform as keyof Settings["platforms"]
                    )
                  }
                />
              }
              label={platform.charAt(0).toUpperCase() + platform.slice(1)}
            />
          ))}
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Blocked Keywords
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Add new keyword"
              onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
            />
            <IconButton onClick={handleAddKeyword} color="primary">
              <AddIcon />
            </IconButton>
          </Box>
          <List>
            {settings.blockedKeywords.map((keyword, index) => (
              <ListItem key={index}>
                <ListItemText primary={keyword} />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => handleDeleteKeyword(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Statistics
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Chip
              icon={<BlockIcon />}
              label={`${stats.blocked} Blocked`}
              color="error"
            />
            <Chip
              icon={<CheckCircleIcon />}
              label={`${stats.analyzed} Analyzed`}
              color="success"
            />
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

// Add console log to verify the script is running
console.log("TheBatSonar popup script loaded");

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing React app");
  const container = document.getElementById("root");
  if (container) {
    console.log("Root element found, creating React root");
    const root = createRoot(container);
    console.log("Rendering Popup component");
    root.render(<Popup />);
  } else {
    console.error("Root element not found");
  }
});

// Add error boundary to catch any rendering errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("React Error:", error);
    console.error("Error Info:", errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: "white", padding: "20px" }}>
          <h1>Something went wrong.</h1>
          <p>Please check the console for details.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap the Popup component with ErrorBoundary
const PopupWithErrorBoundary = () => (
  <ErrorBoundary>
    <Popup />
  </ErrorBoundary>
);

// Update the render call to use the wrapped component
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing React app");
  const container = document.getElementById("root");
  if (container) {
    console.log("Root element found, creating React root");
    const root = createRoot(container);
    console.log("Rendering Popup component");
    root.render(<PopupWithErrorBoundary />);
  } else {
    console.error("Root element not found");
  }
});
