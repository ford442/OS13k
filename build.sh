#!/bin/bash

# 1. Install Dependencies
echo "📦 Installing dependencies..."
npm install

# 2. Run the Build (Generates the JS13k minified versions)
echo "🔨 Building project..."
npm run build

# 3. Prepare the 'dist' folder (Clean slate)
echo "Bd Preparing dist folder..."
rm -rf dist
mkdir -p dist/os13k-full
mkdir -p dist/js13k
mkdir -p dist/os13k-full/node_modules/peerjs/dist

# 4. Copy 'OS13k Full Version' files
echo "📂 Copying Full Version files..."
cp index.html favicon.ico help.html programs.js dist/os13k-full/
cp -r OS13k apps controller dweets games music shaders system dist/os13k-full/
cp node_modules/peerjs/dist/peerjs.min.js dist/os13k-full/node_modules/peerjs/dist/

# 5. Copy 'JS13k Build Version' files
echo "📂 Copying JS13k Build files..."
cp JS13k/index.html JS13k/index.min.html JS13k/index.js favicon.ico dist/js13k/
# Only copy zip if it exists
if [ -f "JS13k/OS13k.zip" ]; then
    cp JS13k/OS13k.zip dist/js13k/
fi

# 6. Create the Redirect Index Page
echo "md Creating redirect index..."
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OS13k - Choose Version</title>
    <meta http-equiv="refresh" content="0; url=os13k-full/">
</head>
<body>
    <p>Redirecting to <a href="os13k-full/">OS13k Full Version</a>...</p>
</body>
</html>
EOF

echo "✅ Build finished! Files are ready in 'dist/'"
