const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");

const findWorkspaceRoot = (startDir) => {
  let dir = startDir;
  while (true) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (pkg && pkg.workspaces) {
          return dir;
        }
      } catch (error) {
        // Ignore parse errors and continue up.
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return startDir;
    }
    dir = parent;
  }
};

const workspaceRoot = findWorkspaceRoot(projectRoot);
const prismaDirCandidates = [
  path.join(projectRoot, "node_modules", ".prisma"),
  path.join(workspaceRoot, "node_modules", ".prisma"),
];
const prismaDir = prismaDirCandidates.find((candidate) =>
  fs.existsSync(candidate)
);

if (!prismaDir) {
  console.warn(
    `[prisma] Missing node_modules/.prisma, tried: ${prismaDirCandidates.join(
      ", "
    )}`
  );
  process.exit(0);
}

let clientDir;
try {
  clientDir = path.dirname(
    require.resolve("@prisma/client/package.json", { paths: [projectRoot] })
  );
} catch (error) {
  console.warn("[prisma] Missing @prisma/client, skipping client link.");
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
  console.log(`[prisma] Linked @prisma/client/.prisma -> ${prismaDir}`);
} catch (error) {
  fs.mkdirSync(linkPath, { recursive: true });
  fs.cpSync(prismaDir, linkPath, { recursive: true });
  console.log(`[prisma] Copied ${prismaDir} into @prisma/client/.prisma`);
}
