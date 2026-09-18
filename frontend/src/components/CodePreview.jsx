import { Dialog, DialogTitle, DialogContent, Typography } from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

function CodePreview({ selectedCode, setSelectedCode, getLanguage }) {
  return (
    <Dialog
      open={!!selectedCode}
      onClose={() => setSelectedCode(null)}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>{selectedCode?.name || "Code Preview"}</DialogTitle>

      <DialogContent>
        <Typography sx={{ fontSize: "12px", mb: 1 }}>
          {selectedCode?.file}
        </Typography>

        <SyntaxHighlighter
          language={getLanguage(selectedCode?.file)}
          style={oneDark}
        >
          {selectedCode?.code || "// No code available"}
        </SyntaxHighlighter>
      </DialogContent>
    </Dialog>
  );
}

export default CodePreview;
