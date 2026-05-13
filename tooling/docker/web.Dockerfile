FROM node:20-alpine

WORKDIR /workspace

COPY package*.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/domain/package.json packages/domain/package.json
COPY packages/utils/package.json packages/utils/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--workspace", "@contriskill/web"]
