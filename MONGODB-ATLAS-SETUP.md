# MongoDB Atlas Setup Guide

This application has been migrated from MySQL to MongoDB Atlas. Follow this guide to set up your MongoDB Atlas database.

## Prerequisites

- MongoDB Atlas account (free tier available)
- Internet connection for cloud database access

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account or log in to existing account
3. Create a new organization (if needed)
4. Create a new project for this application

## Step 2: Create a Cluster

1. Click "Build a Database"
2. Choose deployment option:
   - **Recommended**: M0 Sandbox (Free Forever)
   - **For production**: Choose appropriate tier
3. Select cloud provider and region (choose closest to your users)
4. Name your cluster (e.g., `encrypted-data-cluster`)
5. Click "Create Cluster"

## Step 3: Configure Database Access

### Create Database User
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose authentication method: "Password"
4. Create username and secure password
5. Set database user privileges: "Atlas admin" or custom role
6. Click "Add User"

### Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production: Add specific IP addresses
5. Click "Confirm"

## Step 4: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select driver: "Node.js" and version "4.1 or later"
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<dbname>` with your database name (e.g., `encrypted_data_app`)

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/encrypted_data_app?retryWrites=true&w=majority
```

## Step 5: Configure Application

1. Copy `API/env.example` to `API/.env`
2. Update the MongoDB configuration:
   ```env
   # MongoDB Atlas Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/encrypted_data_app?retryWrites=true&w=majority
   DB_NAME=encrypted_data_app
   ```
3. Remove old MySQL configuration variables (they're not needed anymore)

## Step 6: Database Schema

The application will automatically create the required collections and indexes when it starts. No manual schema creation is needed.

### Collections Created
- `users` - User accounts and profiles
- `user_encryption` - User encryption keys and settings
- `encrypted_data` - Encrypted user data
- `rate_limit` - Rate limiting records

## Step 7: Testing Connection

1. Start the application:
   ```bash
   npm run dev:api
   ```
2. Look for successful connection logs:
   ```
   [DATABASE] MongoDB Atlas connection established successfully.
   [DATABASE] MongoDB models registered successfully.
   ```

## Development vs Production

### Development
- Use the free M0 Sandbox tier
- Allow access from anywhere (0.0.0.0/0) for convenience
- Use a development database name

### Production
- Consider upgrading to a paid tier for better performance
- Restrict network access to specific IP addresses
- Use environment-specific database names
- Enable backup and monitoring
- Set up alerts for performance and security

## Database Management

### MongoDB Compass (Recommended)
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Use your connection string to connect
3. Browse collections, documents, and run queries

### Atlas Web Interface
- Use the MongoDB Atlas web interface for cluster management
- Monitor performance and set up alerts
- Manage users and network access

## Migration Notes

### What Changed
- **Database**: MySQL → MongoDB Atlas
- **ORM**: Sequelize → Mongoose
- **Connection**: Local database → Cloud database
- **Schema**: SQL tables → MongoDB collections
- **Relationships**: Foreign keys → Object references and population

### Benefits
- **Scalability**: Automatic scaling with MongoDB Atlas
- **Reliability**: Built-in replication and backup
- **Performance**: Optimized for cloud deployment
- **Maintenance**: Fully managed service
- **Security**: Enterprise-grade security features

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check network access settings
   - Verify IP address is whitelisted
   - Confirm username/password are correct

2. **Authentication Failed**
   - Verify database user exists
   - Check username/password in connection string
   - Ensure user has proper permissions

3. **Database Name Issues**
   - MongoDB will create the database automatically
   - Database name is case-sensitive
   - Use alphanumeric characters and underscores only

### Support
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Community Forums](https://community.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)

## Security Best Practices

1. **Use strong passwords** for database users
2. **Limit network access** to specific IP addresses in production
3. **Enable monitoring and alerts** for suspicious activity
4. **Regular backup** your data (Atlas handles this automatically)
5. **Use environment variables** for sensitive configuration
6. **Rotate credentials** regularly
7. **Enable audit logging** for compliance requirements

## Cost Optimization

1. **Start with M0 Sandbox** (free tier) for development
2. **Monitor usage** and upgrade only when needed
3. **Use appropriate instance sizes** for your workload
4. **Enable data compression** to reduce storage costs
5. **Set up alerts** for unexpected usage spikes 