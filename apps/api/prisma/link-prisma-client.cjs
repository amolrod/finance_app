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

// Find all @prisma/client directories that need the generated client
const clientDirs = [];

// 1. Standard resolution
try {
  const clientDir = path.dirname(
    require.resolve("@prisma/client/package.json", { paths: [projectRoot] })
  );
  clientDirs.push(clientDir);
} catch (error) {
  // skip
}

// 2. Workspace root node_modules
const workspaceClient = path.join(workspaceRoot, "node_modules", "@prisma", "client");
if (fs.existsSync(workspaceClient) && !clientDirs.includes(workspaceClient)) {
  clientDirs.push(workspaceClient);
}

// 3. Project-local node_modules
const localClient = path.join(projectRoot, "node_modules", "@prisma", "client");
if (fs.existsSync(localClient) && !clientDirs.includes(localClient)) {
  clientDirs.push(localClient);
}

// 4. Bun cache directories
const bunDir = path.join(workspaceRoot, "node_modules", ".bun");
if (fs.existsSync(bunDir)) {
  try {
    const entries = fs.readdirSync(bunDir).filter(e => e.startsWith("@prisma+client"));
    for (const entry of entries) {
      const bunClient = path.join(bunDir, entry, "node_modules", "@prisma", "client");
      if (fs.existsSync(bunClient) && !clientDirs.includes(bunClient)) {
        clientDirs.push(bunClient);
      }
      // Also check the .prisma/client path directly inside bun cache
      const bunPrismaDir = path.join(bunDir, entry, "node_modules", ".prisma");
      if (fs.existsSync(path.dirname(bunPrismaDir))) {
        try {
          fs.mkdirSync(path.join(bunPrismaDir, "client"), { recursive: true });
          fs.cpSync(path.join(prismaDir, "client"), path.join(bunPrismaDir, "client"), { recursive: true });
          console.log(`[prisma] Copied generated client to bun cache: ${bunPrismaDir}`);
        } catch (e) {
          console.warn(`[prisma] Failed to copy to bun cache: ${e.message}`);
        }
      }
    }
  } catch (e) {
    // skip
  }
}

if (clientDirs.length === 0) {
  console.warn("[prisma] Missing @prisma/client, skipping client link.");
  process.exit(0);
}

// Link/copy .prisma to each @prisma/client directory found
for (const clientDir of clientDirs) {
  let clientRealDir = clientDir;
  try {
    clientRealDir = fs.realpathSync(clientDir);
  } catch (error) {
    // Use the original path if realpath fails
  }

  const linkPath = path.join(clientRealDir, ".prisma");

  try {
    fs.rmSync(linkPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors and try to recreate.
  }

  try {
    fs.symlinkSync(prismaDir, linkPath, "junction");
    console.log(`[prisma] Linked ${linkPath} -> ${prismaDir}`);
  } catch (error) {
    try {
      fs.mkdirSync(linkPath, { recursive: true });
      fs.cpSync(prismaDir, linkPath, { recursive: true });
      console.log(`[prisma] Copied ${prismaDir} into ${linkPath}`);
    } catch (copyError) {
      console.warn(`[prisma] Failed to link/copy to ${linkPath}: ${copyError.message}`);
    }
  }
}

console.log(`[prisma] Linked generated client to ${clientDirs.length} location(s)`);
