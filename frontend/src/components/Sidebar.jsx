import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
} from "@mui/material";

import FileTree from "./FileTree";

function Sidebar({
  repoUrl,
  setRepoUrl,
  handleUpload,
  uploadStatus,
  fileTree,
  setSelectedCode,
  session,
  setSessionId,
  supabase,
}) {
  return (
    <Box
      sx={{
        width: "260px",
        backgroundColor: "#0f172a",
        color: "white",
        p: 3,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" sx={{ mb: 3 }}>
        Codebase AI
      </Typography>

      <Typography
        variant="caption"
        sx={{
          color: "#94a3b8",
          fontWeight: 600,
          letterSpacing: "0.08em",
          mb: 1,
        }}
      >
        REPOSITORY
      </Typography>

      <TextField
        size="small"
        placeholder="Repo URL"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        sx={{
          backgroundColor: "white",
          borderRadius: 1,
          mb: 2,
        }}
      />

      <Button
        variant="contained"
        onClick={handleUpload}
        disabled={uploadStatus === "loading"}
        sx={{
          backgroundColor:
            uploadStatus === "done" ? "#22c55e" : "#3b82f6",
          "&:hover": {
            backgroundColor:
              uploadStatus === "done" ? "#16a34a" : "#2563eb",
          },
        }}
      >
        {uploadStatus === "loading" ? (
          <CircularProgress size={18} sx={{ color: "white" }} />
        ) : uploadStatus === "done" ? (
          "Uploaded"
        ) : (
          "Upload Repo"
        )}
      </Button>

      <Typography
        variant="caption"
        sx={{
          color: "#94a3b8",
          fontWeight: 600,
          letterSpacing: "0.08em",
          mt: 2,
        }}
      >
        FILES
      </Typography>

      <Box
        sx={{
          mt: 2,
          pt: 1.5,
          borderTop: "1px solid #334155",
          overflow: "auto",
          flex: 1,
        }}
      >
        <FileTree
          tree={fileTree}
          onSelect={(file) =>
            setSelectedCode({
              file: file.file_path,
              name: file.file_path?.split("/").pop(),
              code: file.code || "",
            })
          }
        />
      </Box>

      <Box
        sx={{
          mt: 2,
          pt: 2,
          borderTop: "1px solid #334155",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {session?.user?.email?.charAt(0).toUpperCase()}
          </Box>

          <Typography
            variant="body2"
            sx={{
              color: "#e2e8f0",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {session?.user?.email}
          </Typography>
        </Box>

        <Typography
          variant="caption"
          sx={{ color: "#94a3b8" }}
        >
          Signed in
        </Typography>

        <Button
          fullWidth
          variant="outlined"
          onClick={async () => {
            setSessionId(null);
            await supabase.auth.signOut();
          }}
          sx={{
            color: "white",
            borderColor: "#475569",
            mt: 1.5,
            "&:hover": {
              borderColor: "#94a3b8",
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
}

export default Sidebar;