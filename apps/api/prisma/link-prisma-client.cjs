const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const prismaDir = path.join(projectRoot, "node_modules", ".prisma");
const clientDir = path.join(projectRoot, "node_modules", "@prisma", "client");

if (!fs.existsSync(prismaDir)) {
  console.warn("[prisma] Missing node_modules/.prisma, skipping client link.");
  process.exit(0);
}

if (!fs.existsSync(clientDir)) {
  console.warn("[prisma] Missing node_modules/@prisma/client, skipping client link.");
  process.exit(0);
}

let clientRealDir = clientDir;
try {
  clientRealDir = fs.realpathSync(clientDir);
} catch (error) {
  console.warn("[prisma] Failed to resolve @prisma/client path, using symlink path.");
}

const linkPath = path.join(clientRealDir, ".prisma");

try {
  fs.rmSync(linkPath, { recursive: true, force: true });
} catch (error) {
  // Ignore cleanup errors and try to recreate.
}

try {
  fs.symlinkSync(prismaDir, linkPath, "junction");
  console.log("[prisma] Linked @prisma/client/.prisma -> node_modules/.prisma");
} catch (error) {
  fs.mkdirSync(linkPath, { recursive: true });
  fs.cpSync(prismaDir, linkPath, { recursive: true });
  console.log("[prisma] Copied node_modules/.prisma into @prisma/client/.prisma");
}
