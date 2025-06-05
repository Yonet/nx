const fs = require('fs');
const path = 'package.json'; // Assuming script runs from project root
let packageData;
try {
  packageData = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch (err) {
  console.error('Failed to read or parse package.json:', err);
  // Initialize with a basic structure if file doesn't exist or is unparsable
  packageData = { name: "my-monorepo", version: "1.0.0" };
}

packageData.private = true;

// Ensure workspaces is an array and add 'packages/*' if not present
if (!Array.isArray(packageData.workspaces)) {
  packageData.workspaces = [];
}
if (!packageData.workspaces.includes('packages/*')) {
  packageData.workspaces.push('packages/*');
}

// Ensure devDependencies exists
if (typeof packageData.devDependencies !== 'object' || packageData.devDependencies === null) {
  packageData.devDependencies = {};
}

// Keep existing typescript version if present, otherwise add/update
if (!packageData.devDependencies.typescript) {
  // Try to get version from existing package.json, else default
  const existingPackageJson = fs.existsSync('package.json') ? JSON.parse(fs.readFileSync('package.json', 'utf8')) : {};
  packageData.devDependencies.typescript = existingPackageJson.devDependencies && existingPackageJson.devDependencies.typescript ? existingPackageJson.devDependencies.typescript : "^5.0.0";
}


fs.writeFileSync(path, JSON.stringify(packageData, null, 2) + '\\n');
console.log('package.json updated for Yarn Workspaces.');
