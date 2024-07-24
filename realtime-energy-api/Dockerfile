
FROM node:20

WORKDIR /usr/src/app

COPY . .

RUN npm install --only=development

#RUN npm run build

EXPOSE 3000

CMD [ "npm", "run", "start" ]
