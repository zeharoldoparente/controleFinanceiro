const fs = require("fs");
const path = require("path");

const defaultUploadDir = path.resolve(__dirname, "../../uploads");

function getUploadDir() {
   const configuredDir = String(process.env.UPLOAD_DIR || "").trim();
   return configuredDir
      ? path.resolve(configuredDir)
      : defaultUploadDir;
}

function ensureUploadDir() {
   const uploadDir = getUploadDir();
   fs.mkdirSync(uploadDir, { recursive: true });
   return uploadDir;
}

function createUploadBaseDirs() {
   const uploadDir = getUploadDir();
   const bases = new Set([process.cwd(), __dirname]);

   for (const origem of Array.from(bases)) {
      let atual = origem;
      for (let i = 0; i < 6; i += 1) {
         bases.add(atual);
         const pai = path.dirname(atual);
         if (pai === atual) break;
         atual = pai;
      }
   }

   const uploadDirs = new Set([uploadDir]);
   for (const base of bases) {
      uploadDirs.add(path.resolve(base, "uploads"));
      uploadDirs.add(path.resolve(base, "uploads/comprovantes"));
   }

   return Array.from(uploadDirs);
}

function isSafePathInsideBase(baseDir, filePath) {
   const relativePath = path.relative(baseDir, filePath);
   return (
      relativePath &&
      !relativePath.startsWith("..") &&
      !path.isAbsolute(relativePath)
   );
}

function fileExists(filePath) {
   return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function resolveStoredUploadPath(storedValue) {
   const originalValue = String(storedValue ?? "").trim();
   if (!originalValue) return null;

   const uploadBaseDirs = createUploadBaseDirs();
   const candidates = new Set();
   const addCandidate = (value) => {
      if (value) candidates.add(String(value).trim());
   };

   addCandidate(originalValue);

   const normalizedValue = originalValue
      .replace(/\\/g, "/")
      .split("?")[0]
      .split("#")[0];

   addCandidate(normalizedValue);
   addCandidate(path.basename(normalizedValue));

   try {
      const url = new URL(normalizedValue);
      addCandidate(url.pathname);
      addCandidate(path.basename(url.pathname));
   } catch (_) {
      // Ignora quando o valor salvo nao eh uma URL completa.
   }

   for (const candidate of candidates) {
      if (!candidate) continue;

      if (path.isAbsolute(candidate)) {
         const absolutePath = path.normalize(candidate);
         if (fileExists(absolutePath)) {
            return absolutePath;
         }

         for (const baseDir of uploadBaseDirs) {
            if (
               isSafePathInsideBase(baseDir, absolutePath) &&
               fileExists(absolutePath)
            ) {
               return absolutePath;
            }
         }
      }

      const pathParts = candidate
         .replace(/\\/g, "/")
         .replace(/^\/+/, "")
         .split("/")
         .filter(Boolean);

      if (pathParts.length === 0) continue;

      const uploadIndex = pathParts.lastIndexOf("uploads");
      const relativeParts =
         uploadIndex >= 0 ? pathParts.slice(uploadIndex + 1) : pathParts;

      if (relativeParts.length === 0) continue;

      for (const baseDir of uploadBaseDirs) {
         const resolvedPath = path.resolve(baseDir, ...relativeParts);
         if (
            isSafePathInsideBase(baseDir, resolvedPath) &&
            fileExists(resolvedPath)
         ) {
            return resolvedPath;
         }
      }
   }

   return null;
}

function removeStoredUploadIfExists(storedValue) {
   const resolvedPath = resolveStoredUploadPath(storedValue);
   if (resolvedPath && fileExists(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
   }
}

module.exports = {
   ensureUploadDir,
   getUploadDir,
   removeStoredUploadIfExists,
   resolveStoredUploadPath,
};
