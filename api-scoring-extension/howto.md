# HOW TO: Use the API Scoring Suite

## Prerequisites

- **Podman** installed and running
- **Node.js** (for extension development)
- **VS Code** with the API Scoring extension installed

---

## Step 1: Start Services

### 1.1 Verify Podman is running
```bash
podman machine list
podman machine start  # If not running
```

### 1.2 Start backend and frontend services
```bash
cd /Users/rafagranados/Develop/PoC/api-scoring-engine
./start-all.sh
```

**This will:**
- Stop existing services
- Clean unused images
- Rebuild backend image
- Start backend service on http://localhost:8080
- Start React frontend on http://localhost:3000

### 1.3 Verify services are running
```bash
podman ps
curl http://localhost:8080/health
curl http://localhost:3000
```

---

## Step 2: Prepare API Project

### 2.1 Create project structure
Your project should contain:
```
your-api-project/
├── metadata.yml          # API metadata configuration
└── openapi-rest.yml      # OpenAPI specification file
```

### 2.2 Configure metadata.yml
```yaml
apis:
  - name: "Your API Name"
    version: "1.0.0"
    description: "API description"
    definition-path: "openapi-rest.yml"
    api-spec-type: "REST"
```

**Important:** Use `definition-path` (not `file`) to reference your OpenAPI spec file.

### 2.3 Ensure OpenAPI spec exists
Make sure the file referenced in `definition-path` exists in your project directory.

---

## Step 3: Configure VS Code

### 3.1 Open VS Code in the correct directory
**CRITICAL:** Open VS Code **only** in the directory containing your `metadata.yml`:

```bash
cd /path/to/your/api-project
code .
```

**Do NOT open VS Code in a parent directory** that contains multiple projects, as this will cause the extension to detect multiple APIs and create conflicts.

### 3.2 Verify workspace structure
Your VS Code workspace should contain only:
- `metadata.yml`
- `openapi-rest.yml` (or your spec file)
- Any other files needed for your API

### 3.3 Install/Update extension
If you've modified the extension code:
```bash
cd /Users/rafagranados/Develop/PoC/api-scoring-ide-plugins/plugins/vscode-apiscoring/code
npm install
npm run compile
npm run package
code --install-extension vscode-apiscoring-1.0.1.vsix
```

---

## Step 4: Validate API

### 4.1 Launch validation
1. Open VS Code in your API project directory
2. Use the API Scoring extension to validate your API
3. The extension will:
   - Detect your `metadata.yml`
   - Create a ZIP with necessary files
   - Send to backend for validation
   - Display results

### 4.2 Monitor backend logs
```bash
podman logs -f certification-service
```

---

## Step 5: Troubleshoot Common Issues

### 5.1 Backend not responding
```bash
podman ps
podman logs certification-service
./start-all.sh  # Restart services
```

### 5.2 Wrong API detected
**Problem:** Backend processes different API than expected
**Solution:** 
- Ensure VS Code is open only in your API project directory
- Remove any other `metadata.yml` files from parent directories
- Clean workspace to contain only your API files

### 5.3 Missing file references
**Problem:** Backend reports missing files
**Solution:**
- Verify all files referenced in `metadata.yml` exist
- Use `definition-path` instead of `file` in metadata
- Ensure ZIP contains all necessary files

### 5.4 Extension not detecting files
**Problem:** Extension doesn't find `metadata.yml`
**Solution:**
- Open VS Code in the correct directory
- Verify `metadata.yml` is in the root of your project
- Check file permissions

### 5.5 Podman connection issues
```bash
podman machine stop
podman machine start
./start-all.sh
```

---

## Step 6: Interpret Results

### 6.1 Understanding scores
- **Documentation Score:** Completeness of API documentation
- **Code Quality Score:** Code standards and best practices
- **Security Score:** Security implementation quality
- **Overall Score:** Weighted average of all scores

### 6.2 Review validation details
- Check specific issues found
- Review recommendations
- Address critical issues first

---

## Development: Modify Extension

### Modify extension code
```bash
cd /Users/rafagranados/Develop/PoC/api-scoring-ide-plugins/plugins/vscode-apiscoring/code
# Edit source files
npm run compile
npm run package
code --install-extension vscode-apiscoring-1.0.1.vsix
```

### Key files to modify
- `src/WorkspaceManager.ts` - File detection logic
- `src/extension.ts` - Main extension logic
- `src/webview/webview.ts` - Webview communication

---

## Important Notes

### Workspace Configuration
- **Always open VS Code in the specific API project directory**
- **Never open VS Code in a parent directory** containing multiple projects
- **Clean workspace** to contain only files for your current API

### File References
- Use `definition-path` in `metadata.yml` (not `file`)
- Ensure all referenced files exist in the project
- Keep file paths relative to project root

### Service Management
- Backend runs in Podman container on port 8080
- Frontend runs in Podman container on port 3000
- Use `./start-all.sh` to restart all services
- Monitor logs with `podman logs certification-service`

### Extension Updates
- Recompile extension after code changes
- Reinstall extension in VS Code
- Restart VS Code after extension updates

---

## Quick Reference

### Start services
```bash
cd /Users/rafagranados/Develop/PoC/api-scoring-engine
./start-all.sh
```

### Check services
```bash
podman ps
curl http://localhost:8080/health
```

### View logs
```bash
podman logs -f certification-service
```

### Restart services
```bash
./start-all.sh
```

### Update extension
```bash
cd /Users/rafagranados/Develop/PoC/api-scoring-ide-plugins/plugins/vscode-apiscoring/code
npm run compile && npm run package
code --install-extension vscode-apiscoring-1.0.1.vsix
``` 