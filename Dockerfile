# Specify the base image with a version that supports the nullish coalescing operator
FROM node:16

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock) files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your app's source code
COPY . .

# Build your app
RUN npm run build

# Expose the port your app runs on
EXPOSE 5173

# Command to run your app
CMD ["npm", "run", "dev"]
