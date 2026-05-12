FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /demos

# Install Node deps
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts 2>/dev/null || npm install

# Copy all demo source
COPY . .

# Output dir must be a volume mount — just ensure it exists
RUN mkdir -p output/recordings output/final assets/audio

# Default: record all demos
CMD ["npx", "playwright", "test", "--project=demo-free", "--project=demo-individual", "--project=demo-startup"]
