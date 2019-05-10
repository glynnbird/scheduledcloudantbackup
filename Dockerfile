FROM node:10
WORKDIR /app
COPY package.json package-lock.json backup.js /app/
RUN npm install
CMD npm start
