FROM mcr.microsoft.com/playwright:v1.44.0-jammy

WORKDIR /demos

# Install Python + edge-tts for reliable TTS
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 python3-pip ffmpeg \
    && pip3 install --no-cache-dir edge-tts \
    && rm -rf /var/lib/apt/lists/*

# Install Node deps
COPY package.json package-lock.json* ./
RUN npm install --ignore-scripts 2>/dev/null || npm install

# Copy all demo source
COPY . .

# Output dir must be a volume mount — just ensure it exists
RUN mkdir -p output/recordings output/final assets/audio

# Default: record all demos
CMD ["npx", "playwright", "test", "--project=demo-free", "--project=demo-individual", "--project=demo-startup"]
